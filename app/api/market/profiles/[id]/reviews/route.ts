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
  request: NextRequest,
  context: RouteContext,
) {
  const { id } =
    await context.params

  const profileId =
    String(id ?? '').trim()

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

  const role =
    String(
      request.nextUrl
        .searchParams
        .get('role') ??
        'seller',
    )
      .trim()
      .toLowerCase()

  if (
    role !== 'seller' &&
    role !== 'buyer'
  ) {
    return NextResponse.json(
      {
        error:
          '评价类型无效',
      },
      {
        status: 400,
      },
    )
  }

  const supabase =
    getAdminSupabase()

  /*
   * 读取被评价玩家的公开资料
   */
  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        rsi_handle:star_citizen_handle,
        rsi_verified,
        member_number,
        profile_slug
      `)
      .eq(
        'id',
        profileId,
      )
      .maybeSingle()

  if (profileError) {
    console.error(
      'Failed to load market review profile:',
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

  /*
   * 读取该玩家收到的评价。
   *
   * 注意：
   * 这里只根据 reviewee_id 取得候选记录。
   * 后面还会检查原始交易 buyer / seller，
   * 防止卖家评价和买家评价混在一起。
   */
  const {
    data: receivedReviews,
    error: reviewsError,
  } =
    await supabase
      .from(
        'market_trade_reviews',
      )
      .select(`
        id,
        trade_request_id,
        reviewer_id,
        reviewee_id,
        rating,
        comment,
        created_at
      `)
      .eq(
        'reviewee_id',
        profileId,
      )
      .order(
        'created_at',
        {
          ascending: false,
        },
      )

  if (reviewsError) {
    console.error(
      'Failed to load market review records:',
      reviewsError,
    )

    return NextResponse.json(
      {
        error:
          '读取评价记录失败',
      },
      {
        status: 500,
      },
    )
  }

  const candidateReviews =
    receivedReviews ?? []

  if (
    candidateReviews.length ===
    0
  ) {
    return NextResponse.json(
      {
        profile,
        role,
        ratingAverage: null,
        ratingCount: 0,
        reviews: [],
      },
      {
        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      },
    )
  }

  /*
   * 找出评价对应的交易。
   */
  const tradeIds =
    Array.from(
      new Set(
        candidateReviews
          .map(
            (review) =>
              review.trade_request_id,
          )
          .filter(Boolean),
      ),
    )

  const {
    data: trades,
    error: tradesError,
  } =
    await supabase
      .from(
        'market_trade_requests',
      )
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        quantity,
        status,
        completed_at
      `)
      .in(
        'id',
        tradeIds,
      )
      .eq(
        'status',
        'completed',
      )

  if (tradesError) {
    console.error(
      'Failed to load trades for market reviews:',
      tradesError,
    )

    return NextResponse.json(
      {
        error:
          '读取评价交易记录失败',
      },
      {
        status: 500,
      },
    )
  }

  const tradeById =
    new Map<
      string,
      any
    >()

  for (
    const trade of
      trades ?? []
  ) {
    tradeById.set(
      trade.id,
      trade,
    )
  }

  /*
   * 严格区分评价方向。
   *
   * seller:
   * reviewer 必须是原交易 buyer
   * reviewee 必须是原交易 seller
   *
   * buyer:
   * reviewer 必须是原交易 seller
   * reviewee 必须是原交易 buyer
   */
  const validReviews =
    candidateReviews.filter(
      (review) => {
        const trade =
          tradeById.get(
            review.trade_request_id,
          )

        if (!trade) {
          return false
        }

        if (
          role === 'seller'
        ) {
          return (
            trade.seller_id ===
              profileId &&
            trade.buyer_id ===
              review.reviewer_id
          )
        }

        return (
          trade.buyer_id ===
            profileId &&
          trade.seller_id ===
            review.reviewer_id
        )
      },
    )

  if (
    validReviews.length ===
    0
  ) {
    return NextResponse.json(
      {
        profile,
        role,
        ratingAverage: null,
        ratingCount: 0,
        reviews: [],
      },
      {
        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      },
    )
  }

  /*
   * 读取所有评价人的公开资料。
   */
  const reviewerIds =
    Array.from(
      new Set(
        validReviews
          .map(
            (review) =>
              review.reviewer_id,
          )
          .filter(Boolean),
      ),
    )

  const {
    data: reviewerProfiles,
    error:
      reviewerProfilesError,
  } =
    await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        rsi_handle:star_citizen_handle,
        rsi_verified,
        member_number,
        profile_slug
      `)
      .in(
        'id',
        reviewerIds,
      )

  if (
    reviewerProfilesError
  ) {
    console.error(
      'Failed to load market reviewer profiles:',
      reviewerProfilesError,
    )

    return NextResponse.json(
      {
        error:
          '读取评价用户资料失败',
      },
      {
        status: 500,
      },
    )
  }

  const reviewerById =
    new Map<
      string,
      any
    >()

  for (
    const reviewer of
      reviewerProfiles ?? []
  ) {
    reviewerById.set(
      reviewer.id,
      reviewer,
    )
  }

  /*
   * 读取评价所对应的商品。
   */
  const listingIds =
    Array.from(
      new Set(
        validReviews
          .map(
            (review) =>
              tradeById.get(
                review.trade_request_id,
              )?.listing_id,
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
        title,
        listing_type,
        image_urls
      `)
      .in(
        'id',
        listingIds,
      )

  if (listingsError) {
    console.error(
      'Failed to load listings for market reviews:',
      listingsError,
    )

    return NextResponse.json(
      {
        error:
          '读取评价商品失败',
      },
      {
        status: 500,
      },
    )
  }

  const listingById =
    new Map<
      string,
      any
    >()

  for (
    const listing of
      listings ?? []
  ) {
    listingById.set(
      listing.id,
      listing,
    )
  }

  /*
   * 整理前端真正需要的数据。
   */
  const reviews =
    validReviews.map(
      (review) => {
        const trade =
          tradeById.get(
            review.trade_request_id,
          )

        const reviewer =
          reviewerById.get(
            review.reviewer_id,
          ) ?? null

        const listing =
          trade
            ? (
                listingById.get(
                  trade.listing_id,
                ) ?? null
              )
            : null

        return {
          id:
            review.id,

          rating:
            Number(
              review.rating,
            ),

          comment:
            review.comment ??
            null,

          createdAt:
            review.created_at,

          completedAt:
            trade?.completed_at ??
            null,

          quantity:
            Number(
              trade?.quantity ??
                0,
            ),

          reviewer,

          listing,
        }
      },
    )

  const ratingCount =
    reviews.length

  const ratingAverage =
    ratingCount > 0
      ? Number(
          (
            reviews.reduce(
              (
                total,
                review,
              ) =>
                total +
                review.rating,
              0,
            ) /
            ratingCount
          ).toFixed(1),
        )
      : null

  return NextResponse.json(
    {
      profile,
      role,
      ratingAverage,
      ratingCount,
      reviews,
    },
    {
      headers: {
        'Cache-Control':
          'no-store, max-age=0',
      },
    },
  )
}