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

const COMMENTS_PAGE_SIZE = 20

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

// GET /api/community/comments/mine?cursor=xxx
// 读取当前登录用户发表过的评论
export async function GET(
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
          error: '请先登录',
        },
        {
          status: 401,
        },
      )
    }

    const accessToken =
      authorization.slice(7)

    const cursor =
      request.nextUrl.searchParams.get(
        'cursor',
      )

    const supabase =
      getAdminSupabase()

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

    let query =
      supabase
        .from(
          'post_comments',
        )
        .select(`
          id,
          post_id,
          author_id,
          content,
          parent_comment_id,
          created_at,
          updated_at
        `)
        .eq(
          'author_id',
          user.id,
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
          COMMENTS_PAGE_SIZE + 1,
        )

    if (cursor) {
      query =
        query.lt(
          'created_at',
          cursor,
        )
    }

    const {
      data,
      error,
    } = await query

    if (error) {
      console.error(
        'Failed to load my comments:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '读取我的评论失败',
        },
        {
          status: 500,
        },
      )
    }

    const rows =
      data ?? []

    const hasMore =
      rows.length >
      COMMENTS_PAGE_SIZE

    const comments =
      hasMore
        ? rows.slice(
            0,
            COMMENTS_PAGE_SIZE,
          )
        : rows

    const postIds = [
      ...new Set(
        comments.map(
          (comment) =>
            comment.post_id,
        ),
      ),
    ]

    let posts: any[] = []

    if (postIds.length > 0) {
      const {
        data: postRows,
        error: postsError,
      } = await supabase
        .from('posts')
        .select(`
          id,
          author_id,
          content,
          created_at,
          profiles!posts_author_id_fkey (
            username,
            display_name,
            avatar_url,
            star_citizen_handle,
            profile_slug
          )
        `)
        .in(
          'id',
          postIds,
        )
        .eq(
          'visibility',
          'public',
        )
        .is(
          'deleted_at',
          null,
        )

      if (postsError) {
        console.error(
          'Failed to load posts for my comments:',
          postsError,
        )

        return NextResponse.json(
          {
            error:
              '读取评论对应的动态失败',
          },
          {
            status: 500,
          },
        )
      }

      posts =
        postRows ?? []
    }

    const postMap =
      new Map(
        posts.map(
          (post) => [
            post.id,
            post,
          ],
        ),
      )

      const parentCommentIds = [
        ...new Set(
          comments
            .map(
              (comment) =>
                comment.parent_comment_id,
            )
            .filter(
              (
                id,
              ): id is string =>
                Boolean(id),
            ),
        ),
      ]

      let parentComments: any[] = []

      if (
        parentCommentIds.length >
        0
      ) {
        const {
          data:
            parentCommentRows,
          error:
            parentCommentsError,
        } = await supabase
          .from(
            'post_comments',
          )
          .select(`
            id,
            author_id,
            profiles!post_comments_author_fk (
              username,
              display_name,
              avatar_url,
              star_citizen_handle,
              profile_slug
            )
          `)
          .in(
            'id',
            parentCommentIds,
          )
          .is(
            'deleted_at',
            null,
          )

        if (
          parentCommentsError
        ) {
          console.error(
            'Failed to load parent comments:',
            parentCommentsError,
          )
        } else {
          parentComments =
            parentCommentRows ?? []
        }
      }

      const parentCommentMap =
        new Map(
          parentComments.map(
            (
              parentComment,
            ) => [
              parentComment.id,
              parentComment,
            ],
          ),
        )

    const items =
      comments
        .map(
          (comment) => ({
            ...comment,

            post:
              postMap.get(
                comment.post_id,
              ) ?? null,

            parent_comment:
              comment
                .parent_comment_id
                ? parentCommentMap.get(
                    comment
                      .parent_comment_id,
                  ) ?? null
                : null,
          }),
        )
        .filter(
          (comment) =>
            comment.post !== null,
        )

    const lastComment =
      comments[
        comments.length - 1
      ]

    const nextCursor =
      hasMore &&
      lastComment
        ? lastComment.created_at
        : null

    return NextResponse.json(
      {
        comments: items,
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
      'GET my community comments error:',
      error,
    )

    return NextResponse.json(
      {
        error: '服务器错误',
      },
      {
        status: 500,
      },
    )
  }
}