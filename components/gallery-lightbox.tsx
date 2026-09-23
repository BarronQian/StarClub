'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  X,
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

import { cn } from '@/lib/utils'
import {
  getDisplayAuthor,
  type GalleryShot,
} from '@/lib/gallery'

type GalleryLightboxProps = {
  shots: GalleryShot[]
  index: number
  onClose: () => void
  onNavigate: (
    offset: number,
  ) => void
}

type LikeState = {
  liked: boolean
  likeCount: number
  loading: boolean
}

type GalleryLikeChangedDetail = {
  galleryId: number
  liked: boolean
  likeCount: number
}

const GALLERY_LIKE_CHANGED_EVENT =
  'gallery-like-changed'

let browserSupabase:
  | ReturnType<
      typeof createClient
    >
  | null = null

function getBrowserSupabase() {
  if (browserSupabase) {
    return browserSupabase
  }

  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const anonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !supabaseUrl ||
    !anonKey
  ) {
    return null
  }

  browserSupabase =
    createClient(
      supabaseUrl,
      anonKey,
    )

  return browserSupabase
}

function broadcastLikeChange(
  detail: GalleryLikeChangedDetail,
) {
  window.dispatchEvent(
    new CustomEvent<GalleryLikeChangedDetail>(
      GALLERY_LIKE_CHANGED_EVENT,
      {
        detail,
      },
    ),
  )
}

function AuthorLinks({
  shot,
}: {
  shot: GalleryShot
}) {
  const displayAuthor =
    getDisplayAuthor(shot)

  return (
    <div className="flex items-center gap-2">
      {shot.profileSlug ? (
        <Link
          href={`/profile/${encodeURIComponent(
            shot.profileSlug,
          )}`}
          onClick={(event) =>
            event.stopPropagation()
          }
          className="font-display text-[0.6rem] tracking-[0.2em] text-muted-foreground/70 transition-colors hover:text-primary"
        >
          {displayAuthor}
        </Link>
      ) : (
        <span className="font-display text-[0.6rem] tracking-[0.2em] text-muted-foreground/70">
          {displayAuthor}
        </span>
      )}

      {shot.authorUrl ? (
        <a
          href={shot.authorUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) =>
            event.stopPropagation()
          }
          aria-label={`打开 ${displayAuthor} 的外部主页`}
          title="作者外部主页"
          className="inline-flex items-center text-muted-foreground/60 transition-colors hover:text-primary"
        >
          <ExternalLink
            className="size-3.5"
            strokeWidth={1.6}
          />
        </a>
      ) : null}
    </div>
  )
}

