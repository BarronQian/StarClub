import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getAdminSession } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

import { AdminHeader } from '@/components/admin/admin-header'
import { MarketForceCloseButton } from '@/components/admin/market-force-close-button'

import { Badge } from '@/components/ui/badge'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = {
  title: '市场管理 | 星际酒馆 StarClub',
  robots: {
    index: false,
    follow: false,
  },
}

type ListingType =
  | 'wts'
  | 'wtb'
  | 'wtt'

type MarketListingRow = {
  id: string
  seller_id: string
  listing_type: ListingType
  category: string
  title: string
  price_uec: number | null
  quantity: number
  status: string
  created_at: string
  updated_at: string | null
  closed_at: string | null
}

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  star_citizen_handle: string | null
}

function getTypeLabel(
  type: ListingType,
) {
  if (type === 'wts') {
    return '出售 WTS'
  }

  if (type === 'wtb') {
    return '求购 WTB'
  }

  return '交换 WTT'
}

function getTypeBadgeClass(
  type: ListingType,
) {
  if (type === 'wts') {
    return 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
  }

  if (type === 'wtb') {
    return 'border-blue-500/30 text-blue-600 dark:text-blue-400'
  }

  return 'border-violet-500/30 text-violet-600 dark:text-violet-400'
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(
    new Date(value),
  )
}

