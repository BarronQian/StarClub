import {
  NextRequest,
  NextResponse,
} from 'next/server'
import {
  createClient,
} from '@supabase/supabase-js'

function getAdminSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL

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

  const token =
    authorization.slice(7)

  const supabase =
    getAdminSupabase()

  const {
    data,
    error,
  } =
    await supabase.auth.getUser(
      token,
    )

  if (
    error ||
    !data.user
  ) {
    return null
  }

  return data.user
}

export async function GET(
  request: NextRequest,
) {
  try {
    const user =
      await getCurrentUser(
        request,
      )

    if (!user) {
      return NextResponse.json(
        {
          total: 0,
          requests: 0,
          messages: 0,
        },
        {
          headers: {
            'Cache-Control':
              'no-store, max-age=0',
          },
        },
      )
    }

    const supabase =
      getAdminSupabase()

    const {
      data:
        notificationState,
    } = await supabase
      .from(
        'market_notification_state',
      )
      .select(
        'trade_requests_seen_at',
      )
      .eq(
        'user_id',
        user.id,
      )
      .maybeSingle()

    const seenAt =
      notificationState
        ?.trade_requests_seen_at ??
      '1970-01-01T00:00:00.000Z'

    const {
      count:
        unreadRequestCount,
      error:
        requestCountError,
    } = await supabase
      .from(
        'market_trade_requests',
      )
      .select(
        'id',
        {
          count: 'exact',
          head: true,
        },
      )
      .eq(
        'seller_id',
        user.id,
      )
      .eq(
        'status',
        'pending',
      )
      .gt(
        'created_at',
        seenAt,
      )

    if (requestCountError) {
      console.error(
        'Failed to count unread trade requests:',
        requestCountError,
      )
    }

    const {
      data:
        tradeRequests,
      error:
        tradeRequestsError,
    } = await supabase
      .from(
        'market_trade_requests',
      )
      .select(`
        id,
        buyer_id,
        seller_id,
        buyer_last_read_at,
        seller_last_read_at
      `)
      .eq(
        'status',
        'accepted',
      )
      .or(
        `buyer_id.eq.${user.id},seller_id.eq.${user.id}`,
      )

    if (tradeRequestsError) {
      console.error(
        'Failed to load trade requests for notifications:',
        tradeRequestsError,
      )
    }

    const requests =
      tradeRequests ?? []

    const requestIds =
      requests.map(
        (item) => item.id,
      )

    let unreadMessageCount =
      0

    if (
      requestIds.length > 0
    ) {
      const {
        data:
          messages,
        error:
          messagesError,
      } = await supabase
        .from(
          'market_trade_messages',
        )
        .select(`
          trade_request_id,
          sender_id,
          created_at
        `)
        .in(
          'trade_request_id',
          requestIds,
        )

      if (messagesError) {
        console.error(
          'Failed to load unread notification messages:',
          messagesError,
        )
      } else {
        for (
          const message of
            messages ?? []
        ) {
          const tradeRequest =
            requests.find(
              (item) =>
                item.id ===
                message.trade_request_id,
            )

          if (!tradeRequest) {
            continue
          }

          if (
            message.sender_id ===
            user.id
          ) {
            continue
          }

          const isBuyer =
            tradeRequest.buyer_id ===
            user.id

          const lastReadAt =
            isBuyer
              ? tradeRequest
                  .buyer_last_read_at
              : tradeRequest
                  .seller_last_read_at

          if (
            lastReadAt &&
            new Date(
              message.created_at,
            ).getTime() <=
              new Date(
                lastReadAt,
              ).getTime()
          ) {
            continue
          }

          unreadMessageCount +=
            1
        }
      }
    }

    const requestsCount =
      unreadRequestCount ?? 0

    return NextResponse.json(
      {
        total:
          requestsCount +
          unreadMessageCount,

        requests:
          requestsCount,

        messages:
          unreadMessageCount,
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
      'Market notifications GET error:',
      error,
    )

    return NextResponse.json(
      {
        total: 0,
        requests: 0,
        messages: 0,
      },
      {
        status: 500,
      },
    )
  }
}

export async function PATCH(
  request: NextRequest,
) {
  try {
    const user =
      await getCurrentUser(
        request,
      )

    if (!user) {
      return NextResponse.json(
        {
          error:
            '请先登录后操作',
        },
        {
          status: 401,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    const now =
      new Date().toISOString()

    const {
      error,
    } = await supabase
      .from(
        'market_notification_state',
      )
      .upsert(
        {
          user_id:
            user.id,

          trade_requests_seen_at:
            now,

          updated_at:
            now,
        },
        {
          onConflict:
            'user_id',
        },
      )

    if (error) {
      console.error(
        'Failed to mark trade requests as seen:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '更新通知状态失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        success: true,
        seen_at: now,
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
      'Market notifications PATCH error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '更新通知状态失败',
      },
      {
        status: 500,
      },
    )
  }
}