'use client'

import { useEffect, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { clockInZone, dateInZone, formatMinutesRough } from '@/lib/executive-hangar'

export function NextOpen({
  nextOpen,
  untilNextOpen,
  isOpenNow,
}: {
  nextOpen: Date
  untilNextOpen: number
  isOpenNow: boolean
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 2200)
    return () => window.clearTimeout(id)
  }, [copied])

  const copy = async () => {
    const stamp = `<t:${Math.floor(nextOpen.getTime() / 1000)}:F>`
    try {
      await navigator.clipboard.writeText(stamp)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="corner-cut border border-border bg-background">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-3 lg:px-8">
        <span className="text-[0.58rem] tracking-[0.28em] text-muted-foreground uppercase">
          Next Executive Hangar
          {isOpenNow && (
            <span className="hidden sm:inline"> · after current window</span>
          )}
        </span>
        <span className="font-display text-[0.55rem] tracking-[0.24em] text-muted-foreground">
          LIVE CYCLE CALCULATION
        </span>
      </div>

      <div className="flex flex-col gap-8 px-6 py-8 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="flex flex-wrap items-end gap-10 lg:gap-16">
          <div className="flex flex-col gap-1.5">
            <span className="font-display text-5xl leading-none tabular-nums tracking-tight text-foreground sm:text-6xl">
              {clockInZone(nextOpen)}
            </span>
            <span className="text-[0.55rem] tracking-[0.26em] text-muted-foreground uppercase">
              Local Time · {dateInZone(nextOpen)}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-display text-2xl leading-none tabular-nums tracking-tight text-muted-foreground sm:text-3xl">
              {clockInZone(nextOpen, 'Asia/Shanghai')}
            </span>
            <span className="text-[0.55rem] tracking-[0.26em] text-muted-foreground uppercase">
              Beijing · UTC+8
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-display text-2xl leading-none tabular-nums tracking-tight text-primary sm:text-3xl">
              IN {formatMinutesRough(untilNextOpen).toUpperCase()}
            </span>
            <span className="text-[0.55rem] tracking-[0.26em] text-muted-foreground uppercase">
              Countdown
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copy}
            className="pill flex h-10 items-center gap-2 border border-border px-5 font-display text-[0.6rem] tracking-[0.2em] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {copied ? (
              <Check className="size-3.5" strokeWidth={1.8} />
            ) : (
              <Copy className="size-3.5" strokeWidth={1.6} />
            )}
            COPY DISCORD TIME
          </button>
          <span
            aria-live="polite"
            className={`text-[0.6rem] tracking-[0.16em] text-muted-foreground transition-opacity duration-300 ${
              copied ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Discord timestamp copied
          </span>
        </div>
      </div>
    </section>
  )
}
