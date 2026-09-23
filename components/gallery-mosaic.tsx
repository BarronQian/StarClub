'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ExternalLink,
  Heart,
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

import { cn } from '@/lib/utils'
import {
  GALLERY_CATEGORY_LABEL,
  type GalleryShot,
} from '@/lib/gallery'

const GAP = 10
const DESKTOP_TARGET_HEIGHT = 320
const TABLET_TARGET_HEIGHT = 220
const MAX_LAST_ROW_HEIGHT_RATIO = 1.25
const MOBILE_BREAKPOINT = 640
const TABLET_BREAKPOINT = 1024

type MosaicRow = {
  shots: GalleryShot[]
  height: number
  fillWidth: boolean
}

type LikeState = {
  liked: boolean
  likeCount: number
  loading?: boolean
}

type GalleryLikeChangedDetail = {
  galleryId: number
  liked: boolean
  likeCount: number
}

const GALLERY_LIKE_CHANGED_EVENT =
  'gallery-like-changed'

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

let browserSupabase:
  | ReturnType<typeof createClient>
  | null = null

function getBrowserSupabase() {
  if (browserSupabase) {
    return browserSupabase
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

function computeJustifiedRows(
  shots: GalleryShot[],
  containerWidth: number,
  targetHeight: number,
  gap: number,
): MosaicRow[] {
  if (
    containerWidth <= 0 ||
    shots.length === 0
  ) {
    return []
  }

  const rows: MosaicRow[] = []

  let current: GalleryShot[] =
    []

  let aspectSum = 0

  for (const shot of shots) {
    current.push(shot)

    aspectSum +=
      shot.aspectRatio

    const widthAtTarget =
      aspectSum *
        targetHeight +
      (current.length - 1) *
        gap

    if (
      widthAtTarget >=
      containerWidth
    ) {
      const availableWidth =
        containerWidth -
        (current.length - 1) *
          gap

      rows.push({
        shots: current,
        height:
          availableWidth /
          aspectSum,
        fillWidth: true,
      })

      current = []
      aspectSum = 0
    }
  }

  if (
    current.length > 0
  ) {
    const availableWidth =
      containerWidth -
      (current.length - 1) *
        gap

    const naturalHeight =
      availableWidth /
      aspectSum

    if (
      naturalHeight >
      targetHeight *
        MAX_LAST_ROW_HEIGHT_RATIO
    ) {
      rows.push({
        shots: current,
        height:
          targetHeight,
        fillWidth: false,
      })
    } else {
      rows.push({
        shots: current,
        height:
          naturalHeight,
        fillWidth: true,
      })
    }
  }

  return rows
}

function AuthorLinks({
  shot,
}: {
  shot: GalleryShot
}) {
  const hasProfile =
    Boolean(
      shot.profileSlug,
    )

  const hasExternal =
    Boolean(
      shot.authorUrl,
    )

  return (
    <div className="flex items-center gap-1.5">
      {hasProfile ? (
        <Link
          href={`/profile/${encodeURIComponent(
            shot.profileSlug!,
          )}`}
          onClick={(event) =>
            event.stopPropagation()
          }
          className="font-display text-[0.6rem] tracking-[0.12em] text-white/75 transition-colors hover:text-primary"
        >
          {shot.author}
        </Link>
      ) : (
        <span className="font-display text-[0.6rem] tracking-[0.12em] text-white/75">
          {shot.author}
        </span>
      )}

      {hasExternal ? (
        <a
          href={shot.authorUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) =>
            event.stopPropagation()
          }
          aria-label={`打开 ${shot.author} 的个人主页`}
          title="作者个人主页"
          className="inline-flex items-center text-white/55 transition-colors hover:text-primary"
        >
          <ExternalLink
            className="size-3"
            strokeWidth={1.6}
          />
        </a>
      ) : null}
    </div>
  )
}

function MosaicItem({
  shot,
  likeState,
  onToggleLike,
  onOpen,
  style,
}: {
  shot: GalleryShot
  likeState: LikeState
  onToggleLike: () => void
  onOpen: () => void
  style: React.CSSProperties
}) {
  return (
    <div
      style={style}
      className="relative"
    >
      <figure className="group relative block h-full w-full overflow-hidden border border-border bg-card">
        <button
          type="button"
          onClick={onOpen}
          className="absolute inset-0 z-10"
          aria-label={`查看大图：${shot.caption}`}
        />

        <Image
          src={
            shot.thumbnailSrc ??
            shot.src
          }
          alt={shot.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 32vw"
          className="object-cover"
          unoptimized
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/85 via-background/0 to-background/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between gap-2 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="pill self-start border border-border/60 bg-background/80 px-2 py-1 font-display text-[0.55rem] tracking-[0.18em] text-foreground backdrop-blur">
            {
              GALLERY_CATEGORY_LABEL[
                shot.category
              ]
            }
          </span>

          <div className="absolute bottom-3 left-3 right-20 flex flex-col items-start gap-0.5">
            <span className="text-xs font-medium text-white sm:text-sm">
              《{shot.caption}》
            </span>

            <div className="pointer-events-auto">
              <AuthorLinks
                shot={shot}
              />
            </div>
          </div>
        </div>

        {shot.id !==
        undefined ? (
          <button
            type="button"
            disabled={
              likeState.loading
            }
            onClick={(
              event,
            ) => {
              event.stopPropagation()

              onToggleLike()
            }}
            aria-pressed={
              likeState.liked
            }
            aria-label={
              likeState.liked
                ? '取消喜欢'
                : '喜欢这张作品'
            }
            className={cn(
              'absolute bottom-3 right-3 z-30 flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100 focus-visible:opacity-100',
              likeState.loading &&
                'cursor-wait opacity-70',
            )}
          >
            <Heart
              className={cn(
                'size-3 transition-colors',
                likeState.liked
                  ? 'fill-primary text-primary'
                  : 'text-foreground',
              )}
              strokeWidth={
                1.6
              }
            />

            <span className="font-display text-[0.58rem] tracking-[0.06em] text-foreground">
              {
                likeState.likeCount
              }
            </span>
          </button>
        ) : null}
      </figure>
    </div>
  )
}

export function GalleryMosaic({
  shots,
  onOpen,
}: {
  shots: GalleryShot[]
  onOpen: (
    shot: GalleryShot,
  ) => void
}) {
  const containerRef =
    useRef<HTMLDivElement>(
      null,
    )

  const [
    width,
    setWidth,
  ] =
    useState(0)

  const [
    likeStates,
    setLikeStates,
  ] =
    useState<
      Record<
        number,
        LikeState
      >
    >({})

  useEffect(() => {
    const initial:
      Record<
        number,
        LikeState
      > = {}

    for (
      const shot of shots
    ) {
      if (
        shot.id ===
        undefined
      ) {
        continue
      }

      initial[shot.id] = {
        liked: false,
        likeCount:
          shot.likes ?? 0,
      }
    }

    setLikeStates(
      initial,
    )

    let cancelled =
      false

async function loadLikeStates() {
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

  /*
   * 未登录用户直接使用
   * Gallery 服务端已经传下来的点赞数。
   */
  if (!accessToken) {
    return
  }

  /*
   * 一次收集当前 Mosaic
   * 所有有效作品 ID。
   */
  const galleryIds =
    shots
      .map(
        (shot) =>
          shot.id,
      )
      .filter(
        (
          id,
        ): id is number =>
          id !==
          undefined,
      )

  if (
    galleryIds.length ===
    0
  ) {
    return
  }

  try {
    /*
     * 一次请求读取当前用户
     * 对所有作品的点赞状态。
     */
    const response =
      await fetch(
        '/api/gallery/likes',
        {
          method:
            'POST',

          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              galleryIds,
            }),

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

    const likedIds =
      new Set<number>(
        Array.isArray(
          data.likedIds,
        )
          ? data.likedIds.map(
              (
                id: unknown,
              ) =>
                Number(id),
            )
          : [],
      )

    /*
     * 一次性更新所有作品状态。
     *
     * 点赞总数继续使用
     * Gallery 数据里的 shot.likes，
     * 这里只更新当前用户是否点赞。
     */
    setLikeStates(
      (previous) => {
        const next = {
          ...previous,
        }

        for (
          const shot of shots
        ) {
          if (
            shot.id ===
            undefined
          ) {
            continue
          }

          next[shot.id] = {
            liked:
              likedIds.has(
                shot.id,
              ),

            likeCount:
              previous[
                shot.id
              ]?.likeCount ??
              shot.likes ??
              0,

            loading:
              false,
          }
        }

        return next
      },
    )
  } catch {
    /*
     * 请求失败时保留
     * 服务端传下来的初始点赞数。
     */
  }
}

    void loadLikeStates()

    return () => {
      cancelled = true
    }
  }, [shots])

  useEffect(() => {
      function handleLikeChanged(
        event: Event,
      ) {
        const customEvent =
          event as CustomEvent<GalleryLikeChangedDetail>

        const detail =
          customEvent.detail

        if (!detail) {
          return
        }

        setLikeStates(
          (
            previous,
          ) => ({
            ...previous,

            [detail.galleryId]: {
              liked:
                detail.liked,

              likeCount:
                detail.likeCount,

              loading:
                false,
            },
          }),
        )
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
    }, [])

  useEffect(() => {
    const element =
      containerRef.current

    if (!element) {
      return
    }

    const updateWidth =
      () => {
        const next =
          Math.round(
            element.getBoundingClientRect()
              .width,
          )

        setWidth(
          (
            previous,
          ) => {
            if (
              Math.abs(
                previous -
                  next,
              ) < 4
            ) {
              return previous
            }

            return next
          },
        )
      }

    updateWidth()

    window.addEventListener(
      'resize',
      updateWidth,
    )

    return () => {
      window.removeEventListener(
        'resize',
        updateWidth,
      )
    }
  }, [])

  async function toggleLike(
    shot: GalleryShot,
  ) {
                          console.log(
                        'LIKE DEBUG:',
                        {
                          id: shot.id,
                          idType: typeof shot.id,
                          caption: shot.caption,
                          requestUrl: `/api/gallery/${shot.id}/like`,
                        },
                      )
    if (
      shot.id ===
      undefined
    ) {
      return
    }

    const current =
      likeStates[
        shot.id
      ] ?? {
        liked: false,
        likeCount:
          shot.likes ?? 0,
      }

    if (
      current.loading
    ) {
      return
    }

    setLikeStates(
      (
        previous,
      ) => ({
        ...previous,

        [shot.id!]: {
          ...current,
          loading: true,
        },
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

      setLikeStates(
        (
          previous,
        ) => ({
          ...previous,

          [shot.id!]:
            nextState,
        }),
      )

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
      setLikeStates(
        (
          previous,
        ) => {
          const state =
            previous[
              shot.id!
            ]

          if (!state) {
            return previous
          }

          return {
            ...previous,

            [shot.id!]: {
              ...state,
              loading:
                false,
            },
          }
        },
      )
    }
  }

  const isMobile =
    width > 0 &&
    width <
      MOBILE_BREAKPOINT

  const targetHeight =
    width <
    TABLET_BREAKPOINT
      ? TABLET_TARGET_HEIGHT
      : DESKTOP_TARGET_HEIGHT

  const rows =
    !isMobile &&
    width > 0
      ? computeJustifiedRows(
          shots,
          width,
          targetHeight,
          GAP,
        )
      : []

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{
        overflowAnchor:
          'none',
      }}
    >
      {width === 0 ? (
        <div
          style={{
            height:
              shots.length *
              70,
          }}
          aria-hidden="true"
        />
      ) : isMobile ? (
        <div className="flex flex-col gap-3">
          {shots.map(
            (shot) => {
              const state =
                shot.id !==
                undefined
                  ? likeStates[
                      shot.id
                    ] ?? {
                      liked:
                        false,
                      likeCount:
                        shot.likes ??
                        0,
                    }
                  : {
                      liked:
                        false,
                      likeCount:
                        shot.likes ??
                        0,
                    }

              return (
                <MosaicItem
                  key={
                    shot.id ??
                    shot.src
                  }
                  shot={
                    shot
                  }
                  likeState={
                    state
                  }
                  onToggleLike={() =>
                    toggleLike(
                      shot,
                    )
                  }
                  onOpen={() =>
                    onOpen(
                      shot,
                    )
                  }
                  style={{
                    width:
                      '100%',
                    aspectRatio:
                      shot.aspectRatio,
                  }}
                />
              )
            },
          )}
        </div>
      ) : (
        <div
          className="flex flex-col"
          style={{
            gap: GAP,
          }}
        >
          {rows.map(
            (
              row,
              rowIndex,
            ) => (
              <div
                key={
                  rowIndex
                }
                className="flex"
                style={{
                  height:
                    row.height,

                  gap:
                    GAP,

                  justifyContent:
                    row.fillWidth
                      ? 'stretch'
                      : 'flex-start',
                }}
              >
                {row.shots.map(
                  (
                    shot,
                  ) => {
                    const state =
                      shot.id !==
                      undefined
                        ? likeStates[
                            shot.id
                          ] ?? {
                            liked:
                              false,
                            likeCount:
                              shot.likes ??
                              0,
                          }
                        : {
                            liked:
                              false,
                            likeCount:
                              shot.likes ??
                              0,
                          }

                    return (
                      <MosaicItem
                        key={
                          shot.id ??
                          shot.src
                        }
                        shot={
                          shot
                        }
                        likeState={
                          state
                        }
                        onToggleLike={() =>
                          toggleLike(
                            shot,
                          )
                        }
                        onOpen={() =>
                          onOpen(
                            shot,
                          )
                        }
                        style={
                          row.fillWidth
                            ? {
                                flexGrow:
                                  shot.aspectRatio,

                                flexShrink:
                                  1,

                                flexBasis:
                                  0,

                                minWidth:
                                  0,

                                height:
                                  '100%',
                              }
                            : {
                                flexGrow:
                                  0,

                                flexShrink:
                                  0,

                                width:
                                  row.height *
                                  shot.aspectRatio,

                                height:
                                  '100%',
                              }
                        }
                      />
                    )
                  },
                )}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  )
}
