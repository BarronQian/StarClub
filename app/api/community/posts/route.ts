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

const POSTS_PAGE_SIZE = 20

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
      'Missing Supabase server environment variables',
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

// GET /api/community/posts
//
// 首页：
// /api/community/posts
//
// 加载更多：
// /api/community/posts?cursor=xxx
//
// 指定用户：
// /api/community/posts?authorId=xxx
//
// 指定用户加载更多：
// /api/community/posts?authorId=xxx&cursor=xxx
//
// 每次最多读取 20 条动态
export async function GET(
  request: NextRequest,
) {
  try {
    const supabase =
      getAdminSupabase()

    const authorId =
      request.nextUrl.searchParams.get(
        'authorId',
      )

    const following =
      request.nextUrl.searchParams.get(
        'following',
      ) === 'true'

    const cursor =
      request.nextUrl.searchParams.get(
        'cursor',
      )
    
      let followingIds:
        string[] | null = null

      let followingUserId:
        string | null = null

      if (following) {
        const authorization =
          request.headers.get(
            'authorization',
          )

        if (
          !authorization?.startsWith(
            'Bearer ',
          )
        ) {
          return NextResponse.json(
            {
              error:
                '请先登录后查看关注动态',
            },
            {
              status: 401,
            },
          )
        }

        const accessToken =
          authorization.slice(7)

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser(
            accessToken,
          )

        if (
          userError ||
          !user
        ) {
          return NextResponse.json(
            {
              error:
                '登录状态已失效',
            },
            {
              status: 401,
            },
          )
        }

        followingUserId =
            user.id

        const {
          data: followRows,
          error: followError,
        } =
          await supabase
            .from(
              'profile_follows',
            )
            .select(
              'following_id',
            )
            .eq(
              'follower_id',
              user.id,
            )

        if (followError) {
          console.error(
            'Failed to load followed profiles:',
            followError,
          )

          return NextResponse.json(
            {
              error:
                '读取关注列表失败',
            },
            {
              status: 500,
            },
          )
        }

        followingIds =
          (followRows ?? [])
            .map(
              (row) =>
                row.following_id,
            )
            .filter(Boolean)

        // 还没有关注任何人
        if (
          followingIds.length === 0
        ) {
          return NextResponse.json(
            {
              posts: [],
              hasMore: false,
              nextCursor: null,
            },
            {
              headers: {
                'Cache-Control':
                  'no-store, max-age=0',
              },
            },
          )
        }
      }

    let postsQuery =
      supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          author_id,
          profiles!posts_author_id_fkey (
            username,
            display_name,
            avatar_url,
            star_citizen_handle,
            rsi_verified,
            member_number,
            profile_slug
          )
        `)
        .eq(
          'visibility',
          'public',
        )
        .is(
          'deleted_at',
          null,
        )
        .order(
          'created_at',
          {
            ascending: false,
          },
        )
        .limit(
          POSTS_PAGE_SIZE + 1,
        )

    // 个人主页动态
    if (authorId) {
      postsQuery =
        postsQuery.eq(
          'author_id',
          authorId,
        )
    }

    // 我的关注动态
    if (
      following &&
      followingIds &&
      followingIds.length > 0
    ) {
      postsQuery =
        postsQuery.in(
          'author_id',
          followingIds,
        )
    }

    // 下一页：
    // 继续读取比上一页最后一条更早的动态
    if (cursor) {
      postsQuery =
        postsQuery.lt(
          'created_at',
          cursor,
        )
    }

    const {
      data,
      error,
    } =
      await postsQuery

    if (error) {
      console.error(
        'Failed to load posts:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '读取动态失败',
        },
        {
          status: 500,
        },
      )
    }

    const rows =
      data ?? []

    // 多拿 1 条只是为了判断还有没有下一页
    const hasMore =
      rows.length >
      POSTS_PAGE_SIZE

    const pageRows =
      hasMore
        ? rows.slice(
            0,
            POSTS_PAGE_SIZE,
          )
        : rows

    const postIds =
      pageRows.map(
        (post) =>
          post.id,
      )

    const likeCounts =
      new Map<
        string,
        number
      >()

    const likedPostIds =
      new Set<string>()

    const commentCounts =
      new Map<
        string,
        number
      >()

    // 当前这一页的点赞数量
    if (
      postIds.length > 0
    ) {
      const {
        data: likes,
        error:
          likesError,
      } = await supabase
        .from(
          'post_likes',
        )
        .select(
          'post_id',
        )
        .in(
          'post_id',
          postIds,
        )

      if (
        likesError
      ) {
        console.error(
          'Failed to load post likes:',
          likesError,
        )
      } else {
        for (
          const like of
            likes ?? []
        ) {
          likeCounts.set(
            like.post_id,
            (
              likeCounts.get(
                like.post_id,
              ) ?? 0
            ) + 1,
          )
        }
      }
    }

    // 当前用户已经点赞的动态
    if (
      followingUserId &&
      postIds.length > 0
    ) {
      const {
        data: myLikes,
        error: myLikesError,
      } = await supabase
        .from(
          'post_likes',
        )
        .select(
          'post_id',
        )
        .eq(
          'user_id',
          followingUserId,
        )
        .in(
          'post_id',
          postIds,
        )

      if (myLikesError) {
        console.error(
          'Failed to load my post likes:',
          myLikesError,
        )
      } else {
        for (
          const like of
            myLikes ?? []
        ) {
          likedPostIds.add(
            like.post_id,
          )
        }
      }
    }

    // 当前这一页的评论数量
    if (
      postIds.length > 0
    ) {
      const {
        data: comments,
        error:
          commentsError,
      } = await supabase
        .from(
          'post_comments',
        )
        .select(
          'post_id',
        )
        .in(
          'post_id',
          postIds,
        )
        .is(
          'deleted_at',
          null,
        )

      if (
        commentsError
      ) {
        console.error(
          'Failed to load post comments:',
          commentsError,
        )
      } else {
        for (
          const comment of
            comments ?? []
        ) {
          commentCounts.set(
            comment.post_id,
            (
              commentCounts.get(
                comment.post_id,
              ) ?? 0
            ) + 1,
          )
        }
      }
    }

    const posts =
      pageRows.map(
        (post) => ({
          ...post,

          like_count:
            likeCounts.get(
              post.id,
            ) ?? 0,

          comment_count:
            commentCounts.get(
              post.id,
            ) ?? 0,

          liked_by_me:
            likedPostIds.has(
              post.id,
            ),
        }),
      )

    const lastPost =
      pageRows[
        pageRows.length - 1
      ]

    const nextCursor =
      hasMore &&
      lastPost
        ? lastPost.created_at
        : null

    return NextResponse.json(
      {
        posts,

        hasMore,

        nextCursor,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      },
    )
  } catch (error) {
    console.error(
      'GET community posts error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '服务器错误',
      },
      {
        status: 500,
      },
    )
  }
}

// POST /api/community/posts
// 发布新动态
export async function POST(
  request: NextRequest,
) {
  try {
    const authorization =
      request.headers.get(
        'authorization',
      )

    if (
      !authorization?.startsWith(
        'Bearer ',
      )
    ) {
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

    const accessToken =
      authorization.slice(7)

    const supabase =
      getAdminSupabase()

    // 根据 access token 获取当前用户
    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await supabase.auth.getUser(
        accessToken,
      )

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            '登录状态已失效',
        },
        {
          status: 401,
        },
      )
    }

    // 获取用户 Profile
    const {
      data: profile,
      error:
        profileError,
    } = await supabase
      .from(
        'profiles',
      )
      .select(`
        id,
        star_citizen_handle,
        rsi_verified,
        muted_until,
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

    // 已封禁用户不能发布动态
    if (
      profile.banned_at
    ) {
      return NextResponse.json(
        {
          error:
            '该账号已被封禁，无法发布动态',
        },
        {
          status: 403,
        },
      )
    }

    // 禁言中的用户不能发布动态
    if (
      profile.muted_until
    ) {
      const mutedUntil =
        new Date(
          profile.muted_until,
        )

      if (
        !Number.isNaN(
          mutedUntil.getTime(),
        ) &&
        mutedUntil.getTime() >
          Date.now()
      ) {
        return NextResponse.json(
          {
            error:
              '该账号正在禁言中，暂时无法发布动态',

            muted_until:
              profile.muted_until,
          },
          {
            status: 403,
          },
        )
      }
    }

    // 必须完成 RSI Handle 认证
    if (
      profile.rsi_verified !==
        true ||
      !profile.star_citizen_handle
    ) {
      return NextResponse.json(
        {
          error:
            '完成 RSI Handle 认证后才能发布动态',
        },
        {
          status: 403,
        },
      )
    }

    const body =
      await request.json()

    const content =
      typeof body.content ===
      'string'
        ? body.content.trim()
        : ''

    if (!content) {
      return NextResponse.json(
        {
          error:
            '动态内容不能为空',
        },
        {
          status: 400,
        },
      )
    }

    if (
      content.length > 1000
    ) {
      return NextResponse.json(
        {
          error:
            '动态内容不能超过 1000 字',
        },
        {
          status: 400,
        },
      )
    }

    const {
      data: post,
      error:
        insertError,
    } = await supabase
      .from(
        'posts',
      )
      .insert({
        author_id:
          profile.id,

        content,

        visibility:
          'public',
      })
      .select(`
        id,
        content,
        created_at,
        updated_at
      `)
      .single()

    if (
      insertError
    ) {
      console.error(
        'Failed to create post:',
        insertError,
      )

      return NextResponse.json(
        {
          error:
            '发布动态失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        post,
      },
      {
        status: 201,
      },
    )
  } catch (error) {
    console.error(
      'POST community post error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '服务器错误',
      },
      {
        status: 500,
      },
    )
  }
}

