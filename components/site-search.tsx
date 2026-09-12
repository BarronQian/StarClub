'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, X, ArrowRight } from 'lucide-react'

const SEARCH_ITEMS = [
  { title: '关于我们', href: '/about', category: '页面' },
  { title: '社区活动', href: '/events', category: '页面' },
  { title: '合影档案', href: '/archive', category: '页面' },
  { title: '中文攻略', href: '/guides', category: '页面' },
  { title: '实用工具', href: '/tools', category: '页面' },
  { title: '玩家影廊', href: '/gallery', category: '页面' },
  { title: '名人堂', href: '/hall-of-fame', category: '页面' },

  {
    title: '星际公民特色护甲图鉴',
    href: '/guides/armor-codex',
    category: '攻略',
  },
  {
    title: '星际公民全舰船总览图',
    href: '/guides/star-citizen-fleet-overview',
    category: '攻略',
  },

  {
    title: '行政机库计时器',
    href: '/tools/executive-hangar',
    category: '工具',
  },
  {
    title: 'Discord 时间戳生成器',
    href: '/tools/discord-timestamp',
    category: '工具',
  },
  {
    title: '货运利润计算器',
    href: '/tools/cargo-profit',
    category: '工具',
  },
]

const QUICK_LINKS = [
  { title: '查看社区活动', href: '/events' },
  { title: '浏览中文攻略', href: '/guides' },
  { title: '打开实用工具', href: '/tools' },
  { title: '浏览玩家影廊', href: '/gallery' },
  { title: '查看合影档案', href: '/archive' },
]

export function SiteSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    if (!keyword) return []

    return SEARCH_ITEMS.filter((item) =>
      `${item.title} ${item.category}`
        .toLowerCase()
        .includes(keyword)
    )
  }, [query])

  const closeSearch = () => {
    setOpen(false)
    setQuery('')
  }

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSearch()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
        aria-label="搜索网站"
        title="搜索"
      >
        <Search className="size-4" />
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-18 z-200">
          {/* 页面背景模糊层 */}
          <button
            type="button"
            aria-label="关闭搜索"
            onClick={closeSearch}
            className="absolute inset-0 bg-white/35 backdrop-blur-[10px]"
          />

          {/* Apple 风格顶部搜索区域 */}
          <div className="relative border-b border-black/6 bg-[#f5f5f7]/98 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
            <div className="mx-auto w-full max-w-188 px-6 pb-12 pt-10 sm:px-8 lg:pb-14 lg:pt-12">

              {/* 搜索框 */}
              <div className="flex items-center gap-3">
                <Search
                  className="size-5 shrink-0 text-foreground/45"
                  strokeWidth={1.8}
                />

                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索 starclubsc.com"
                  className="min-w-0 flex-1 bg-transparent text-2xl font-medium tracking-tight text-foreground outline-none placeholder:text-foreground/40 sm:text-[1.75rem]"
                />

                <button
                  type="button"
                  onClick={closeSearch}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-black/5 hover:text-foreground"
                  aria-label="关闭搜索"
                >
                  <X className="size-4.5" />
                </button>
              </div>

              {/* 空搜索时：快捷入口 */}
              {!query.trim() && (
                <div className="mt-8">
                  <p className="mb-3 text-xs font-medium text-foreground/45">
                    快速链接
                  </p>

                  <div className="flex flex-col">
                    {QUICK_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeSearch}
                        className="group flex items-center gap-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
                      >
                        <ArrowRight
                          className="size-3 text-foreground/35 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                          strokeWidth={1.8}
                        />
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 输入关键词后的结果 */}
              {query.trim() && (
                <div className="mt-8">
                  <p className="mb-3 text-xs font-medium text-foreground/45">
                    搜索结果
                  </p>

                  {results.length > 0 ? (
                    <div className="flex flex-col">
                      {results.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeSearch}
                          className="group flex items-center justify-between border-b border-black/5 py-3.5 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <ArrowRight
                              className="size-3.5 text-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                              strokeWidth={1.7}
                            />

                            <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                              {item.title}
                            </span>
                          </div>

                          <span className="text-xs text-foreground/35">
                            {item.category}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-sm text-foreground/45">
                      没有找到与「{query}」相关的内容
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}