'use client'

import { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: 1100, suffix: '+', label: '社区成员', en: 'COMMUNITY MEMBERS' },
  { value: 300, suffix: '+', label: '俱乐部成员', en: 'ORGANIZATION MEMBERS' },
  { value: 50, suffix: '+', label: '已举办活动', en: 'OPERATIONS' },
] as const

function useCountUp(target: number, start: boolean, duration = 1600) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) return

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setValue(target)
      return
    }

    let frame = 0
    const t0 = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, start, duration])

  return value
}

function StatItem({
  stat,
  active,
}: {
  stat: (typeof STATS)[number]
  active: boolean
}) {
  const value = useCountUp(stat.value, active)

  return (
    <div className="relative flex flex-col gap-2 px-1 py-6 sm:px-6">
      <span
        aria-hidden="true"
        className="absolute left-0 top-6 hidden h-8 w-px bg-primary/45 sm:block"
      />
      <span className="font-display text-3xl tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        {value.toLocaleString('en-US')}
        <span className="text-primary">{stat.suffix}</span>
      </span>
      <span className="text-sm text-foreground/80">{stat.label}</span>
      <span className="text-[0.6rem] tracking-[0.3em] text-muted-foreground">
        {stat.en}
      </span>
    </div>
  )
}

/* Not a count — the community is always active, so this reads as a static fact
   rather than an animated metric. */
function StaticStatItem() {
  return (
    <div className="relative flex flex-col gap-2 px-1 py-6 sm:px-6">
      <span
        aria-hidden="true"
        className="absolute left-0 top-6 hidden h-8 w-px bg-primary/45 sm:block"
      />
      <span className="font-display text-3xl tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        7<span className="text-primary">×</span>24
      </span>
      <span className="text-sm text-foreground/80">全球社区</span>
      <span className="text-[0.6rem] tracking-[0.3em] text-muted-foreground">
        GLOBAL COMMUNITY
      </span>
    </div>
  )
}

export function CommunityStats() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="stats"
      ref={ref}
      className="relative border-y border-border bg-card/40"
    >
      <div aria-hidden="true" className="hud-scanline absolute inset-0 opacity-40" />
      <div className="site-container relative py-10 lg:py-16">
        <div className="grid grid-cols-2 gap-x-4 divide-border sm:grid-cols-4">
          {STATS.map((stat) => (
            <StatItem key={stat.en} stat={stat} active={active} />
          ))}
          <StaticStatItem />
        </div>
      </div>
    </section>
  )
}
