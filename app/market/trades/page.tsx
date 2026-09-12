'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock3,
  Inbox,
  Loader2,
  Package,
  Send,
  Store,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

type TradeRequestStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'completed'

type TradeAction =
  | 'accept'
  | 'decline'
  | 'cancel'
  | 'complete'

type TradeProfile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  star_citizen_handle: string | null
  rsi_verified: boolean | null
  member_number: number | null
  profile_slug: string | null
}

type TradeListing = {
  id: string
  listing_type: string
  title: string
  price_uec: number | null
  quantity: number
  image_urls: string[]
  location: string | null
  status: string
  closed_at: string | null
}

type TradeRequest = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string

  quantity: number
  offered_price_uec: number | null
  preferred_location: string | null
  preferred_time: string | null
  message: string

  status: TradeRequestStatus

  created_at: string
  updated_at: string
  accepted_at: string | null
  declined_at: string | null
  cancelled_at: string | null
  completed_at: string | null

  cancelled_by: string | null
  cancel_reason: string | null

  buyer_completed_at: string | null
  seller_completed_at: string | null

  buyer_last_read_at: string | null
  seller_last_read_at: string | null

  unread_count: number

  market_listings:
    | TradeListing
    | null

  buyer:
    | TradeProfile
    | null

  seller:
    | TradeProfile
    | null
}

type MyListing = {
  id: string
  listing_type: 'wts' | 'wtb' | 'wtt'
  category: string
  subcategory: string | null
  title: string
  price_uec: number | null
  quantity: number
  quality: number | null
  location: string | null
  image_urls: string[]
  status: string
  created_at: string
  updated_at: string | null
  closed_at: string | null
}

type TabValue =
  | 'received'
  | 'sent'
  | 'active'
  | 'history'
  | 'listings'

const STATUS_LABELS: Record<
  TradeRequestStatus,
  string
> = {
  pending: '等待处理',
  accepted: '交易中',
  declined: '已拒绝',
  cancelled: '已取消',
  completed: '已完成',
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(
    new Date(value),
  )
}

function formatPrice(
  value: number | null,
) {
  if (value === null) {
    return '未报价'
  }

  return `${value.toLocaleString()} aUEC`
}

function getProfileName(
  profile:
    | TradeProfile
    | null,
) {
  return (
    profile?.star_citizen_handle ??
    profile?.display_name ??
    profile?.username ??
    'StarClub 玩家'
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
    return JSON.parse(
      text,
    )
  } catch {
    throw new Error(
      response.ok
        ? '服务器返回了无法识别的数据'
        : `服务器返回异常（${response.status}），请稍后重试`,
    )
  }
}

