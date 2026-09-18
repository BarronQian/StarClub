'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DISCORD_URL, EXTERNAL } from '@/lib/links'
import { GUIDE_TAGS, type GuideCategory } from '@/lib/guides'
import { ARCHIVE } from '@/lib/archive'
import { SiteSearch } from '@/components/site-search'
import { HeaderUserAuth } from '@/components/header-user-auth'

const NAV_LINKS = [
  { key: 'about', href: '/#about', label: '关于我们', en: 'ABOUT' },
  { key: 'community', href: '/community', label: '社区', en: 'COMMUNITY' },
  { key: 'events', href: '/events', label: '活动', en: 'EVENTS' },
  {
  key: 'archive',
  href: '/archive',
  label: '合影',
  en: 'ARCHIVE',
  children: [
    { label: '全部合影', href: '/archive' },
    {
      label: '社区大型集体合影',
      href: '/archive/community',
    },
    {
      label: '酒馆自定义集体活动合影',
      href: '/archive/starclub-original',
    },
    {
      label: '沙盒副本集体合影',
      href: '/archive/sandbox',
    },
    {
      label: '飞船群飞合影',
      href: '/archive/fleet-formations',
    },
    {
      label: '限时活动集体合影',
      href: '/archive/limited-time',
    },
  ],
},
  {
    key: 'guides',
    href: '/guides',
    label: '攻略',
    en: 'GUIDES',
    children: [
      { label: '全部攻略', href: '/guides' },
      { label: '萌新入门', href: '/guides?category=萌新入门' },
      { label: 'FPS单兵战斗', href: '/guides?category=FPS单兵战斗' },
      { label: '飞船空战', href: '/guides?category=飞船空战' },
      { label: '舰船武器组件', href: '/guides?category=舰船武器组件' },
      { label: '单兵武器装备', href: '/guides?category=单兵武器装备' },
      { label: '经济 / 赚钱', href: '/guides?category=经济 / 赚钱' },
      { label: '探索 / 旅游', href: '/guides?category=探索 / 旅游' },
      { label: '沙盒活动', href: '/guides?category=沙盒活动' },
      { label: '限时活动', href: '/guides?category=限时活动' },
      { label: '维克洛商店', href: '/guides?category=维克洛商店' },
      { label: '舰船升级CCU', href: '/guides?category=舰船升级CCU' },
      { label: '其他', href: '/guides?category=其他' },
    ],
  },
  { key: 'tools', href: '/tools', label: '工具', en: 'TOOLS' },
  { key: 'gallery', href: '/gallery', label: '影廊', en: 'GALLERY' },
  { key: 'market', href: '/market', label: '市场', en: 'MARKET' },
  { key: 'hall-of-fame', href: '/hall-of-fame', label: '名人堂', en: 'HALL OF FAME' },
] as const

/** Route-prefix based nav keys that should stay active on any nested route. */
const ROUTE_PREFIX_KEYS = [
  'community',
  'archive',
  'tools',
  'events',
  'guides',
  'market',
] as const

/** Section ids observed for scroll-based active state on the homepage. */
const HOME_SECTION_IDS = ['about']

function isNavLinkActive(
  linkKey: string,
  href: string,
  pathname: string,
  activeHomeSection: string | null,
) {
  if ((ROUTE_PREFIX_KEYS as readonly string[]).includes(linkKey)) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }
  if (linkKey === 'gallery' || linkKey === 'hall-of-fame') return pathname === href
  if (pathname !== '/') return false
  return activeHomeSection === linkKey
}

