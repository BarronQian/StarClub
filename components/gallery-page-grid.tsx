'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { cn } from '@/lib/utils'
import { GalleryLightbox } from '@/components/gallery-lightbox'
import { GalleryMosaic } from '@/components/gallery-mosaic'

import {
  GALLERY_CATEGORY_LABEL,
  getSortedGallery,
  getUsedGalleryCategories,
  groupGalleryByMonth,
  type GalleryCategory,
  type GallerySort,
  type GalleryShot,
} from '@/lib/gallery'

const SORTS: {
  key: GallerySort
  label: string
}[] = [
  {
    key: 'latest',
    label: '最新发布',
  },
  {
    key: 'popular',
    label: '热门作品',
  },
]

type GalleryLikeChangedDetail = {
  galleryId: number
  liked: boolean
  likeCount: number
}

const GALLERY_LIKE_CHANGED_EVENT =
  'gallery-like-changed'

function TimelineRail({
  groups,
  activeKey,
  onSelect,
}: {
  groups: {
    key: string
    year: string
    month: string
  }[]
  activeKey: string | null
  onSelect: (
    key: string,
  ) => void
}) {
  if (
    groups.length === 0
  ) {
    return null
  }

  return (
    <nav
      aria-label="按发布时间导航"
      className="flex flex-col gap-1 border-l border-border pl-5"
    >
      {groups.map(
        (group) => {
          const active =
            group.key ===
            activeKey

          return (
            <button
              key={
                group.key
              }
              type="button"
              onClick={() =>
                onSelect(
                  group.key,
                )
              }
              className={cn(
                'flex items-center gap-2 py-1.5 text-left font-display text-[0.62rem] tracking-[0.18em] transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'h-px w-5 transition-colors',
                  active
                    ? 'bg-primary'
                    : 'bg-border',
                )}
              />

              {
                group.year
              }
              .
              {
                group.month
              }
            </button>
          )
        },
      )}
    </nav>
  )
}

