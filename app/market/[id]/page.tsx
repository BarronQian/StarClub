'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  Send,
  User,
  X,
  Flag,
} from 'lucide-react'
import {
  use,
  useEffect,
  useState,
} from 'react'

type ListingType =
  | 'wts'
  | 'wtb'
  | 'wtt'

type MarketListing = {
  id: string
  seller_id: string
  listing_type: ListingType
  category: string
  title: string
  description: string
  price_uec: number | null
  quantity: number
  quality: number | null
  location: string | null
  negotiable: boolean
  offered_item: string | null
  wanted_item: string | null
  image_urls: string[]
  status: string
  created_at: string
  updated_at: string
  closed_at: string | null

  profiles: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    discord_id: string | null
    rsi_handle: string | null
    rsi_verified: boolean | null
    member_number: number | null
    profile_slug: string | null
  } | null
}

type SellerMarketStats = {
  completed: number
  wts: number
  wtb: number
  wtt: number
  ratingAverage: number | null
  ratingCount: number
}

const TYPE_LABELS: Record<
  ListingType,
  string
> = {
  wts: '出售 WTS',
  wtb: '求购 WTB',
  wtt: '交换 WTT',
}

const CATEGORY_LABELS: Record<
  string,
  string
> = {
  ship: '飞船',
  vehicle: '载具',
  weapon: '武器',
  armor: '护甲',
  equipment: '装备',
  component: '舰船组件',
  cargo: '货物',
  material: '材料',
  other: '其他',
}

function formatPrice(
  value: number | null,
) {
  if (value === null) {
    return '面议'
  }

  return `${value.toLocaleString()} aUEC`
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  ).format(
    new Date(value),
  )
}

async function readJsonSafely(
  response: Response,
) {
  const text =
    await response.text()

  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(
      response.ok
        ? '服务器返回了无法识别的数据'
        : `服务器返回异常（${response.status}），请稍后重试`,
    )
  }
}

