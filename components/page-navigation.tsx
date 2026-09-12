'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUp } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

export function PageNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowTop(window.scrollY > 500)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (pathname === '/') return null
  
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex size-11 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
        aria-label="返回上一页"
        title="返回上一页"
      >
        <ArrowLeft className="size-4" />
      </button>

      <button
        type="button"
        onClick={scrollToTop}
        className={`flex size-11 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary ${
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