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

function calculateRating(
  ratings: number[],
) {
  if (ratings.length === 0) {
    return {
      average: null,
      count: 0,
    }
  }

  const average =
    ratings.reduce(
      (total, rating) =>
        total + rating,
      0,
    ) / ratings.length

  return {
    average: Number(
      average.toFixed(1),
    ),
    count: ratings.length,
  }
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const {
      id: profileId,
    } = await context.params

    if (!profileId) {
      return NextResponse.json(
        {
          error:
            '缺少卖家 ID',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    /*
     * 1. 卖家公开资料
     */
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        star_citizen_handle,
        rsi_verified,
        member_number,
        profile_slug
      `)
      .eq(
        'id',
        profileId,
      )
      .maybeSingle()

    if (
      profileError ||
      !profile
    ) {
      console.error(
        'Failed to load seller market profile:',
        profileError,
      )

      return NextResponse.json(
        {
          error:
            '卖家资料不存在',
        },
        {
          status: 404,
        },
      )
    }

    /*
     * 2. 当前仍然有效的商单
     *
     * 这里只返回这个玩家作为
     * 商单发布者 seller 的商单。
     */
    const {
      data: activeListingsData,
      error: activeListingsError,
    } = await supabase
      .from('market_listings')
      .select(`
        id,
        listing_type,
        category,
        title,
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
        updated_at
      `)
      .eq(
        'seller_id',
        profileId,
      )
      .eq(
        'status',
        'active',
      )
      .is(
        'deleted_at',
        null,
      )
      .order(
        'created_at',
        {
          ascending: false,
        },
      )

    if (activeListingsError) {
      console.error(
        'Failed to load seller active listings:',
        activeListingsError,
      )

      return NextResponse.json(
        {
          error:
            '读取卖家当前商单失败',
        },
        {
          status: 500,
        },
      )
    }

    const activeListings =
      activeListingsData ?? []

    /*
     * 3. 读取这个玩家参与过的
     * 所有已完成交易。
     *
     * 之后根据 seller_id / buyer_id
     * 区分他当时是卖家还是买家。
     */
    const {
      data: completedTradesData,
      error: completedTradesError,
    } = await supabase
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
        status,
        created_at,
        completed_at
      `)
      .eq(
        'status',
        'completed',
      )
      .or(
        `seller_id.eq.${profileId},buyer_id.eq.${profileId}`,
      )
      .order(
        'completed_at',
        {
          ascending: false,
        },
      )

    if (completedTradesError) {
      console.error(
        'Failed to load seller completed trades:',
        completedTradesError,
      )

      return NextResponse.json(
        {
          error:
            '读取历史成交失败',
        },
        {
          status: 500,
        },
      )
    }

    const completedTrades =
      completedTradesData ?? []

    /*
     * 4. 批量读取历史交易对应商单，
     * 用于显示商品标题、类型、图片。
     */
    const listingIds =
      Array.from(
        new Set(
          completedTrades
            .map(
              (trade) =>
                trade.listing_id,
            )
            .filter(
              (
                listingId,
              ): listingId is string =>
                Boolean(
                  listingId,
                ),
            ),
        ),
      )

    const listingMap =
      new Map<
        string,
        {
          id: string
          listing_type:
            | string
            | null
          title:
            | string
            | null
          image_urls:
            | string[]
            | null
          price_uec:
            | number
            | null
        }
      >()

    if (
      listingIds.length > 0
    ) {
      const {
        data:
          historicalListings,
        error:
          historicalListingsError,
      } = await supabase
        .from(
          'market_listings',
        )
        .select(`
          id,
          listing_type,
          title,
          image_urls,
          price_uec
        `)
        .in(
          'id',
          listingIds,
        )

      if (
        historicalListingsError
      ) {
        console.error(
          'Failed to load historical market listings:',
          historicalListingsError,
        )
      } else {
        for (
          const listing of
            historicalListings ?? []
        ) {
          listingMap.set(
            listing.id,
            listing,
          )
        }
      }
    }

    /*
     * 5. 历史成交整理。
     *
     * role 表示这个玩家在这笔交易中
     * 扮演 seller 还是 buyer。
     */
    const history =
      completedTrades.map(
        (trade) => {
          const listing =
            trade.listing_id
              ? listingMap.get(
                  trade.listing_id,
                ) ?? null
              : null

          const role =
            trade.seller_id ===
            profileId
              ? 'seller'
              : 'buyer'

          return {
            id:
              trade.id,

            listingId:
              trade.listing_id,

            role,

            listingType:
              listing?.listing_type ??
              null,

            title:
              listing?.title ??
              '历史交易商品',

            imageUrls:
              listing?.image_urls ??
              null,

            quantity:
              Number(
                trade.quantity ??
                  0,
              ),

            priceUec:
              trade.offered_price_uec ??
              listing?.price_uec ??
              null,

            completedAt:
              trade.completed_at,

            createdAt:
              trade.created_at,
          }
        },
      )

    /*
     * 6. 市场交易统计。
     *
     * completed = 所有完成交易
     *
     * wts / wtb / wtt：
     * 延续 Seller Card 现在已有的
     * 历史成交分类统计方式。
     */
    let wts = 0
    let wtb = 0
    let wtt = 0

    for (
      const item of history
    ) {
      if (
        item.listingType ===
        'wts'
      ) {
        wts += 1
      } else if (
        item.listingType ===
        'wtb'
      ) {
        wtb += 1
      } else if (
        item.listingType ===
        'wtt'
      ) {
        wtt += 1
      }
    }

    /*
     * 7. 卖家信誉
     *
     * 只统计：
     * Buyer -> Seller
     *
     * 不把这个玩家作为买家时
     * 收到的评价混进来。
     */
    const {
      data: receivedReviews,
      error: reviewsError,
    } = await supabase
      .from(
        'market_trade_reviews',
      )
      .select(`
        trade_request_id,
        reviewer_id,
        reviewee_id,
        rating
      `)
      .eq(
        'reviewee_id',
        profileId,
      )

    if (reviewsError) {
      console.error(
        'Failed to load seller reviews:',
        reviewsError,
      )
    }

    const completedTradeMap =
      new Map(
        completedTrades.map(
          (trade) => [
            trade.id,
            trade,
          ],
        ),
      )

    const sellerRatings:
      number[] = []

    for (
      const review of
        receivedReviews ?? []
    ) {
      const trade =
        completedTradeMap.get(
          review.trade_request_id,
        )

      /*
       * 必须满足：
       *
       * 当前 profile 是 seller
       * reviewer 是该交易 buyer
       *
       * 才属于 Seller Rating。
       */
      if (
        !trade ||
        trade.seller_id !==
          profileId ||
        trade.buyer_id !==
          review.reviewer_id
      ) {
        continue
      }

      const rating =
        Number(
          review.rating,
        )

      if (
        Number.isFinite(
          rating,
        )
      ) {
        sellerRatings.push(
          rating,
        )
      }
    }

    const sellerRating =
      calculateRating(
        sellerRatings,
      )

    return NextResponse.json(
      {
        profile: {
          id:
            profile.id,

          username:
            profile.username,

          display_name:
            profile.display_name,

          avatar_url:
            profile.avatar_url,

          rsi_handle:
            profile.star_citizen_handle,

          rsi_verified:
            profile.rsi_verified,

          member_number:
            profile.member_number,

          profile_slug:
            profile.profile_slug,
        },

        stats: {
          completed:
            history.length,

          wts,
          wtb,
          wtt,

          sellerRatingAverage:
            sellerRating.average,

          sellerRatingCount:
            sellerRating.count,

          activeListings:
            activeListings.length,
        },

        activeListings,

        history,
      },
      {
        status: 200,
      },
    )
  } catch (error) {
    console.error(
      'Seller market API error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '读取卖家市场信息失败',
      },
      {
        status: 500,
      },
    )
  }
}