export default function MarketListingPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } =
    use(params)

  const [
    listing,
    setListing,
  ] =
    useState<MarketListing | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    activeImage,
    setActiveImage,
  ] =
    useState(0)

  const [
    tradeDialogOpen,
    setTradeDialogOpen,
  ] =
    useState(false)

  const [
    tradeQuantity,
    setTradeQuantity,
  ] =
    useState('1')

  const [
    tradeOffer,
    setTradeOffer,
  ] =
    useState('')

  const [
    tradeLocation,
    setTradeLocation,
  ] =
    useState('')

  const [
    tradeTime,
    setTradeTime,
  ] =
    useState('')

  const [
    tradeMessage,
    setTradeMessage,
  ] =
    useState('')

  const [
    sendingTradeRequest,
    setSendingTradeRequest,
  ] =
    useState(false)

  const [
    tradeError,
    setTradeError,
  ] =
    useState('')

  const [
    tradeSuccess,
    setTradeSuccess,
  ] =
    useState('')

  const [
    sellerStats,
    setSellerStats,
  ] =
    useState<SellerMarketStats | null>(
      null,
    )

  const [
    sellerStatsLoading,
    setSellerStatsLoading,
  ] =
    useState(false)

    const [
      reportDialogOpen,
      setReportDialogOpen,
    ] = useState(false)

    const [
      reportReason,
      setReportReason,
    ] = useState('')

    const [
      reportDetails,
      setReportDetails,
    ] = useState('')

    const [
      submittingReport,
      setSubmittingReport,
    ] = useState(false)

    const [
      reportError,
      setReportError,
    ] = useState('')

    const [
      reportSuccess,
      setReportSuccess,
    ] = useState('')

    const [
      currentUserId,
      setCurrentUserId,
    ] = useState<string | null>(null)

    useEffect(() => {
      let active = true

      async function loadCurrentUser() {
        const {
          getSupabaseBrowser,
        } =
          await import(
            '@/lib/supabase-browser'
          )

        const supabase =
          getSupabaseBrowser()

        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession()

        if (active) {
          setCurrentUserId(
            session?.user.id ?? null,
          )
        }
      }

      void loadCurrentUser()

      return () => {
        active = false
      }
    }, [])

  useEffect(() => {
    async function loadListing() {
      setLoading(true)
      setError('')
      setSellerStats(null)

      try {
        const response =
          await fetch(
            `/api/market/listings/${id}`,
            {
              cache:
                'no-store',
            },
          )

        const data =
          await readJsonSafely(
            response,
          )

        if (!response.ok) {
          throw new Error(
            data.error ??
              '读取商品详情失败',
          )
        }

        const nextListing =
          data.listing as
            | MarketListing
            | undefined

        if (!nextListing) {
          throw new Error(
            '商品信息不存在',
          )
        }

        setListing(
          nextListing,
        )

        const sellerId =
          nextListing.profiles
            ?.id

        if (sellerId) {
          setSellerStatsLoading(
            true,
          )

          try {
            const statsResponse =
              await fetch(
                `/api/market/profiles/${sellerId}/stats`,
                {
                  cache:
                    'no-store',
                },
              )

            const statsData =
              await readJsonSafely(
                statsResponse,
              )

            if (
              statsResponse.ok
            ) {
              setSellerStats({
                completed:
                  Number(
                    statsData.completed,
                  ) || 0,
                wts:
                  Number(
                    statsData.wts,
                  ) || 0,
                wtb:
                  Number(
                    statsData.wtb,
                  ) || 0,
                wtt:
                  Number(
                    statsData.wtt,
                  ) || 0,
                ratingAverage:
                  statsData.ratingAverage ===
                    null ||
                  statsData.ratingAverage ===
                    undefined
                    ? null
                    : Number(
                        statsData.ratingAverage,
                      ),
                ratingCount:
                  Number(
                    statsData.ratingCount,
                  ) || 0,
              })
            } else {
              console.error(
                'Failed to load seller market stats:',
                statsData.error,
              )
            }
          } catch (
            statsError
          ) {
            console.error(
              'Failed to load seller market stats:',
              statsError,
            )
          } finally {
            setSellerStatsLoading(
              false,
            )
          }
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : '读取商品详情失败',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadListing()
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-32 lg:px-8">
          <div className="py-28 text-center text-sm text-muted-foreground">
            正在加载商品详情……
          </div>
        </div>
      </main>
    )
  }

  if (
    error ||
    !listing
  ) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-32 lg:px-8">
          <Link
            href="/market"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            返回市场
          </Link>

          <div className="py-28 text-center">
            <h1 className="text-xl font-semibold">
              无法显示该交易
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              {error}
            </p>
          </div>
        </div>
      </main>
    )
  }

  const isClosed =
    Boolean(
      listing.closed_at,
    )

  const closedLabel =
    listing.listing_type ===
    'wts'
      ? '已售罄'
      : '已结束'

  const images =
    listing.image_urls ?? []

  const sellerName =
    listing.profiles
      ?.display_name ??
    listing.profiles
      ?.username ??
    listing.profiles
      ?.rsi_handle ??
    'StarClub 玩家'

  const sellerProfileHref =
    listing.profiles
      ?.profile_slug
      ? `/profile/${listing.profiles.profile_slug}`
      : null

  function previousImage() {
    if (
      images.length <= 1
    ) {
      return
    }

    setActiveImage(
      (current) =>
        current === 0
          ? images.length - 1
          : current - 1,
    )
  }

  function nextImage() {
    if (
      images.length <= 1
    ) {
      return
    }

    setActiveImage(
      (current) =>
        current ===
        images.length - 1
          ? 0
          : current + 1,
    )
  }

  function openTradeDialog() {
    if (
      !listing ||
      listing.closed_at
    ) {
      return
    }

    setTradeQuantity('1')

    setTradeOffer(
      listing.price_uec !== null
        ? String(
            listing.price_uec,
          )
        : '',
    )

    setTradeLocation(
      listing.location ?? '',
    )

    setTradeTime('')
    setTradeMessage('')
    setTradeError('')
    setTradeSuccess('')

    setTradeDialogOpen(
      true,
    )
  }

  async function sendTradeRequest() {
    if (!listing) {
      setTradeError(
        '商品信息尚未加载完成',
      )
      return
    }

    if (
      sendingTradeRequest
    ) {
      return
    }

    setTradeError('')
    setTradeSuccess('')

    const quantity =
      Number(
        tradeQuantity,
      )

    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity < 1
    ) {
      setTradeError(
        '请输入有效的交易数量',
      )
      return
    }

    const offeredPriceUec =
      tradeOffer.trim()
        ? Number(
            tradeOffer,
          )
        : null

    if (
      offeredPriceUec !==
        null &&
      (
        !Number.isSafeInteger(
          offeredPriceUec,
        ) ||
        offeredPriceUec < 0
      )
    ) {
      setTradeError(
        '请输入有效的报价',
      )
      return
    }

    setSendingTradeRequest(
      true,
    )

    try {
      const {
        getSupabaseBrowser,
      } =
        await import(
          '@/lib/supabase-browser'
        )

      const supabase =
        getSupabaseBrowser()

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession()

      if (!session) {
        throw new Error(
          '请先登录后发送交易申请',
        )
      }

      const response =
        await fetch(
          '/api/market/listings/trade-requests',
          {
            method:
              'POST',
            headers: {
              'Content-Type':
                'application/json',
              Authorization:
                `Bearer ${session.access_token}`,
            },
            body:
              JSON.stringify({
                listingId:
                  listing.id,
                quantity,
                offeredPriceUec,
                preferredLocation:
                  tradeLocation.trim(),
                preferredTime:
                  tradeTime.trim(),
                message:
                  tradeMessage.trim(),
              }),
          },
        )

      const data =
        await readJsonSafely(
          response,
        )

      if (!response.ok) {
        throw new Error(
          data.error ??
            '发送交易申请失败',
        )
      }

      setTradeSuccess(
        '交易申请已发送给卖家',
      )

      window.setTimeout(
        () => {
          setTradeDialogOpen(
            false,
          )

          setTradeSuccess('')
          setTradeOffer('')
          setTradeLocation('')
          setTradeTime('')
          setTradeMessage('')
        },
        1000,
      )
    } catch (err) {
      setTradeError(
        err instanceof Error
          ? err.message
          : '发送交易申请失败',
      )
    } finally {
      setSendingTradeRequest(
        false,
      )
    }
  }

  function openReportDialog() {
  setReportReason('')
  setReportDetails('')
  setReportError('')
  setReportSuccess('')

  setReportDialogOpen(true)
}

