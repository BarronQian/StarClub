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
          error:
            '请先登录后查看交易申请',
        },
        {
          status: 401,
        },
      )
    }

    const url =
      new URL(
        request.url,
      )

    const type =
      url.searchParams.get(
        'type',
      )

    if (
      type !== 'received' &&
      type !== 'sent'
    ) {
      return NextResponse.json(
        {
          error:
            '交易申请类型无效',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        star_citizen_handle,
        rsi_verified
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
            '无法读取社区资料',
        },
        {
          status: 403,
        },
      )
    }

    let query =
      supabase
        .from(
          'market_trade_requests',
        )
        .select(`
          id,
          listing_id,
          buyer_id,
          seller_id,
          quantity,
          offered_price_uec,
          preferred_location,
          preferred_time,
          message,
          status,
          created_at,
          updated_at,
          accepted_at,
          declined_at,
          cancelled_at,
          completed_at,

          cancelled_by,
          cancel_reason,
          buyer_completed_at,
          seller_completed_at,

          buyer_last_read_at,
          seller_last_read_at,

          market_listings!market_trade_requests_listing_fk (
            id,
            listing_type,
            title,
            price_uec,
            quantity,
            image_urls,
            location,
            status,
            closed_at
          ),

          buyer:profiles!market_trade_requests_buyer_fk (
            id,
            username,
            display_name,
            avatar_url,
            star_citizen_handle,
            rsi_verified,
            member_number,
            profile_slug
          ),

          seller:profiles!market_trade_requests_seller_fk (
            id,
            username,
            display_name,
            avatar_url,
            star_citizen_handle,
            rsi_verified,
            member_number,
            profile_slug
          )
        `)
        .order(
          'created_at',
          {
            ascending: false,
          },
        )

    if (
      type === 'received'
    ) {
      query =
        query.eq(
          'seller_id',
          profile.id,
        )
    } else {
      query =
        query.eq(
          'buyer_id',
          profile.id,
        )
    }

    const {
      data,
      error,
    } = await query

    if (error) {
      console.error(
        'Failed to load trade requests:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '读取交易申请失败',
        },
        {
          status: 500,
        },
      )
    }

    const requests =
      data ?? []

    const requestIds =
      requests.map(
        (item) =>
          item.id,
      )

    const unreadCounts =
      new Map<
        string,
        number
      >()

    if (
      requestIds.length >
      0
    ) {
      const {
        data: messages,
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

      if (
        messagesError
      ) {
        console.error(
          'Failed to load unread trade messages:',
          messagesError,
        )
      } else {
        const requestMap =
          new Map(
            requests.map(
              (
                item,
              ) => [
                item.id,
                item,
              ],
            ),
          )

        for (
          const message of
          messages ?? []
        ) {
          const tradeRequest =
            requestMap.get(
              message.trade_request_id,
            )

          if (
            !tradeRequest
          ) {
            continue
          }

          /*
           * 自己发送的消息不算未读。
           */
          if (
            message.sender_id ===
            profile.id
          ) {
            continue
          }

          const isBuyer =
            tradeRequest
              .buyer_id ===
            profile.id

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

          unreadCounts.set(
            tradeRequest.id,
            (
              unreadCounts.get(
                tradeRequest.id,
              ) ?? 0
            ) + 1,
          )
        }
      }
    }

    const requestsWithUnread =
      requests.map(
        (item) => ({
          ...item,

          unread_count:
            unreadCounts.get(
              item.id,
            ) ?? 0,
        }),
      )

    return NextResponse.json(
      {
        requests:
          requestsWithUnread,
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
      'Trade request GET error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '读取交易申请失败',
      },
      {
        status: 500,
      },
    )
  }
}

