import {
  NextRequest,
  NextResponse,
} from 'next/server'
import {
  createClient,
} from '@supabase/supabase-js'

export const dynamic =
  'force-dynamic'

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

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  },
) {
  const { id } =
    await context.params

  const supabase =
    getAdminSupabase()

  const {
    data: listing,
    error,
  } = await supabase
    .from('market_listings')
    .select(`
      id,
      seller_id,
      listing_type,
      category,
      title,
      description,
      price_uec,
      quantity,
      quality,
      location,
      negotiable,
      offered_item,
      wanted_item,
      image_urls,
      status,
      created_at,
      updated_at,
      closed_at,
      profiles!market_listings_seller_fk (
        id,
        username,
        display_name,
        avatar_url,
        discord_id,
        rsi_handle:star_citizen_handle,
        rsi_verified,
        member_number,
        profile_slug
      )
    `)
    .eq(
      'id',
      id,
    )
    .is(
      'deleted_at',
      null,
    )
    .maybeSingle()

  if (error) {
    console.error(
      'Failed to load market listing:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '读取商品详情失败',
      },
      {
        status: 500,
      },
    )
  }

  if (!listing) {
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
  * 统计当前商单真正完成的成交数量。
  *
  * 只计算 status = completed 的交易，
  * Pending / Accepted / Declined / Cancelled
  * 均不会计入已售数量。
  */
  const {
    data: completedTrades,
    error: completedTradesError,
  } = await supabase
    .from('market_trade_requests')
    .select(`
      quantity
    `)
    .eq(
      'listing_id',
      id,
    )
    .eq(
      'status',
      'completed',
    )

  if (completedTradesError) {
    console.error(
      'Failed to load completed market trade quantities:',
      completedTradesError,
    )
  }

  const completedQuantity =
    completedTradesError
      ? 0
      : (
          completedTrades ??
          []
        ).reduce(
          (
            total,
            trade,
          ) => {
            const quantity =
              Number(
                trade.quantity ??
                  0,
              )

            if (
              !Number.isFinite(
                quantity,
              ) ||
              quantity <= 0
            ) {
              return total
            }

            return (
              total +
              quantity
            )
          },
          0,
        )

  return NextResponse.json(
    {
      listing: {
        ...listing,
        completed_quantity:
          completedQuantity,
      },
    },
    {
      headers: {
        'Cache-Control':
          'no-store, max-age=0',
      },
    },
  )
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  },
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
            '请先登录后操作交易',
        },
        {
          status: 401,
        },
      )
    }

    const supabase =
    getAdminSupabase()

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from('profiles')
      .select(`
        id,
        banned_at,
        market_banned_at
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
          '读取用户资料失败',
      },
      {
        status: 500,
      },
    )
  }

  if (
    profile.banned_at ||
    profile.market_banned_at
  ) {
    return NextResponse.json(
      {
        error:
          '当前账号已被限制使用市场功能',
      },
      {
        status: 403,
      },
    )
  }

    const { id } =
      await context.params

    let body: any = {}

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

    const action =
      String(
        body.action ?? '',
      ).toLowerCase()

    if (
      action !== 'close' &&
      action !== 'update_quantity'
    ) {
      return NextResponse.json(
        {
          error:
            '交易操作无效',
        },
        {
          status: 400,
        },
      )
    }

    const {
      data: listing,
      error: listingError,
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
        id,
      )
      .maybeSingle()

    if (
      listingError
    ) {
      console.error(
        'Failed to load market listing for update:',
        listingError,
      )

      return NextResponse.json(
        {
          error:
            '读取交易失败',
        },
        {
          status: 500,
        },
      )
    }

    if (
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

    if (
      listing.seller_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            '你只能修改自己的交易',
        },
        {
          status: 403,
        },
      )
    }

    if (
      action ===
      'update_quantity'
    ) {
      if (
        listing.closed_at ||
        listing.status !==
          'active'
      ) {
        return NextResponse.json(
          {
            error:
              '已经下架的商单不能修改数量',
          },
          {
            status: 400,
          },
        )
      }

      const quantity =
        Number(
          body.quantity,
        )

      if (
        !Number.isInteger(
          quantity,
        ) ||
        quantity < 0
      ) {
        return NextResponse.json(
          {
            error:
              '商品数量必须是 0 或更大的整数',
          },
          {
            status: 400,
          },
        )
      }

      const now =
        new Date().toISOString()

      const shouldClose =
        quantity === 0

      const {
        data:
          updatedListing,
        error:
          updateError,
      } = await supabase
        .from(
          'market_listings',
        )
          .update({
            quantity,
            updated_at:
              now,
            ...(shouldClose
              ? {
                  closed_at:
                    now,
                }
              : {}),
          })
        .eq(
          'id',
          id,
        )
        .eq(
          'seller_id',
          user.id,
        )
        .select(`
          id,
          seller_id,
          listing_type,
          quantity,
          status,
          closed_at,
          updated_at
        `)
        .single()

      if (
        updateError ||
        !updatedListing
      ) {
        console.error(
          'Failed to update market listing quantity:',
          updateError,
        )

        return NextResponse.json(
          {
            error:
              '修改商品数量失败',
          },
          {
            status: 500,
          },
        )
      }

      return NextResponse.json(
        {
          success: true,
          listing:
            updatedListing,
        },
        {
          headers: {
            'Cache-Control':
              'no-store, max-age=0',
          },
        },
      )
    }

    if (
      listing.closed_at
    ) {
      return NextResponse.json(
        {
          success: true,
          listing,
        },
      )
    }

    const closedAt =
      new Date().toISOString()

    const {
      data:
        updatedListing,
      error:
        updateError,
    } = await supabase
      .from(
        'market_listings',
      )
        .update({
          closed_at:
            closedAt,
          updated_at:
            closedAt,
        })
      .eq(
        'id',
        id,
      )
      .eq(
        'seller_id',
        user.id,
      )
      .select(`
        id,
        seller_id,
        listing_type,
        quantity,
        status,
        closed_at,
        updated_at
      `)
      .single()

    if (
      updateError ||
      !updatedListing
    ) {
      console.error(
        'Failed to close market listing:',
        updateError,
      )

      return NextResponse.json(
        {
          error:
            '结束交易失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        success: true,
        listing:
          updatedListing,
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
      'Market listing PATCH error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '更新挂牌失败',
      },
      {
        status: 500,
      },
    )
  }
}