export function GalleryPageGrid({
  shots,
}: {
  shots: GalleryShot[]
}) {
  /*
   * 本地作品数据。
   *
   * 初始数据来自服务器，
   * 后续真实点赞变化会同步更新这里。
   */
  const [
    liveShots,
    setLiveShots,
  ] =
    useState<GalleryShot[]>(
      shots,
    )

  const [
    filter,
    setFilter,
  ] =
    useState<
      GalleryCategory | 'all'
    >('all')

  const [
    sort,
    setSort,
  ] =
    useState<GallerySort>(
      'latest',
    )

  const [
    openIndex,
    setOpenIndex,
  ] =
    useState<
      number | null
    >(null)

  const [
    activeKey,
    setActiveKey,
  ] =
    useState<
      string | null
    >(null)

  const sectionRefs =
    useRef<
      Map<
        string,
        HTMLDivElement
      >
    >(
      new Map(),
    )

  /*
   * 如果服务器传入新的 shots，
   * 同步更新本地数据。
   */
  useEffect(() => {
    setLiveShots(
      shots,
    )
  }, [
    shots,
  ])

  /*
   * 接收 GalleryMosaic /
   * GalleryLightbox 的真实点赞变化。
   *
   * 更新 GalleryPageGrid 自己的数据，
   * 这样“热门作品”排序会立即使用最新点赞数。
   */
  useEffect(() => {
    function handleLikeChanged(
      event: Event,
    ) {
      const customEvent =
        event as CustomEvent<GalleryLikeChangedDetail>

      const detail =
        customEvent.detail

      if (
        !detail
      ) {
        return
      }

      setLiveShots(
        (
          previous,
        ) =>
          previous.map(
            (
              shot,
            ) => {
              if (
                shot.id !==
                detail.galleryId
              ) {
                return shot
              }

              return {
                ...shot,

                likes:
                  detail.likeCount,
              }
            },
          ),
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

  const filters =
    useMemo(() => {
      const categories =
        getUsedGalleryCategories(
          liveShots,
        )

      return [
        {
          key:
            'all' as const,

          label:
            '全部',
        },

        ...categories.map(
          (
            key,
          ) => ({
            key,

            label:
              GALLERY_CATEGORY_LABEL[
                key
              ],
          }),
        ),
      ]
    }, [
      liveShots,
    ])

  /*
   * 分类 + 排序
   *
   * 现在 popular 使用的是
   * liveShots 中实时更新后的 likes。
   */
  const filtered =
    useMemo(() => {
      const base =
        filter ===
        'all'
          ? liveShots
          : liveShots.filter(
              (
                shot,
              ) =>
                shot.category ===
                filter,
            )

      return getSortedGallery(
        base,
        sort,
      )
    }, [
      liveShots,
      filter,
      sort,
    ])

  const groups =
    useMemo(
      () =>
        groupGalleryByMonth(
          filtered,
        ),
      [
        filtered,
      ],
    )

  useEffect(() => {
    if (
      groups.length >
      0
    ) {
      setActiveKey(
        groups[0].key,
      )
    }
  }, [
    groups,
  ])

  useEffect(() => {
    const nodes =
      Array.from(
        sectionRefs.current.values(),
      )

    if (
      nodes.length ===
      0
    ) {
      return
    }

    const observer =
      new IntersectionObserver(
        (
          entries,
        ) => {
          const visible =
            entries.filter(
              (
                entry,
              ) =>
                entry.isIntersecting,
            )

          if (
            visible.length ===
            0
          ) {
            return
          }

          const top =
            visible.reduce(
              (
                a,
                b,
              ) =>
                a.intersectionRatio >
                b.intersectionRatio
                  ? a
                  : b,
            )

          const key =
            top.target.getAttribute(
              'data-key',
            )

          if (
            key
          ) {
            setActiveKey(
              key,
            )
          }
        },
        {
          threshold:
            0.2,

          rootMargin:
            '-20% 0px -60% 0px',
        },
      )

    nodes.forEach(
      (
        node,
      ) =>
        observer.observe(
          node,
        ),
    )

    return () =>
      observer.disconnect()
  }, [
    groups,
  ])

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="影廊分类筛选"
          className="flex flex-wrap gap-2"
        >
          {filters.map(
            (
              item,
            ) => {
              const active =
                item.key ===
                filter

              return (
                <button
                  key={
                    item.key
                  }
                  type="button"
                  role="tab"
                  aria-selected={
                    active
                  }
                  onClick={() => {
                    setFilter(
                      item.key,
                    )

                    setOpenIndex(
                      null,
                    )
                  }}
                  className={cn(
                    'pill border px-5 py-2.5 font-display text-[0.72rem] tracking-[0.18em] transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                  )}
                >
                  {
                    item.label
                  }
                </button>
              )
            },
          )}
        </div>

        <div
          role="tablist"
          aria-label="排序方式"
          className="flex shrink-0 gap-4 border-l border-border pl-5"
        >
          {SORTS.map(
            (
              item,
            ) => {
              const active =
                item.key ===
                sort

              return (
                <button
                  key={
                    item.key
                  }
                  type="button"
                  role="tab"
                  aria-selected={
                    active
                  }
                  onClick={() => {
                    setSort(
                      item.key,
                    )

                    setOpenIndex(
                      null,
                    )
                  }}
                  className={cn(
                    'font-display text-[0.72rem] tracking-[0.18em] transition-colors',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {
                    item.label
                  }
                </button>
              )
            },
          )}
        </div>
      </div>

      {filtered.length >
      0 ? (
        <div className="mt-10 flex gap-10">
          <div className="hidden w-30 flex-none lg:block">
            <div className="sticky top-28">
              <TimelineRail
                groups={
                  groups
                }
                activeKey={
                  activeKey
                }
                onSelect={(
                  key,
                ) => {
                  sectionRefs.current
                    .get(
                      key,
                    )
                    ?.scrollIntoView(
                      {
                        block:
                          'start',

                        behavior:
                          'smooth',
                      },
                    )
                }}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {groups.map(
              (
                group,
              ) => (
                <div
                  key={
                    group.key
                  }
                  data-key={
                    group.key
                  }
                  ref={(
                    node,
                  ) => {
                    if (
                      node
                    ) {
                      sectionRefs.current.set(
                        group.key,
                        node,
                      )
                    } else {
                      sectionRefs.current.delete(
                        group.key,
                      )
                    }
                  }}
                  className="scroll-mt-28 pb-10"
                >
                  <p className="mb-5 font-display text-[0.7rem] tracking-[0.32em] text-foreground">
                    {
                      group.year
                    }

                    <span className="text-muted-foreground">
                      {' '}
                      /{' '}
                    </span>

                    {
                      group.month
                    }
                  </p>

                  <GalleryMosaic
                    shots={
                      group.shots
                    }
                    onOpen={(
                      shot,
                    ) =>
                      setOpenIndex(
                        filtered.findIndex(
                          (
                            item,
                          ) =>
                            item.id ===
                            shot.id,
                        ),
                      )
                    }
                  />
                </div>
              ),
            )}
          </div>
        </div>
      ) : (
        <p className="mt-14 text-center text-sm text-muted-foreground">
          该分类下暂无作品。
        </p>
      )}

      {openIndex !==
      null ? (
        <GalleryLightbox
          shots={
            filtered
          }
          index={
            openIndex
          }
          onClose={() =>
            setOpenIndex(
              null,
            )
          }
          onNavigate={(
            offset,
          ) =>
            setOpenIndex(
              (
                current,
              ) => {
                if (
                  current ===
                  null
                ) {
                  return current
                }

                const next =
                  (current +
                    offset +
                    filtered.length) %
                  filtered.length

                return next
              },
            )
          }
        />
      ) : null}
    </div>
  )
}