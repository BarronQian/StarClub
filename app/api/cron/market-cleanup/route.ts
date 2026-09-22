import {
  NextRequest,
  NextResponse,
} from 'next/server'
import {
  createClient,
} from '@supabase/supabase-js'

export const dynamic =
  'force-dynamic'

const MARKET_BUCKET =
  'market-listings'

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

function isAuthorized(
  request: NextRequest,
) {
  const cronSecret =
    process.env.CRON_SECRET

  if (!cronSecret) {
    return false
  }

  const authorization =
    request.headers.get(
      'authorization',
    )

  return (
    authorization ===
    `Bearer ${cronSecret}`
  )
}

/*
 * 从 Supabase Storage public URL
 * 提取 bucket 内部文件路径。
 *
 * 例如：
 *
 * https://xxx.supabase.co/storage/v1/object/public/
 * market-listings/user/batch/display/1.webp
 *
 * →
 *
 * user/batch/display/1.webp
 */
function getStoragePath(
  imageUrl: string,
) {
  try {
    const marker =
      `/storage/v1/object/public/${MARKET_BUCKET}/`

    const markerIndex =
      imageUrl.indexOf(marker)

    if (markerIndex === -1) {
      return null
    }

    const rawPath =
      imageUrl.slice(
        markerIndex +
          marker.length,
      )

    if (!rawPath) {
      return null
    }

    return decodeURIComponent(
      rawPath.split('?')[0],
    )
  } catch {
    return null
  }
}

function getStoragePaths(
  imageUrls: unknown,
) {
  if (
    !Array.isArray(
      imageUrls,
    )
  ) {
    return []
  }

  const paths =
    new Set<string>()

  for (
    const value of imageUrls
  ) {
    if (
      typeof value !==
      'string'
    ) {
      continue
    }

    const displayPath =
      getStoragePath(value)

    if (!displayPath) {
      continue
    }

    /*
     * 删除 DB 中保存的 display 图片。
     */
    paths.add(displayPath)

    /*
     * 新图片结构：
     *
     * /display/1.webp
     * /thumbs/1.webp
     *
     * DB 只保存 display URL，
     * 所以这里同时推导缩略图路径。
     */
    if (
      displayPath.includes(
        '/display/',
      )
    ) {
      paths.add(
        displayPath.replace(
          '/display/',
          '/thumbs/',
        ),
      )
    }
  }

  return Array.from(paths)
}

