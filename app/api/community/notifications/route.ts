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

const PAGE_SIZE = 20

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

/*
 * GET /api/community/notifications
 *
 * 返回当前登录用户的消息通知
 */
export async function GET(
  request: NextRequest,
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

    const supabase =
      getAdminSupabase()

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
          read_at
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
      data:
        notificationRows,
      error:
        notificationError,
    } =
      await query

    if (
      notificationError
    ) {
      console.error(
        'Failed to load community notifications:',
        notificationError,
      )

      throw notificationError
    }

    const rows =
      notificationRows ?? []

    const hasMore =
      rows.length >
      PAGE_SIZE

    const visibleRows =
      hasMore
        ? rows.slice(
            0,
            PAGE_SIZE,
          )
        : rows

    /*
     * 一次性读取这些通知对应的用户资料，
     * 再映射成前端需要的 actor。
     */
    const actorIds =
      Array.from(
        new Set(
          visibleRows
            .map(
              (
                notification,
              ) =>
                notification.actor_id,
            )
            .filter(Boolean),
        ),
      )

    let profileMap =
      new Map<
        string,
        {
          username:
            | string
            | null
          display_name:
            | string
            | null
          avatar_url:
            | string
            | null
          star_citizen_handle:
            | string
            | null
          profile_slug:
            | string
            | null
        }
      >()

    if (
      actorIds.length >
      0
    ) {
      const {
        data:
          actorProfiles,
        error:
          actorProfilesError,
      } =
        await supabase
          .from(
            'profiles',
          )
          .select(`
            id,
            username,
            display_name,
            avatar_url,
            star_citizen_handle,
            profile_slug
          `)
          .in(
            'id',
            actorIds,
          )

      if (
        actorProfilesError
      ) {
        console.error(
          'Failed to load notification actors:',
          actorProfilesError,
        )
      } else {
        profileMap =
          new Map(
            (
              actorProfiles ??
              []
            ).map(
              (
                profile,
              ) => [
                profile.id,
                {
                  username:
                    profile.username ??
                    null,

                  display_name:
                    profile.display_name ??
                    null,

                  avatar_url:
                    profile.avatar_url ??
                    null,

                  star_citizen_handle:
                    profile.star_citizen_handle ??
                    null,

                  profile_slug:
                    profile.profile_slug ??
                    null,
                },
              ],
            ),
          )
      }
    }

    const notifications =
      visibleRows.map(
        (
          notification,
        ) => ({
          ...notification,

          actor:
            profileMap.get(
              notification.actor_id,
            ) ?? null,
        }),
      )

    /*
     * 未查看数量
     */
    const {
      count:
        unseenCount,
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

    if (
      unseenCountError
    ) {
      console.error(
        'Failed to count unseen notifications:',
        unseenCountError,
      )
    }

    /*
     * 未读数量
     */
    const {
      count:
        unreadCount,
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

    if (
      unreadCountError
    ) {
      console.error(
        'Failed to count unread notifications:',
        unreadCountError,
      )
    }

    const lastNotification =
      visibleRows[
        visibleRows.length -
          1
      ]

    return NextResponse.json({
      notifications,

      unseenCount:
        unseenCount ?? 0,

      unreadCount:
        unreadCount ?? 0,

      hasMore,

      nextCursor:
        hasMore &&
        lastNotification
          ? lastNotification.created_at
          : null,
    })
  } catch (error) {
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
}

/*
 * PATCH /api/community/notifications
 *
 * action:
 * seen
 * read
 * read-all
 */
export async function PATCH(
  request: NextRequest,
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

    const body =
      await request.json()

    const action =
      typeof body?.action ===
      'string'
        ? body.action
        : ''

    const supabase =
      getAdminSupabase()

    const now =
      new Date().toISOString()

    /*
     * 用户打开「我的消息」
     * → 全部标记为 seen
     */
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
        throw error
      }

      return NextResponse.json({
        success: true,
      })
    }

    /*
     * 单条标记为已读
     */
    if (
      action ===
      'read'
    ) {
      const notificationId =
        typeof body
          ?.notificationId ===
        'string'
          ? body.notificationId
          : ''

      if (
        !notificationId
      ) {
        return NextResponse.json(
          {
            error:
              '缺少通知 ID',
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
        throw error
      }

      return NextResponse.json({
        success: true,
      })
    }

    /*
     * 全部标记为已读
     */
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
        throw error
      }

      return NextResponse.json({
        success: true,
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
      'Failed to update notifications:',
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
} 