export async function POST(
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
            '请先登录后发送交易申请',
        },
        {
          status: 401,
        },
      )
    }

    let body: any

    try {
      body =
        await request.json()
    } catch {
      return NextResponse.json(
        {
          error:
            '请求内容格式错误',
        },
        {
          status: 400,
        },
      )
    }

    const listingId =
      typeof body.listingId ===
      'string'
        ? body.listingId
        : ''

    const quantity =
      Number(
        body.quantity,
      )

    const offeredPriceUec =
      body.offeredPriceUec ===
        null ||
      body.offeredPriceUec ===
        undefined ||
      body.offeredPriceUec ===
        ''
        ? null
        : Number(
            body.offeredPriceUec,
          )

    const preferredLocation =
      typeof body.preferredLocation ===
      'string'
        ? body.preferredLocation
            .trim()
            .slice(
              0,
              200,
            )
        : ''

    const preferredTime =
      typeof body.preferredTime ===
      'string'
        ? body.preferredTime
            .trim()
            .slice(
              0,
              200,
            )
        : ''

    const message =
      typeof body.message ===
      'string'
        ? body.message
            .trim()
            .slice(
              0,
              2000,
            )
        : ''

    if (!listingId) {
      return NextResponse.json(
        {
          error:
            '缺少交易商品',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity < 1
    ) {
      return NextResponse.json(
        {
          error:
            '交易数量无效',
        },
        {
          status: 400,
        },
      )
    }

    if (
      offeredPriceUec !==
        null &&
      (
        !Number.isSafeInteger(
          offeredPriceUec,
        ) ||
        offeredPriceUec <
          0
      )
    ) {
      return NextResponse.json(
        {
          error:
            '报价无效',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        star_citizen_handle,
        rsi_verified,
        banned_at,
        muted_until
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
            '无法读取你的社区资料',
        },
        {
          status: 403,
        },
      )
    }

    if (
      profile.banned_at
    ) {
      return NextResponse.json(
        {
          error:
            '当前账号无法使用市场交易功能',
        },
        {
          status: 403,
        },
      )
    }

    if (
      profile.muted_until &&
      new Date(
        profile.muted_until,
      ).getTime() >
        Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            '当前账号暂时无法发送交易申请',
        },
        {
          status: 403,
        },
      )
    }

    if (
      profile.rsi_verified !==
        true ||
      !profile.star_citizen_handle
    ) {
      return NextResponse.json(
        {
          error:
            '完成 RSI Handle 认证后才能发送交易申请',
        },
        {
          status: 403,
        },
      )
    }

    const {
      data: listing,
      error:
        listingError,
    } = await supabase
      .from(
        'market_listings',
      )
      .select(`
        id,
        seller_id,
        listing_type,
        quantity,
        status,
        closed_at,
        deleted_at
      `)
      .eq(
        'id',
        listingId,
      )
      .maybeSingle()

    if (
      listingError ||
      !listing ||
      listing.deleted_at
    ) {
      return NextResponse.json(
        {
          error:
            '该交易不存在或已被删除',
        },
        {
          status: 404,
        },
      )
    }

    /*
     * closed_at 才是现在商品是否已经下架的主要依据。
     *
     * 下架只阻止新的交易申请，
     * 不影响已经建立的 accepted 订单。
     */
    if (
      listing.closed_at
    ) {
      return NextResponse.json(
        {
          error:
            listing
              .listing_type ===
            'wts'
              ? '该商品已经售罄'
              : '该交易已经结束',
        },
        {
          status: 409,
        },
      )
    }

    if (
      listing.status !==
      'active'
    ) {
      return NextResponse.json(
        {
          error:
            '该交易当前无法接受新的申请',
        },
        {
          status: 409,
        },
      )
    }

    if (
      listing.seller_id ===
      profile.id
    ) {
      return NextResponse.json(
        {
          error:
            '不能向自己发布的交易发送申请',
        },
        {
          status: 400,
        },
      )
    }

    if (
      listing
        .listing_type ===
        'wts' &&
      quantity >
        listing.quantity
    ) {
      return NextResponse.json(
        {
          error:
            `该商品当前最多可交易 ${listing.quantity} 件`,
        },
        {
          status: 400,
        },
      )
    }

    /*
     * 同一个用户针对同一个商品，
     * 同时只能存在一个 pending / accepted 订单。
     *
     * cancelled / declined / completed 后
     * 可以重新发起新的申请。
     */
    const {
      data:
        existingRequest,
      error:
        existingError,
    } = await supabase
      .from(
        'market_trade_requests',
      )
      .select('id')
      .eq(
        'listing_id',
        listing.id,
      )
      .eq(
        'buyer_id',
        profile.id,
      )
      .in(
        'status',
        [
          'pending',
          'accepted',
        ],
      )
      .limit(1)
      .maybeSingle()

    if (
      existingError
    ) {
      console.error(
        'Failed to check existing trade request:',
        existingError,
      )

      return NextResponse.json(
        {
          error:
            '检查交易申请失败',
        },
        {
          status: 500,
        },
      )
    }

    if (
      existingRequest
    ) {
      return NextResponse.json(
        {
          error:
            '你已经对该交易发起过正在进行的申请',
        },
        {
          status: 409,
        },
      )
    }

    const {
      data:
        tradeRequest,
      error:
        insertError,
    } = await supabase
      .from(
        'market_trade_requests',
      )
      .insert({
        listing_id:
          listing.id,

        buyer_id:
          profile.id,

        seller_id:
          listing.seller_id,

        quantity,

        offered_price_uec:
          offeredPriceUec,

        preferred_location:
          preferredLocation ||
          null,

        preferred_time:
          preferredTime ||
          null,

        message,

        status:
          'pending',
      })
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        quantity,
        offered_price_uec,
        preferred_location,
        preferred_time,
        message,
        status,
        created_at,
        updated_at,
        accepted_at,
        declined_at,
        cancelled_at,
        completed_at,
        cancelled_by,
        cancel_reason,
        buyer_completed_at,
        seller_completed_at
      `)
      .single()

    if (
      insertError ||
      !tradeRequest
    ) {
      console.error(
        'Failed to create trade request:',
        insertError,
      )

      return NextResponse.json(
        {
          error:
            '发送交易申请失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        tradeRequest,
      },
      {
        status: 201,
      },
    )
  } catch (error) {
    console.error(
      'Trade request POST error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '发送交易申请失败',
      },
      {
        status: 500,
      },
    )
  }
}