export function SiteHeader() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const [mobileSubExpanded, setMobileSubExpanded] = useState<string | null>(null)
  const [activeHomeSection, setActiveHomeSection] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Track which homepage section is currently in view so the on-page anchor
  // links (关于我们 / 活动 / 影廊) can show an accurate active state.
  useEffect(() => {
    if (pathname !== '/') {
      setActiveHomeSection(null)
      return
    }

    const elements = HOME_SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) {
          setActiveHomeSection(visible[0].target.id)
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [pathname])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-all duration-500',
        scrolled || open
          ? 'border-border bg-background/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl'
          : 'border-border/60 bg-background/78 backdrop-blur-xl',
      )}
    >
      <div className="site-container flex h-16 items-center justify-between gap-6 lg:h-20">
        <Link href="/" className="group flex items-center gap-3">
          <Image
            src="/images/starclub-logo.png"
            alt="星际酒馆 StarClub 徽标"
            width={44}
            height={44}
            priority
            className="size-9 shrink-0 object-contain transition-transform duration-500 group-hover:scale-110 lg:size-10"
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-sm tracking-[0.34em] text-foreground">
              STARCLUB
            </span>
            <span className="mt-1 text-[0.6rem] tracking-[0.3em] text-muted-foreground">
              星际酒馆
            </span>
          </span>
        </Link>