async function submitReport() {
  if (!listing) {
    setReportError(
      '交易信息尚未加载完成',
    )
    return
  }

  if (submittingReport) {
    return
  }

  setReportError('')
  setReportSuccess('')

  if (!reportReason) {
    setReportError(
      '请选择举报原因',
    )
    return
  }

  if (
    reportDetails.length >
    1500
  ) {
    setReportError(
      '补充说明不能超过 1500 个字符',
    )
    return
  }

  setSubmittingReport(true)

  try {
    const {
      getSupabaseBrowser,
    } =
      await import(
        '@/lib/supabase-browser'
      )

    const supabase =
      getSupabaseBrowser()

    const {
      data: {
        session,
      },
    } =
      await supabase.auth.getSession()

    if (!session) {
      throw new Error(
        '请先登录后举报交易',
      )
    }

    const response =
      await fetch(
        '/api/market/reports',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body:
            JSON.stringify({
              listingId:
                listing.id,

              reason:
                reportReason,

              details:
                reportDetails.trim(),
            }),
        },
      )

    const data =
      await readJsonSafely(
        response,
      )

    if (!response.ok) {
      throw new Error(
        data.error ??
          '提交举报失败',
      )
    }

    setReportSuccess(
      '举报已提交，我们会尽快处理。',
    )

    window.setTimeout(
      () => {
        setReportDialogOpen(
          false,
        )

        setReportReason('')
        setReportDetails('')
        setReportSuccess('')
      },
      1200,
    )
  } catch (err) {
    setReportError(
      err instanceof Error
        ? err.message
        : '提交举报失败',
    )
  } finally {
    setSubmittingReport(false)
  }
}

  return (
    <>
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-28 lg:px-8">
          <div className="mb-8">
            <Link
              href="/market"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              返回市场
            </Link>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:gap-14">
            <div>
              <div className="relative aspect-4/3 overflow-hidden rounded-3xl border border-border bg-muted">
                {images.length >
                0 ? (
                  <img
                    src={
                      images[
                        activeImage
                      ]
                    }
                    alt={
                      listing.title
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Package className="size-8" />

                    <span className="text-sm">
                      暂无商品图片
                    </span>
                  </div>
                )}

                {images.length >
                  1 && (
                  <>
                    <button
                      type="button"
                      aria-label="上一张图片"
                      onClick={
                        previousImage
                      }
                      className="absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 shadow-sm backdrop-blur transition-transform hover:scale-105"
                    >
                      <ChevronLeft className="size-5" />
                    </button>

                    <button
                      type="button"
                      aria-label="下一张图片"
                      onClick={
                        nextImage
                      }
                      className="absolute right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 shadow-sm backdrop-blur transition-transform hover:scale-105"
                    >
                      <ChevronRight className="size-5" />
                    </button>

                    <div className="absolute bottom-4 right-4 rounded-full bg-black/65 px-3 py-1.5 text-xs text-white backdrop-blur">
                      {activeImage +
                        1}
                      /
                      {
                        images.length
                      }
                    </div>
                  </>
                )}
              </div>

              {images.length >
                1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {images.map(
                    (
                      image,
                      index,
                    ) => (
                      <button
                        key={
                          image
                        }
                        type="button"
                        onClick={() =>
                          setActiveImage(
                            index,
                          )
                        }
                        className={`aspect-4/3 overflow-hidden rounded-xl border transition-all ${
                          activeImage ===
                          index
                            ? 'border-foreground ring-1 ring-foreground'
                            : 'border-border opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={
                            image
                          }
                          alt={`商品图片 ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>

            <div className="lg:pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">
                  {
                    TYPE_LABELS[
                      listing
                        .listing_type
                    ]
                  }
                </span>

                {isClosed && (
                  <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {closedLabel}
                  </span>
                )}

                <span className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
                  {CATEGORY_LABELS[
                    listing.category
                  ] ??
                    listing.category}
                </span>

                {listing.negotiable && (
                  <span className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
                    可议价
                  </span>
                )}
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
                {listing.title}
              </h1>

              {listing.listing_type !==
              'wtt' ? (
                <div className="mt-6 text-3xl font-semibold tracking-tight">
                  {formatPrice(
                    listing.price_uec,
                  )}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-border p-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        我提供
                      </div>

                      <div className="mt-1 font-medium">
                        {listing.offered_item ||
                          '未填写'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        我想换
                      </div>

                      <div className="mt-1 font-medium">
                        {listing.wanted_item ||
                          '未填写'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-y border-border py-6">
                <div>
                  <div className="text-xs text-muted-foreground">
                    数量
                  </div>

                  <div className="mt-1 text-sm font-medium">
                    ×
                    {
                      listing.quantity
                    }
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">
                    品质
                  </div>

                  <div className="mt-1 text-sm font-medium">
                    {listing.quality !==
                    null
                      ? `${listing.quality}%`
                      : '未注明'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">
                    交易地点
                  </div>

                  <div className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                    <MapPin className="size-3.5 text-muted-foreground" />

                    {listing.location ||
                      '双方协商'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">
                    发布时间
                  </div>

                  <div className="mt-1 text-sm font-medium">
                    {formatDate(
                      listing.created_at,
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-sm font-semibold">
                  商品说明
                </h2>

                <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {listing.description ||
                    '卖家暂未填写额外说明。'}
                </div>
              </div>

              <div className="mt-10 rounded-2xl border border-border p-5">
                <div className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  SELLER
                </div>

                {sellerProfileHref ? (
                  <Link
                    href={
                      sellerProfileHref
                    }
                    className="group flex items-center gap-4 rounded-xl transition-opacity hover:opacity-75"
                  >
                    {listing
                      .profiles
                      ?.avatar_url ? (
                      <img
                        src={
                          listing
                            .profiles
                            .avatar_url
                        }
                        alt={
                          sellerName
                        }
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="size-5 text-muted-foreground" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate font-medium group-hover:underline">
                          {
                            sellerName
                          }
                        </div>

                        {listing
                          .profiles
                          ?.rsi_verified && (
                          <BadgeCheck className="size-4 shrink-0 text-blue-500" />
                        )}
                      </div>

                      {listing
                        .profiles
                        ?.rsi_handle && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          RSI @
                          {
                            listing
                              .profiles
                              .rsi_handle
                          }
                        </div>
                      )}

                      {listing
                        .profiles
                        ?.member_number !==
                          null &&
                        listing
                          .profiles
                          ?.member_number !==
                          undefined && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            StarClub #
                            {
                              listing
                                .profiles
                                .member_number
                            }
                          </div>
                        )}
                    </div>

                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-4">
                    {listing
                      .profiles
                      ?.avatar_url ? (
                      <img
                        src={
                          listing
                            .profiles
                            .avatar_url
                        }
                        alt={
                          sellerName
                        }
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="size-5 text-muted-foreground" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate font-medium">
                          {
                            sellerName
                          }
                        </div>

                        {listing
                          .profiles
                          ?.rsi_verified && (
                          <BadgeCheck className="size-4 shrink-0 text-blue-500" />
                        )}
                      </div>

                      {listing
                        .profiles
                        ?.rsi_handle && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          RSI @
                          {
                            listing
                              .profiles
                              .rsi_handle
                          }
                        </div>
                      )}

                      {listing
                        .profiles
                        ?.member_number !==
                          null &&
                        listing
                          .profiles
                          ?.member_number !==
                          undefined && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            StarClub #
                            {
                              listing
                                .profiles
                                .member_number
                            }
                          </div>
                        )}
                    </div>
                  </div>
                )}

              <div className="mt-5 border-t border-border pt-4">
                {sellerStatsLoading ? (
                    <div className="flex h-14 items-center justify-center">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
) : sellerStats ? (
  <div>
    <div className="mb-4 flex items-center justify-between">
      <div className="text-xs text-muted-foreground">
        交易评分
      </div>

      {sellerStats.ratingCount > 0 &&
      sellerStats.ratingAverage !== null ? (
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500">
            ★
          </span>

          <span className="text-sm font-semibold">
            {
              sellerStats.ratingAverage.toFixed(
                1,
              )
            }
          </span>

          <span className="text-xs text-muted-foreground">
            （
            {
              sellerStats.ratingCount
            }
            ）
          </span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">
          暂无评价
        </span>
      )}
    </div>

    <div className="grid grid-cols-4 divide-x divide-border">
                      <div className="text-center">
                        <div className="text-base font-semibold">
                          {
                            sellerStats.completed
                          }
                        </div>

                        <div className="mt-1 text-[11px] text-muted-foreground">
                          历史成交
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-base font-semibold">
                          {
                            sellerStats.wts
                          }
                        </div>

                        <div className="mt-1 text-[11px] text-muted-foreground">
                          出售
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-base font-semibold">
                          {
                            sellerStats.wtb
                          }
                        </div>

                        <div className="mt-1 text-[11px] text-muted-foreground">
                          求购
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-base font-semibold">
                          {
                            sellerStats.wtt
                          }
                        </div>

                        <div className="mt-1 text-[11px] text-muted-foreground">
                          交换
                        </div>
                      </div>
                    </div>
                  </div>
                  ) : (
                    <div className="text-center text-xs text-muted-foreground">
                      暂无历史交易统计
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-5">
                  
                {currentUserId !==
                  listing.seller_id ? (
                  <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={openReportDialog}
                        className="
                          inline-flex h-10 items-center justify-center gap-2
                          rounded-full
                          border border-red-200
                          bg-red-50
                          px-5
                          text-sm font-medium text-red-600
                          transition-all
                          hover:border-red-300
                          hover:bg-red-100
                          hover:text-red-700
                          active:scale-[0.98]
                        "
                      >
                        <Flag className="h-4 w-4" />
                        举报此交易
                      </button>
                  </div>
                ) : null}
                <div className="flex gap-3">
                  <RefreshCw className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                  <p className="text-xs leading-6 text-muted-foreground">
                    星际酒馆市场仅提供游戏内交易信息展示与撮合。
                    请与对方确认物品、数量、品质及交易地点后，在游戏内完成交易。
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {listing.profiles
                  ?.discord_id ? (
                  <a
                    href={`https://discord.com/users/${listing.profiles.discord_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <MessageCircle className="size-4" />
                    Discord 联系
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-muted-foreground opacity-50"
                  >
                    <MessageCircle className="size-4" />
                    未绑定 Discord
                  </button>
                )}

                <button
                  type="button"
                  disabled={
                    isClosed
                  }
                  onClick={
                    openTradeDialog
                  }
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-medium transition-opacity ${
                    isClosed
                      ? 'cursor-not-allowed bg-muted text-muted-foreground'
                      : 'bg-foreground text-background hover:opacity-85'
                  }`}
                >
                  {isClosed ? (
                    <>
                      <X className="size-4" />
                      {closedLabel}
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      发送交易申请
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {tradeDialogOpen && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-6 py-5 backdrop-blur">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  TRADE REQUEST
                </div>

                <h2 className="mt-1 text-xl font-semibold">
                  发送交易申请
                </h2>
              </div>

              <button
                type="button"
                disabled={
                  sendingTradeRequest
                }
                onClick={() =>
                  setTradeDialogOpen(
                    false,
                  )
                }
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-sm font-medium">
                  {listing.title}
                </div>

                <div className="mt-2 text-sm text-muted-foreground">
                  价格：
                  {listing.price_uec !==
                  null
                    ? `${listing.price_uec.toLocaleString()} aUEC / 个`
                    : '面议'}
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  交易发布者：
                  {listing.profiles
                    ?.rsi_handle
                    ? `@${listing.profiles.rsi_handle}`
                    : sellerName}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  交易数量
                </label>

                <input
                  value={
                    tradeQuantity
                  }
                  onChange={(
                    event,
                  ) =>
                    setTradeQuantity(
                      event.target.value.replace(
                        /\D/g,
                        '',
                      ),
                    )
                  }
                  inputMode="numeric"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
                />

                {listing.listing_type ===
                  'wts' && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    当前可交易：
                    {
                      listing.quantity
                    }
                  </div>
                )}
              </div>

              {listing.listing_type !==
                'wtt' && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    我的报价

                    <span className="ml-2 font-normal text-muted-foreground">
                      可选
                    </span>
                  </label>

                  <div className="relative">
                    <input
                      value={
                        tradeOffer
                      }
                      onChange={(
                        event,
                      ) =>
                        setTradeOffer(
                          event.target.value.replace(
                            /\D/g,
                            '',
                          ),
                        )
                      }
                      inputMode="numeric"
                      placeholder="留空表示接受发布价格"
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 pr-20 text-sm outline-none"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      aUEC / 个
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  希望交易地点

                  <span className="ml-2 font-normal text-muted-foreground">
                    可选
                  </span>
                </label>

                <input
                  value={
                    tradeLocation
                  }
                  onChange={(
                    event,
                  ) =>
                    setTradeLocation(
                      event.target.value,
                    )
                  }
                  maxLength={200}
                  placeholder="例如：Orison / 艾佛勒斯港"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  希望交易时间

                  <span className="ml-2 font-normal text-muted-foreground">
                    可选
                  </span>
                </label>

                <input
                  value={
                    tradeTime
                  }
                  onChange={(
                    event,
                  ) =>
                    setTradeTime(
                      event.target.value,
                    )
                  }
                  maxLength={200}
                  placeholder="例如：今晚 8 点以后 / 周末"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  留言

                  <span className="ml-2 font-normal text-muted-foreground">
                    可选
                  </span>
                </label>

                <textarea
                  value={
                    tradeMessage
                  }
                  onChange={(
                    event,
                  ) =>
                    setTradeMessage(
                      event.target.value,
                    )
                  }
                  maxLength={2000}
                  rows={4}
                  placeholder="例如：今晚可以交易，如果方便的话请接受申请。"
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm leading-6 outline-none"
                />

                <div className="mt-1 text-right text-xs text-muted-foreground">
                  {
                    tradeMessage.length
                  }
                  /2000
                </div>
              </div>

              {listing.listing_type !==
                'wtt' &&
                tradeOffer &&
                tradeQuantity &&
                Number(
                  tradeOffer,
                ) > 0 &&
                Number(
                  tradeQuantity,
                ) > 0 && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="text-xs text-muted-foreground">
                      预计交易总额
                    </div>

                    <div className="mt-1 text-lg font-semibold">
                      {(
                        Number(
                          tradeOffer,
                        ) *
                        Number(
                          tradeQuantity,
                        )
                      ).toLocaleString()}{' '}
                      aUEC
                    </div>
                  </div>
                )}

              {tradeError && (
                <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
                  {tradeError}
                </div>
              )}

              {tradeSuccess && (
                <div className="rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-600">
                  {tradeSuccess}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
              <button
                type="button"
                disabled={
                  sendingTradeRequest
                }
                onClick={() =>
                  setTradeDialogOpen(
                    false,
                  )
                }
                className="h-10 rounded-full border border-border px-5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                取消
              </button>

              <button
                type="button"
                disabled={
                  sendingTradeRequest
                }
                onClick={
                  sendTradeRequest
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {sendingTradeRequest ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    发送交易申请
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {reportDialogOpen && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  REPORT LISTING
                </div>

                <h2 className="mt-1 text-xl font-semibold">
                  举报此交易
                </h2>
              </div>

              <button
                type="button"
                disabled={submittingReport}
                onClick={() =>
                  setReportDialogOpen(false)
                }
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-sm font-medium">
                  {listing.title}
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  发布者：
                  {listing.profiles?.rsi_handle
                    ? `@${listing.profiles.rsi_handle}`
                    : sellerName}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  举报原因
                </label>

                <select
                  value={reportReason}
                  onChange={(event) =>
                    setReportReason(
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
                >
                  <option value="">
                    请选择举报原因
                  </option>

                  <option value="fraud">
                    疑似诈骗
                  </option>

                  <option value="misleading">
                    虚假 / 误导交易信息
                  </option>

                  <option value="rmt">
                    RMT / 现金交易
                  </option>

                  <option value="prohibited">
                    违规商品或内容
                  </option>

                  <option value="spam">
                    垃圾信息 / 恶意刷屏
                  </option>

                  <option value="other">
                    其他
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  补充说明

                  <span className="ml-2 font-normal text-muted-foreground">
                    可选
                  </span>
                </label>

                <textarea
                  value={reportDetails}
                  onChange={(event) =>
                    setReportDetails(
                      event.target.value,
                    )
                  }
                  maxLength={1500}
                  rows={5}
                  placeholder="请简要说明举报原因，例如交易内容、行为或其他需要管理员注意的信息。"
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm leading-6 outline-none"
                />

                <div className="mt-1 text-right text-xs text-muted-foreground">
                  {reportDetails.length}/1500
                </div>
              </div>

              {reportError && (
                <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
                  {reportError}
                </div>
              )}

              {reportSuccess && (
                <div className="rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-600">
                  {reportSuccess}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                disabled={submittingReport}
                onClick={() =>
                  setReportDialogOpen(false)
                }
                className="h-10 rounded-full border border-border px-5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                取消
              </button>

              <button
                type="button"
                disabled={submittingReport}
                onClick={submitReport}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-red-500 px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submittingReport ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  '提交举报'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}