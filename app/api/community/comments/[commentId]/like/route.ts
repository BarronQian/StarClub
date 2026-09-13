import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

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

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      commentId: string
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
      commentId,
    } =
      await context.params

    const supabase =
      getAdminSupabase()

    const {
      data: profile,
      error:
        profileError,
    } =
      await supabase
        .from(
          'profiles',
        )
        .select(`
          id,
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

    if (
      profile.banned_at
    ) {
      return NextResponse.json(
        {
          error:
            '该账号已被封禁，无法进行点赞操作',
        },
        {
          status: 403,
        },
      )
    }

    const {
      data: comment,
      error:
        commentError,
    } =
      await supabase
        .from(
          'post_comments',
        )
        .select(`
          id,
          post_id,
          author_id,
          deleted_at
        `)
        .eq(
          'id',
          commentId,
        )
        .is(
          'deleted_at',
          null,
        )
        .maybeSingle()

    if (
      commentError
    ) {
      throw commentError
    }

    if (!comment) {
      return NextResponse.json(
        {
          error:
            '评论不存在',
        },
        {
          status: 404,
        },
      )
    }

    const {
      data:
        existingLike,
      error:
        likeError,
    } =
      await supabase
        .from(
          'comment_likes',
        )
        .select(
          'comment_id',
        )
        .eq(
          'comment_id',
          commentId,
        )
        .eq(
          'user_id',
          user.id,
        )
        .maybeSingle()

    if (
      likeError
    ) {
      throw likeError
    }

    let liked = false

    if (
      existingLike
    ) {
      const {
        error,
      } =
        await supabase
          .from(
            'comment_likes',
          )
          .delete()
          .eq(
            'comment_id',
            commentId,
          )
          .eq(
            'user_id',
            user.id,
          )

      if (error) {
        throw error
      }

      const {
        error:
          notificationDeleteError,
      } =
        await supabase
          .from(
            'community_notifications',
          )
          .delete()
          .eq(
            'type',
            'comment_like',
          )
          .eq(
            'comment_id',
            commentId,
          )
          .eq(
            'actor_id',
            user.id,
          )

      if (
        notificationDeleteError
      ) {
        console.error(
          'Failed to delete comment like notification:',
          notificationDeleteError,
        )
      }

      liked = false
    } else {
      const {
        error,
      } =
        await supabase
          .from(
            'comment_likes',
          )
          .insert({
            comment_id:
              commentId,

            user_id:
              user.id,
          })

      if (error) {
        throw error
      }

      if (
        comment.author_id &&
        comment.author_id !==
          user.id
      ) {
        const {
          error:
            notificationError,
        } =
          await supabase
            .from(
              'community_notifications',
            )
            .insert({
              recipient_id:
                comment.author_id,

              actor_id:
                user.id,

              type:
                'comment_like',

              post_id:
                comment.post_id,

              comment_id:
                commentId,
            })

        if (
          notificationError
        ) {
          console.error(
            'Failed to create comment like notification:',
            notificationError,
          )
        }
      }

      liked = true
    }

    const {
      count,
      error:
        countError,
    } =
      await supabase
        .from(
          'comment_likes',
        )
        .select(
          '*',
          {
            count:
              'exact',

            head:
              true,
          },
        )
        .eq(
          'comment_id',
          commentId,
        )

    if (
      countError
    ) {
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
      'Failed to toggle comment like:',
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