export default function MarketTradesPage() {
  const [
    received,
    setReceived,
  ] = useState<
    TradeRequest[]
  >([])

  const [
    sent,
    setSent,
  ] = useState<
    TradeRequest[]
  >([])

  const [
  myListings,
  setMyListings,
] =
  useState<MyListing[]>([])

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState<
    string | null
  >(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<TabValue>(
      'received',
    )

  const [
    updatingId,
    setUpdatingId,
  ] = useState<
    string | null
  >(null)

  const [
    actionError,
    setActionError,
  ] = useState('')

  const [
    cancelTarget,
    setCancelTarget,
  ] =
    useState<TradeRequest | null>(
      null,
    )

  const [
    cancelReason,
    setCancelReason,
  ] = useState('')

  const [
    cancelError,
    setCancelError,
  ] = useState('')

  const [
    closingListingId,
    setClosingListingId,
  ] = useState<
    string | null
  >(null)

  const [
    editingListingId,
    setEditingListingId,
  ] = useState<string | null>(null)

  const [
    editingQuantity,
    setEditingQuantity,
  ] = useState('')

  const [
    savingListingId,
    setSavingListingId,
  ] = useState<string | null>(null)

  const loadRequests =
    useCallback(
      async () => {
        setLoading(true)
        setError('')

        try {
          const {
            getSupabaseBrowser,
          } = await import(
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
              '请先登录后查看我的交易',
            )
          }

          setCurrentUserId(
            session.user.id,
          )

          const headers = {
            Authorization:
              `Bearer ${session.access_token}`,
          }

          const [
            receivedResponse,
            sentResponse,
          ] =
            await Promise.all([
              fetch(
                '/api/market/listings/trade-requests?type=received',
                {
                  cache:
                    'no-store',
                  headers,
                },
              ),

              fetch(
                '/api/market/listings/trade-requests?type=sent',
                {
                  cache:
                    'no-store',
                  headers,
                },
              ),
            ])
          
          const listingsResponse =
            await fetch(
              '/api/market/listings?mine=1&page=1',
              {
                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },
                cache: 'no-store',
              },
            )

            const [
              receivedData,
              sentData,
              listingsData,
            ] =
              await Promise.all([
                receivedResponse.json(),
                sentResponse.json(),
                listingsResponse.json(),
              ])

          if (
            !receivedResponse.ok
          ) {
            throw new Error(
              receivedData.error ??
                '读取收到的申请失败',
            )
          }

          if (
            !sentResponse.ok
          ) {
            throw new Error(
              sentData.error ??
                '读取发出的申请失败',
            )
          }

          if (
            !listingsResponse.ok
          ) {
            throw new Error(
              listingsData.error ??
                '读取我的商单失败',
            )
          }

          const listingRows =
            Array.isArray(listingsData.listings)
              ? listingsData.listings
              : Array.isArray(listingsData.data)
                ? listingsData.data
                : []

          setMyListings(listingRows)

          setReceived(
            Array.isArray(
              receivedData.requests,
            )
              ? receivedData.requests
              : [],
          )

          setSent(
            Array.isArray(
              sentData.requests,
            )
              ? sentData.requests
              : [],
          )
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : '读取交易数据失败',
          )
        } finally {
          setLoading(false)
        }
      },
      [],
    )

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  useEffect(() => {
  async function markTradeRequestsSeen() {
    try {
      const {
        getSupabaseBrowser,
      } = await import(
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
        return
      }

      await fetch(
        '/api/market/notifications',
        {
          method: 'PATCH',
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
        },
      )
    } catch (error) {
      console.error(
        'Failed to mark trade requests as seen:',
        error,
      )
    }
  }

  void markTradeRequestsSeen()
}, [])

  async function updateTradeRequest(
    id: string,
    action: TradeAction,
    reason?: string,
  ) {
    if (updatingId) {
      return
    }

    setUpdatingId(
      id,
    )

    setActionError('')

    try {
      const {
        getSupabaseBrowser,
      } = await import(
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
          '请先登录后操作交易',
        )
      }

      const response =
        await fetch(
          `/api/market/listings/trade-requests/${id}`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body:
              JSON.stringify({
                action,

                ...(reason
                  ? {
                      reason,
                    }
                  : {}),
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
            '更新交易状态失败',
        )
      }

      await loadRequests()

      return data
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : '更新交易状态失败'

      setActionError(
        message,
      )

      throw err
    } finally {
      setUpdatingId(
        null,
      )
    }
  }

  function openCancelDialog(
    request: TradeRequest,
  ) {
    setCancelTarget(
      request,
    )

    setCancelReason('')
    setCancelError('')
  }

  function closeCancelDialog() {
    if (updatingId) {
      return
    }

    setCancelTarget(
      null,
    )

    setCancelReason('')
    setCancelError('')
  }

  async function submitCancel() {
    if (
      !cancelTarget ||
      updatingId
    ) {
      return
    }

    const reason =
      cancelReason.trim()

    if (!reason) {
      setCancelError(
        '请填写取消原因',
      )

      return
    }

    if (
      reason.length >
      500
    ) {
      setCancelError(
        '取消原因最多 500 个字符',
      )

      return
    }

    setCancelError('')

    try {
      await updateTradeRequest(
        cancelTarget.id,
        'cancel',
        reason,
      )

      setCancelTarget(
        null,
      )

      setCancelReason('')
    } catch (err) {
      setCancelError(
        err instanceof Error
          ? err.message
          : '取消交易失败',
      )
    }
  }

  async function confirmComplete(
    request: TradeRequest,
  ) {
    const confirmed =
      window.confirm(
        '确认你已经在游戏内完成了这笔交易吗？\n\n你的确认不会立即结束订单，需要交易双方都确认后才会正式完成。',
      )

    if (!confirmed) {
      return
    }

    try {
      const data =
        await updateTradeRequest(
          request.id,
          'complete',
        )

      if (
        data?.waitingForOtherParty
      ) {
        window.alert(
          '你的完成确认已记录，正在等待交易对方确认。',
        )
      }
    } catch {
      // 错误已经显示在页面
    }
  }

  async function closeListing(
    listing:
      TradeListing,
  ) {
    if (
      closingListingId
    ) {
      return
    }

    const label =
      listing.listing_type ===
      'wts'
        ? '标记已售罄'
        : '下架交易'

    const confirmed =
      window.confirm(
        `确定要${label}吗？\n\n下架后不会再接受新的交易申请，但已经接受的订单仍然可以继续完成。`,
      )

    if (!confirmed) {
      return
    }

    setClosingListingId(
      listing.id,
    )

    setActionError('')

    try {
      const {
        getSupabaseBrowser,
      } = await import(
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
          '请先登录后操作交易',
        )
      }

      const response =
        await fetch(
          `/api/market/listings/${listing.id}`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body:
              JSON.stringify({
                action:
                  'close',
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
            '下架交易失败',
        )
      }

      await loadRequests()
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : '下架交易失败',
      )
    } finally {
      setClosingListingId(
        null,
      )
    }
  }

  function beginEditQuantity(
    listing: MyListing,
  ) {
    setEditingListingId(listing.id)
    setEditingQuantity(String(listing.quantity))
    setActionError('')
  }

  function cancelEditQuantity() {
    if (savingListingId) {
      return
    }

    setEditingListingId(null)
    setEditingQuantity('')
  }

  async function saveListingQuantity(
    listing: MyListing,
  ) {
    if (savingListingId) {
      return
    }

    const quantity = Number(editingQuantity)

    if (
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setActionError('商品数量必须是 0 或更大的整数')
      return
    }

    setSavingListingId(listing.id)
    setActionError('')

    try {
      const {
        getSupabaseBrowser,
      } = await import(
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
          '请先登录后修改商单',
        )
      }

      const response =
        await fetch(
          `/api/market/listings/${listing.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
              Authorization:
                `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: 'update_quantity',
              quantity,
            }),
          },
        )

      const data =
        await readJsonSafely(response)

      if (!response.ok) {
        throw new Error(
          data.error ??
            '修改商品数量失败',
        )
      }

      setEditingListingId(null)
      setEditingQuantity('')
      await loadRequests()
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : '修改商品数量失败',
      )
    } finally {
      setSavingListingId(null)
    }
  }

  const activeRequests =
    useMemo(() => {
      const map =
        new Map<
          string,
          TradeRequest
        >()

      for (
        const request of [
          ...received,
          ...sent,
        ]
      ) {
        if (
          request.status ===
          'accepted'
        ) {
          map.set(
            request.id,
            request,
          )
        }
      }

      return Array.from(
        map.values(),
      ).sort(
        (a, b) =>
          new Date(
            b.updated_at,
          ).getTime() -
          new Date(
            a.updated_at,
          ).getTime(),
      )
    }, [
      received,
      sent,
    ])

  const historyRequests =
    useMemo(() => {
      const map =
        new Map<
          string,
          TradeRequest
        >()

      for (
        const request of [
          ...received,
          ...sent,
        ]
      ) {
        if (
          [
            'declined',
            'cancelled',
            'completed',
          ].includes(
            request.status,
          )
        ) {
          map.set(
            request.id,
            request,
          )
        }
      }

      return Array.from(
        map.values(),
      ).sort(
        (a, b) =>
          new Date(
            b.updated_at,
          ).getTime() -
          new Date(
            a.updated_at,
          ).getTime(),
      )
    }, [
      received,
      sent,
    ])

  const totalActiveUnread =
    useMemo(
      () =>
        activeRequests.reduce(
          (
            total,
            request,
          ) =>
            total +
            (
              request.unread_count ??
              0
            ),
          0,
        ),
      [
        activeRequests,
      ],
    )

  const currentRequests =
    activeTab === 'received'
      ? received
      : activeTab === 'sent'
        ? sent
        : activeTab === 'active'
          ? activeRequests
          : activeTab === 'history'
            ? historyRequests
            : []

  const tabs = [
    {
      value:
        'received' as const,

      label:
        '收到的申请',

      count:
        received.filter(
          (request) =>
            request.status ===
            'pending',
        ).length,
    },

    {
      value:
        'sent' as const,

      label:
        '发出的申请',

      count:
        sent.filter(
          (request) =>
            request.status ===
            'pending',
        ).length,
    },

    {
      value:
        'active' as const,

      label:
        '进行中',

      count:
        totalActiveUnread,
    },

    {
      value:
        'history' as const,

      label:
        '历史',

      count: 0,
    },

    {
      value:
        'listings' as const,

      label:
        '我的商单',

      count:
        myListings.filter(
          (listing) =>
            listing.status === 'active' &&
            !listing.closed_at,
        ).length,
    },
  ]

  return (
    <>
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-28 lg:px-8">
          <div className="mb-8">
            <Link
              href="/market"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />

              返回市场
            </Link>
          </div>

          <div className="flex flex-col gap-3 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                STARCLUB MARKET
              </div>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                我的交易
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                管理收到和发出的交易申请，并查看正在进行及已经结束的交易。
              </p>
            </div>
          </div>

          <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
            {tabs.map(
              (tab) => (
                <button
                  key={
                    tab.value
                  }
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      tab.value,
                    )
                  }
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                    activeTab ===
                    tab.value
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {
                    tab.label
                  }

                  {tab.count >
                    0 && (
                    <span
                      className={`flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] ${
                        activeTab ===
                        tab.value
                          ? 'bg-background/20 text-background'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {
                        tab.count
                      }
                    </span>
                  )}
                </button>
              ),
            )}
          </div>

          {actionError && (
            <div className="mt-6 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {
                actionError
              }
            </div>
          )}

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />

                正在读取交易信息……
              </div>
            </div>
          ) : error ? (
            <div className="mt-8 rounded-xl border border-border p-8 text-center">
              <div className="font-medium">
                无法读取交易信息
              </div>

              <div className="mt-2 text-sm text-muted-foreground">
                {
                  error
                }
              </div>
            </div>
          ) : activeTab === 'listings' ? (
            myListings.length === 0 ? (
              <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
                <Store className="size-7 text-muted-foreground" />
                <div className="mt-4 font-medium">
                  暂无商单
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  你发布的市场商单会显示在这里。
                </div>
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                {myListings.map((listing) => {
                  const image =
                    listing.image_urls?.[0] ?? null
                  const closed =
                    Boolean(listing.closed_at) ||
                    listing.status !== 'active'
                  const editing =
                    editingListingId === listing.id
                  const saving =
                    savingListingId === listing.id
                  const closing =
                    closingListingId === listing.id

                  return (
                    <article
                      key={listing.id}
                      className="overflow-hidden rounded-xl border border-border bg-card"
                    >
                      <div className="flex flex-col gap-5 p-5 md:flex-row">
                        <Link
                          href={`/market/${listing.id}`}
                          className="block shrink-0"
                        >
                          <div className="flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted md:w-40">
                            {image ? (
                              <img
                                src={image}
                                alt={listing.title}
                                className={`h-full w-full object-cover ${
                                  closed
                                    ? 'grayscale opacity-60'
                                    : ''
                                }`}
                              />
                            ) : (
                              <Package className="size-6 text-muted-foreground" />
                            )}
                          </div>
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium uppercase">
                                  {listing.listing_type}
                                </span>

                                <span
                                  className={`rounded-md px-2.5 py-1 text-[11px] ${
                                    closed
                                      ? 'bg-muted text-muted-foreground'
                                      : 'bg-emerald-500/10 text-emerald-600'
                                  }`}
                                >
                                  {closed
                                    ? listing.listing_type === 'wts'
                                      ? '已售罄 / 已下架'
                                      : '已下架'
                                    : '上架中'}
                                </span>

                                <span className="text-xs text-muted-foreground">
                                  {formatDate(listing.created_at)}
                                </span>
                              </div>

                              <Link
                                href={`/market/${listing.id}`}
                                className="mt-3 block truncate text-lg font-semibold hover:underline"
                              >
                                {listing.title}
                              </Link>

                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                <span>
                                  {formatPrice(listing.price_uec)}
                                </span>
                                <span>
                                  {listing.location || '未填写地点'}
                                </span>
                              </div>
                            </div>

                            <div className="sm:text-right">
                              <div className="text-xs text-muted-foreground">
                                当前数量
                              </div>
                              <div className="mt-1 text-xl font-semibold">
                                {listing.quantity}
                              </div>
                            </div>
                          </div>

                          {!closed && (
                            <div className="mt-5 flex flex-wrap items-center gap-2">
                              {editing ? (
                                <>
                                  <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={editingQuantity}
                                    disabled={saving}
                                    onChange={(event) =>
                                      setEditingQuantity(
                                        event.target.value,
                                      )
                                    }
                                    className="h-9 w-28 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40"
                                    aria-label="商品数量"
                                  />

                                  <button
                                    type="button"
                                    disabled={
                                      saving ||
                                      editingQuantity.trim() === ''
                                    }
                                    onClick={() =>
                                      void saveListingQuantity(
                                        listing,
                                      )
                                    }
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {saving ? (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                      <Check className="size-3.5" />
                                    )}
                                    保存数量
                                  </button>

                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={
                                      cancelEditQuantity
                                    }
                                    className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
                                  >
                                    取消
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    beginEditQuantity(
                                      listing,
                                    )
                                  }
                                  className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-xs font-medium transition-colors hover:bg-muted"
                                >
                                  修改数量
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={closing || saving}
                                onClick={() =>
                                  void closeListing(
                                    listing,
                                  )
                                }
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-red-500/30 px-4 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {closing ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Store className="size-3.5" />
                                )}
                                {listing.listing_type === 'wts'
                                  ? '标记售罄 / 下架'
                                  : '下架商单'}
                              </button>

                              <Link
                                href={`/market/${listing.id}`}
                                className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-xs font-medium transition-colors hover:bg-muted"
                              >
                                查看商品
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )
          ) : currentRequests
              .length ===
            0 ? (
            <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
              {activeTab ===
              'received' ? (
                <Inbox className="size-7 text-muted-foreground" />
              ) : activeTab ===
                'sent' ? (
                <Send className="size-7 text-muted-foreground" />
              ) : (
                <Clock3 className="size-7 text-muted-foreground" />
              )}

              <div className="mt-4 font-medium">
                暂无交易记录
              </div>

              <div className="mt-1 text-sm text-muted-foreground">
                {activeTab ===
                'received'
                  ? '其他玩家发送给你的交易申请会显示在这里。'
                  : activeTab ===
                      'sent'
                    ? '你向其他玩家发出的交易申请会显示在这里。'
                    : activeTab ===
                        'active'
                      ? '交易发布者接受申请后，正在进行的交易会显示在这里。'
                      : '已经完成、取消或拒绝的交易会显示在这里。'}
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {currentRequests.map(
                (
                  request,
                ) => {
                  const listing =
                    request.market_listings

                  const isSeller =
                    request.seller_id ===
                    currentUserId

                  const isBuyer =
                    request.buyer_id ===
                    currentUserId

                  const counterpart =
                    isSeller
                      ? request.buyer
                      : request.seller

                  const counterpartName =
                    getProfileName(
                      counterpart,
                    )

                  const image =
                    listing
                      ?.image_urls?.[0] ??
                    null

                  const updating =
                    updatingId ===
                    request.id

                  const unreadCount =
                    request.unread_count ??
                    0

                  const myCompleted =
                    isBuyer
                      ? Boolean(
                          request.buyer_completed_at,
                        )
                      : Boolean(
                          request.seller_completed_at,
                        )

                  const otherCompleted =
                    isBuyer
                      ? Boolean(
                          request.seller_completed_at,
                        )
                      : Boolean(
                          request.buyer_completed_at,
                        )

                  const buyerName =
                    getProfileName(
                      request.buyer,
                    )

                  const sellerName =
                    getProfileName(
                      request.seller,
                    )

                  const cancelledByName =
                    request.cancelled_by ===
                    request.buyer_id
                      ? buyerName
                      : request.cancelled_by ===
                          request.seller_id
                        ? sellerName
                        : '交易参与者'

                  const listingClosed =
                    Boolean(
                      listing
                        ?.closed_at,
                    )

                  const closingListing =
                    listing
                      ? closingListingId ===
                        listing.id
                      : false

                  return (
                    <article
                      key={
                        request.id
                      }
                      className="overflow-hidden rounded-xl border border-border bg-card"
                    >
                      <div className="flex flex-col gap-5 p-5 md:flex-row">
                        <Link
                          href={
                            listing
                              ? `/market/${listing.id}`
                              : '/market'
                          }
                          className="block shrink-0"
                        >
                          <div className="flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted md:w-40">
                            {image ? (
                              <img
                                src={
                                  image
                                }
                                alt={
                                  listing?.title ??
                                  '商品图片'
                                }
                                className={`h-full w-full object-cover ${
                                  listingClosed
                                    ? 'grayscale opacity-60'
                                    : ''
                                }`}
                              />
                            ) : (
                              <Package className="size-6 text-muted-foreground" />
                            )}
                          </div>
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium">
                                  {
                                    STATUS_LABELS[
                                      request.status
                                    ]
                                  }
                                </span>

                                {listingClosed && (
                                  <span className="rounded-md bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                                    商品已下架
                                  </span>
                                )}

                                {request.status ===
                                  'accepted' &&
                                  unreadCount >
                                    0 && (
                                    <span className="rounded-md bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                                      {
                                        unreadCount
                                      }{' '}
                                      条新消息
                                    </span>
                                  )}

                                <span className="text-xs text-muted-foreground">
                                  {formatDate(
                                    request.created_at,
                                  )}
                                </span>
                              </div>

                              <Link
                                href={
                                  listing
                                    ? `/market/${listing.id}`
                                    : '/market'
                                }
                                className="mt-3 block text-lg font-semibold hover:underline"
                              >
                                {listing
                                  ?.title ??
                                  '交易商品'}
                              </Link>

                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                <span>
                                  数量 ×
                                  {
                                    request.quantity
                                  }
                                </span>

                                <span>
                                  报价：
                                  {formatPrice(
                                    request.offered_price_uec,
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="sm:text-right">
                              <div className="text-xs text-muted-foreground">
                                {isSeller
                                  ? '申请人'
                                  : '交易发布者'}
                              </div>

                              <div className="mt-1 flex items-center gap-1.5 font-medium sm:justify-end">
                                @
                                {
                                  counterpartName
                                }

                                {counterpart
                                  ?.rsi_verified && (
                                  <BadgeCheck className="size-4 text-blue-500" />
                                )}
                              </div>
                            </div>
                          </div>

                          {(request.preferred_location ||
                            request.preferred_time) && (
                            <div className="mt-4 grid gap-3 rounded-lg bg-muted/40 p-4 text-sm sm:grid-cols-2">
                              <div>
                                <div className="text-xs text-muted-foreground">
                                  希望交易地点
                                </div>

                                <div className="mt-1">
                                  {request.preferred_location ||
                                    '未指定'}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs text-muted-foreground">
                                  希望交易时间
                                </div>

                                <div className="mt-1">
                                  {request.preferred_time ||
                                    '未指定'}
                                </div>
                              </div>
                            </div>
                          )}

                          {request.message && (
                            <div className="mt-4">
                              <div className="text-xs text-muted-foreground">
                                交易留言
                              </div>

                              <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                                {
                                  request.message
                                }
                              </p>
                            </div>
                          )}

                          {request.status ===
                            'accepted' && (
                            <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
                              <div className="text-xs font-medium">
                                完成确认
                              </div>

                              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`flex size-5 items-center justify-center rounded-full border ${
                                      request.buyer_completed_at
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                                        : 'border-border text-muted-foreground'
                                    }`}
                                  >
                                    {request.buyer_completed_at ? (
                                      <Check className="size-3" />
                                    ) : (
                                      '1'
                                    )}
                                  </span>

                                  <span>
                                    买家
                                    {request.buyer_completed_at
                                      ? '已确认完成'
                                      : '等待确认'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span
                                    className={`flex size-5 items-center justify-center rounded-full border ${
                                      request.seller_completed_at
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                                        : 'border-border text-muted-foreground'
                                    }`}
                                  >
                                    {request.seller_completed_at ? (
                                      <Check className="size-3" />
                                    ) : (
                                      '2'
                                    )}
                                  </span>

                                  <span>
                                    卖家
                                    {request.seller_completed_at
                                      ? '已确认完成'
                                      : '等待确认'}
                                  </span>
                                </div>
                              </div>

                              {myCompleted &&
                                !otherCompleted && (
                                  <div className="mt-3 text-xs text-muted-foreground">
                                    你已确认完成，正在等待对方确认。
                                  </div>
                                )}

                              {!myCompleted &&
                                otherCompleted && (
                                  <div className="mt-3 text-xs text-emerald-600">
                                    对方已经确认完成，等待你确认。
                                  </div>
                                )}
                            </div>
                          )}

                          {request.status ===
                            'completed' && (
                            <div className="mt-4 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                              双方已确认，本次交易已完成。
                            </div>
                          )}

                          {request.status ===
                            'cancelled' && (
                            <div className="mt-4 rounded-lg bg-red-500/10 px-4 py-3">
                              <div className="text-sm font-medium text-red-600">
                                该交易已由 @
                                {
                                  cancelledByName
                                }{' '}
                                取消
                              </div>

                              <div className="mt-1 text-sm text-muted-foreground">
                                取消原因：
                                {request.cancel_reason ||
                                  '未填写'}
                              </div>

                              {request.cancelled_at && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  {formatDate(
                                    request.cancelled_at,
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="mt-5 flex flex-wrap gap-2">
                            <Link
                              href={
                                listing
                                  ? `/market/${listing.id}`
                                  : '/market'
                              }
                              className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-xs font-medium transition-colors hover:bg-muted"
                            >
                              查看商品
                            </Link>

                            {request.status ===
                              'pending' &&
                              isSeller && (
                                <>
                                  <button
                                    type="button"
                                    disabled={
                                      updating
                                    }
                                    onClick={() =>
                                      void updateTradeRequest(
                                        request.id,
                                        'accept',
                                      )
                                    }
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {updating ? (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                      <Check className="size-3.5" />
                                    )}

                                    接受申请
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      updating
                                    }
                                    onClick={() =>
                                      void updateTradeRequest(
                                        request.id,
                                        'decline',
                                      )
                                    }
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-4 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <X className="size-3.5" />

                                    拒绝
                                  </button>
                                </>
                              )}

                            {request.status ===
                              'pending' &&
                              isBuyer && (
                                <button
                                  type="button"
                                  disabled={
                                    updating
                                  }
                                  onClick={() =>
                                    openCancelDialog(
                                      request,
                                    )
                                  }
                                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-4 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <X className="size-3.5" />

                                  取消申请
                                </button>
                              )}

                            {request.status ===
                              'accepted' && (
                                <>
                                  <Link
                                    href={`/market/trades/${request.id}`}
                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-4 text-xs font-medium transition-colors hover:bg-muted"
                                  >
                                    进入交易会话

                                    {unreadCount >
                                      0 && (
                                      <span className="flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                                        {
                                          unreadCount
                                        }
                                      </span>
                                    )}
                                  </Link>

                                  <button
                                    type="button"
                                    disabled={
                                      updating ||
                                      myCompleted
                                    }
                                    onClick={() =>
                                      void confirmComplete(
                                        request,
                                      )
                                    }
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {updating ? (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                      <Check className="size-3.5" />
                                    )}

                                    {myCompleted
                                      ? '我已确认完成'
                                      : '确认我已完成'}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      updating
                                    }
                                    onClick={() =>
                                      openCancelDialog(
                                        request,
                                      )
                                    }
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-red-500/30 px-4 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <X className="size-3.5" />

                                    取消这笔交易
                                  </button>

                                  {isSeller &&
                                    listing &&
                                    !listingClosed && (
                                      <button
                                        type="button"
                                        disabled={
                                          closingListing
                                        }
                                        onClick={() =>
                                          void closeListing(
                                            listing,
                                          )
                                        }
                                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-4 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {closingListing ? (
                                          <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                          <Store className="size-3.5" />
                                        )}

                                        {listing.listing_type ===
                                        'wts'
                                          ? '标记商品售罄'
                                          : '下架交易'}
                                      </button>
                                    )}
                                </>
                              )}

                            {[
                              'cancelled',
                              'completed',
                            ].includes(
                              request.status,
                            ) && (
                              <Link
                                href={`/market/trades/${request.id}`}
                                className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-xs font-medium transition-colors hover:bg-muted"
                              >
                                查看交易会话
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                },
              )}
            </div>
          )}
        </div>
      </main>

      {cancelTarget && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-background shadow-2xl">
            <div className="border-b border-border px-6 py-5">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                CANCEL TRADE
              </div>

              <h2 className="mt-1 text-xl font-semibold">
                {cancelTarget.status ===
                'pending'
                  ? '取消交易申请'
                  : '取消这笔交易'}
              </h2>
            </div>

            <div className="p-6">
              <p className="text-sm leading-6 text-muted-foreground">
                取消后交易对方也会看到取消人和取消原因。已经取消的订单不会自动下架商品。
              </p>

              <div className="mt-5">
                <label className="text-sm font-medium">
                  取消原因
                </label>

                <textarea
                  value={
                    cancelReason
                  }
                  onChange={(
                    event,
                  ) => {
                    setCancelReason(
                      event.target.value,
                    )

                    setCancelError(
                      '',
                    )
                  }}
                  rows={4}
                  maxLength={
                    500
                  }
                  placeholder="例如：临时有事无法交易、交易时间无法协调、买卖双方协商取消……"
                  className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-foreground/40"
                />

                <div className="mt-1 text-right text-[10px] text-muted-foreground">
                  {
                    cancelReason.length
                  }
                  /500
                </div>
              </div>

              {cancelError && (
                <div className="mt-3 rounded-lg bg-red-500/10 px-4 py-3 text-xs text-red-500">
                  {
                    cancelError
                  }
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={
                    Boolean(
                      updatingId,
                    )
                  }
                  onClick={
                    closeCancelDialog
                  }
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  返回
                </button>

                <button
                  type="button"
                  disabled={
                    Boolean(
                      updatingId,
                    ) ||
                    !cancelReason.trim()
                  }
                  onClick={() =>
                    void submitCancel()
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingId ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <X className="size-4" />
                  )}

                  确认取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}