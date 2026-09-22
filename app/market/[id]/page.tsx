'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flag,
  Info,
  Layers3,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import {
  use,
  useEffect,
  useState,
} from 'react'

import {
  UserVerificationBadges,
} from '@/components/user-verification-badges'

import {
  RsiVerificationModal,
} from '@/components/rsi-verification-modal'

import {
  MarketRsiRequiredDialog,
} from '@/components/market-rsi-required-dialog'

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
      reportEvidenceUrl,
      setReportEvidenceUrl,
    ] = useState('')

    const [
      uploadingEvidence,
      setUploadingEvidence,
    ] = useState(false)

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

    const [
      currentUser,
      setCurrentUser,
    ] = useState<{
      loggedIn: boolean
      star_citizen_handle: string | null
      rsi_verified: boolean
      rsi_verification_handle: string | null
      rsi_verification_code: string | null
      rsi_verification_expires_at: string | null
    }>({
      loggedIn: false,
      star_citizen_handle: null,
      rsi_verified: false,
      rsi_verification_handle: null,
      rsi_verification_code: null,
      rsi_verification_expires_at: null,
    })

    const [
      currentUserLoading,
      setCurrentUserLoading,
    ] = useState(true)

    const [
      rsiRequiredOpen,
      setRsiRequiredOpen,
    ] = useState(false)

    const [
      rsiVerificationOpen,
      setRsiVerificationOpen,
    ] = useState(false)

    const [
      pendingTradeAfterVerify,
      setPendingTradeAfterVerify,
    ] = useState(false)

  useEffect(() => {
    let active = true

    async function loadCurrentUser() {
      try {
        const {
          getSupabaseBrowser,
        } = await import(
          '@/lib/supabase-browser'
        )

        const supabase =
          getSupabaseBrowser()

        const {
          data: { session },
        } =
          await supabase.auth.getSession()

        if (!active) {
          return
        }

        if (!session?.user) {
          setCurrentUserId(null)

          setCurrentUser({
            loggedIn: false,
            star_citizen_handle: null,
            rsi_verified: false,
            rsi_verification_handle: null,
            rsi_verification_code: null,
            rsi_verification_expires_at: null,
          })

          return
        }

        setCurrentUserId(
          session.user.id,
        )

        const {
          data,
          error,
        } = await supabase
          .from('profiles')
          .select(`
            star_citizen_handle,
            rsi_verified,
            rsi_verification_handle,
            rsi_verification_code,
            rsi_verification_expires_at
          `)
          .eq(
            'id',
            session.user.id,
          )
          .maybeSingle()

        if (error) {
          throw error
        }

        if (!active) {
          return
        }

        setCurrentUser({
          loggedIn: true,
          star_citizen_handle:
            data?.star_citizen_handle ??
            null,
          rsi_verified:
            data?.rsi_verified === true,
          rsi_verification_handle:
            data?.rsi_verification_handle ??
            null,
          rsi_verification_code:
            data?.rsi_verification_code ??
            null,
          rsi_verification_expires_at:
            data?.rsi_verification_expires_at ??
            null,
        })
      } catch (error) {
        console.error(
          'Failed to load current market user:',
          error,
        )
      } finally {
        if (active) {
          setCurrentUserLoading(false)
        }
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

  function showTradeDialog() {
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

    setTradeDialogOpen(true)
  }

  async function openTradeDialog() {
    if (
      !listing ||
      listing.closed_at ||
      currentUserLoading ||
      currentUserId ===
        listing.seller_id
    ) {
      return
    }

    if (!currentUser.loggedIn) {
      const {
        getSupabaseBrowser,
      } = await import(
        '@/lib/supabase-browser'
      )

      const supabase =
        getSupabaseBrowser()

      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: 'discord',
          options: {
            redirectTo:
              window.location.href,
            scopes: 'identify email',
          },
        })

      if (error) {
        console.error(
          'Discord login error:',
          error,
        )

        alert(
          'Discord 登录失败，请稍后再试。',
        )
      }

      return
    }

    if (!currentUser.rsi_verified) {
      setPendingTradeAfterVerify(true)
      setRsiRequiredOpen(true)
      return
    }

    showTradeDialog()
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
      setReportEvidenceUrl('')
      setReportError('')
      setReportSuccess('')

      setReportDialogOpen(true)
    }

    async function uploadReportEvidence(
  file: File,
) {
  if (
    ![
      'image/jpeg',
      'image/png',
      'image/webp',
    ].includes(file.type)
  ) {
    setReportError(
      '仅支持 JPG、PNG 或 WEBP 图片',
    )
    return
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {
    setReportError(
      '图片不能超过 5MB',
    )
    return
  }

  setUploadingEvidence(true)
  setReportError('')

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
        '请先登录后上传证据',
      )
    }

    const formData =
      new FormData()

    formData.append(
      'file',
      file,
    )

    const response =
      await fetch(
        '/api/market/reports/upload',
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: formData,
        },
      )

    const data =
      await readJsonSafely(
        response,
      )

    if (!response.ok) {
      throw new Error(
        data.error ??
          '证据图片上传失败',
      )
    }

    if (
      typeof data.url !==
      'string'
    ) {
      throw new Error(
        '上传成功，但没有返回图片地址',
      )
    }

    setReportEvidenceUrl(
      data.url,
    )
  } catch (err) {
    setReportError(
      err instanceof Error
        ? err.message
        : '证据图片上传失败',
    )
  } finally {
    setUploadingEvidence(false)
  }
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

            evidenceUrl:
              reportEvidenceUrl || null,
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
        setReportEvidenceUrl('')
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
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      listing.listing_type === 'wts'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : listing.listing_type === 'wtb'
                          ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300'
                          : 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300'
                    }`}
                  >
                    {
                      TYPE_LABELS[
                        listing.listing_type
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
                    <div className="mt-6 flex items-baseline gap-2">
                      {listing.price_uec !== null ? (
                        <>
                          <span className="text-3xl font-semibold tabular-nums tracking-tight text-[#b66f08] dark:text-[#e6a64b]">
                            {listing.price_uec.toLocaleString()}
                          </span>

                          <span className="text-[13px] font-medium tracking-[0.08em] text-[#b66f08]/65 dark:text-[#e6a64b]/70">
                            aUEC
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-semibold tracking-tight text-[#b66f08] dark:text-[#e6a64b]">
                          面议
                        </span>
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

                <div className="mt-8 grid grid-cols-2 gap-3 border-y border-border/70 py-5">
                  {/* 数量 */}
                  <div className="flex items-center gap-3 rounded-xl bg-muted/25 px-3.5 py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm ring-1 ring-border/60">
                      <Layers3 className="size-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[10px] font-medium text-muted-foreground">
                        数量
                      </div>

                      <div className="mt-0.5 text-sm font-semibold tabular-nums">
                        ×{listing.quantity}
                      </div>
                    </div>
                  </div>

                  {/* 品质 */}
                  <div className="flex items-center gap-3 rounded-xl bg-muted/25 px-3.5 py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm ring-1 ring-border/60">
                      <Sparkles className="size-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[10px] font-medium text-muted-foreground">
                        品质
                      </div>

                      <div className="mt-0.5 text-sm font-semibold">
                        {listing.quality !== null
                          ? listing.quality
                          : '未注明'}
                      </div>
                    </div>
                  </div>

                  {/* 交易地点 */}
                  <div className="flex items-center gap-3 rounded-xl bg-muted/25 px-3.5 py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm ring-1 ring-border/60">
                      <MapPin className="size-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[10px] font-medium text-muted-foreground">
                        交易地点
                      </div>

                      <div
                        title={listing.location || '双方协商'}
                        className="mt-0.5 truncate text-sm font-semibold"
                      >
                        {listing.location || '双方协商'}
                      </div>
                    </div>
                  </div>

                  {/* 发布时间 */}
                  <div className="flex items-center gap-3 rounded-xl bg-muted/25 px-3.5 py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm ring-1 ring-border/60">
                      <CalendarDays className="size-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[10px] font-medium text-muted-foreground">
                        发布时间
                      </div>

                      <div className="mt-0.5 truncate text-sm font-semibold">
                        {formatDate(
                          listing.created_at,
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              <div className="mt-8">
                <h2 className="text-sm font-semibold">
                  商品说明
                </h2>

                <div
                  className="
                    mt-3
                    max-h-70
                    overflow-y-auto
                    whitespace-pre-wrap
                    wrap-break-word
                    pr-3
                    text-sm
                    leading-7
                    text-muted-foreground
                    scrollbar-thin
                  "
                >
                  {listing.description ||
                    '卖家暂未填写额外说明。'}
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-border px-5 py-4">
                <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
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
                        className="size-10 shrink-0 rounded-full object-cover"
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

                        <UserVerificationBadges
                          rsiVerified={
                            listing.profiles
                              ?.rsi_verified === true
                          }
                          handle={
                            listing.profiles
                              ?.rsi_handle
                          }
                          size="sm"
                        />
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
                        className="size-10 shrink-0 rounded-full object-cover"
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

                        <UserVerificationBadges
                          rsiVerified={
                            listing.profiles
                              ?.rsi_verified === true
                          }
                          handle={
                            listing.profiles
                              ?.rsi_handle
                          }
                          size="sm"
                        />
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

              <div className="mt-4 border-t border-border/70 pt-3.5">
                {sellerStatsLoading ? (
                    <div className="flex h-14 items-center justify-center">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
) : sellerStats ? (
  <div>
    <div className="mb-3 flex items-center justify-between">
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

                <div className="mt-5 rounded-2xl border border-border/70 bg-muted/20 px-5 py-4">
                  <div className="flex items-center gap-5">
                    {/* 安全提示 */}
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-[#b66f08]/15 bg-[#b66f08]/8 dark:border-[#e6a64b]/15 dark:bg-[#e6a64b]/8">
                          <Info className="size-3.5 text-[#b66f08] dark:text-[#e6a64b]" />
                        </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-foreground/80">
                          交易安全提示
                        </div>

                        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                          星际酒馆市场仅提供游戏内交易信息展示与撮合。
                          请确认物品、数量、品质及交易地点后，在游戏内完成交易。
                        </p>
                      </div>
                    </div>

                    {/* 举报 */}
                    {currentUserId !== listing.seller_id ? (
                        <button
                          type="button"
                          onClick={openReportDialog}
                          className="
                            group
                            inline-flex h-9 shrink-0 items-center justify-center gap-1.5
                            rounded-full
                            border border-border/80
                            bg-background
                            px-3.5
                            text-[11px] font-medium
                            text-muted-foreground
                            shadow-sm
                            transition-all
                            hover:border-red-500/25
                            hover:bg-red-500/5
                            active:scale-[0.97]
                            dark:shadow-none
                          "
                        >
                          <Flag className="size-3.5 text-red-500" />

                          <span className="transition-colors group-hover:text-red-500">
                            举报
                          </span>
                        </button>
                    ) : null}
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
                    isClosed ||
                    currentUserId ===
                      listing.seller_id
                  }
                  onClick={
                    openTradeDialog
                  }
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-medium transition-opacity ${
                    isClosed ||
                    currentUserId ===
                      listing.seller_id
                      ? 'cursor-not-allowed bg-muted text-muted-foreground'
                      : 'bg-foreground text-background hover:opacity-85'
                  }`}
                >
                  {isClosed ? (
                    <>
                      <X className="size-4" />
                      {closedLabel}
                    </>
                  ) : currentUserId ===
                    listing.seller_id ? (
                    <>
                      <User className="size-4" />
                      这是你的交易
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
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
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

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    截图证据

                    <span className="ml-2 font-normal text-muted-foreground">
                      可选 · 1 张
                    </span>
                  </label>

                  {reportEvidenceUrl ? (
                    <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20">
                      <img
                        src={reportEvidenceUrl}
                        alt="举报证据"
                        className="max-h-56 w-full object-contain"
                      />

                      <button
                        type="button"
                        disabled={submittingReport}
                        onClick={() =>
                          setReportEvidenceUrl('')
                        }
                        className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black disabled:opacity-50"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      className={`
                        flex min-h-24 flex-col
                        items-center justify-center gap-2
                        rounded-xl border
                        border-dashed border-border
                        bg-muted/20 px-4 py-5
                        text-center transition-colors
                        ${
                          uploadingEvidence
                            ? 'cursor-not-allowed opacity-50'
                            : 'cursor-pointer hover:bg-muted/40'
                        }
                      `}
                    >
                      <span className="text-sm font-medium">
                        {uploadingEvidence
                          ? '正在上传...'
                          : '点击上传截图证据'}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        JPG / PNG / WEBP · 最大 5MB
                      </span>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingEvidence}
                        onChange={(event) => {
                          const file =
                            event.target.files?.[0]

                          if (file) {
                            void uploadReportEvidence(
                              file,
                            )
                          }

                          event.currentTarget.value =
                            ''
                        }}
                      />
                    </label>
                  )}
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
                disabled={
                  submittingReport ||
                  uploadingEvidence
                }
                onClick={submitReport}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-red-500 px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submittingReport ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    提交中...
                  </>
                ) : uploadingEvidence ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    图片上传中...
                  </>
                ) : (
                  '提交举报'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

            <MarketRsiRequiredDialog
        open={rsiRequiredOpen}
        onClose={() => {
          setRsiRequiredOpen(false)
          setPendingTradeAfterVerify(false)
        }}
        onVerify={() => {
          setRsiRequiredOpen(false)
          setRsiVerificationOpen(true)
        }}
      />

      <RsiVerificationModal
        open={rsiVerificationOpen}
        onClose={() => {
          setRsiVerificationOpen(false)
          setPendingTradeAfterVerify(false)
        }}
        currentHandle={
          currentUser.star_citizen_handle
        }
        verificationHandle={
          currentUser.rsi_verification_handle
        }
        verificationCode={
          currentUser.rsi_verification_code
        }
        verificationExpiresAt={
          currentUser.rsi_verification_expires_at
        }
        onVerified={(handle) => {
          setCurrentUser(
            (current) => ({
              ...current,
              star_citizen_handle:
                handle,
              rsi_verified: true,
              rsi_verification_handle:
                null,
              rsi_verification_code:
                null,
              rsi_verification_expires_at:
                null,
            }),
          )

          setRsiVerificationOpen(false)

          if (
            pendingTradeAfterVerify
          ) {
            setPendingTradeAfterVerify(
              false,
            )

            window.setTimeout(() => {
              showTradeDialog()
            }, 150)
          }
        }}
      />

    </>
  )
}