export default async function AdminMarketPage() {
  const session =
    await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  const supabase =
    createAdminClient()

  const [
    listingsResult,
    totalResult,
    activeResult,
    wtsResult,
    wtbResult,
    wttResult,
    pendingReportsResult,
  ] =
    await Promise.all([
      supabase
        .from('market_listings')
        .select(`
          id,
          seller_id,
          listing_type,
          category,
          title,
          price_uec,
          quantity,
          status,
          created_at,
          updated_at,
          closed_at
        `)
        .order(
          'created_at',
          {
            ascending: false,
          },
        )
        .limit(100),

      supabase
        .from('market_listings')
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          },
        ),

      supabase
        .from('market_listings')
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          },
        )
        .is(
          'closed_at',
          null,
        ),

      supabase
        .from('market_listings')
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          },
        )
        .eq(
          'listing_type',
          'wts',
        ),

      supabase
        .from('market_listings')
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          },
        )
        .eq(
          'listing_type',
          'wtb',
        ),

      supabase
        .from('market_listings')
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          },
        )
        .eq(
          'listing_type',
          'wtt',
        ),

      supabase
        .from('market_reports')
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          },
        )
        .eq(
          'status',
          'pending',
        ),
    ])

  if (
    listingsResult.error
  ) {
    throw new Error(
      `Failed to load market listings: ${listingsResult.error.message}`,
    )
  }

  const listings =
    (
      listingsResult.data ??
      []
    ) as MarketListingRow[]

  const sellerIds =
    Array.from(
      new Set(
        listings.map(
          (listing) =>
            listing.seller_id,
        ),
      ),
    )

  let profiles: ProfileRow[] =
    []

  if (
    sellerIds.length >
    0
  ) {
    const profilesResult =
      await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          star_citizen_handle
        `)
        .in(
          'id',
          sellerIds,
        )

    if (
      profilesResult.error
    ) {
      throw new Error(
        `Failed to load market profiles: ${profilesResult.error.message}`,
      )
    }

    profiles =
      (
        profilesResult.data ??
        []
      ) as ProfileRow[]
  }

  const profileMap =
    new Map(
      profiles.map(
        (profile) => [
          profile.id,
          profile,
        ],
      ),
    )

  const totalCount =
    totalResult.count ?? 0

  const activeCount =
    activeResult.count ?? 0

  const closedCount =
    Math.max(
      totalCount -
        activeCount,
      0,
    )
  
    const pendingReportsCount =
  pendingReportsResult.count ?? 0
  
  return (
    <div className="min-h-svh bg-background">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-10 pt-20">
        <AdminHeader
          adminEmail={
            session.email
          }
          active="market"
        />

        <section>
          <div className="mb-4">
            <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
              市场概览
            </h2>

            <p className="mt-2 text-xs text-muted-foreground">
              查看星际酒馆市场当前的商单与交易发布情况。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="corner-cut border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">
                全部商单
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {totalCount}
              </p>
            </div>

            <div className="corner-cut border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">
                当前有效
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {activeCount}
              </p>
            </div>

            <div className="corner-cut border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">
                已关闭
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {closedCount}
              </p>
            </div>

            <div className="corner-cut border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">
                出售 WTS
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {wtsResult.count ?? 0}
              </p>
            </div>

            <div className="corner-cut border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">
                求购 WTB
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {wtbResult.count ?? 0}
              </p>
            </div>

            <div className="corner-cut border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">
                交换 WTT
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {wttResult.count ?? 0}
              </p>
            </div>

            <div className="corner-cut border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">
                待处理举报
              </p>

              <p
                className={`mt-2 text-3xl font-semibold tracking-tight ${
                  pendingReportsCount > 0
                    ? 'text-red-500'
                    : 'text-foreground'
                }`}
              >
                {pendingReportsCount}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
                商单管理
              </h2>

              <p className="mt-2 text-xs text-muted-foreground">
                最近 100 条市场商单
              </p>
            </div>
          </div>

          <div className="corner-cut overflow-hidden border border-border bg-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      类型
                    </TableHead>

                    <TableHead>
                      标题
                    </TableHead>

                    <TableHead>
                      发布者
                    </TableHead>

                    <TableHead>
                      数量
                    </TableHead>

                    <TableHead>
                      价格
                    </TableHead>

                    <TableHead>
                      状态
                    </TableHead>

                    <TableHead>
                      发布时间
                    </TableHead>

                    <TableHead className="text-right">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {listings.length ===
                  0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        当前没有市场商单
                      </TableCell>
                    </TableRow>
                  ) : (
                    listings.map(
                      (
                        listing,
                      ) => {
                        const profile =
                          profileMap.get(
                            listing.seller_id,
                          )

                        const sellerName =
                          profile
                            ?.star_citizen_handle ||
                          profile
                            ?.display_name ||
                          profile
                            ?.username ||
                          '未知用户'

                        const isClosed =
                          Boolean(
                            listing.closed_at,
                          )

                        return (
                          <TableRow
                            key={
                              listing.id
                            }
                          >
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  getTypeBadgeClass(
                                    listing.listing_type,
                                  )
                                }
                              >
                                {getTypeLabel(
                                  listing.listing_type,
                                )}
                              </Badge>
                            </TableCell>

                            <TableCell className="max-w-70">
                              <div className="truncate font-medium text-foreground">
                                {
                                  listing.title
                                }
                              </div>

                              <div className="mt-1 text-[0.68rem] text-muted-foreground">
                                {
                                  listing.category
                                }
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="max-w-40 truncate text-sm">
                                {
                                  sellerName
                                }
                              </div>
                            </TableCell>

                            <TableCell className="tabular-nums">
                              ×
                              {
                                listing.quantity
                              }
                            </TableCell>

                            <TableCell className="whitespace-nowrap">
                              {listing.listing_type ===
                              'wtt'
                                ? '交换'
                                : listing.price_uec ===
                                    null
                                  ? '面议'
                                  : `${listing.price_uec.toLocaleString()} aUEC`}
                            </TableCell>

                            <TableCell>
                              {isClosed ? (
                                <Badge
                                  variant="outline"
                                  className="border-muted-foreground/30 text-muted-foreground"
                                >
                                  已关闭
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                >
                                  进行中
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {formatDate(
                                listing.created_at,
                              )}
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Link
                                  href={`/market/${listing.id}`}
                                  target="_blank"
                                  className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                                >
                                  查看
                                </Link>

                                {!isClosed ? (
                                  <MarketForceCloseButton
                                    listingId={
                                      listing.id
                                    }
                                    title={
                                      listing.title
                                    }
                                  />
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      },
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}