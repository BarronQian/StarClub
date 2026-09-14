import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { createClient } from '@supabase/supabase-js'

export const dynamic =
  'force-dynamic'

export const revalidate = 0

function getAdminSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      'Supabase server environment variables are missing',
    )
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

async function getAuthenticatedUser(
  request: NextRequest,
) {
  const authorization =
    request.headers.get(
      'authorization',
    )

  if (
    !authorization ||
    !authorization.startsWith(
      'Bearer ',
    )
  ) {
    return null
  }

  const accessToken =
    authorization.slice(7)

  const supabase =
    getAdminSupabase()

  const {
    data: {
      user,
    },
    error,
  } =
    await supabase.auth.getUser(
      accessToken,
    )

  if (
    error ||
    !user
  ) {
    return null
  }

  return user
}

/* 点赞 / 取消点赞 */
export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      postId: string
    }>
  },
) {
  try {
    const user =
      await getAuthenticatedUser(
        request,
      )

    if (!user) {
      return NextResponse.json(
        {
          error:
            '请先登录',
        },
        {
          status: 401,
        },
      )
    }

    const {
      postId,
    } =
      await context.params

    const supabase =
      getAdminSupabase()

    // 读取当前用户的处罚状态
    const {
      data: profile,
      error:
        profileError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        community_banned_at,
        banned_at
      `)
      .eq(
        'id',
        user.id,
      )
      .maybeSingle()

    if (
      profileError ||
      !profile
    ) {
      return NextResponse.json(
        {
          error:
            '找不到个人资料',
        },
        {
          status: 404,
        },
      )
    }

    // 注意：
    // 禁言用户仍然可以点赞，
    // 所以这里不检查 muted_until。

    // 确认帖子存在
    const {
      data: post,
      error: postError,
    } = await supabase
        .from('posts')
        .select(`
          id,
          author_id
        `)
      .eq(
        'id',
        postId,
      )
      .eq(
        'visibility',
        'public',
      )
      .is(
        'deleted_at',
        null,
      )
      .maybeSingle()

    if (postError) {
      throw postError
    }

    if (!post) {
      return NextResponse.json(
        {
          error:
            '动态不存在',
        },
        {
          status: 404,
        },
      )
    }

    // 查看当前用户是否已经点赞
    const {
      data:
        existingLike,
      error:
        likeError,
    } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq(
        'post_id',
        postId,
      )
      .eq(
        'user_id',
        user.id,
      )
      .maybeSingle()

    if (likeError) {
      throw likeError
    }

    /*
 * 社区封禁 / 全站封禁：
 * 不允许新增点赞，
 * 但允许取消自己以前的点赞。
 *
 * 社区禁言不影响点赞。
 */
if (
  !existingLike &&
  (
    profile.banned_at ||
    profile.community_banned_at
  )
) {
  return NextResponse.json(
    {
      error:
        profile.banned_at
          ? '该账号已被全站封禁，无法点赞'
          : '该账号已被社区封禁，无法点赞',
    },
    {
      status: 403,
    },
  )
}

    let liked = false

    if (existingLike) {
      // 已经点赞 → 取消点赞
      const {
        error,
      } = await supabase
        .from('post_likes')
        .delete()
        .eq(
          'post_id',
          postId,
        )
        .eq(
          'user_id',
          user.id,
        )

      if (error) {
        throw error
      }

      // 同时删除对应的点赞通知
      // 自己给自己点赞不会生成通知，
      // 所以这里删除不到也没有关系。
      const {
        error:
          notificationDeleteError,
      } = await supabase
        .from(
          'community_notifications',
        )
        .delete()
        .eq(
          'type',
          'post_like',
        )
        .eq(
          'post_id',
          postId,
        )
        .eq(
          'actor_id',
          user.id,
        )

      if (
        notificationDeleteError
      ) {
        console.error(
          'Failed to delete post like notification:',
          notificationDeleteError,
        )
      }

      liked = false
      } else {
        // 没点赞 → 点赞
        const {
          error,
        } = await supabase
          .from('post_likes')
          .insert({
            post_id:
              postId,
            user_id:
              user.id,
          })

        if (error) {
          throw error
        }

        // 别人给自己的动态点赞时创建通知。
        // 自己点赞自己的动态不发送通知。
        if (
          post.author_id &&
          post.author_id !==
            user.id
        ) {
          const {
            error:
              notificationError,
          } = await supabase
            .from(
              'community_notifications',
            )
            .insert({
              recipient_id:
                post.author_id,

              actor_id:
                user.id,

              type:
                'post_like',

              post_id:
                postId,

              comment_id:
                null,
            })

          if (
            notificationError
          ) {
            console.error(
              'Failed to create post like notification:',
              notificationError,
            )
          }
        }

        liked = true
      }

    // 返回最新点赞数
    const {
      count,
      error:
        countError,
    } = await supabase
      .from('post_likes')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq(
        'post_id',
        postId,
      )

    if (countError) {
      throw countError
    }

    return NextResponse.json({
      success: true,
      liked,
      likeCount:
        count ?? 0,
    })
  } catch (error) {
    console.error(
      'Failed to toggle post like:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '点赞失败',
      },
      {
        status: 500,
      },
    )
  }
}