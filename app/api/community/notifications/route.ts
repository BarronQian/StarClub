import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PAGE_SIZE = 30

function getAdminSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

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

async function getCurrentUser(
  request: NextRequest,
) {
  const authorization =
    request.headers.get(
      'authorization',
    )

  if (
    !authorization?.startsWith(
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

  return {
    user,
    supabase,
  }
}

// GET /api/community/notifications
//
// 读取通知列表
// 并返回：
// unseenCount = 左侧红色数字
// unreadCount = 通知列表中真正未读数量
//
export async function GET(
  request: NextRequest,
) {
  try {
    const auth =
      await getCurrentUser(
        request,
      )

    if (!auth) {
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
      user,
      supabase,
    } = auth

    const cursor =
      request.nextUrl.searchParams.get(
        'cursor',
      )

    let query =
      supabase
        .from(
          'community_notifications',
        )
        .select(`
          id,
          recipient_id,
          actor_id,
          type,
          post_id,
          comment_id,
          created_at,
          seen_at,
          read_at,
          actor:profiles!community_notifications_actor_fk (
            username,
            display_name,
            avatar_url,
            star_citizen_handle,
            profile_slug
          )
        `)
        .eq(
          'recipient_id',
          user.id,
        )
        .order(
          'created_at',
          {
            ascending: false,
          },
        )
        .limit(
          PAGE_SIZE + 1,
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
    } =
      await query

    if (error) {
      console.error(
        'Failed to load notifications:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '读取消息失败',
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
      PAGE_SIZE

    const notifications =
      hasMore
        ? rows.slice(
            0,
            PAGE_SIZE,
          )
        : rows

    const lastNotification =
      notifications[
        notifications.length - 1
      ]

    const nextCursor =
      hasMore &&
      lastNotification
        ? lastNotification.created_at
        : null

    const {
      count: unseenCount,
      error:
        unseenCountError,
    } =
      await supabase
        .from(
          'community_notifications',
        )
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          },
        )
        .eq(
          'recipient_id',
          user.id,
        )
        .is(
          'seen_at',
          null,
        )

    if (unseenCountError) {
      console.error(
        'Failed to count unseen notifications:',
        unseenCountError,
      )
    }

    const {
      count: unreadCount,
      error:
        unreadCountError,
    } =
      await supabase
        .from(
          'community_notifications',
        )
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          },
        )
        .eq(
          'recipient_id',
          user.id,
        )
        .is(
          'read_at',
          null,
        )

    if (unreadCountError) {
      console.error(
        'Failed to count unread notifications:',
        unreadCountError,
      )
    }

    return NextResponse.json(
      {
        notifications,
        unseenCount:
          unseenCount ?? 0,
        unreadCount:
          unreadCount ?? 0,
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
      'GET community notifications error:',
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

// PATCH /api/community/notifications
//
// action:
// seen      = 进入消息中心，清除左侧红色数字
// read      = 阅读单条通知
// read-all  = 一键全部已读
//
export async function PATCH(
  request: NextRequest,
) {
  try {
    const auth =
      await getCurrentUser(
        request,
      )

    if (!auth) {
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
      user,
      supabase,
    } = auth

    const body =
      await request.json()

    const action =
      typeof body.action ===
      'string'
        ? body.action
        : ''

    const now =
      new Date().toISOString()

    if (
      action ===
      'seen'
    ) {
      const {
        error,
      } =
        await supabase
          .from(
            'community_notifications',
          )
          .update({
            seen_at:
              now,
          })
          .eq(
            'recipient_id',
            user.id,
          )
          .is(
            'seen_at',
            null,
          )

      if (error) {
        console.error(
          'Failed to mark notifications seen:',
          error,
        )

        return NextResponse.json(
          {
            error:
              '更新消息状态失败',
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

    if (
      action ===
      'read-all'
    ) {
      const {
        error,
      } =
        await supabase
          .from(
            'community_notifications',
          )
          .update({
            seen_at:
              now,
            read_at:
              now,
          })
          .eq(
            'recipient_id',
            user.id,
          )
          .is(
            'read_at',
            null,
          )

      if (error) {
        console.error(
          'Failed to mark all notifications read:',
          error,
        )

        return NextResponse.json(
          {
            error:
              '全部标为已读失败',
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

    if (
      action ===
      'read'
    ) {
      const notificationId =
        typeof body.notificationId ===
          'string'
          ? body.notificationId.trim()
          : ''

      if (!notificationId) {
        return NextResponse.json(
          {
            error:
              '缺少消息 ID',
          },
          {
            status: 400,
          },
        )
      }

      const {
        error,
      } =
        await supabase
          .from(
            'community_notifications',
          )
          .update({
            seen_at:
              now,
            read_at:
              now,
          })
          .eq(
            'id',
            notificationId,
          )
          .eq(
            'recipient_id',
            user.id,
          )

      if (error) {
        console.error(
          'Failed to mark notification read:',
          error,
        )

        return NextResponse.json(
          {
            error:
              '更新消息状态失败',
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

    return NextResponse.json(
      {
        error:
          '无效的操作',
      },
      {
        status: 400,
      },
    )
  } catch (error) {
    console.error(
      'PATCH community notifications error:',
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