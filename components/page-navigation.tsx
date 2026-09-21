'use client'

import {
  useEffect,
  useState,
} from 'react'

import {
  ArrowLeft,
  ArrowUp,
} from 'lucide-react'

import {
  usePathname,
  useRouter,
} from 'next/navigation'

export function PageNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  const [
    showTop,
    setShowTop,
  ] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowTop(
        window.scrollY > 500,
      )
    }

    handleScroll()

    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      },
    )

    return () =>
      window.removeEventListener(
        'scroll',
        handleScroll,
      )
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // 首页不显示
  if (pathname === '/') {
    return null
  }

  // 影廊不需要全局返回 / 回到顶部按钮
  if (
    pathname === '/gallery' ||
    pathname.startsWith(
      '/gallery/',
    )
  ) {
    return null
  }

  return (
    <div
      className={`page-floating-navigation fixed bottom-7.5 right-22 z-50 ${
        pathname === '/community'
          ? 'hidden xl:block'
          : 'block'
      }`}
    >
      {/* 返回上一页：位于 AI 按钮左侧 */}
      <button
        type="button"
        onClick={() =>
          router.back()
        }
        className="flex size-11 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
        aria-label="返回上一页"
        title="返回上一页"
      >
        <ArrowLeft className="size-4" />
      </button>

      {/* 回到顶部：位于 AI 按钮正上方 */}
      <button
        type="button"
        onClick={
          scrollToTop
        }
        className={`absolute bottom-14.5 left-14.5 flex size-11 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary ${
          showTop
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0'
        }`}
        aria-label="回到顶部"
        title="回到顶部"
      >
        <ArrowUp className="size-4" />
      </button>
    </div>
  )
}