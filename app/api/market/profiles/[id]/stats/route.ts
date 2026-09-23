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

type RatingReview = {
  rating: number
}

function calculateRating(
  reviews: RatingReview[],
) {
  const count =
    reviews.length

  if (count === 0) {
    return {
      average: null,
      count: 0,
    }
  }

  const total =
    reviews.reduce(
      (
        sum,
        review,
      ) => {
        return (
          sum +
          Number(
            review.rating ??
              0,
          )
        )
      },
      0,
    )

  return {
    average:
      Number(
        (
          total /
          count
        ).toFixed(1),
      ),
    count,
  }
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

  /*
   * ------------------------------------------------
   * 1. 确认玩家存在
   * ------------------------------------------------
   */

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

  /*
   * ------------------------------------------------
   * 2. 读取该玩家收到的所有评价
   * ------------------------------------------------
   *
   * 注意：
   * 这里先读取全部收到的评价，
   * 后面再根据原交易中的 buyer / seller 身份
   * 严格区分：
   *
   * sellerRating = 买家给这个玩家的评价
   * buyerRating  = 卖家给这个玩家的评价
   *
   * 两套评分不会混在一起。
   * ------------------------------------------------
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
        rating,
        reviewer_id,
        trade_request_id
      `)
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

  /*
   * ------------------------------------------------
   * 3. 找出这些评价对应的原交易
   * ------------------------------------------------
   */

  const reviewTradeIds =
    Array.from(
      new Set(
        (
          receivedReviews ??
          []
        )
          .map(
            (review) =>
              review.trade_request_id,
          )
          .filter(Boolean),
      ),
    )

  const reviewTradeById =
    new Map<
      string,
      {
        buyer_id: string
        seller_id: string
      }
    >()

  if (
    reviewTradeIds.length >
    0
  ) {
    const {
      data: reviewTrades,
      error:
        reviewTradesError,
    } =
      await supabase
        .from(
          'market_trade_requests',
        )
        .select(`
          id,
          buyer_id,
          seller_id
        `)
        .in(
          'id',
          reviewTradeIds,
        )

    if (
      reviewTradesError
    ) {
      console.error(
        'Failed to load trades for market review stats:',
        reviewTradesError,
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

    for (
      const trade of
        reviewTrades ?? []
    ) {
      reviewTradeById.set(
        trade.id,
        {
          buyer_id:
            trade.buyer_id,
          seller_id:
            trade.seller_id,
        },
      )
    }
  }

  /*
   * ------------------------------------------------
   * 4. 区分卖家评价 / 买家评价
   * ------------------------------------------------
   */

  const sellerReviews =
    (
      receivedReviews ?? []
    ).filter(
      (review) => {
        const trade =
          reviewTradeById.get(
            review.trade_request_id,
          )

        if (!trade) {
          return false
        }

        return (
          trade.seller_id ===
            profileId &&
          trade.buyer_id ===
            review.reviewer_id
        )
      },
    )

  const buyerReviews =
    (
      receivedReviews ?? []
    ).filter(
      (review) => {
        const trade =
          reviewTradeById.get(
            review.trade_request_id,
          )

        if (!trade) {
          return false
        }

        return (
          trade.buyer_id ===
            profileId &&
          trade.seller_id ===
            review.reviewer_id
        )
      },
    )

  const sellerRating =
    calculateRating(
      sellerReviews,
    )

  const buyerRating =
    calculateRating(
      buyerReviews,
    )

  /*
   * ------------------------------------------------
   * 5. 读取该玩家全部 Completed 交易
   * ------------------------------------------------
   */

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

  /*
   * ------------------------------------------------
   * 6. 没有历史成交时直接返回
   * ------------------------------------------------
   */

  if (
    trades.length === 0
  ) {
    return NextResponse.json(
      {
        completed: 0,
        wts: 0,
        wtb: 0,
        wtt: 0,

        sellerRatingAverage:
          sellerRating.average,

        sellerRatingCount:
          sellerRating.count,

        buyerRatingAverage:
          buyerRating.average,

        buyerRatingCount:
          buyerRating.count,
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
   * ------------------------------------------------
   * 7. 查询历史交易对应商单类型
   * ------------------------------------------------
   */

  const listingIds =
    Array.from(
      new Set(
        trades
          .map(
            (trade) =>
              trade.listing_id,
          )
          .filter(Boolean),
      ),
    )

  /*
   * 理论上 Completed trade 应该都有 listing_id。
   * 这里仍然防御性处理空数组。
   */

  if (
    listingIds.length === 0
  ) {
    return NextResponse.json(
      {
        completed:
          trades.length,
        wts: 0,
        wtb: 0,
        wtt: 0,

        sellerRatingAverage:
          sellerRating.average,

        sellerRatingCount:
          sellerRating.count,

        buyerRatingAverage:
          buyerRating.average,

        buyerRatingCount:
          buyerRating.count,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      },
    )
  }

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

  /*
   * ------------------------------------------------
   * 8. 统计历史交易类型
   * ------------------------------------------------
   */

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

  /*
   * ------------------------------------------------
   * 9. 返回最终统计
   * ------------------------------------------------
   */

  return NextResponse.json(
    {
      completed:
        trades.length,

      wts,
      wtb,
      wtt,

      /*
       * 卖家评分：
       * 买家完成交易后
       * 对这个玩家作为卖家的评价。
       */
      sellerRatingAverage:
        sellerRating.average,

      sellerRatingCount:
        sellerRating.count,

      /*
       * 买家评分：
       * 卖家完成交易后
       * 对这个玩家作为买家的评价。
       */
      buyerRatingAverage:
        buyerRating.average,

      buyerRatingCount:
        buyerRating.count,
    },
    {
      headers: {
        'Cache-Control':
          'no-store, max-age=0',
      },
    },
  )
}