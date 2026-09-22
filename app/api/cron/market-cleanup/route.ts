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

export async function GET(
  request: NextRequest,
) {
  try {
    /*
     * 目前固定为 Dry Run。
     * 不会修改任何数据。
     */
    const dryRun = true

    const supabase =
      getAdminSupabase()

    const now =
      new Date()

    const sevenDaysAgo =
      new Date(
        now.getTime() -
          7 *
            24 *
            60 *
            60 *
            1000,
      ).toISOString()

    const thirtyDaysAgo =
      new Date(
        now.getTime() -
          30 *
            24 *
            60 *
            60 *
            1000,
      ).toISOString()

    /*
     * 1. 超过 7 天仍 pending
     */
    const {
      data:
        expiredPending,
      error:
        pendingError,
    } = await supabase
      .from(
        'market_trade_requests',
      )
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        status,
        created_at
      `)
      .eq(
        'status',
        'pending',
      )
      .lt(
        'created_at',
        sevenDaysAgo,
      )

    if (pendingError) {
      throw pendingError
    }

    /*
     * 2. 接受超过 7 天仍未完成
     */
    const {
      data:
        expiredAccepted,
      error:
        acceptedError,
    } = await supabase
      .from(
        'market_trade_requests',
      )
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        status,
        accepted_at
      `)
      .eq(
        'status',
        'accepted',
      )
      .not(
        'accepted_at',
        'is',
        null,
      )
      .lt(
        'accepted_at',
        sevenDaysAgo,
      )

    if (acceptedError) {
      throw acceptedError
    }

    /*
     * 3. 读取所有仍然在线的商单
     */
    const {
      data: listings,
      error:
        listingsError,
    } = await supabase
      .from(
        'market_listings',
      )
      .select(`
        id,
        title,
        created_at,
        image_urls,
        closed_at,
        deleted_at
      `)
      .is(
        'closed_at',
        null,
      )
      .is(
        'deleted_at',
        null,
      )

    if (listingsError) {
      throw listingsError
    }

    const listingIds =
      (listings ?? []).map(
        (listing) =>
          listing.id,
      )

    /*
     * 4. 一次读取这些商单的交易申请
     */
    let tradeRequests:
      any[] = []

    if (
      listingIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from(
          'market_trade_requests',
        )
        .select(`
          id,
          listing_id,
          status,
          created_at,
          accepted_at,
          completed_at
        `)
        .in(
          'listing_id',
          listingIds,
        )

      if (error) {
        throw error
      }

      tradeRequests =
        data ?? []
    }

    const toClose: any[] =
      []

    const toDelete: any[] =
      []

    /*
     * 5. 计算每个商单生命周期
     */
    for (
      const listing of
        listings ?? []
    ) {
      const listingTrades =
        tradeRequests.filter(
          (trade) =>
            trade.listing_id ===
            listing.id,
        )

      const completedTrades =
        listingTrades.filter(
          (trade) =>
            trade.status ===
              'completed' &&
            trade.completed_at,
        )

      const activeTrades =
        listingTrades.filter(
          (trade) =>
            trade.status ===
              'pending' ||
            trade.status ===
              'accepted',
        )

      /*
       * 从未成功成交
       */
      if (
        completedTrades.length ===
        0
      ) {
        const createdAt =
          new Date(
            listing.created_at,
          )

        /*
         * 注意：
         * 已经超过 7 天的 pending /
         * accepted 在正式执行时会先被取消。
         *
         * 因此这里只把仍未超时的有效交易
         * 当成阻止删除的交易。
         */
        const hasValidActiveTrade =
          activeTrades.some(
            (trade) => {
              if (
                trade.status ===
                'pending'
              ) {
                return (
                  new Date(
                    trade.created_at,
                  ) >=
                  new Date(
                    sevenDaysAgo,
                  )
                )
              }

              if (
                trade.status ===
                  'accepted' &&
                trade.accepted_at
              ) {
                return (
                  new Date(
                    trade.accepted_at,
                  ) >=
                  new Date(
                    sevenDaysAgo,
                  )
                )
              }

              return false
            },
          )

        if (
          createdAt <
            new Date(
              thirtyDaysAgo,
            ) &&
          !hasValidActiveTrade
        ) {
          toDelete.push({
            id:
              listing.id,
            title:
              listing.title,
            created_at:
              listing.created_at,
            image_urls:
              listing.image_urls ??
              [],
            reason:
              '发布超过30天且从未成功成交',
          })
        }

        continue
      }

      /*
       * 有历史成交：
       * 找最后一次 completed_at
       */
      const lastCompletedAt =
        completedTrades
          .map(
            (trade) =>
              new Date(
                trade.completed_at,
              ),
          )
          .sort(
            (a, b) =>
              b.getTime() -
              a.getTime(),
          )[0]

      if (
        lastCompletedAt <
        new Date(
          thirtyDaysAgo,
        )
      ) {
        toClose.push({
          id:
            listing.id,
          title:
            listing.title,
          completed_count:
            completedTrades.length,
          last_completed_at:
            lastCompletedAt.toISOString(),
          reason:
            '最后一次成功成交已超过30天',
        })
      }
    }

    /*
     * Dry Run：
     * 只返回将会发生什么。
     */
    return NextResponse.json(
      {
        success: true,
        dry_run: dryRun,

        checked_at:
          now.toISOString(),

        rules: {
          pending_timeout_days:
            7,
          accepted_timeout_days:
            7,
          listing_inactivity_days:
            30,
        },

        summary: {
          pending_to_cancel:
            expiredPending
              ?.length ?? 0,

          accepted_to_cancel:
            expiredAccepted
              ?.length ?? 0,

          listings_to_close:
            toClose.length,

          listings_to_delete:
            toDelete.length,
        },

        pending_to_cancel:
          expiredPending ?? [],

        accepted_to_cancel:
          expiredAccepted ??
          [],

        listings_to_close:
          toClose,

        listings_to_delete:
          toDelete,
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
      'Market cleanup dry run error:',
      error,
    )

    return NextResponse.json(
      {
        success: false,
        dry_run: true,
        error:
          '市场维护检查失败',
      },
      {
        status: 500,
      },
    )
  }
}