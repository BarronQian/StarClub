'use client'

import { cn } from '@/lib/utils'
import type { HangarWindow } from '@/lib/executive-hangar'
import {
  clockInZone,
  dateInZone,
} from '@/lib/executive-hangar'
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
  onTimezoneChange: (
    id: HangarTimezoneId,
  ) => void
}) {
  const zone =
    HANGAR_TIMEZONES.find(
      (t) =>
        t.id === timezone,
    )?.zone

  return (
    <section className="flex flex-col gap-5">

      <div className="flex flex-wrap items-end justify-between gap-4">

        <div>
          <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground">
            UPCOMING WINDOWS
          </p>

          <h2 className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">
            后续开放窗口
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            查看接下来几次行政机库开放时间
          </p>
        </div>

        <TimezoneSelector
          value={timezone}
          onChange={
            onTimezoneChange
          }
        />

      </div>


      <div className="overflow-hidden rounded-2xl border border-neutral-300 bg-[#ededE9] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">

        {/* 顶部设备标签 */}
        <div className="flex items-center justify-between border-b border-neutral-300 bg-[#e3e3de] px-4 py-2.5">

          <span className="text-[8px] font-semibold tracking-[0.18em] text-neutral-600">
            EXECUTIVE HANGAR SCHEDULE
          </span>

          <span className="font-mono text-[8px] tracking-[0.12em] text-muted-foreground">
            LIVE CYCLE DATA
          </span>

        </div>


        <ul className="grid lg:grid-cols-5">

          {windows.map(
            (
              w,
              i,
            ) => {
              const live =
                w.open.getTime() <=
                  now &&
                w.close.getTime() >
                  now

              const isNext =
                !live &&
                i === 0

              return (
                <li
                  key={w.open.toISOString()}
                  className={cn(
                    'relative min-w-0 border-b border-neutral-300 bg-[#f8f8f5] p-4 transition-colors lg:border-b-0 lg:border-r last:lg:border-r-0',
                    live &&
                      'bg-emerald-50/70',
                    !live &&
                      isNext &&
                      'bg-amber-50/60',
                  )}
                >

                  {/* 顶部状态灯 */}
                  <div className="mb-4 flex items-center justify-between">

                    <div className="flex items-center gap-2">

                      <span
                        className={cn(
                          'size-2 rounded-full',
                          live
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]'
                            : isNext
                              ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.55)]'
                              : 'bg-neutral-300',
                        )}
                      />

                      <span
                        className={cn(
                          'font-mono text-[9px] font-semibold tabular-nums',
                          live
                            ? 'text-emerald-700'
                            : isNext
                              ? 'text-[#a66700]'
                              : 'text-muted-foreground',
                        )}
                      >
                        SLOT{' '}
                        {String(
                          i +
                            1,
                        ).padStart(
                          2,
                          '0',
                        )}
                      </span>

                    </div>

                    <span
                      className={cn(
                        'text-[8px] font-semibold tracking-[0.12em]',
                        live
                          ? 'text-emerald-700'
                          : isNext
                            ? 'text-[#a66700]'
                            : 'text-muted-foreground',
                      )}
                    >
                      {live
                        ? 'OPEN NOW'
                        : isNext
                          ? 'NEXT'
                          : 'QUEUED'}
                    </span>

                  </div>


                  {/* 日期 */}
                  <p className="text-[8px] tracking-[0.14em] text-muted-foreground">
                    {dateInZone(
                      w.open,
                      zone,
                    )}
                  </p>


                  {/* 开放时间 */}
                  <div className="mt-2 rounded-lg border border-neutral-400/60 bg-[linear-gradient(180deg,#2d2d2a_0%,#20201e_100%)] px-3 py-3 shadow-[inset_0_0_16px_rgba(0,0,0,0.55)]">

                    <p className="font-mono text-2xl font-semibold leading-none tabular-nums text-white">
                      {clockInZone(
                        w.open,
                        zone,
                      )}
                    </p>

                    <p className="mt-1 text-[8px] tracking-[0.14em] text-white/35">
                      OPEN
                    </p>

                  </div>


                  {/* 关闭时间 */}
                  <div className="mt-3 flex items-center justify-between border-t border-neutral-300 pt-3">

                    <span className="text-[8px] tracking-[0.12em] text-muted-foreground">
                      关闭
                    </span>

                    <span className="font-mono text-[10px] font-semibold tabular-nums text-neutral-800">
                      {clockInZone(
                        w.close,
                        zone,
                      )}
                    </span>

                  </div>

                </li>
              )
            },
          )}

        </ul>

      </div>

    </section>
  )
}