export async function DELETE(
  request: NextRequest,
) {
  try {
    const authHeader =
      request.headers.get(
        'authorization',
      )

    const accessToken =
      authHeader?.startsWith(
        'Bearer ',
      )
        ? authHeader.slice(7)
        : null

    if (!accessToken) {
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

    const postId =
      request.nextUrl.searchParams.get(
        'postId',
      )

    if (!postId) {
      return NextResponse.json(
        {
          error:
            '动态 ID 无效',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await supabase.auth.getUser(
        accessToken,
      )

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            '登录状态无效',
        },
        {
          status: 401,
        },
      )
    }

    const {
      data: post,
      error:
        postError,
    } = await supabase
      .from('posts')
      .select(`
        id,
        author_id,
        deleted_at
      `)
      .eq(
        'id',
        postId,
      )
      .maybeSingle()

    if (
      postError
    ) {
      console.error(
        'Failed to load post for delete:',
        postError,
      )

      return NextResponse.json(
        {
          error:
            '读取动态失败',
        },
        {
          status: 500,
        },
      )
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

    if (
      post.author_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            '你只能删除自己的动态',
        },
        {
          status: 403,
        },
      )
    }

    if (
      post.deleted_at
    ) {
      return NextResponse.json({
        ok: true,
        postId,
      })
    }

    const now =
      new Date().toISOString()

    const {
      error:
        deleteError,
    } = await supabase
      .from('posts')
      .update({
        deleted_at:
          now,
        updated_at:
          now,
      })
      .eq(
        'id',
        postId,
      )
      .eq(
        'author_id',
        user.id,
      )

    if (
      deleteError
    ) {
      console.error(
        'Failed to delete post:',
        deleteError,
      )

      return NextResponse.json(
        {
          error:
            '删除动态失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      postId,
    })
  } catch (error) {
    console.error(
      'Delete post error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '删除动态失败',
      },
      {
        status: 500,
      },
    )
  }
}