<nav aria-label="主导航" className="hidden items-center gap-8 lg:flex">
  {NAV_LINKS.map((link) => {
    const isActive = isNavLinkActive(
      link.key,
      link.href,
      pathname,
      activeHomeSection,
    )

    const hasDesktopChildren =
      link.key === 'archive' &&
      'children' in link &&
      link.children

    return (
      <div
        key={link.href}
        className="group/nav relative"
      >
        <Link
          href={link.href}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            'relative block py-2 text-sm tracking-[0.2em] transition-colors duration-200',
            isActive
              ? 'font-medium text-foreground'
              : 'text-muted-foreground group-hover/nav:text-foreground',
          )}
        >
          {link.label}

          <span
            aria-hidden
            className={cn(
              'absolute inset-x-0 -bottom-0.5 h-px origin-left bg-primary transition-transform duration-300',
              isActive
                ? 'scale-x-100'
                : 'scale-x-0 group-hover/nav:scale-x-100',
            )}
          />
        </Link>

        {hasDesktopChildren && (
          <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 translate-y-2 pt-3 opacity-0 transition-all duration-200 group-hover/nav:visible group-hover/nav:translate-y-0 group-hover/nav:opacity-100">
            <div className="rounded-xl border border-border bg-background/95 p-2 shadow-xl backdrop-blur-xl">
              <div className="px-3 pb-2 pt-2">
                <span className="font-display text-[0.55rem] tracking-[0.3em] text-primary">
                  {link.en}
                </span>
              </div>

              <div className="h-px bg-border/70" />

              <div className="py-1">
                {link.children.map((child) => {
                  const archiveCategory =
                    child.label !== '全部合影'
                      ? ARCHIVE.find(
                          (item) =>
                            `/archive/${item.slug}` === child.href,
                        )
                      : null

                  const archiveAlbums =
                    archiveCategory?.albums ?? []

                  const hasSubmenu =
                    archiveAlbums.length > 0

                  const isChildActive =
                    child.href === '/archive'
                      ? pathname === '/archive'
                      : pathname === child.href ||
                        pathname.startsWith(
                          `${child.href}/`,
                        )

                  return (
                    <div
                      key={child.href}
                      className="group/sub relative"
                    >
                      <Link
                        href={child.href}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
                          isChildActive
                            ? 'bg-muted font-medium text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <span>{child.label}</span>

                        {hasSubmenu && (
                          <span className="text-muted-foreground/50 transition-all group-hover/sub:translate-x-0.5 group-hover/sub:text-primary">
                            ›
                          </span>
                        )}
                      </Link>

                      {hasSubmenu &&
                        archiveCategory && (
                          <div className="invisible absolute left-full top-0 z-60 w-60 translate-x-1 pl-2 opacity-0 transition-all duration-200 group-hover/sub:visible group-hover/sub:translate-x-0 group-hover/sub:opacity-100">
                            <div className="rounded-xl border border-border bg-background/98 p-2 shadow-xl backdrop-blur-xl">
                              <Link
                                href={`/archive/${archiveCategory.slug}`}
                                className={cn(
                                  'flex rounded-lg px-3 py-2.5 text-sm transition-colors',
                                  pathname ===
                                    `/archive/${archiveCategory.slug}`
                                    ? 'bg-muted font-medium text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                              >
                                全部
                              </Link>

                              <div className="my-1 h-px bg-border/70" />

                              {archiveAlbums.map(
                                (album) => {
                                  const albumHref =
                                    `/archive/${archiveCategory.slug}/${album.slug}`

                                  const isAlbumActive =
                                    pathname === albumHref

                                  return (
                                    <Link
                                      key={album.slug}
                                      href={albumHref}
                                      className={cn(
                                        'flex rounded-lg px-3 py-2.5 text-sm transition-colors',
                                        isAlbumActive
                                          ? 'bg-muted font-medium text-primary'
                                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                      )}
                                    >
                                      {album.title}
                                    </Link>
                                  )
                                },
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  })}
</nav>

        <div className="flex items-center gap-3">
          <SiteSearch />

          <div className="shrink-0 [&_button]:h-10 [&_button]:min-w-16 [&_button]:whitespace-nowrap [&_button]:px-4 [&_button]:py-0 lg:[&_button]:h-auto lg:[&_button]:min-w-0 lg:[&_button]:px-5 lg:[&_button]:py-2.5">
            <HeaderUserAuth />
          </div>
          
          <a
            href={DISCORD_URL}
            {...EXTERNAL}
            className="pill hidden bg-primary px-5 py-2.5 font-display text-[0.68rem] tracking-[0.22em] text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_6px_18px_rgba(184,115,0,0.22)] active:translate-y-0 active:scale-[0.98] lg:inline-block"
          >
            加入 DISCORD
          </a>
          <button
            type="button"
            onClick={() => {
  setOpen((v) => !v)
  setMobileExpanded(null)
  setMobileSubExpanded(null)
}}
            aria-expanded={open}
            aria-label={open ? '关闭菜单' : '打开菜单'}
            className="grid size-10 place-items-center border border-border text-foreground lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
          <nav
  aria-label="移动导航"
  className="flex flex-col px-5 py-4 pb-8"
>
            {NAV_LINKS.map((link) => {
  const isActive = isNavLinkActive(
    link.key,
    link.href,
    pathname,
    activeHomeSection,
  )

  const hasChildren = 'children' in link && link.children
  const isExpanded = mobileExpanded === link.key

  if (hasChildren) {
    return (
      <div
        key={link.href}
        className="border-b border-border/60"
      >
        <div className="flex items-center">
          <Link
            href={link.href}
            onClick={() => setOpen(false)}
            aria-current={isActive ? 'page' : undefined}
            className="flex flex-1 items-baseline justify-between py-4"
          >
            <span
              className={cn(
                'inline-flex items-center gap-2 text-sm transition-colors duration-200',
                isActive
                  ? 'font-medium text-foreground'
                  : 'text-foreground/80',
              )}
            >
              {link.label}

              <span
                aria-hidden
                className={cn(
                  'size-1 rounded-full bg-primary transition-opacity duration-200',
                  isActive ? 'opacity-100' : 'opacity-0',
                )}
              />
            </span>

            <span
              className={cn(
                'mr-4 font-display text-[0.6rem] tracking-[0.3em]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground',
              )}
            >
              {link.en}
            </span>
          </Link>

          <button
            type="button"
            onClick={() =>
              setMobileExpanded(
                isExpanded ? null : link.key
              )
            }
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? '收起' : '展开'}${link.label}`}
            className="grid size-10 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
  className={cn(
    'size-4 transition-transform duration-200',
    isExpanded && 'rotate-180',
  )}
/>
          </button>
        </div>

        {isExpanded && (
  <div className="pb-3 pl-4">
    {link.children.map((child) => {
      const category =
        link.key === 'guides' && child.label !== '全部攻略'
          ? (child.label as GuideCategory)
          : null

      const tags =
        category && category in GUIDE_TAGS
          ? GUIDE_TAGS[category]
          : []

      const archiveCategory =
        link.key === 'archive' && child.label !== '全部合影'
          ? ARCHIVE.find(
              (item) => `/archive/${item.slug}` === child.href
            )
          : null

      const archiveAlbums =
        archiveCategory?.albums ?? []

      const hasMobileSubmenu =
        tags.length > 0 || archiveAlbums.length > 0

      const subKey = `${link.key}-${child.href}`

      const isSubExpanded =
        mobileSubExpanded === subKey

      return (
        <div key={child.href}>
          <div className="flex items-center">
            <Link
              href={child.href}
              onClick={() => {
                setOpen(false)
                setMobileExpanded(null)
                setMobileSubExpanded(null)
              }}
              className="flex flex-1 items-center rounded-lg px-3 py-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {child.label}
            </Link>

            {hasMobileSubmenu && (
              <button
                type="button"
                onClick={() =>
                  setMobileSubExpanded(
                    isSubExpanded ? null : subKey
                  )
                }
                aria-expanded={isSubExpanded}
                aria-label={`${isSubExpanded ? '收起' : '展开'}${child.label}`}
                className="grid size-9 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronDown
  className={cn(
    'size-3.5 transition-transform duration-200',
    isSubExpanded && 'rotate-180',
  )}
/>
              </button>
            )}
          </div>

          {isSubExpanded && (
            <div className="ml-3 border-l border-border/70 pl-3">
              {category && (
                <>
                  <Link
                    href={`/guides?category=${encodeURIComponent(category)}`}
                    onClick={() => {
                      setOpen(false)
                      setMobileExpanded(null)
                      setMobileSubExpanded(null)
                    }}
                    className="flex rounded-lg px-3 py-2.5 text-[0.78rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    全部
                  </Link>

                  {tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/guides?category=${encodeURIComponent(category)}&tag=${encodeURIComponent(tag)}`}
                      onClick={() => {
                        setOpen(false)
                        setMobileExpanded(null)
                        setMobileSubExpanded(null)
                      }}
                      className="flex rounded-lg px-3 py-2.5 text-[0.78rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {tag}
                    </Link>
                  ))}
                </>
              )}

              {archiveCategory && (
                <>
                  <Link
                    href={`/archive/${archiveCategory.slug}`}
                    onClick={() => {
                      setOpen(false)
                      setMobileExpanded(null)
                      setMobileSubExpanded(null)
                    }}
                    className="flex rounded-lg px-3 py-2.5 text-[0.78rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    全部
                  </Link>

                  {archiveAlbums.map((album) => (
                    <Link
                      key={album.slug}
                      href={`/archive/${archiveCategory.slug}/${album.slug}`}
                      onClick={() => {
                        setOpen(false)
                        setMobileExpanded(null)
                        setMobileSubExpanded(null)
                      }}
                      className="flex rounded-lg px-3 py-2.5 text-[0.78rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {album.title}
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )
    })}
  </div>
)}
      </div>
    )
  }
  return (
    <Link
      key={link.href}
      href={link.href}
      onClick={() => setOpen(false)}
      aria-current={isActive ? 'page' : undefined}
      className="flex items-baseline justify-between border-b border-border/60 py-4 last:border-0"
    >
      <span
        className={cn(
          'inline-flex items-center gap-2 text-sm transition-colors duration-200',
          isActive
            ? 'font-medium text-foreground'
            : 'text-foreground/80',
        )}
      >
        {link.label}

        <span
          aria-hidden
          className={cn(
            'size-1 rounded-full bg-primary transition-opacity duration-200',
            isActive ? 'opacity-100' : 'opacity-0',
          )}
        />
      </span>

      <span
        className={cn(
          'font-display text-[0.6rem] tracking-[0.3em] transition-colors duration-200',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground',
        )}
      >
        {link.en}
      </span>
    </Link>
  )
})}
            <div className="sticky bottom-0 mt-5 border-t border-border bg-background/95 pt-4 backdrop-blur-xl">
  <a
    href={DISCORD_URL}
    {...EXTERNAL}
    onClick={() => {
      setOpen(false)
      setMobileExpanded(null)
      setMobileSubExpanded(null)
    }}
    className="pill block bg-primary px-5 py-3 text-center font-display text-[0.78rem] tracking-[0.22em] text-primary-foreground"
  >
    加入 DISCORD
  </a>
</div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}