export async function GET(
  request: NextRequest,
) {
  /*
   * 正式执行接口。
   * 没有正确 CRON_SECRET
   * 一律拒绝。
   */
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
      },
      {
        status: 401,
      },
    )
  }

  try {
    const supabase =
      getAdminSupabase()

    const now =
      new Date()

    const nowIso =
      now.toISOString()

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
     * ==================================================
     * 1. pending 超过 7 天
     * ==================================================
     */

    const {
      data:
        cancelledPending,
      error:
        pendingError,
    } = await supabase
      .from(
        'market_trade_requests',
      )
      .update({
        status:
          'cancelled',
        cancelled_at:
          nowIso,
        cancel_reason:
          '交易申请超过 7 天未处理，系统自动取消',
        updated_at:
          nowIso,
      })
      .eq(
        'status',
        'pending',
      )
      .lt(
        'created_at',
        sevenDaysAgo,
      )
      .select('id')

    if (pendingError) {
      throw pendingError
    }

    /*
     * ==================================================
     * 2. accepted 超过 7 天
     * ==================================================
     */

    const {
      data:
        cancelledAccepted,
      error:
        acceptedError,
    } = await supabase
      .from(
        'market_trade_requests',
      )
      .update({
        status:
          'cancelled',
        cancelled_at:
          nowIso,
        cancel_reason:
          '交易接受后超过 7 天未完成，系统自动取消',
        updated_at:
          nowIso,
      })
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
      .select('id')

    if (acceptedError) {
      throw acceptedError
    }

    /*
     * ==================================================
     * 3. 获取仍在线的商单
     * ==================================================
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
     * ==================================================
     * 4. 获取在线商单的交易记录
     * ==================================================
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
     * ==================================================
     * 5. 判断每个商单的生命周期
     * ==================================================
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

      /*
       * ----------------------------------------------
       * 从未成功成交
       * ----------------------------------------------
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
         * 前面已经把 >7 天的
         * pending / accepted 自动取消。
         *
         * 因此这里如果还有 pending /
         * accepted，就说明仍然是有效交易。
         */
        const hasActiveTrade =
          listingTrades.some(
            (trade) =>
              trade.status ===
                'pending' ||
              trade.status ===
                'accepted',
          )

        if (
          createdAt <
            new Date(
              thirtyDaysAgo,
            ) &&
          !hasActiveTrade
        ) {
          toDelete.push(
            listing,
          )
        }

        continue
      }

      /*
       * ----------------------------------------------
       * 曾经成功成交
       * ----------------------------------------------
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
          ...listing,
          last_completed_at:
            lastCompletedAt.toISOString(),
        })
      }
    }

    /*
     * ==================================================
     * 6. 有成交历史但 30 天无新成交
     * → 只下架
     * ==================================================
     */

    const closedListings:
      string[] = []

    for (
      const listing of
        toClose
    ) {
      const {
        error,
      } = await supabase
        .from(
          'market_listings',
        )
        .update({
          closed_at:
            nowIso,
          updated_at:
            nowIso,
        })
        .eq(
          'id',
          listing.id,
        )
        .is(
          'closed_at',
          null,
        )

      if (error) {
        console.error(
          'Failed to auto-close market listing:',
          listing.id,
          error,
        )

        continue
      }

      closedListings.push(
        listing.id,
      )
    }

    /*
     * ==================================================
     * 7. 0 成交 + 发布超过 30 天
     *
     * 顺序非常重要：
     *
     * A. 删除 Storage 图片
     * B. 图片删除成功后
     * C. DELETE market_listings
     *
     * 如果 Storage 删除失败，
     * 暂时保留 DB 商单，
     * 下一次 Cron 再尝试。
     * ==================================================
     */

    const deletedListings:
      string[] = []

    const storageDeleted:
      string[] = []

    const deleteFailures:
      {
        listing_id: string
        reason: string
      }[] = []

    for (
      const listing of
        toDelete
    ) {
      const storagePaths =
        getStoragePaths(
          listing.image_urls,
        )

      /*
       * 有图片才调用 Storage remove。
       */
      if (
        storagePaths.length > 0
      ) {
        const {
          data:
            removedFiles,
          error:
            storageError,
        } =
          await supabase.storage
            .from(
              MARKET_BUCKET,
            )
            .remove(
              storagePaths,
            )

        if (storageError) {
          console.error(
            'Failed to delete market listing images:',
            listing.id,
            storageError,
          )

          deleteFailures.push({
            listing_id:
              listing.id,
            reason:
              'storage_delete_failed',
          })

          continue
        }

        for (
          const removed of
            removedFiles ?? []
        ) {
          if (
            removed?.name
          ) {
            storageDeleted.push(
              removed.name,
            )
          }
        }
      }

      /*
       * Storage 处理完成后，
       * 再删除数据库商单。
       *
       * 相关未成交 trade request /
       * messages / reviews / reports
       * 根据现有 FK CASCADE 清理。
       */
      const {
        error:
          deleteError,
      } = await supabase
        .from(
          'market_listings',
        )
        .delete()
        .eq(
          'id',
          listing.id,
        )
        .is(
          'closed_at',
          null,
        )
        .is(
          'deleted_at',
          null,
        )

      if (deleteError) {
        console.error(
          'Failed to permanently delete market listing:',
          listing.id,
          deleteError,
        )

        deleteFailures.push({
          listing_id:
            listing.id,
          reason:
            'database_delete_failed',
        })

        continue
      }

      deletedListings.push(
        listing.id,
      )
    }

    /*
     * ==================================================
     * 8. 返回维护结果
     * ==================================================
     */

    return NextResponse.json(
      {
        success: true,

        checked_at:
          nowIso,

        rules: {
          pending_timeout_days:
            7,
          accepted_timeout_days:
            7,
          listing_inactivity_days:
            30,
        },

        summary: {
          pending_cancelled:
            cancelledPending
              ?.length ?? 0,

          accepted_cancelled:
            cancelledAccepted
              ?.length ?? 0,

          listings_closed:
            closedListings.length,

          listings_deleted:
            deletedListings.length,

          storage_files_deleted:
            storageDeleted.length,

          failures:
            deleteFailures.length,
        },

        closed_listing_ids:
          closedListings,

        deleted_listing_ids:
          deletedListings,

        storage_deleted:
          storageDeleted,

        failures:
          deleteFailures,
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
      'Market cleanup error:',
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          '市场自动维护失败',
      },
      {
        status: 500,
      },
    )
  }
}