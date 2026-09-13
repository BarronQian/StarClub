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

// GET /api/community/comments?postId=xxx&cursor=xxx
// 每次最多读取 20 条评论
export async function GET(
  request: NextRequest,
) {
  try {
    const postId =
      request.nextUrl.searchParams.get(
        'postId',
      )

    const cursor =
      request.nextUrl.searchParams.get(
        'cursor',
      )

    if (!postId) {
      return NextResponse.json(
        {
          error:
            '缺少动态 ID',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      getAdminSupabase()

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
          reply_to_comment_id,
          created_at,
          updated_at,
          profiles!post_comments_author_fk (
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
          'post_id',
          postId,
        )
        .is(
          'deleted_at',
          null,
        )
        .order(
          'created_at',
          {
            ascending: true,
          },
        )
        .limit(
          COMMENTS_PAGE_SIZE +
            1,
        )

    if (cursor) {
      query =
        query.gt(
          'created_at',
          cursor,
        )
    }

    const {
      data,
      error,
    } =
      await query

    if (error) {
      console.error(
        'Failed to load comments:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '读取评论失败',
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
        comments,
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
      'GET community comments error:',
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

// POST /api/community/comments
// 发表评论
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

    if (
      profile.banned_at
    ) {
      return NextResponse.json(
        {
          error:
            '该账号已被封禁，无法评论',
        },
        {
          status: 403,
        },
      )
    }

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
              '该账号正在禁言中，暂时无法评论',
          },
          {
            status: 403,
          },
        )
      }
    }

    if (
      profile.rsi_verified !==
        true ||
      !profile.star_citizen_handle
    ) {
      return NextResponse.json(
        {
          error:
            '完成 RSI Handle 认证后才能评论',
        },
        {
          status: 403,
        },
      )
    }

    const body =
      await request.json()

    const postId =
      typeof body.postId ===
      'string'
        ? body.postId.trim()
        : ''

    const content =
      typeof body.content ===
      'string'
        ? body.content.trim()
        : ''

    const parentCommentId =
      typeof body.parentCommentId ===
        'string' &&
      body.parentCommentId.trim()
        ? body.parentCommentId.trim()
        : null

    const replyToCommentId =
      typeof body.replyToCommentId ===
        'string' &&
      body.replyToCommentId.trim()
        ? body.replyToCommentId.trim()
        : null

    if (!postId) {
      return NextResponse.json(
        {
          error:
            '缺少动态 ID',
        },
        {
          status: 400,
        },
      )
    }

    if (!content) {
      return NextResponse.json(
        {
          error:
            '评论内容不能为空',
        },
        {
          status: 400,
        },
      )
    }

    if (
      content.length > 500
    ) {
      return NextResponse.json(
        {
          error:
            '评论不能超过 500 字',
        },
        {
          status: 400,
        },
      )
    }

    const {
      data: post,
      error:
        postError,
    } = await supabase
      .from(
        'posts',
      )
      .select('id')
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

    if (
      postError ||
      !post
    ) {
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

        // 如果是在回复某条评论，
    // 确认父评论存在、未删除，
    // 并且属于当前这条动态
    if (parentCommentId) {
      const {
        data: parentComment,
        error: parentCommentError,
      } = await supabase
        .from('post_comments')
        .select(`
          id,
          post_id,
          parent_comment_id,
          deleted_at
        `)
        .eq(
          'id',
          parentCommentId,
        )
        .maybeSingle()

      if (
        parentCommentError ||
        !parentComment ||
        parentComment.deleted_at
      ) {
        return NextResponse.json(
          {
            error:
              '要回复的评论不存在',
          },
          {
            status: 404,
          },
        )
      }

      if (
        parentComment.post_id !==
        postId
      ) {
        return NextResponse.json(
          {
            error:
              '无法回复其他动态下的评论',
          },
          {
            status: 400,
          },
        )
      }
    }

    if (replyToCommentId) {
      const {
        data: replyToComment,
        error: replyToCommentError,
      } = await supabase
        .from('post_comments')
        .select(`
          id,
          post_id,
          deleted_at
        `)
        .eq(
          'id',
          replyToCommentId,
        )
        .maybeSingle()

      if (
        replyToCommentError ||
        !replyToComment ||
        replyToComment.deleted_at
      ) {
        return NextResponse.json(
          {
            error:
              '要回复的评论不存在',
          },
          {
            status: 404,
          },
        )
      }

      if (
        replyToComment.post_id !==
        postId
      ) {
        return NextResponse.json(
          {
            error:
              '无法回复其他动态下的评论',
          },
          {
            status: 400,
          },
        )
      }
    }

    const {
      data: insertedComment,
      error:
        insertError,
    } = await supabase
      .from(
        'post_comments',
      )
      .insert({
        post_id:
          postId,

        author_id:
          profile.id,

        content,

        parent_comment_id:
          parentCommentId,

        reply_to_comment_id:
          replyToCommentId,
      })
      .select(`
        id,
        post_id,
        author_id,
        content,
        parent_comment_id,
        reply_to_comment_id,
        created_at,
        updated_at
      `)
      .single()

    if (
      insertError
    ) {
      console.error(
        'Failed to create comment:',
        insertError,
      )

      return NextResponse.json(
        {
          error:
            '发表评论失败',
        },
        {
          status: 500,
        },
      )
    }
    
        const {
      data: comment,
      error:
        commentLoadError,
    } = await supabase
      .from(
        'post_comments',
      )
      .select(`
        id,
        post_id,
        author_id,
        content,
        parent_comment_id,
        reply_to_comment_id,
        created_at,
        updated_at,
        profiles!post_comments_author_fk (
          username,
          display_name,
          avatar_url,
          star_citizen_handle,
          profile_slug
        )
      `)
      .eq(
        'id',
        insertedComment.id,
      )
      .single()

    if (
      commentLoadError ||
      !comment
    ) {
      console.error(
        'Failed to load created comment:',
        commentLoadError,
      )

      return NextResponse.json(
        {
          error:
            '评论已发布，但读取评论信息失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        comment,
      },
      {
        status: 201,
      },
    )
  } catch (error) {
    console.error(
      'POST community comment error:',
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

// DELETE /api/community/comments?commentId=xxx
// 删除自己的评论
export async function DELETE(
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

    const commentId =
      request.nextUrl.searchParams.get(
        'commentId',
      )

    if (!commentId) {
      return NextResponse.json(
        {
          error:
            '缺少评论 ID',
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
            '登录状态已失效',
        },
        {
          status: 401,
        },
      )
    }

    const {
      data: comment,
      error:
        commentError,
    } = await supabase
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
      .maybeSingle()

    if (
      commentError ||
      !comment
    ) {
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

    if (
      comment.author_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            '你只能删除自己的评论',
        },
        {
          status: 403,
        },
      )
    }

    if (
      comment.deleted_at
    ) {
      return NextResponse.json(
        {
          ok: true,
          postId:
            comment.post_id,
        },
      )
    }

        // 如果删除的是一条父评论，
    // 将它下面仍然存在的回复提升为一级评论，
    // 避免回复因为失去父评论而无法显示
    const {
      error: promoteRepliesError,
    } = await supabase
      .from(
        'post_comments',
      )
      .update({
        parent_comment_id:
          null,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'parent_comment_id',
        commentId,
      )
      .is(
        'deleted_at',
        null,
      )

    if (
      promoteRepliesError
    ) {
      console.error(
        'Failed to promote child replies:',
        promoteRepliesError,
      )

      return NextResponse.json(
        {
          error:
            '处理评论回复失败',
        },
        {
          status: 500,
        },
      )
    }

    const {
      error:
        deleteError,
    } = await supabase
      .from(
        'post_comments',
      )
      .update({
        deleted_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        commentId,
      )
      .eq(
        'author_id',
        user.id,
      )

    if (
      deleteError
    ) {
      console.error(
        'Failed to delete comment:',
        deleteError,
      )

      return NextResponse.json(
        {
          error:
            '删除评论失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        ok: true,
        postId:
          comment.post_id,
      },
    )
  } catch (error) {
    console.error(
      'DELETE community comment error:',
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