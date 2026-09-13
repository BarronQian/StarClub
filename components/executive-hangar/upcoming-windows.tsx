'use client'

import { cn } from '@/lib/utils'
import type { HangarWindow } from '@/lib/executive-hangar'
import { clockInZone, dateInZone } from '@/lib/executive-hangar'
import {
  HANGAR_TIMEZONES,
  type HangarTimezoneId,
} from '@/lib/executive-hangar-config'
import { TimezoneSelector } from './timezone-selector'

export function UpcomingWindows({
  windows,
  now,
  timezone,
  onTimezoneChange,
}: {
  windows: HangarWindow[]
  now: number
  timezone: HangarTimezoneId
  onTimezoneChange: (id: HangarTimezoneId) => void
}) {
  const zone = HANGAR_TIMEZONES.find((t) => t.id === timezone)?.zone

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="font-display text-[0.58rem] tracking-[0.3em] text-primary">
            行政机库开放时间
          </span>

          <h2 className="font-display text-xl tracking-tight text-foreground">
            后续开放窗口
          </h2>
        </div>

        <TimezoneSelector
          value={timezone}
          onChange={onTimezoneChange}
        />
      </div>

      <div className="corner-cut relative overflow-hidden border border-border/80 bg-background shadow-[0_16px_40px_rgba(0,0,0,0.04)]">
        {/* 顶部仪表导轨 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[8%] top-0 h-px bg-primary/70 shadow-[0_0_12px_hsl(var(--primary)/0.35)]"
        />

        <ul className="flex flex-col divide-y divide-border lg:flex-row lg:divide-x lg:divide-y-0">
          {windows.map((w, i) => {
            const live =
              w.open.getTime() <= now &&
              w.close.getTime() > now

            const isNext =
              !live &&
              i === 0

            return (
              <li
                key={w.open.toISOString()}
                className={cn(
                  'group relative flex flex-1 flex-col gap-3 px-5 py-5 transition-colors',
                  live
                    ? 'bg-primary/[0.07]'
                    : isNext
                      ? 'bg-primary/[0.035]'
                      : 'bg-background',
                )}
              >
                {/* 当前 / 下一窗口顶部状态线 */}
                {(live || isNext) && (
                  <span
                    className={cn(
                      'absolute inset-x-0 top-0 h-px',
                      live
                        ? 'bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.45)]'
                        : 'bg-primary/60',
                    )}
                    aria-hidden="true"
                  />
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        live
                          ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.7)]'
                          : isNext
                            ? 'bg-primary/70'
                            : 'bg-muted-foreground/25',
                      )}
                      aria-hidden="true"
                    />

                    <span
                      className={cn(
                        'font-display text-[0.6rem] tabular-nums tracking-[0.22em]',
                        live || isNext
                          ? 'text-primary'
                          : 'text-muted-foreground',
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <span
                    className={cn(
                      'text-[0.52rem] tracking-[0.18em]',
                      live
                        ? 'font-medium text-primary'
                        : 'text-muted-foreground/70',
                    )}
                  >
                    {live
                      ? '当前已开启'
                      : dateInZone(w.open, zone)}
                  </span>
                </div>

                <span className="font-display text-2xl leading-none tabular-nums tracking-tight text-foreground">
                  {clockInZone(w.open, zone)}
                </span>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.6rem] tabular-nums tracking-[0.12em] text-muted-foreground">
                    关闭时间 {clockInZone(w.close, zone)}
                  </span>

                  {isNext && (
                    <span className="text-[0.52rem] tracking-[0.16em] text-primary">
                      下一窗口
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}