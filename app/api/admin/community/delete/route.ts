import {
  NextResponse,
  type NextRequest,
} from 'next/server'

import {
  requireAdminApi,
  isOwnerEmail,
  isOwnerUserId,
} from '@/lib/admin-auth'

import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(
  request: NextRequest,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  const body = await request
    .json()
    .catch(() => null)

  const postId =
    typeof body?.id === 'string'
      ? body.id.trim()
      : ''

  if (!postId) {
    return NextResponse.json(
      {
        error: '缺少动态 ID',
      },
      {
        status: 400,
      },
    )
  }

  const admin =
    createAdminClient()

  /*
   * 读取动态和作者 ID。
   *
   * author_id 就是社区 Profile UUID，
   * 所以可以直接用它判断 Owner，
   * 不再通过 Auth 邮箱反查。
   */
  const {
    data: post,
    error: postError,
  } = await admin
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

  if (postError) {
    console.error(
      '[v0] Community post lookup error:',
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
          '找不到该动态',
      },
      {
        status: 404,
      },
    )
  }

  if (post.deleted_at) {
    return NextResponse.json(
      {
        error:
          '该动态已经被删除',
      },
      {
        status: 400,
      },
    )
  }

  const postBelongsToOwner =
    isOwnerUserId(
      post.author_id,
    )

  const callerIsOwner =
    isOwnerEmail(
      auth.session.email,
    )

  /*
   * Owner 的动态受保护：
   *
   * 普通 Admin：
   * - 不能删除 Owner 动态
   *
   * 后台 Owner：
   * - 可以删除 Owner 自己的动态
   *
   * 普通 Admin / 其他 Admin 的动态：
   * - 管理组之间可以互相删除
   */
  if (
    postBelongsToOwner &&
    !callerIsOwner
  ) {
    return NextResponse.json(
      {
        error:
          '最高权限账号的动态不可由普通管理员删除',
      },
      {
        status: 403,
      },
    )
  }

  /*
   * 软删除。
   * 不永久删除数据库记录，
   * 只设置 deleted_at。
   */
  const {
    error: deleteError,
  } = await admin
    .from('posts')
    .update({
      deleted_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      postId,
    )

  if (deleteError) {
    console.error(
      '[v0] Community delete error:',
      deleteError,
    )

    return NextResponse.json(
      {
        error:
          '删除动态失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json({
    ok: true,
  })
}