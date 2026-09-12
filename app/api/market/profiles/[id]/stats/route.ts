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

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  const {
    id,
  } = await context.params

  const profileId =
    String(
      id ?? '',
    ).trim()

  if (!profileId) {
    return NextResponse.json(
      {
        error:
          '用户 ID 无效',
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
  } =
    await supabase
      .from('profiles')
      .select('id')
      .eq(
        'id',
        profileId,
      )
      .maybeSingle()

  if (profileError) {
    console.error(
      'Failed to load market profile:',
      profileError,
    )

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

  if (!profile) {
    return NextResponse.json(
      {
        error:
          '用户不存在',
      },
      {
        status: 404,
      },
    )
  }

  const {
    data: reviews,
    error: reviewsError,
  } =
    await supabase
      .from(
        'market_trade_reviews',
      )
      .select(
        'rating',
      )
      .eq(
        'reviewee_id',
        profileId,
      )

  if (reviewsError) {
    console.error(
      'Failed to load market reviews:',
      reviewsError,
    )

    return NextResponse.json(
      {
        error:
          '读取评价统计失败',
      },
      {
        status: 500,
      },
    )
  }

  const ratingCount =
    reviews?.length ?? 0

  const ratingAverage =
    ratingCount > 0
      ? Number(
          (
            (
              reviews ?? []
            ).reduce(
              (
                total,
                review,
              ) =>
                total +
                Number(
                  review.rating,
                ),
              0,
            ) /
            ratingCount
          ).toFixed(1),
        )
      : null

  const {
    data: completedTrades,
    error: tradesError,
  } =
    await supabase
      .from(
        'market_trade_requests',
      )
      .select(
        'listing_id',
      )
      .eq(
        'status',
        'completed',
      )
      .or(
        `buyer_id.eq.${profileId},seller_id.eq.${profileId}`,
      )

  if (tradesError) {
    console.error(
      'Failed to load completed market trades:',
      tradesError,
    )

    return NextResponse.json(
      {
        error:
          '读取交易统计失败',
      },
      {
        status: 500,
      },
    )
  }

  const trades =
    completedTrades ?? []

  if (
    trades.length === 0
  ) {
    return NextResponse.json(
      {
        completed: 0,
        wts: 0,
        wtb: 0,
        wtt: 0,
        ratingAverage,
        ratingCount,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      },
    )
  }

  const listingIds =
    Array.from(
      new Set(
        trades
          .map(
            (
              trade,
            ) =>
              trade.listing_id,
          )
          .filter(Boolean),
      ),
    )

  const {
    data: listings,
    error: listingsError,
  } =
    await supabase
      .from(
        'market_listings',
      )
      .select(`
        id,
        listing_type
      `)
      .in(
        'id',
        listingIds,
      )

  if (listingsError) {
    console.error(
      'Failed to load market listings for stats:',
      listingsError,
    )

    return NextResponse.json(
      {
        error:
          '读取交易统计失败',
      },
      {
        status: 500,
      },
    )
  }

  const listingTypeById =
    new Map<
      string,
      string
    >()

  for (
    const listing of
    listings ?? []
  ) {
    listingTypeById.set(
      listing.id,
      listing.listing_type,
    )
  }

  let wts = 0
  let wtb = 0
  let wtt = 0

  for (
    const trade of trades
  ) {
    const listingType =
      listingTypeById.get(
        trade.listing_id,
      )

    if (
      listingType === 'wts'
    ) {
      wts += 1
    }

    if (
      listingType === 'wtb'
    ) {
      wtb += 1
    }

    if (
      listingType === 'wtt'
    ) {
      wtt += 1
    }
  }

  return NextResponse.json(
    {
      completed:
        trades.length,
      wts,
      wtb,
      wtt,
      ratingAverage,
      ratingCount,
    },
    {
      headers: {
        'Cache-Control':
          'no-store, max-age=0',
      },
    },
  )
}