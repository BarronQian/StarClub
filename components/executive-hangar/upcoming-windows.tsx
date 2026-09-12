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
            UPCOMING WINDOWS
          </span>
          <h2 className="font-display text-xl tracking-tight text-foreground">
            后续开放窗口
          </h2>
        </div>
        <TimezoneSelector value={timezone} onChange={onTimezoneChange} />
      </div>

      <div className="corner-cut border border-border bg-background">
        <ul className="flex flex-col divide-y divide-border lg:flex-row lg:divide-x lg:divide-y-0">
          {windows.map((w, i) => {
            const live = w.open.getTime() <= now && w.close.getTime() > now
            const isNext = !live && i === 0
            return (
              <li
                key={w.open.toISOString()}
                className={cn(
                  'relative flex flex-1 flex-col gap-2.5 px-5 py-5',
                  (live || isNext) && 'bg-primary/[0.04]',
                )}
              >
                {(live || isNext) && (
                  <span
                    className="absolute inset-x-0 top-0 h-px bg-primary"
                    aria-hidden="true"
                  />
                )}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'font-display text-[0.6rem] tabular-nums tracking-[0.22em]',
                      live || isNext ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'text-[0.52rem] tracking-[0.22em] uppercase',
                      live ? 'text-primary' : 'text-muted-foreground/70',
                    )}
                  >
                    {live ? 'OPEN NOW' : dateInZone(w.open, zone)}
                  </span>
                </div>
                <span className="font-display text-2xl leading-none tabular-nums tracking-tight text-foreground">
                  {clockInZone(w.open, zone)}
                </span>
                <span className="text-[0.6rem] tabular-nums tracking-[0.14em] text-muted-foreground">
                  → {clockInZone(w.close, zone)} CLOSE
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
