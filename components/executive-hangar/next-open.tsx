'use client'

import { useEffect, useState } from 'react'
import {
  Check,
  Copy,
} from 'lucide-react'
import {
  clockInZone,
  dateInZone,
  formatMinutesRough,
} from '@/lib/executive-hangar'

export function NextOpen({
  nextOpen,
  untilNextOpen,
  isOpenNow,
}: {
  nextOpen: Date
  untilNextOpen: number
  isOpenNow: boolean
}) {
  const [
    copied,
    setCopied,
  ] = useState(false)

  useEffect(() => {
    if (!copied) return

    const id =
      window.setTimeout(
        () =>
          setCopied(false),
        2200,
      )

    return () =>
      window.clearTimeout(
        id,
      )
  }, [copied])

  const copy =
    async () => {
      const stamp =
        `<t:${Math.floor(
          nextOpen.getTime() /
            1000,
        )}:F>`

      try {
        await navigator.clipboard.writeText(
          stamp,
        )

        setCopied(true)
      } catch {
        setCopied(false)
      }
    }

  return (
    <section className="corner-cut relative overflow-hidden border border-border/80 bg-background">
      {/* 顶部发光导轨 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[7%] top-0 h-px bg-primary/70 shadow-[0_0_14px_hsl(var(--primary)/0.35)]"
      />

      {/* 背景微光 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 size-72 rounded-full bg-primary/4 blur-3xl"
      />

      {/* 顶部状态栏 */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-muted/12 px-6 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-primary shadow-[0_0_9px_hsl(var(--primary)/0.65)]"
          />

          <span className="text-[0.58rem] tracking-[0.2em] text-muted-foreground">
            {isOpenNow
              ? '当前窗口结束后的下一次开放'
              : '下一次行政机库开放'}
          </span>
        </div>

        <span className="font-display text-[0.55rem] tracking-[0.18em] text-muted-foreground">
          实时周期计算
        </span>
      </div>

      <div className="relative z-10 flex flex-col gap-8 px-6 py-8 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="flex flex-wrap items-end gap-8 lg:gap-14">
          {/* 本地时间 */}
          <div className="flex flex-col gap-2">
            <span className="text-[0.56rem] tracking-[0.18em] text-muted-foreground">
              本地时间
            </span>

            <span className="font-display text-5xl leading-none tabular-nums tracking-tight text-foreground sm:text-6xl">
              {clockInZone(
                nextOpen,
              )}
            </span>

            <span className="text-[0.58rem] tabular-nums tracking-[0.13em] text-muted-foreground">
              {dateInZone(
                nextOpen,
              )}
            </span>
          </div>

          {/* 北京时间 */}
          <div className="flex flex-col gap-2 border-l border-border/70 pl-6">
            <span className="text-[0.56rem] tracking-[0.18em] text-muted-foreground">
              北京时间
            </span>

            <span className="font-display text-2xl leading-none tabular-nums tracking-tight text-muted-foreground sm:text-3xl">
              {clockInZone(
                nextOpen,
                'Asia/Shanghai',
              )}
            </span>

            <span className="text-[0.58rem] tracking-[0.13em] text-muted-foreground/80">
              UTC+8
            </span>
          </div>

          {/* 倒计时 */}
          <div className="flex flex-col gap-2 border-l border-border/70 pl-6">
            <span className="text-[0.56rem] tracking-[0.18em] text-muted-foreground">
              距离开启
            </span>

            <span className="font-display text-2xl leading-none tabular-nums tracking-tight text-primary sm:text-3xl">
              {formatMinutesRough(
                untilNextOpen,
              )}
            </span>

            <div className="mt-1 flex items-center gap-1">
              {Array.from({
                length: 8,
              }).map(
                (
                  _,
                  i,
                ) => (
                  <span
                    key={
                      i
                    }
                    aria-hidden="true"
                    className="h-1 w-3 rounded-full bg-primary/65 shadow-[0_0_5px_hsl(var(--primary)/0.25)]"
                  />
                ),
              )}
            </div>
          </div>
        </div>

        {/* Discord 时间戳 */}
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <button
            type="button"
            onClick={
              copy
            }
            className="pill flex h-10 items-center gap-2 border border-border bg-background/80 px-5 font-display text-[0.6rem] tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {copied ? (
              <Check
                className="size-3.5"
                strokeWidth={
                  1.8
                }
              />
            ) : (
              <Copy
                className="size-3.5"
                strokeWidth={
                  1.6
                }
              />
            )}

            {copied
              ? '已复制 Discord 时间'
              : '复制 Discord 时间'}
          </button>

          <span
            aria-live="polite"
            className={`text-[0.58rem] tracking-[0.12em] text-muted-foreground transition-opacity duration-300 ${
              copied
                ? 'opacity-100'
                : 'opacity-0'
            }`}
          >
            Discord 时间戳已复制
          </span>
        </div>
      </div>
    </section>
  )
}