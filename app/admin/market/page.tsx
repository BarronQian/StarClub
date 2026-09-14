import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getAdminSession } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

import { AdminHeader } from '@/components/admin/admin-header'
import { MarketForceCloseButton } from '@/components/admin/market-force-close-button'
import { MarketReportActions } from '@/components/admin/market-report-actions'
import { MarketReportEvidence } from '@/components/admin/market-report-evidence'

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
  deleted_at?: string | null
}

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  star_citizen_handle: string | null
  profile_slug?: string | null
  market_banned_at?: string | null
  banned_at?: string | null
}

type MarketReportStatus =
  | 'pending'
  | 'resolved'
  | 'dismissed'

type MarketReportRow = {
  id: string
  listing_id: string
  reporter_id: string
  reported_user_id: string
  reason: string
  details: string | null
  evidence_url: string | null
  status: MarketReportStatus
  resolution_note: string | null
  handled_at: string | null
  created_at: string
  updated_at: string
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

function getReportReasonLabel(
  reason: string,
) {
  if (reason === 'fraud') {
    return '疑似诈骗'
  }

  if (reason === 'misleading') {
    return '虚假 / 误导信息'
  }

  if (reason === 'rmt') {
    return 'RMT / 现金交易'
  }

  if (reason === 'prohibited') {
    return '违规商品或内容'
  }

  if (reason === 'spam') {
    return '垃圾信息 / 恶意刷屏'
  }

  if (reason === 'other') {
    return '其他'
  }

  return reason
}

function getReportStatusLabel(
  status: MarketReportStatus,
) {
  if (status === 'pending') {
    return '待处理'
  }

  if (status === 'resolved') {
    return '已处理'
  }

  return '已驳回'
}

function getReportStatusClass(
  status: MarketReportStatus,
) {
  if (status === 'pending') {
    return 'border-amber-500/30 text-amber-600 dark:text-amber-400'
  }

  if (status === 'resolved') {
    return 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
  }

  return 'border-muted-foreground/30 text-muted-foreground'
}

function getProfileName(
  profile:
    | ProfileRow
    | undefined,
) {
  return (
    profile?.star_citizen_handle ||
    profile?.display_name ||
    profile?.username ||
    '未知用户'
  )
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
    reportsResult,
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
        .from('market_reports')
        .select(`
          id,
          listing_id,
          reporter_id,
          reported_user_id,
          reason,
          details,
          evidence_url,
          status,
          resolution_note,
          handled_at,
          created_at,
          updated_at
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

  if (
    reportsResult.error
  ) {
    throw new Error(
      `Failed to load market reports: ${reportsResult.error.message}`,
    )
  }

  const listings =
    (
      listingsResult.data ??
      []
    ) as MarketListingRow[]

  const reports =
    (
      reportsResult.data ??
      []
    ) as MarketReportRow[]

  const reportListingIds =
    Array.from(
      new Set(
        reports.map(
          (report) =>
            report.listing_id,
        ),
      ),
    )

  let reportListings: MarketListingRow[] =
    []

  if (
    reportListingIds.length >
    0
  ) {
    const reportListingsResult =
      await supabase
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
          closed_at,
          deleted_at
        `)
        .in(
          'id',
          reportListingIds,
        )

    if (
      reportListingsResult.error
    ) {
      throw new Error(
        `Failed to load reported market listings: ${reportListingsResult.error.message}`,
      )
    }

    reportListings =
      (
        reportListingsResult.data ??
        []
      ) as MarketListingRow[]
  }

  const sellerIds =
    listings.map(
      (listing) =>
        listing.seller_id,
    )

  const reportUserIds =
    reports.flatMap(
      (report) => [
        report.reporter_id,
        report.reported_user_id,
      ],
    )

  const profileIds =
    Array.from(
      new Set([
        ...sellerIds,
        ...reportUserIds,
      ]),
    )

  let profiles: ProfileRow[] =
    []

  if (
    profileIds.length >
    0
  ) {
    const profilesResult =
      await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          star_citizen_handle,
          profile_slug,
          market_banned_at,
          banned_at
        `)
        .in(
          'id',
          profileIds,
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

  const reportListingMap =
    new Map(
      reportListings.map(
        (listing) => [
          listing.id,
          listing,
        ],
      ),
    )

  const sortedReports =
    [...reports].sort(
      (a, b) => {
        if (
          a.status === 'pending' &&
          b.status !== 'pending'
        ) {
          return -1
        }

        if (
          a.status !== 'pending' &&
          b.status === 'pending'
        ) {
          return 1
        }

        return (
          new Date(
            b.created_at,
          ).getTime() -
          new Date(
            a.created_at,
          ).getTime()
        )
      },
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
              查看星际酒馆市场当前的商单、交易发布与举报处理情况。
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
              <div className="flex items-center gap-3">
                <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
                  举报处理
                </h2>

                {pendingReportsCount > 0 ? (
                  <Badge
                    variant="outline"
                    className="border-red-500/30 text-red-500"
                  >
                    待处理 {pendingReportsCount}
                  </Badge>
                ) : null}
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                最近 100 条市场举报，待处理举报优先显示。
              </p>
            </div>
          </div>

          <div className="corner-cut overflow-hidden border border-border bg-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      状态
                    </TableHead>

                    <TableHead>
                      被举报交易
                    </TableHead>

                    <TableHead>
                      举报原因
                    </TableHead>

                    <TableHead>
                      举报人
                    </TableHead>

                    <TableHead>
                      被举报卖家
                    </TableHead>

                    <TableHead>
                      举报时间
                    </TableHead>

                    <TableHead>
                      举报截图
                    </TableHead>

                    <TableHead className="text-right">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sortedReports.length ===
                  0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        当前没有市场举报
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedReports.map(
                      (
                        report,
                      ) => {
                        const listing =
                          reportListingMap.get(
                            report.listing_id,
                          )

                        const reporter =
                          profileMap.get(
                            report.reporter_id,
                          )

                        const seller =
                          profileMap.get(
                            report.reported_user_id,
                          )

                        const reporterName =
                          getProfileName(
                            reporter,
                          )

                        const sellerName =
                          getProfileName(
                            seller,
                          )

                        const listingClosed =
                          Boolean(
                            listing?.closed_at ||
                              listing?.deleted_at,
                          )

                        const sellerMarketBanned =
                          Boolean(
                            seller?.market_banned_at ||
                              seller?.banned_at,
                          )

                        return (
                          <TableRow
                            key={
                              report.id
                            }
                          >
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  getReportStatusClass(
                                    report.status,
                                  )
                                }
                              >
                                {getReportStatusLabel(
                                  report.status,
                                )}
                              </Badge>
                            </TableCell>

                            <TableCell className="min-w-56 max-w-80">
                              {listing ? (
                                <>
                                  <Link
                                    href={`/market/${listing.id}`}
                                    target="_blank"
                                    className="block truncate font-medium text-foreground transition-colors hover:text-primary"
                                  >
                                    {listing.title}
                                  </Link>

                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.68rem] text-muted-foreground">
                                    <span>
                                      {getTypeLabel(
                                        listing.listing_type,
                                      )}
                                    </span>

                                    {listingClosed ? (
                                      <span>
                                        已关闭
                                      </span>
                                    ) : null}
                                  </div>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  交易已不存在
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="min-w-48 max-w-72">
                              <div className="text-sm font-medium text-foreground">
                                {getReportReasonLabel(
                                  report.reason,
                                )}
                              </div>

                              {report.details ? (
                                <div className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">
                                  {report.details}
                                </div>
                              ) : null}

                              {report.resolution_note ? (
                                <div className="mt-2 rounded-md bg-muted/60 px-2.5 py-2 text-[0.7rem] leading-5 text-muted-foreground">
                                  处理备注：{report.resolution_note}
                                </div>
                              ) : null}
                            </TableCell>

                            <TableCell>
                              <div className="max-w-36 truncate text-sm">
                                {reporterName}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="max-w-36 truncate text-sm font-medium">
                                {sellerName}
                              </div>

                              {seller?.banned_at ? (
                                <div className="mt-1 text-[0.68rem] text-red-500">
                                  全站封禁
                                </div>
                              ) : seller?.market_banned_at ? (
                                <div className="mt-1 text-[0.68rem] text-red-500">
                                  市场封禁
                                </div>
                              ) : null}
                            </TableCell>

                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {formatDate(
                                report.created_at,
                              )}
                            </TableCell>
                            
                            <TableCell className="whitespace-nowrap">
                              <MarketReportEvidence
                                url={
                                  report.evidence_url
                                }
                              />
                            </TableCell>

                            <TableCell className="min-w-92 text-right">
                              {report.status ===
                              'pending' ? (
                                <MarketReportActions
                                  reportId={
                                    report.id
                                  }
                                  listingTitle={
                                    listing?.title ??
                                    '已删除交易'
                                  }
                                  sellerName={
                                    sellerName
                                  }
                                  listingClosed={
                                    listingClosed
                                  }
                                  sellerMarketBanned={
                                    sellerMarketBanned
                                  }
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {report.handled_at
                                    ? `处理于 ${formatDate(report.handled_at)}`
                                    : '已完成'}
                                </span>
                              )}
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
                          getProfileName(
                            profile,
                          )

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
                                {listing.title}
                              </div>

                              <div className="mt-1 text-[0.68rem] text-muted-foreground">
                                {listing.category}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="max-w-40 truncate text-sm">
                                {sellerName}
                              </div>
                            </TableCell>

                            <TableCell className="tabular-nums">
                              ×{listing.quantity}
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