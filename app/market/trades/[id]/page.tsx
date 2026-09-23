'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Loader2,
  Package,
  Send,
  Star,
  X,
} from 'lucide-react'
import {
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

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

type TradeMessage = {
  id: string
  trade_request_id: string
  sender_id: string
  content: string
  created_at: string
  edited_at: string | null
  deleted_at: string | null
  sender: TradeProfile | null
}

type TradeRequestStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'completed'

type TradeReview = {
  id: string
  rating: number
  comment: string | null
  reviewer_id: string
  reviewee_id: string
  created_at: string
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

  market_listings: TradeListing | null
  buyer: TradeProfile | null
  seller: TradeProfile | null
}

function formatTime(
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
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return null
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

export default function TradeConversationPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const {
    id,
  } = use(params)

  const [
    tradeRequest,
    setTradeRequest,
  ] =
    useState<TradeRequest | null>(
      null,
    )

  const [
    messages,
    setMessages,
  ] =
    useState<TradeMessage[]>(
      [],
    )

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
    content,
    setContent,
  ] = useState('')

  const [
    sending,
    setSending,
  ] = useState(false)

  const [
    sendError,
    setSendError,
  ] = useState('')

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false)

  const [
    actionError,
    setActionError,
  ] = useState('')

  const [
    cancelDialogOpen,
    setCancelDialogOpen,
  ] = useState(false)

  const [
    cancelReason,
    setCancelReason,
  ] = useState('')

  const [
    cancelError,
    setCancelError,
  ] = useState('')

  const [
    review,
    setReview,
  ] =
    useState<TradeReview | null>(
      null,
    )

  const [
    selectedRating,
    setSelectedRating,
  ] = useState(0)

  const [
    reviewComment,
    setReviewComment,
  ] = useState('')

  const [
    reviewLoading,
    setReviewLoading,
  ] = useState(false)

  const [
    reviewSubmitting,
    setReviewSubmitting,
  ] = useState(false)

  const [
    reviewError,
    setReviewError,
  ] = useState('')

  const bottomRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const loadMessages =
    useCallback(
      async (
        silent = false,
      ) => {
        if (!silent) {
          setLoading(true)
        }

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
              '请先登录后查看交易会话',
            )
          }

          setCurrentUserId(
            session.user.id,
          )

          const response =
            await fetch(
              `/api/market/listings/trade-requests/${id}/messages`,
              {
                cache:
                  'no-store',

                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },
              },
            )

          const data =
            await readJsonSafely(
              response,
            )

          if (!response.ok) {
            throw new Error(
              data.error ??
                '读取交易会话失败',
            )
          }

          setTradeRequest(
            data.tradeRequest ??
              null,
          )

          setMessages(
            Array.isArray(
              data.messages,
            )
              ? data.messages
              : [],
          )

          setError('')
        } catch (err) {
          if (!silent) {
            setError(
              err instanceof Error
                ? err.message
                : '读取交易会话失败',
            )
          } else {
            console.error(
              'Silent trade conversation refresh failed:',
              err,
            )
          }
        } finally {
          if (!silent) {
            setLoading(false)
          }
        }
      },
      [
        id,
      ],
    )

  useEffect(() => {
    void loadMessages()
  }, [
    loadMessages,
  ])

  useEffect(() => {
    if (
      messages.length ===
      0
    ) {
      return
    }

    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [
    messages,
  ])

  /*
   * Supabase Realtime
   *
   * 只有 accepted 状态允许新增消息，
   * 所以只有交易进行中需要订阅 INSERT。
   *
   * 同时保留 5 秒兜底同步，
   * 防止某些浏览器 / RLS / WebSocket
   * 临时情况下漏掉 Realtime 事件。
   */
  useEffect(() => {
    if (
      !tradeRequest ||
      tradeRequest.status !==
        'accepted'
    ) {
      return
    }

    let channel: any =
      null

    let cancelled =
      false

    let fallbackTimer:
      | number
      | null =
      null

    async function subscribe() {
      try {
        const {
          getSupabaseBrowser,
        } = await import(
          '@/lib/supabase-browser'
        )

        if (cancelled) {
          return
        }

        const supabase =
          getSupabaseBrowser()

        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession()

        if (
          !session ||
          cancelled
        ) {
          return
        }

        /*
         * RLS 下 Realtime 必须绑定
         * 当前用户 JWT。
         */
        await supabase.realtime.setAuth(
          session.access_token,
        )

        if (cancelled) {
          return
        }

        channel =
          supabase
            .channel(
              `market-trade-${id}`,
            )
            .on(
              'postgres_changes',
              {
                event:
                  'INSERT',

                schema:
                  'public',

                table:
                  'market_trade_messages',

                filter:
                  `trade_request_id=eq.${id}`,
              },
              (
                payload,
              ) => {
                console.log(
                  '[MARKET REALTIME] New message:',
                  payload.new,
                )

                void loadMessages(
                  true,
                )
              },
            )
            .subscribe(
              (
                status,
                subscribeError,
              ) => {
                console.log(
                  '[MARKET REALTIME]',
                  status,
                )

                if (
                  subscribeError
                ) {
                  console.error(
                    '[MARKET REALTIME] Subscribe error:',
                    subscribeError,
                  )
                }

                if (
                  [
                    'CHANNEL_ERROR',
                    'TIMED_OUT',
                    'CLOSED',
                  ].includes(
                    status,
                  )
                ) {
                  console.error(
                    '[MARKET REALTIME] Channel status:',
                    status,
                  )
                }
              },
            )

        /*
         * Realtime 是主通道，
         * 每 5 秒检查一次作为保险。
         */
        fallbackTimer =
          window.setInterval(
            () => {
              if (
                !cancelled
              ) {
                void loadMessages(
                  true,
                )
              }
            },
            5000,
          )

        if (
          cancelled &&
          channel
        ) {
          void channel.unsubscribe()
        }
      } catch (err) {
        console.error(
          '[MARKET REALTIME] Setup failed:',
          err,
        )

        /*
         * 即使 Realtime 初始化失败，
         * 仍然开启兜底轮询。
         */
        if (
          !cancelled &&
          fallbackTimer ===
            null
        ) {
          fallbackTimer =
            window.setInterval(
              () => {
                if (
                  !cancelled
                ) {
                  void loadMessages(
                    true,
                  )
                }
              },
              5000,
            )
        }
      }
    }

    void subscribe()

    return () => {
      cancelled =
        true

      if (
        fallbackTimer !==
        null
      ) {
        window.clearInterval(
          fallbackTimer,
        )
      }

      if (channel) {
        void channel.unsubscribe()
      }
    }
  }, [
    id,
    tradeRequest?.status,
    loadMessages,
  ])

  const loadReview =
    useCallback(
      async () => {
        if (
          tradeRequest?.status !==
          'completed'
        ) {
            setReview(null)
            setSelectedRating(0)
            setReviewComment('')
            setReviewError('')
          return
        }

        setReviewLoading(true)
        setReviewError('')

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
              '请先登录后查看评价',
            )
          }

          const response =
            await fetch(
              `/api/market/listings/trade-requests/${id}/review`,
              {
                cache:
                  'no-store',

                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },
              },
            )

          const data =
            await readJsonSafely(
              response,
            )

          if (!response.ok) {
            throw new Error(
              data.error ??
                '读取交易评价失败',
            )
          }

          const nextReview =
            data.review ??
            null

          setReview(
            nextReview,
          )

          setSelectedRating(
            nextReview?.rating ??
              0,
          )
          setReviewComment(
            nextReview?.comment ??
              '',
          )
        } catch (err) {
          setReviewError(
            err instanceof Error
              ? err.message
              : '读取交易评价失败',
          )
        } finally {
          setReviewLoading(false)
        }
      },
      [
        id,
        tradeRequest?.status,
      ],
    )

  useEffect(() => {
    if (
      tradeRequest?.status ===
      'completed'
    ) {
      void loadReview()
    } else {
        setReview(null)
        setSelectedRating(0)
        setReviewComment('')
        setReviewError('')
    }
  }, [
    tradeRequest?.status,
    loadReview,
  ])

  async function submitReview() {
    if (
      review ||
      reviewSubmitting
    ) {
      return
    }

    if (
      selectedRating < 1 ||
      selectedRating > 5
    ) {
      setReviewError(
        '请先选择 1–5 星评分',
      )
      return
    }

    const trimmedComment =
      reviewComment.trim()

    if (
      trimmedComment.length > 100
    ) {
      setReviewError(
        '简短评价最多 100 个字符',
      )
      return
    }

    setReviewSubmitting(true)
    setReviewError('')

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
          '请先登录后提交评价',
        )
      }

      const response =
        await fetch(
          `/api/market/listings/trade-requests/${id}/review`,
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
              rating:
                selectedRating,
              comment:
                trimmedComment,
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
            '提交评价失败',
        )
      }

      if (data.review) {
        setReview(
          data.review,
        )

        setSelectedRating(
          data.review.rating ??
            selectedRating,
        )
        setReviewComment(
          data.review.comment ??
            trimmedComment,
        )
      } else {
        await loadReview()
      }
    } catch (err) {
      setReviewError(
        err instanceof Error
          ? err.message
          : '提交评价失败',
      )
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function sendMessage() {
    if (
      sending ||
      !content.trim()
    ) {
      return
    }

    if (
      tradeRequest?.status !==
      'accepted'
    ) {
      setSendError(
        '当前交易状态无法发送消息',
      )

      return
    }

    const outgoingContent =
      content.trim()

    setSending(true)
    setSendError('')

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
          '请先登录后发送消息',
        )
      }

      const response =
        await fetch(
          `/api/market/listings/trade-requests/${id}/messages`,
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
                content:
                  outgoingContent,
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
            '发送消息失败',
        )
      }

      setContent('')

      if (data.message) {
        setMessages(
          (
            current,
          ) => {
            const exists =
              current.some(
                (
                  message,
                ) =>
                  message.id ===
                  data.message.id,
              )

            if (exists) {
              return current
            }

            return [
              ...current,
              data.message,
            ]
          },
        )
      }

      /*
       * 本地立即追加后，
       * 再静默同步一次保证数据一致。
       */
      void loadMessages(
        true,
      )
    } catch (err) {
      setSendError(
        err instanceof Error
          ? err.message
          : '发送消息失败',
      )
    } finally {
      setSending(false)
    }
  }

  async function updateTrade(
    action:
      | 'complete'
      | 'cancel',
    reason?: string,
  ) {
    if (
      actionLoading
    ) {
      return null
    }

    setActionLoading(
      true,
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
            method:
              'PATCH',

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

      await loadMessages(
        true,
      )

      return data
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : '更新交易状态失败',
      )

      return null
    } finally {
      setActionLoading(
        false,
      )
    }
  }

  async function confirmCompletion() {
    if (
      !tradeRequest ||
      tradeRequest.status !==
        'accepted'
    ) {
      return
    }

    const confirmed =
      window.confirm(
        '确认你已经在游戏内完成了这笔交易吗？\n\n你的确认不会单方面结束交易，需要双方都确认后才会正式完成。',
      )

    if (!confirmed) {
      return
    }

    const result =
      await updateTrade(
        'complete',
      )

    if (
      result?.waitingForOtherParty
    ) {
      window.alert(
        '你的完成确认已记录，正在等待交易对方确认。',
      )
    }
  }

  function openCancelDialog() {
    if (
      !tradeRequest ||
      tradeRequest.status !==
        'accepted'
    ) {
      return
    }

    setCancelReason('')
    setCancelError('')
    setCancelDialogOpen(
      true,
    )
  }

  function closeCancelDialog() {
    if (
      actionLoading
    ) {
      return
    }

    setCancelDialogOpen(
      false,
    )

    setCancelReason('')
    setCancelError('')
  }

  async function confirmCancel() {
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

    const result =
      await updateTrade(
        'cancel',
        reason,
      )

    if (!result) {
      return
    }

    setCancelDialogOpen(
      false,
    )

    setCancelReason('')
  }

  const canSend =
    tradeRequest?.status ===
    'accepted'

  const isBuyer =
    tradeRequest?.buyer_id ===
    currentUserId

  const isSeller =
    tradeRequest?.seller_id ===
    currentUserId

  const counterpart =
    tradeRequest
      ? isBuyer
        ? tradeRequest.seller
        : tradeRequest.buyer
      : null

  const counterpartName =
    getProfileName(
      counterpart,
    )

  const counterpartHref =
    counterpart?.profile_slug
      ? `/profile/${counterpart.profile_slug}`
      : null

  const listing =
    tradeRequest
      ?.market_listings ??
    null

  const listingImage =
    listing
      ?.image_urls?.[0] ??
    null

  const listingClosed =
    Boolean(
      listing?.closed_at,
    )

  const offeredPrice =
    tradeRequest
      ? formatPrice(
          tradeRequest.offered_price_uec,
        )
      : null

  const myCompleted =
    tradeRequest
      ? isBuyer
        ? Boolean(
            tradeRequest.buyer_completed_at,
          )
        : Boolean(
            tradeRequest.seller_completed_at,
          )
      : false

  const otherCompleted =
    tradeRequest
      ? isBuyer
        ? Boolean(
            tradeRequest.seller_completed_at,
          )
        : Boolean(
            tradeRequest.buyer_completed_at,
          )
      : false

  const buyerName =
    getProfileName(
      tradeRequest?.buyer ??
        null,
    )

  const sellerName =
    getProfileName(
      tradeRequest?.seller ??
        null,
    )

  const cancelledByName =
    tradeRequest?.cancelled_by ===
    tradeRequest?.buyer_id
      ? buyerName
      : tradeRequest?.cancelled_by ===
          tradeRequest?.seller_id
        ? sellerName
        : '交易参与者'

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />

            正在加载交易会话……
          </div>
        </div>
      </main>
    )
  }

  if (
    error ||
    !tradeRequest
  ) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-28">
          <Link
            href="/market/trades"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />

            返回我的交易
          </Link>

          <div className="mt-10 rounded-xl border border-border p-8 text-center">
            <div className="font-medium">
              无法打开交易会话
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
              {error ||
                '交易会话不存在'}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 pb-10 pt-24">
          <div>
            <Link
              href="/market/trades"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />

              返回我的交易
            </Link>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Link
                href={`/market/${tradeRequest.listing_id}`}
                className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted"
              >
                {listingImage ? (
                  <img
                    src={
                      listingImage
                    }
                    alt={
                      listing?.title ??
                      '交易商品'
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
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      TRADE CONVERSATION
                    </div>

                    <Link
                      href={`/market/${tradeRequest.listing_id}`}
                      className="mt-1 block truncate text-2xl font-semibold tracking-tight transition-opacity hover:opacity-70"
                    >
                      {listing?.title ??
                        '交易会话'}
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium">
                      {tradeRequest.status ===
                      'accepted'
                        ? '交易进行中'
                        : tradeRequest.status ===
                            'completed'
                          ? '交易已完成'
                          : tradeRequest.status ===
                              'cancelled'
                            ? '交易已取消'
                            : tradeRequest.status ===
                                'pending'
                              ? '等待处理'
                              : '已拒绝'}
                    </span>

                    {listingClosed && (
                      <span className="shrink-0 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                        商品已下架
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <div>
                    对方：

                    {counterpartHref ? (
                      <Link
                        href={
                          counterpartHref
                        }
                        className="ml-1 inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                      >
                        @{counterpartName}

                        {counterpart
                          ?.rsi_verified && (
                          <BadgeCheck className="size-3.5 text-blue-500" />
                        )}
                      </Link>
                    ) : (
                      <span className="ml-1 inline-flex items-center gap-1 font-medium text-foreground">
                        @{counterpartName}

                        {counterpart
                          ?.rsi_verified && (
                          <BadgeCheck className="size-3.5 text-blue-500" />
                        )}
                      </span>
                    )}
                  </div>

                  <div>
                    数量：

                    <span className="ml-1 font-medium text-foreground">
                      ×
                      {
                        tradeRequest.quantity
                      }
                    </span>
                  </div>

                  {offeredPrice && (
                    <div>
                      报价：

                      <span className="ml-1 font-medium text-foreground">
                        {
                          offeredPrice
                        }
                      </span>
                    </div>
                  )}
                </div>

                {(tradeRequest.preferred_location ||
                  tradeRequest.preferred_time) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tradeRequest.preferred_location && (
                      <span className="rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
                        地点 ·{' '}
                        {
                          tradeRequest.preferred_location
                        }
                      </span>
                    )}

                    {tradeRequest.preferred_time && (
                      <span className="rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
                        时间 ·{' '}
                        {
                          tradeRequest.preferred_time
                        }
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {tradeRequest.status ===
              'accepted' && (
              <div className="mt-5 border-t border-border pt-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-xs font-medium">
                      双方完成确认
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex size-5 items-center justify-center rounded-full border ${
                            tradeRequest.buyer_completed_at
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                              : 'border-border text-muted-foreground'
                          }`}
                        >
                          {tradeRequest.buyer_completed_at ? (
                            <Check className="size-3" />
                          ) : (
                            '1'
                          )}
                        </span>

                        <span>
                          买家
                          {tradeRequest.buyer_completed_at
                            ? '已确认'
                            : '待确认'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`flex size-5 items-center justify-center rounded-full border ${
                            tradeRequest.seller_completed_at
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                              : 'border-border text-muted-foreground'
                          }`}
                        >
                          {tradeRequest.seller_completed_at ? (
                            <Check className="size-3" />
                          ) : (
                            '2'
                          )}
                        </span>

                        <span>
                          卖家
                          {tradeRequest.seller_completed_at
                            ? '已确认'
                            : '待确认'}
                        </span>
                      </div>
                    </div>

                    {myCompleted &&
                      !otherCompleted && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          你已经确认完成，正在等待对方确认。
                        </div>
                      )}

                    {!myCompleted &&
                      otherCompleted && (
                        <div className="mt-2 text-xs text-emerald-600">
                          对方已经确认完成，等待你确认。
                        </div>
                      )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={
                        actionLoading ||
                        myCompleted
                      }
                      onClick={() =>
                        void confirmCompletion()
                      }
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading ? (
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
                        actionLoading
                      }
                      onClick={
                        openCancelDialog
                      }
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-red-500/30 px-4 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="size-3.5" />

                      取消这笔交易
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tradeRequest.status ===
              'cancelled' && (
              <div className="mt-5 rounded-lg bg-red-500/10 px-4 py-4">
                <div className="font-medium text-red-600">
                  该交易已由 @
                  {
                    cancelledByName
                  }{' '}
                  取消
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  取消原因：
                  {tradeRequest.cancel_reason ||
                    '未填写'}
                </div>

                {tradeRequest.cancelled_at && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {formatTime(
                      tradeRequest.cancelled_at,
                    )}
                  </div>
                )}
              </div>
            )}

            {tradeRequest.status ===
              'completed' && (
              <div className="mt-5 rounded-lg bg-emerald-500/10 px-4 py-4">
                <div className="flex items-center gap-2 font-medium text-emerald-700">
                  <Check className="size-4" />

                  双方均已确认，本次交易已经完成
                </div>

                {tradeRequest.completed_at && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {formatTime(
                      tradeRequest.completed_at,
                    )}
                  </div>
                )}

                <div className="mt-4 border-t border-emerald-500/20 pt-4">
                  {reviewLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      正在读取你的评价……
                    </div>
                  ) : review ? (
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        你的评价
                      </div>

                      <div className="mt-2 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(
                          (value) => (
                            <Star
                              key={
                                value
                              }
                              className={`size-5 ${
                                value <=
                                review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground/35'
                              }`}
                            />
                          ),
                        )}
                      </div>

                        <div className="mt-2 text-xs text-muted-foreground">
                          已提交 {review.rating} 星评价
                        </div>

                        {review.comment && (
                          <div className="mt-3 rounded-lg border border-border/70 bg-background/60 px-3 py-2.5 text-xs leading-5 text-foreground">
                            {review.comment}
                          </div>
                        )}
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        评价交易对方 @{counterpartName}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        请选择 1–5 星评分，也可以留下简短评价。提交后暂不支持修改。
                      </div>

                     <div className="mt-3 flex flex-col items-start gap-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(
                            (value) => (
                              <button
                                key={
                                  value
                                }
                                type="button"
                                disabled={
                                  reviewSubmitting
                                }
                                onClick={() => {
                                  setSelectedRating(
                                    value,
                                  )
                                  setReviewError(
                                    '',
                                  )
                                }}
                                className="rounded-sm transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label={`${value} 星`}
                              >
                                <Star
                                  className={`size-6 transition-colors ${
                                    value <=
                                    selectedRating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-muted-foreground/40 hover:text-amber-400'
                                  }`}
                                />
                              </button>
                            ),
                          )}
                        </div>

                            <div className="w-full">
                                <textarea
                                  value={reviewComment}
                                  onChange={(event) => {
                                    setReviewComment(
                                      event.target.value,
                                    )
                                    setReviewError('')
                                  }}
                                  disabled={
                                    reviewSubmitting
                                  }
                                  maxLength={100}
                                  rows={2}
                                  placeholder="写一句对本次交易的评价（选填）"
                                  className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-xs leading-5 outline-none transition-colors focus:border-foreground/40 disabled:opacity-60"
                                />

                                <div className="mt-1 text-right text-[10px] text-muted-foreground">
                                  {reviewComment.length}/100
                                </div>
                              </div>

                        <button
                          type="button"
                          disabled={
                            reviewSubmitting ||
                            selectedRating <
                              1
                          }
                          onClick={() =>
                            void submitReview()
                          }
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {reviewSubmitting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Star className="size-3.5" />
                          )}

                          提交评价
                        </button>
                      </div>
                    </div>
                  )}

                  {reviewError && (
                    <div className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-500">
                      {reviewError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {actionError && (
              <div className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-xs text-red-500">
                {
                  actionError
                }
              </div>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex h-[62vh] min-h-130 max-h-190 flex-col">
              <div className="flex-1 overflow-y-auto px-5 py-6">
                {messages.length ===
                0 ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <div className="text-sm font-medium">
                        还没有消息
                      </div>

                      <div className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                        可以在这里和交易对方确认交易时间、地点以及其他细节。
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map(
                      (
                        message,
                      ) => {
                        const isMine =
                          message.sender_id ===
                          currentUserId

                        const senderName =
                          getProfileName(
                            message.sender,
                          )

                        return (
                          <div
                            key={
                              message.id
                            }
                            className={`flex ${
                              isMine
                                ? 'justify-end'
                                : 'justify-start'
                            }`}
                          >
                            <div className="max-w-[82%] sm:max-w-[72%]">
                              {!isMine && (
                                <div className="mb-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
                                  <span>
                                    @
                                    {
                                      senderName
                                    }
                                  </span>

                                  {message
                                    .sender
                                    ?.rsi_verified && (
                                    <BadgeCheck className="size-3 text-blue-500" />
                                  )}
                                </div>
                              )}

                              <div
                                className={`rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                                  isMine
                                    ? 'rounded-br-md bg-foreground text-background'
                                    : 'rounded-bl-md bg-muted text-foreground'
                                }`}
                              >
                                <div className="whitespace-pre-wrap wrap-break-word">
                                  {
                                    message.content
                                  }
                                </div>
                              </div>

                              <div
                                className={`mt-1 px-1 text-[10px] text-muted-foreground ${
                                  isMine
                                    ? 'text-right'
                                    : 'text-left'
                                }`}
                              >
                                {formatTime(
                                  message.created_at,
                                )}

                                {message.edited_at &&
                                  ' · 已编辑'}
                              </div>
                            </div>
                          </div>
                        )
                      },
                    )}

                    <div
                      ref={
                        bottomRef
                      }
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-border bg-background/80 p-4 backdrop-blur">
                {sendError && (
                  <div className="mb-3 rounded-lg bg-red-500/10 px-4 py-2.5 text-xs text-red-500">
                    {
                      sendError
                    }
                  </div>
                )}

                {canSend ? (
                  <>
                    <div className="flex items-end gap-3">
                      <textarea
                        value={
                          content
                        }
                        onChange={(
                          event,
                        ) =>
                          setContent(
                            event.target.value,
                          )
                        }
                        onKeyDown={(
                          event,
                        ) => {
                          if (
                            event.key ===
                              'Enter' &&
                            !event.shiftKey
                          ) {
                            event.preventDefault()

                            void sendMessage()
                          }
                        }}
                        maxLength={
                          2000
                        }
                        rows={1}
                        placeholder="输入交易消息……"
                        className="max-h-36 min-h-12 flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-foreground/40"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          void sendMessage()
                        }
                        disabled={
                          sending ||
                          !content.trim()
                        }
                        className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="发送消息"
                      >
                        {sending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between px-1">
                      <div className="text-[10px] text-muted-foreground">
                        Enter 发送 · Shift
                        + Enter 换行
                      </div>

                      <div className="text-[10px] text-muted-foreground">
                        {
                          content.length
                        }
                        /2000
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg bg-muted px-4 py-3 text-center text-xs text-muted-foreground">
                    {tradeRequest.status ===
                    'cancelled'
                      ? '这笔交易已经取消，会话仅供查看历史记录。'
                      : tradeRequest.status ===
                          'completed'
                        ? '这笔交易已经完成，会话仅供查看历史记录。'
                        : '当前交易状态无法发送消息。'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-[10px] leading-5 text-muted-foreground">
            请仅使用游戏内方式完成交易。StarClub
            不参与交易资金托管，也不会要求任何现实货币付款。
          </div>
        </div>
      </main>

      {cancelDialogOpen && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-background shadow-2xl">
            <div className="border-b border-border px-6 py-5">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                CANCEL TRADE
              </div>

              <h2 className="mt-1 text-xl font-semibold">
                取消这笔交易
              </h2>
            </div>

            <div className="p-6">
              <p className="text-sm leading-6 text-muted-foreground">
                取消后会话将停止发送新消息，但双方仍可以查看历史记录。交易对方也会看到取消人和取消原因。
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
                  placeholder="例如：时间无法协调、临时有事、双方协商取消……"
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
                    actionLoading
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
                    actionLoading ||
                    !cancelReason.trim()
                  }
                  onClick={() =>
                    void confirmCancel()
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading ? (
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