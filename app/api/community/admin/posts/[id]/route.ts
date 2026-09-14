import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

import {
  isAdminUserId,
} from '@/lib/admin-auth'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

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

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
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
            '登录状态无效',
        },
        {
          status: 401,
        },
      )
    }

    if (
      !isAdminUserId(
        user.id,
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
      id: postId,
    } =
      await context.params

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

    if (postError) {
      console.error(
        'Failed to load post for admin delete:',
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

    if (post.deleted_at) {
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

    if (deleteError) {
      console.error(
        'Failed to admin delete post:',
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

    // 和普通删除保持一致：
    // 删除该动态相关通知。
    const {
      error:
        notificationCleanupError,
    } = await supabase
      .from(
        'community_notifications',
      )
      .delete()
      .eq(
        'post_id',
        postId,
      )

    if (
      notificationCleanupError
    ) {
      console.error(
        'Failed to clean up post notifications:',
        notificationCleanupError,
      )
    }

    return NextResponse.json({
      ok: true,
      postId,
    })
  } catch (error) {
    console.error(
      'Admin delete community post error:',
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