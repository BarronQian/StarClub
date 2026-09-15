import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  isAdminIdentity,
} from '@/lib/admin-auth'

import {
  createAdminClient,
} from '@/lib/supabase-admin'

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  },
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

    const admin =
      createAdminClient()

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await admin.auth.getUser(
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

    if (
      !isAdminIdentity(
        user.id,
        user.email,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '无社区管理权限',
        },
        {
          status: 403,
        },
      )
    }

    const {
      id,
    } =
      await context.params

    const commentId =
      id?.trim()

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

    const {
      data: comment,
      error:
        commentError,
    } = await admin
      .from(
        'comments',
      )
      .select(`
        id,
        post_id,
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
            '找不到该评论',
        },
        {
          status: 404,
        },
      )
    }

    if (
      comment.deleted_at
    ) {
      return NextResponse.json({
        ok: true,
        commentId,
        postId:
          comment.post_id,
      })
    }

    const now =
      new Date().toISOString()

    const {
      error:
        updateError,
    } = await admin
      .from(
        'comments',
      )
      .update({
        deleted_at:
          now,
        updated_at:
          now,
      })
      .eq(
        'id',
        commentId,
      )

    if (updateError) {
      console.error(
        'Admin comment delete error:',
        updateError,
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

    await admin
      .from(
        'community_notifications',
      )
      .delete()
      .eq(
        'comment_id',
        commentId,
      )

    return NextResponse.json({
      ok: true,
      commentId,
      postId:
        comment.post_id,
    })
  } catch (error) {
    console.error(
      'Admin comment delete error:',
      error,
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
}