export function GalleryLightbox({
  shots,
  index,
  onClose,
  onNavigate,
}: GalleryLightboxProps) {
  const shot =
    shots[index]

  const hasMultiple =
    shots.length > 1

  const [
    likeState,
    setLikeState,
  ] =
    useState<LikeState>({
      liked: false,
      likeCount: 0,
      loading: false,
    })

  const goPrev =
    useCallback(
      () =>
        onNavigate(-1),
      [onNavigate],
    )

  const goNext =
    useCallback(
      () =>
        onNavigate(1),
      [onNavigate],
    )

  /*
   * 键盘操作 + 页面滚动锁定
   */
  useEffect(() => {
    function onKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        'Escape'
      ) {
        onClose()
      }

      if (
        event.key ===
        'ArrowLeft'
      ) {
        goPrev()
      }

      if (
        event.key ===
        'ArrowRight'
      ) {
        goNext()
      }
    }

    document.addEventListener(
      'keydown',
      onKeyDown,
    )

    const previousOverflow =
      document.body.style
        .overflow

    document.body.style.overflow =
      'hidden'

    return () => {
      document.removeEventListener(
        'keydown',
        onKeyDown,
      )

      document.body.style.overflow =
        previousOverflow
    }
  }, [
    onClose,
    goPrev,
    goNext,
  ])

  /*
   * 接收其他影廊组件广播的点赞变化。
   *
   * 下一步 GalleryMosaic 也会使用
   * 同一个事件。
   */
  useEffect(() => {
    if (
      !shot ||
      shot.id ===
        undefined
    ) {
      return
    }

    function handleLikeChanged(
      event: Event,
    ) {
      const customEvent =
        event as CustomEvent<GalleryLikeChangedDetail>

      const detail =
        customEvent.detail

      if (
        !detail ||
        detail.galleryId !==
          shot.id
      ) {
        return
      }

      setLikeState({
        liked:
          detail.liked,

        likeCount:
          detail.likeCount,

        loading:
          false,
      })
    }

    window.addEventListener(
      GALLERY_LIKE_CHANGED_EVENT,
      handleLikeChanged,
    )

    return () => {
      window.removeEventListener(
        GALLERY_LIKE_CHANGED_EVENT,
        handleLikeChanged,
      )
    }
  }, [
    shot?.id,
  ])

  /*
   * 每次切换作品时，
   * 从服务器读取真实点赞状态。
   */
  useEffect(() => {
    if (
      !shot ||
      shot.id === undefined
    ) {
      setLikeState({
        liked: false,
        likeCount: 0,
        loading: false,
      })

      return
    }

    const galleryId =
      shot.id

    let cancelled =
      false

    /*
     * 切换图片时先使用服务端传来的
     * 已知点赞数，避免短暂显示 0。
     */
    setLikeState({
      liked: false,
      likeCount:
        shot.likes ?? 0,
      loading: false,
    })

    async function loadLikeState() {
      try {
        const supabase =
          getBrowserSupabase()

        let accessToken:
          | string
          | undefined

        if (supabase) {
          const {
            data,
          } =
            await supabase.auth.getSession()

          accessToken =
            data.session
              ?.access_token
        }

        const response =
          await fetch(
            `/api/gallery/${galleryId}/like`,
            {
              method:
                'GET',

              headers:
                accessToken
                  ? {
                      Authorization: `Bearer ${accessToken}`,
                    }
                  : undefined,

              cache:
                'no-store',
            },
          )

        if (
          !response.ok
        ) {
          return
        }

        const data =
          await response.json()

        if (cancelled) {
          return
        }

        const nextState = {
          liked:
            Boolean(
              data.liked,
            ),

          likeCount:
            Number(
              data.likeCount ??
                0,
            ),

          loading:
            false,
        }

        setLikeState(
          nextState,
        )

        /*
         * 服务器读取到最新状态后
         * 同样广播出去。
         */
        broadcastLikeChange({
          galleryId,

          liked:
            nextState.liked,

          likeCount:
            nextState.likeCount,
        })
      } catch (
        error
      ) {
        console.error(
          'Failed to load gallery like state:',
          error,
        )
      }
    }

    void loadLikeState()

    return () => {
      cancelled =
        true
    }
  }, [
    shot?.id,
  ])

  async function toggleLike() {
    if (
      !shot ||
      shot.id ===
        undefined ||
      likeState.loading
    ) {
      return
    }

    setLikeState(
      (
        previous,
      ) => ({
        ...previous,
        loading: true,
      }),
    )

    try {
      const supabase =
        getBrowserSupabase()

      if (!supabase) {
        window.alert(
          '登录服务暂时不可用',
        )

        return
      }

      const {
        data,
      } =
        await supabase.auth.getSession()

      const accessToken =
        data.session
          ?.access_token

      if (
        !accessToken
      ) {
        window.alert(
          '请先登录后再点赞',
        )

        return
      }

      const response =
        await fetch(
          `/api/gallery/${shot.id}/like`,
          {
            method:
              'POST',

            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )

      const result =
        await response.json()

      if (
        !response.ok
      ) {
        window.alert(
          result.error ??
            '点赞失败',
        )

        return
      }

      const nextState = {
        liked:
          Boolean(
            result.liked,
          ),

        likeCount:
          Number(
            result.likeCount ??
              0,
          ),

        loading:
          false,
      }

      /*
       * 更新当前 Lightbox。
       */
      setLikeState(
        nextState,
      )

      /*
       * 广播给 GalleryMosaic
       * 以及其他可能显示该作品的组件。
       */
      broadcastLikeChange({
        galleryId:
          shot.id,

        liked:
          nextState.liked,

        likeCount:
          nextState.likeCount,
      })
    } catch (
      error
    ) {
      console.error(
        'Failed to toggle gallery like:',
        error,
      )

      window.alert(
        '点赞失败，请稍后再试',
      )
    } finally {
      setLikeState(
        (
          previous,
        ) => ({
          ...previous,
          loading:
            false,
        }),
      )
    }
  }

  if (!shot) {
    return null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        shot.caption
      }
      className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm"
    >
      <button
        type="button"
        aria-label="关闭大图"
        onClick={
          onClose
        }
        className="absolute inset-0 cursor-zoom-out"
      />

      <header className="relative z-10 flex items-center justify-between gap-4 border-b border-border/60 px-5 py-4">
        <p className="font-display text-[0.6rem] tracking-[0.28em] text-muted-foreground">
          {String(
            index + 1,
          ).padStart(
            2,
            '0',
          )}{' '}
          /{' '}
          {String(
            shots.length,
          ).padStart(
            2,
            '0',
          )}
        </p>

        <button
          type="button"
          onClick={
            onClose
          }
          aria-label="关闭大图"
          className="pill flex items-center gap-2 border border-border px-4 py-2 font-display text-[0.6rem] tracking-[0.28em] text-foreground transition-colors hover:bg-card"
        >
          <X
            className="size-3.5"
            strokeWidth={
              1.6
            }
            aria-hidden="true"
          />

          关闭
        </button>
      </header>

      <div className="pointer-events-none relative z-10 flex flex-1 items-center justify-center overflow-auto p-4 sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            shot.displaySrc ??
            shot.src ??
            '/placeholder.svg'
          }
          alt={
            shot.alt
          }
          width={
            shot.width
          }
          height={
            shot.height
          }
          className="pointer-events-auto max-h-full w-auto max-w-full object-contain"
          style={{
            aspectRatio:
              shot.aspectRatio,
          }}
        />
      </div>

      {hasMultiple ? (
        <>
          <button
            type="button"
            onClick={
              goPrev
            }
            aria-label="上一张"
            className="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:bg-card sm:left-6"
          >
            <ChevronLeft
              className="size-5"
              strokeWidth={
                1.6
              }
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={
              goNext
            }
            aria-label="下一张"
            className="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:bg-card sm:right-6"
          >
            <ChevronRight
              className="size-5"
              strokeWidth={
                1.6
              }
              aria-hidden="true"
            />
          </button>
        </>
      ) : null}

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-sm font-medium tracking-[0.12em] text-foreground">
            {
              shot.caption
            }
          </p>

          <span
            aria-hidden="true"
            className="text-border"
          >
            /
          </span>

          <p className="text-[0.68rem] tracking-widest text-muted-foreground/80">
            {
              shot.publishedAt
            }
          </p>

          {shot.id !==
          undefined ? (
            <button
              type="button"
              onClick={
                toggleLike
              }
              disabled={
                likeState.loading
              }
              aria-pressed={
                likeState.liked
              }
              aria-label={
                likeState.liked
                  ? '取消喜欢'
                  : '喜欢这张作品'
              }
              className={cn(
                'flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary',
                likeState.liked &&
                  'border-primary/50 text-primary',
                likeState.loading &&
                  'cursor-wait opacity-60',
              )}
            >
              <Heart
                className={cn(
                  'size-3.5',
                  likeState.liked &&
                    'fill-primary text-primary',
                )}
                strokeWidth={
                  1.6
                }
              />

              <span className="font-display text-[0.62rem] tracking-[0.08em]">
                {
                  likeState.likeCount
                }
              </span>
            </button>
          ) : null}
        </div>

        <AuthorLinks
          shot={shot}
        />
      </footer>
    </div>
  )
}