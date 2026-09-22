'use client'

import Link from 'next/link'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  Plus,
  Search,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  MarketListingDialog,
} from '@/components/market-listing-dialog'

import {
  UserVerificationBadges,
} from '@/components/user-verification-badges'

import {
  ARMOR_PARTS,
  ARMOR_WEIGHTS,
  MARKET_CATEGORIES,
  getMarketCategory,
} from '@/lib/market-categories'

type ListingType =
  | 'wts'
  | 'wtb'
  | 'wtt'

type MarketListing = {
  id: string
  seller_id: string
  listing_type: ListingType
  category: string
  subcategory: string | null
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
  closed_at: string | null

  seller_rating_average: number | null
  seller_rating_count: number

  profiles: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    rsi_handle: string | null
    rsi_verified: boolean | null
  } | null
}

const TYPE_OPTIONS = [
  {
    value: 'all',
    label: '全部',
  },
  {
    value: 'wts',
    label: '出售 WTS',
  },
  {
    value: 'wtb',
    label: '求购 WTB',
  },
  {
    value: 'wtt',
    label: '交换 WTT',
  },
]

const LISTING_TYPE_UI: Record<
  ListingType,
  {
    label: string
    className: string
  }
> = {
  wts: {
    label: '出售 WTS',
    className:
      'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },

  wtb: {
    label: '求购 WTB',
    className:
      'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },

  wtt: {
    label: '交换 WTT',
    className:
      'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-400',
  },
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

export default function MarketPage() {
  const [
    listings,
    setListings,
  ] =
    useState<MarketListing[]>(
      [],
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    listingType,
    setListingType,
  ] =
    useState('all')

  const [
    category,
    setCategory,
  ] =
    useState('all')

  const [
    subcategory,
    setSubcategory,
  ] =
    useState('all')

  const [
    armorPart,
    setArmorPart,
  ] =
    useState('all')

  const [
    armorWeight,
    setArmorWeight,
  ] =
    useState('all')

  const [
    searchInput,
    setSearchInput,
  ] =
    useState('')

  const [
    search,
    setSearch,
  ] =
    useState('')

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    listingDialogOpen,
    setListingDialogOpen,
  ] =
    useState(false)

  const [
    publishSuccess,
    setPublishSuccess,
  ] =
    useState(false)

  const [
    tradeNotificationCount,
    setTradeNotificationCount,
  ] =
    useState(0)

  const [
    page,
    setPage,
  ] =
    useState(1)

  const [
    totalPages,
    setTotalPages,
  ] =
    useState(1)

  const [
    totalListings,
    setTotalListings,
  ] =
    useState(0)

  const [
    pageInput,
    setPageInput,
  ] =
    useState('')

  const marketSectionRef =
    useRef<HTMLElement | null>(
      null,
    )

  const selectedCategory =
    category === 'all'
      ? null
      : getMarketCategory(
          category,
        )

  const loadListings =
    useCallback(
      async () => {
        setLoading(true)
        setError('')

        try {
          const params =
            new URLSearchParams()

          params.set(
            'page',
            String(page),
          )

          if (
            listingType !==
            'all'
          ) {
            params.set(
              'listingType',
              listingType,
            )
          }

          if (
            category !==
            'all'
          ) {
            params.set(
              'category',
              category,
            )
          }

          if (
            category !==
              'armor' &&
            subcategory !==
              'all'
          ) {
            params.set(
              'subcategory',
              subcategory,
            )
          }

          if (
            category ===
            'armor'
          ) {
            if (
              armorPart !==
                'all' &&
              armorWeight !==
                'all'
            ) {
              params.set(
                'subcategory',
                `${armorPart}-${armorWeight}`,
              )
            } else if (
              armorPart ===
              'undersuit'
            ) {
              params.set(
                'subcategory',
                'undersuit',
              )
            } else if (
              armorPart ===
              'other'
            ) {
              params.set(
                'subcategory',
                'other',
              )
            }

            if (
              armorPart !==
              'all'
            ) {
              params.set(
                'armorPart',
                armorPart,
              )
            }

            if (
              armorWeight !==
              'all'
            ) {
              params.set(
                'armorWeight',
                armorWeight,
              )
            }
          }

          if (search) {
            params.set(
              'search',
              search,
            )
          }

          const response =
            await fetch(
              `/api/market/listings?${params.toString()}`,
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
                '读取市场失败',
            )
          }

          const nextListings =
            Array.isArray(
              data.listings,
            )
              ? data.listings
              : []

          const nextTotalPages =
            Number.isSafeInteger(
              data.totalPages,
            ) &&
            data.totalPages > 0
              ? data.totalPages
              : 1

          const nextTotalListings =
            Number.isSafeInteger(
              data.total,
            ) &&
            data.total >= 0
              ? data.total
              : 0

          setListings(
            nextListings,
          )

          setTotalPages(
            nextTotalPages,
          )

          setTotalListings(
            nextTotalListings,
          )

          if (
            page >
            nextTotalPages
          ) {
            setPage(
              nextTotalPages,
            )
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : '读取市场失败',
          )
        } finally {
          setLoading(false)
        }
      },
      [
        listingType,
        category,
        subcategory,
        armorPart,
        armorWeight,
        search,
        page,
      ],
    )

  useEffect(() => {
    void loadListings()
  }, [loadListings])

  useEffect(() => {
  let cancelled = false

  async function loadTradeNotifications() {
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
        if (!cancelled) {
          setTradeNotificationCount(0)
        }

        return
      }

      const response =
        await fetch(
          '/api/market/notifications',
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
            cache:
              'no-store',
          },
        )

      const data =
        await readJsonSafely(
          response,
        )

      if (
        !response.ok ||
        cancelled
      ) {
        return
      }

      setTradeNotificationCount(
        Number.isSafeInteger(
          data.total,
        )
          ? data.total
          : 0,
      )
    } catch (error) {
      console.error(
        'Failed to load market notifications:',
        error,
      )
    }
  }

  void loadTradeNotifications()

  const interval =
    window.setInterval(() => {
      void loadTradeNotifications()
    }, 30000)

  return () => {
    cancelled = true
    window.clearInterval(
      interval,
    )
  }
}, [])

  useEffect(() => {
  if (!publishSuccess) {
    return
  }

  const timer =
    window.setTimeout(() => {
      setPublishSuccess(false)
    }, 1800)

  return () => {
    window.clearTimeout(timer)
  }
}, [publishSuccess])

  function scrollToMarket() {
    window.setTimeout(
      () => {
        marketSectionRef.current?.scrollIntoView(
          {
            behavior:
              'smooth',
            block:
              'start',
          },
        )
      },
      50,
    )
  }

  function goToPage(
    targetPage: number,
  ) {
    const nextPage =
      Math.min(
        totalPages,
        Math.max(
          1,
          targetPage,
        ),
      )

    if (
      nextPage === page
    ) {
      return
    }

    setPage(nextPage)
    scrollToMarket()
  }

  function submitSearch(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setSearch(
      searchInput.trim(),
    )

    setPage(1)
  }

  function changeCategory(
    nextCategory: string,
  ) {
    setCategory(
      nextCategory,
    )

    setSubcategory(
      'all',
    )

    setArmorPart(
      'all',
    )

    setArmorWeight(
      'all',
    )

    setPage(1)
  }

  const visiblePages =
    Array.from(
      {
        length:
          totalPages,
      },
      (
        _,
        index,
      ) =>
        index + 1,
    ).filter(
      (
        pageNumber,
      ) =>
        pageNumber === 1 ||
        pageNumber ===
          totalPages ||
        Math.abs(
          pageNumber -
            page,
        ) <= 2,
    )

  return (
    <>
      <main className="min-h-screen bg-background">
        <section className="border-b border-border/60 bg-linear-to-b from-muted/15 to-transparent">
          <div className="mx-auto max-w-7xl px-6 pb-10 pt-28 lg:px-8">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <div>
                  <div className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    STARCLUB MARKET
                  </div>

                  <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                    星际酒馆市场
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                    面向酒馆玩家的游戏内物品交易信息与撮合平台。
                    发布出售、求购或交换信息，与其他玩家直接完成游戏内交易。
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/market/trades"
                    className="relative inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <span>
                      我的交易
                    </span>

                    {tradeNotificationCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold leading-none text-white shadow-sm">
                        {tradeNotificationCount > 99
                          ? '99+'
                          : tradeNotificationCount}
                      </span>
                    )}
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      setListingDialogOpen(
                        true,
                      )
                    }
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md"
                  >
                    <Plus className="size-4" />
                    发布交易
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-border/50 bg-card/75 shadow-[0_1px_2px_rgba(0,0,0,0.025)] backdrop-blur-sm">
                <div className="p-4 md:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <form
                      onSubmit={
                        submitSearch
                      }
                      className="relative min-w-0 flex-1"
                    >
                      <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                      <input
                        value={
                          searchInput
                        }
                        onChange={(
                          event,
                        ) =>
                          setSearchInput(
                            event.target.value,
                          )
                        }
                        placeholder="搜索物品、装备或飞船……"
                        className="h-11 w-full rounded-xl border border-border/60 bg-background/80 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-foreground/30 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.03)]"
                      />
                    </form>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex flex-wrap gap-1 rounded-xl border border-border/50 bg-muted/30 p-1">
                        {TYPE_OPTIONS.map(
                          (
                            option,
                          ) => (
                            <button
                              key={
                                option.value
                              }
                              type="button"
                              onClick={() => {
                                setListingType(
                                  option.value,
                                )

                                setPage(1)
                              }}
                              className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                                listingType ===
                                option.value
                                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                                  : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                              }`}
                            >
                              {
                                option.label
                              }
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 px-4 pt-4 md:px-5">
                  <div className="flex gap-5 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() =>
                        changeCategory(
                          'all',
                        )
                      }
                      className={`shrink-0 border-b-2 pb-3 text-sm transition-colors ${
                        category ===
                        'all'
                          ? 'border-foreground font-semibold text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      全部
                    </button>

                    {MARKET_CATEGORIES.map(
                      (
                        option,
                      ) => (
                        <button
                          key={
                            option.code
                          }
                          type="button"
                          onClick={() =>
                            changeCategory(
                              option.code,
                            )
                          }
                          className={`shrink-0 border-b-2 pb-3 text-sm transition-colors ${
                            category ===
                            option.code
                              ? 'border-foreground font-semibold text-foreground'
                              : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span>
                            {
                              option.nameZh
                            }
                          </span>

                          <span className="ml-1.5 text-[9px] font-normal uppercase tracking-[0.08em] text-muted-foreground/55">
                            {
                              option.nameEn
                            }
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {category !==
                  'all' &&
                  category !==
                    'armor' &&
                  selectedCategory && (
                    <div className="border-t border-border/40 bg-muted/10 px-4 py-4 md:px-5">
                      <div className="mb-2.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/55">
                        Subcategory
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSubcategory(
                              'all',
                            )
                            setPage(1)
                          }}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                            subcategory ===
                            'all'
                              ? 'border-foreground bg-foreground text-background shadow-sm'
                              : 'border-border/60 bg-background/60 text-muted-foreground hover:border-foreground/15 hover:text-foreground'
                          }`}
                        >
                          全部
                        </button>

                        {selectedCategory.subcategories.map(
                          (
                            option,
                          ) => (
                            <button
                              key={
                                option.code
                              }
                              type="button"
                              onClick={() => {
                                setSubcategory(
                                  option.code,
                                )
                                setPage(1)
                              }}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                subcategory ===
                                option.code
                                  ? 'border-foreground bg-foreground text-background shadow-sm'
                                  : 'border-border/60 bg-background/60 text-muted-foreground hover:border-foreground/15 hover:text-foreground'
                              }`}
                            >
                              <span>
                                {
                                  option.nameZh
                                }
                              </span>

                              <span className="ml-1 text-[9px] font-normal text-muted-foreground/55">
                                {
                                  option.nameEn
                                }
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {category ===
                  'armor' && (
                  <div className="space-y-4 border-t border-border/40 bg-muted/10 px-4 py-4 md:px-5">
                    <div>
                      <div className="mb-2.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/55">
                        Armor Part
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setArmorPart(
                              'all',
                            )
                            setArmorWeight(
                              'all',
                            )
                            setPage(1)
                          }}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                            armorPart ===
                            'all'
                              ? 'border-foreground bg-foreground text-background shadow-sm'
                              : 'border-border/60 bg-background/60 text-muted-foreground hover:border-foreground/15 hover:text-foreground'
                          }`}
                        >
                          全部
                        </button>

                        {ARMOR_PARTS.map(
                          (
                            part,
                          ) => (
                            <button
                              key={
                                part.code
                              }
                              type="button"
                              onClick={() => {
                                setArmorPart(
                                  part.code,
                                )

                                if (
                                  !part.hasWeight
                                ) {
                                  setArmorWeight(
                                    'all',
                                  )
                                }

                                setPage(1)
                              }}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                armorPart ===
                                part.code
                                  ? 'border-foreground bg-foreground text-background shadow-sm'
                                  : 'border-border/60 bg-background/60 text-muted-foreground hover:border-foreground/15 hover:text-foreground'
                              }`}
                            >
                              <span>
                                {
                                  part.nameZh
                                }
                              </span>

                              <span className="ml-1 text-[9px] font-normal text-muted-foreground/55">
                                {
                                  part.nameEn
                                }
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    {armorPart !==
                      'undersuit' &&
                      armorPart !==
                        'other' && (
                        <div>
                          <div className="mb-2.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/55">
                            Armor Weight
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setArmorWeight(
                                  'all',
                                )
                                setPage(1)
                              }}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                armorWeight ===
                                'all'
                                  ? 'border-foreground bg-foreground text-background shadow-sm'
                                  : 'border-border/60 bg-background/60 text-muted-foreground hover:border-foreground/15 hover:text-foreground'
                              }`}
                            >
                              全部
                            </button>

                            {ARMOR_WEIGHTS.map(
                              (
                                weight,
                              ) => (
                                <button
                                  key={
                                    weight.code
                                  }
                                  type="button"
                                  onClick={() => {
                                    setArmorWeight(
                                      weight.code,
                                    )
                                    setPage(1)
                                  }}
                                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                    armorWeight ===
                                    weight.code
                                      ? 'border-foreground bg-foreground text-background shadow-sm'
                                      : 'border-border/60 bg-background/60 text-muted-foreground hover:border-foreground/15 hover:text-foreground'
                                  }`}
                                >
                                  <span>
                                    {
                                      weight.nameZh
                                    }
                                  </span>

                                  <span className="ml-1 text-[9px] font-normal text-muted-foreground/55">
                                    {
                                      weight.nameEn
                                    }
                                  </span>
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          ref={
            marketSectionRef
          }
          className="scroll-mt-24 mx-auto max-w-7xl px-6 py-10 lg:px-8"
        >
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({
                length: 12,
              }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-border/50 bg-card"
                >
                  <div className="aspect-4/3 animate-pulse bg-muted" />

                  <div className="flex min-h-49 flex-col p-4">
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />

                      <div className="h-3 w-5 animate-pulse rounded bg-muted" />
                    </div>

                    <div className="mt-4 flex-1">
                      <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />

                      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-muted" />

                      <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-muted" />

                      <div className="mt-4 h-3 w-3/5 animate-pulse rounded bg-muted" />
                    </div>

                    <div className="-mx-4 -mb-4 mt-4 flex min-h-11 items-center gap-2 border-t border-border/50 bg-muted/20 px-4 py-3">
                      <div className="size-6 animate-pulse rounded-full bg-muted" />

                      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-24 text-center text-sm text-red-500">
              {error}
            </div>
          ) : listings.length ===
            0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/10 px-6 py-24 text-center">
              <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-border/50 bg-background shadow-sm">
                <PackageSearch className="size-6 text-muted-foreground" />
              </div>

              <h2 className="text-lg font-semibold tracking-tight">
                暂无符合条件的交易
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                可以调整筛选条件重新查找，或者发布一条新的交易信息。
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {(listingType !== 'all' ||
                  category !== 'all' ||
                  search) && (
                  <button
                    type="button"
                    onClick={() => {
                      setListingType('all')
                      setCategory('all')
                      setSubcategory('all')
                      setArmorPart('all')
                      setArmorWeight('all')
                      setSearchInput('')
                      setSearch('')
                      setPage(1)
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-border/60 bg-background px-4 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    清除筛选
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setListingDialogOpen(
                      true,
                    )
                  }
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-90"
                >
                  <Plus className="size-3.5" />
                  发布交易
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {listings.map(
                  (
                    listing,
                  ) => {
                    const isClosed =
                      Boolean(
                        listing.closed_at,
                      )

                    const closedLabel =
                      listing.listing_type ===
                      'wts'
                        ? '已售罄'
                        : '已结束'

                    const typeUI =
                      LISTING_TYPE_UI[
                        listing.listing_type
                      ]

                    return (
                      <Link
                        key={
                          listing.id
                        }
                        href={`/market/${listing.id}`}
                        className={`group flex h-full flex-col overflow-hidden rounded-[20px] border border-border/55 bg-card shadow-[0_2px_8px_rgba(0,0,0,0.035)] transition-[transform,box-shadow,border-color] duration-300 ease-out ${
                          isClosed
                            ? 'opacity-60'
                            : 'hover:-translate-y-1 hover:border-[#b87300]/25 hover:shadow-[0_16px_40px_rgba(0,0,0,0.09)] dark:hover:border-[#d89b43]/25 dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.22)]'
                        }`}
                      >
                        <div className="relative aspect-4/3 overflow-hidden bg-muted shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
                          {isClosed && (
                            <div className="absolute right-2.5 top-2.5 z-20 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur-md">
                              {
                                closedLabel
                              }
                            </div>
                          )}

                          {listing
                            .image_urls
                            ?.length >
                          0 ? (
                            <img
                              src={
                                listing
                                  .image_urls[0]
                              }
                              alt={
                                listing.title
                              }
                              className={`h-full w-full object-cover transition-transform duration-700 ease-out ${
                                isClosed
                                  ? 'grayscale'
                                  : 'group-hover:scale-[1.035]'
                              }`}
                            />
                          ) : (
                            <div
                              className={`flex h-full items-center justify-center text-[11px] text-muted-foreground ${
                                isClosed
                                  ? 'grayscale'
                                  : ''
                              }`}
                            >
                              暂无图片
                            </div>
                          )}

                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-black/12 to-transparent" />
                        </div>

                        <div className="flex min-h-49 flex-1 flex-col p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.04em] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] ${
                                typeUI.className
                              }`}
                            >
                              {typeUI.label}
                            </span>

                            <span className="text-[11px] font-medium tabular-nums text-muted-foreground/80">
                              ×{listing.quantity}
                            </span>
                          </div>

                          <div className="mt-3.5 flex-1">
                            <h2 className="line-clamp-2 min-h-11 text-[15px] font-bold leading-[1.45] tracking-[-0.015em] text-foreground">
                              {listing.title}
                            </h2>

                              <div className="mt-2.5">
                                {listing.listing_type ===
                                'wtt' ? (
                                  <span className="text-[14px] font-semibold tracking-[-0.02em] text-[#9a671f] dark:text-[#e3ad5c]">
                                    交换
                                  </span>
                                ) : listing.price_uec ===
                                  null ? (
                                  <span className="text-[14px] font-semibold tracking-[-0.02em] text-[#9a671f] dark:text-[#e3ad5c]">
                                    面议
                                  </span>
                                ) : (
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-[17px] font-bold tabular-nums tracking-tight text-[#ad6b0b] dark:text-[#e3ad5c]">
                                      {listing.price_uec.toLocaleString()}
                                    </span>

                                    <span className="text-[9px] font-semibold uppercase tracking-widest text-[#ad6b0b]/55 dark:text-[#e3ad5c]/65">
                                      aUEC
                                    </span>
                                  </div>
                                )}
                              </div>

                            <div className="mt-3 min-h-5">
                              {(listing.location ||
                                listing.quality !==
                                  null) && (
                                <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground/80">
                                  {listing.location && (
                                    <span className="max-w-31.25 truncate">
                                      {listing.location}
                                    </span>
                                  )}

                                  {listing.location &&
                                    listing.quality !==
                                      null && (
                                      <span className="opacity-35">
                                        ·
                                      </span>
                                    )}

                                  {listing.quality !==
                                    null && (
                                    <span>
                                      品质{' '}
                                      {listing.quality}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="-mx-4 -mb-4 mt-4 flex h-12 items-center gap-2 border-t border-border/40 bg-muted/[0.14] px-4 transition-colors group-hover:bg-muted/25">
                            {listing.profiles
                              ?.avatar_url ? (
                              <img
                                src={
                                  listing.profiles
                                    .avatar_url
                                }
                                alt=""
                                className="size-6 shrink-0 rounded-full object-cover ring-1 ring-border/70 shadow-sm"
                              />
                            ) : (
                              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[8px] font-semibold text-muted-foreground ring-1 ring-border/80">
                                SC
                              </div>
                            )}

                                <span
                                  title={
                                    listing.profiles?.rsi_handle
                                      ? `@${listing.profiles.rsi_handle}`
                                      : listing.profiles?.display_name ??
                                        listing.profiles?.username ??
                                        'StarClub 玩家'
                                  }
                                  className="min-w-0 flex-1 truncate text-[10px] font-medium leading-none text-muted-foreground"
                                >
                                  {listing.profiles?.rsi_handle
                                    ? `@${listing.profiles.rsi_handle}`
                                    : listing.profiles?.display_name ??
                                      listing.profiles?.username ??
                                      'StarClub 玩家'}
                                </span>

                                <div className="flex shrink-0 items-center justify-center">
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

                                  {listing.seller_rating_count > 0 &&
                                    listing.seller_rating_average !== null && (
                                      <div className="ml-auto flex h-5 shrink-0 items-center gap-1 leading-none">
                                        <span className="flex h-4 items-center text-[11px] leading-none text-amber-500">
                                          ★
                                        </span>

                                        <span className="flex h-4 items-center text-[10px] font-semibold tabular-nums leading-none text-foreground/80">
                                          {listing.seller_rating_average.toFixed(
                                            1,
                                          )}
                                        </span>

                                        <span className="flex h-4 items-center text-[9px] tabular-nums leading-none text-muted-foreground/60">
                                          ({listing.seller_rating_count})
                                        </span>
                                      </div>
                                    )}

                          </div>
                        </div>
                      </Link>
                    )
                  },
                )}
              </div>

              <div className="mt-12 flex flex-col gap-5 rounded-2xl border border-border/50 bg-card/60 px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] lg:flex-row lg:items-center lg:justify-between">
                <div className="text-xs text-muted-foreground">
                  共{' '}
                  {totalListings.toLocaleString()}
                  {' '}条交易

                  <span className="mx-2">
                    ·
                  </span>

                  第 {page} /{' '}
                  {totalPages} 页
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      page <= 1 ||
                      loading
                    }
                    onClick={() =>
                      goToPage(
                        page - 1,
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-full border border-border/60 bg-background/70 px-3 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="size-3.5" />
                    上一页
                  </button>

                  {visiblePages.map(
                    (
                      pageNumber,
                      index,
                    ) => {
                      const previous =
                        visiblePages[
                          index - 1
                        ]

                      return (
                        <div
                          key={
                            pageNumber
                          }
                          className="flex items-center gap-2"
                        >
                          {previous &&
                            pageNumber -
                              previous >
                              1 && (
                              <span className="px-1 text-xs text-muted-foreground">
                                …
                              </span>
                            )}

                          <button
                            type="button"
                            disabled={
                              loading
                            }
                            onClick={() =>
                              goToPage(
                                pageNumber,
                              )
                            }
                            className={`flex size-9 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                              page ===
                              pageNumber
                                ? 'bg-foreground text-background'
                                : 'border border-border/60 bg-background/70 hover:bg-muted'
                            }`}
                          >
                            {
                              pageNumber
                            }
                          </button>
                        </div>
                      )
                    },
                  )}

                  <button
                    type="button"
                    disabled={
                      page >=
                        totalPages ||
                      loading
                    }
                    onClick={() =>
                      goToPage(
                        page + 1,
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-full border border-border/60 bg-background/70 px-3 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    下一页
                    <ChevronRight className="size-3.5" />
                  </button>

                  {totalPages >
                    1 && (
                    <div className="ml-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        跳至
                      </span>

                      <input
                        value={
                          pageInput
                        }
                        onChange={(
                          event,
                        ) =>
                          setPageInput(
                            event.target.value.replace(
                              /\D/g,
                              '',
                            ),
                          )
                        }
                        onKeyDown={(
                          event,
                        ) => {
                          if (
                            event.key !==
                            'Enter'
                          ) {
                            return
                          }

                          const target =
                            Number(
                              pageInput,
                            )

                          if (
                            !Number.isSafeInteger(
                              target,
                            ) ||
                            target < 1 ||
                            target >
                              totalPages
                          ) {
                            return
                          }

                          goToPage(
                            target,
                          )

                          setPageInput(
                            '',
                          )
                        }}
                        inputMode="numeric"
                        aria-label="跳转页码"
                        className="h-9 w-14 rounded-lg border border-border/60 bg-background px-2 text-center text-xs outline-none transition-colors focus:border-foreground/30"
                      />

                      <span className="text-xs text-muted-foreground">
                        页
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      <MarketListingDialog
        open={
          listingDialogOpen
        }
        onClose={() =>
          setListingDialogOpen(
            false,
          )
        }
        onCreated={() => {
          setListingDialogOpen(false)

          setPublishSuccess(true)

          if (page === 1) {
            void loadListings()
          } else {
            setPage(1)
          }

          window.setTimeout(() => {
            marketSectionRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }, 150)
        }}
      />
          {publishSuccess && (
      <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/10 px-4 backdrop-blur-[2px]">
        <div className="animate-in fade-in zoom-in-95 w-full max-w-xs rounded-2xl border border-border/60 bg-background p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.16)] duration-200">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-emerald-500/10">
            <Check className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>

          <h2 className="mt-4 text-base font-semibold">
            交易发布成功
          </h2>

          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            你的交易信息已成功发布到星际酒馆市场
          </p>
        </div>
      </div>
    )}
    </>
  )
}