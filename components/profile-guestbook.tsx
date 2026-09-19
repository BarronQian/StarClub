'use client'

import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import { Clock3, Trash2, X } from 'lucide-react'

import { getSupabaseBrowser } from '@/lib/supabase-browser'

type GuestbookMessage = {
  id: string
  content: string
  createdAt: string
  canDelete: boolean
  author: {
    id: string
    username: string | null
    displayName: string | null
    starCitizenHandle: string | null
    avatarUrl: string | null
    profileSlug: string | null
    memberNumber: number | null
  }
}

type ProfileGuestbookProps = {
  profileSlug: string
  isOwner?: boolean
}

export function ProfileGuestbook({
  profileSlug,
  isOwner = false,
}: ProfileGuestbookProps) {
  const [messages, setMessages] =
    useState<GuestbookMessage[]>([])

  const [
  showAllMessages,
  setShowAllMessages,
] = useState(false)

const MESSAGES_PREVIEW_LIMIT = 10

  const [content, setContent] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [userLoggedIn, setUserLoggedIn] =
    useState(false)

  const [rsiVerified, setRsiVerified] =
    useState(false)

  const [cooldownUntil, setCooldownUntil] =
    useState<string | null>(null)

  const getAccessToken =
    useCallback(async () => {
      const supabase =
        getSupabaseBrowser()

      const {
        data: { session },
      } =
        await supabase.auth.getSession()

      return session?.access_token ?? null
    }, [])

  const loadViewer =
    useCallback(async () => {
      const supabase =
        getSupabaseBrowser()

      const {
        data: { user },
      } =
        await supabase.auth.getUser()

      if (!user) {
        setUserLoggedIn(false)
        setRsiVerified(false)
        return
      }

      setUserLoggedIn(true)

      const { data } = await supabase
        .from('profiles')
        .select(`
          rsi_verified,
          star_citizen_handle
        `)
        .eq('id', user.id)
        .maybeSingle()

      setRsiVerified(
        Boolean(
          data?.rsi_verified &&
            data?.star_citizen_handle
        )
      )
    }, [])

  const loadMessages =
    useCallback(async () => {
      try {
        setLoading(true)

        const token =
          await getAccessToken()

        const response = await fetch(
          `/api/profile/${encodeURIComponent(
            profileSlug
          )}/guestbook`,
          {
            cache: 'no-store',
            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : undefined,
          }
        )

        if (!response.ok) {
          throw new Error(
            'Failed to load guestbook'
          )
        }

        const data =
          await response.json()

        setMessages(
          Array.isArray(data.messages)
            ? data.messages
            : []
        )
      } catch (error) {
        console.error(
          'Failed to load guestbook:',
          error
        )
      } finally {
        setLoading(false)
      }
    }, [
      getAccessToken,
      profileSlug,
    ])

  useEffect(() => {
    loadViewer()
    loadMessages()
  }, [
    loadViewer,
    loadMessages,
  ])

  useEffect(() => {
    if (!cooldownUntil) return

    const previousBodyOverflow =
      document.body.style.overflow

    const previousHtmlOverflow =
      document.documentElement.style.overflow

    document.body.style.overflow =
      'hidden'

    document.documentElement.style.overflow =
      'hidden'

    return () => {
      document.body.style.overflow =
        previousBodyOverflow

      document.documentElement.style.overflow =
        previousHtmlOverflow
    }
  }, [cooldownUntil])

  const handleSubmit = async () => {
    const trimmed =
      content.trim()

    if (!trimmed) return

    if (trimmed.length > 200) {
      alert('留言最多 200 字。')
      return
    }

    try {
      setSubmitting(true)

      const token =
        await getAccessToken()

      if (!token) {
        alert('请先登录。')
        return
      }

      const response = await fetch(
        `/api/profile/${encodeURIComponent(
          profileSlug
        )}/guestbook`,
        {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type':
              'application/json',
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: trimmed,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        if (
          response.status === 429 &&
          data.nextAvailable
        ) {
          setCooldownUntil(
            data.nextAvailable
          )

          return
        }

        alert(
          data.error ||
            '留言失败。'
        )

        return
      }

      setContent('')

      await loadMessages()
    } catch (error) {
      console.error(
        'Failed to submit guestbook message:',
        error
      )

      alert(
        '留言失败，请稍后再试。'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (
    messageId: string
  ) => {
    if (
      !window.confirm(
        '确定删除这条留言吗？'
      )
    ) {
      return
    }

    try {
      const token =
        await getAccessToken()

      if (!token) return

      const response = await fetch(
        `/api/profile/${encodeURIComponent(
          profileSlug
        )}/guestbook?messageId=${encodeURIComponent(
          messageId
        )}`,
        {
          method: 'DELETE',
          cache: 'no-store',
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        alert(
          data.error ||
            '删除失败。'
        )

        return
      }

      setMessages((current) =>
        current.filter(
          (message) =>
            message.id !== messageId
        )
      )
    } catch (error) {
      console.error(
        'Failed to delete guestbook message:',
        error
      )

      alert(
        '删除失败，请稍后再试。'
      )
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-border bg-white p-5 transition-colors dark:border-white/8 dark:bg-[#37332f]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">
            访客留言
          </h2>

          <span className="text-xs text-muted-foreground">
            {messages.length}
          </span>
        </div>

        {!isOwner && (
          <div className="mt-5">
            {!userLoggedIn ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center dark:border-white/10 dark:bg-white/2">
                <p className="text-xs text-muted-foreground">
                  登录后可以留下访客留言
                </p>
              </div>
            ) : !rsiVerified ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center dark:border-white/10 dark:bg-white/2">
                <p className="text-xs text-muted-foreground">
                  完成 RSI Handle 认证后即可留言
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-neutral-50/60 p-4 transition-colors dark:border-white/10 dark:bg-white/4">
                <textarea
                  value={content}
                  onChange={(event) =>
                    setContent(
                      event.target.value.slice(
                        0,
                        200
                      )
                    )
                  }
                  placeholder="留下一句话……"
                  rows={3}
                  className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {content.length} / 200
                  </span>

                  <button
                    type="button"
                    disabled={
                      submitting ||
                      !content.trim()
                    }
                    onClick={
                      handleSubmit
                    }
                    className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting
                      ? '留言中...'
                      : '留言'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-5">
          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              正在加载留言...
            </div>
          ) : messages.length > 0 ? (
            <div className="divide-y divide-border dark:divide-white/8">
            {messages
              .slice(
                0,
                showAllMessages
                  ? messages.length
                  : MESSAGES_PREVIEW_LIMIT,
              )
              .map(
                (message) => {
                  const authorId =
                    message.author
                      .profileSlug &&
                    message.author
                      .memberNumber !==
                      null &&
                    message.author
                      .memberNumber !==
                      undefined
                      ? `${
                          message.author
                            .profileSlug
                        }#${String(
                          message.author
                            .memberNumber
                        ).padStart(
                          4,
                          '0'
                        )}`
                      : null

                  const authorHref =
                    message.author
                      .profileSlug
                      ? `/profile/${encodeURIComponent(
                          message.author
                            .profileSlug
                        )}`
                      : null

                  const authorName =
                    message.author
                      .starCitizenHandle ||
                    message.author
                      .displayName ||
                    message.author
                      .profileSlug ||
                    'StarClub 用户'

                  return (
                    <article
                      key={message.id}
                      className="py-5 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3">
                        {authorHref ? (
                          <Link
                            href={
                              authorHref
                            }
                            className="shrink-0"
                          >
                            {message.author
                              .avatarUrl ? (
                              <img
                                src={
                                  message
                                    .author
                                    .avatarUrl
                                }
                                alt={
                                  authorName
                                }
                                className="size-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="size-10 rounded-full bg-neutral-100 dark:bg-white/10" />
                            )}
                          </Link>
                        ) : message.author
                            .avatarUrl ? (
                          <img
                            src={
                              message
                                .author
                                .avatarUrl
                            }
                            alt={
                              authorName
                            }
                            className="size-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="size-10 shrink-0 rounded-full bg-neutral-100 dark:bg-white/10" />
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              {authorHref ? (
                                <Link
                                  href={
                                    authorHref
                                  }
                                  className="block truncate text-sm font-medium transition-colors hover:text-[#a66700]"
                                >
                                  {
                                    authorName
                                  }
                                </Link>
                              ) : (
                                <p className="truncate text-sm font-medium">
                                  {
                                    authorName
                                  }
                                </p>
                              )}

                              {authorId && (
                                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                  @
                                  {
                                    authorId
                                  }
                                </p>
                              )}
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <time className="text-[10px] text-muted-foreground">
                                {new Date(
                                  message.createdAt
                                ).toLocaleDateString(
                                  'zh-CN',
                                  {
                                    year:
                                      'numeric',
                                    month:
                                      'numeric',
                                    day:
                                      'numeric',
                                  }
                                )}
                              </time>

                              {message.canDelete && (
                                <button
                                  type="button"
                                  title="删除留言"
                                  onClick={() =>
                                    handleDelete(
                                      message.id
                                    )
                                  }
                                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-red-600 dark:hover:bg-white/10 dark:hover:text-red-400"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-foreground/85">
                            {
                              message.content
                            }
                          </p>
                        </div>
                      </div>
                    </article>
                  )
                }
              )}
                            {messages.length >
                MESSAGES_PREVIEW_LIMIT && (
                <div className="flex justify-center border-t border-border pt-4 dark:border-white/8">
                  <button
                    type="button"
                    onClick={() =>
                      setShowAllMessages(
                        (current) =>
                          !current,
                      )
                    }
                    className="text-xs font-medium text-[#a66700] transition-colors hover:text-[#8f5900]"
                  >
                    {showAllMessages
                      ? '收起'
                      : `查看更多留言（${messages.length - MESSAGES_PREVIEW_LIMIT}）`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border dark:border-white/10 dark:bg-white/2">
              <p className="text-xs text-muted-foreground">
                暂无访客留言
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 7 天留言冷却弹窗 */}
      {cooldownUntil && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-black/25 px-4 backdrop-blur-sm dark:bg-black/45"
          onClick={() =>
            setCooldownUntil(null)
          }
        >
          <div
            className="relative w-full max-w-sm rounded-3xl border border-black/10 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.20)] transition-colors dark:border-white/10 dark:bg-[#37332f] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              onClick={() =>
                setCooldownUntil(null)
              }
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
              aria-label="关闭"
            >
              <X className="size-4" />
            </button>

            <div className="flex size-11 items-center justify-center rounded-full bg-[#b87300]/10 text-[#a66700]">
              <Clock3 className="size-5" />
            </div>

            <p className="mt-5 font-display text-[10px] tracking-[0.22em] text-[#a66700]">
              GUESTBOOK COOLDOWN
            </p>

            <h3 className="mt-2 text-xl font-semibold tracking-tight">
              留言冷却中
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              每位用户每 7
              天只能给同一个主页留言一次。
            </p>

            <div className="mt-5 rounded-2xl border border-border bg-[#f8f7f4] px-4 py-4 transition-colors dark:border-white/8 dark:bg-white/4">
              <p className="text-xs text-muted-foreground">
                下次可留言时间
              </p>

              <p className="mt-1.5 text-sm font-medium text-foreground">
                {new Date(
                  cooldownUntil
                ).toLocaleString(
                  'zh-CN',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute:
                      '2-digit',
                  }
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setCooldownUntil(null)
              }
              className="mt-6 w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-85"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </>
  )
}