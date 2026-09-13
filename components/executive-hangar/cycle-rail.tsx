'use client'

import {
  executiveHangarConfig as cfg,
} from '@/lib/executive-hangar-config'

const SIGNAL_RED =
  '#c94840'

const SIGNAL_GREEN =
  '#3faa59'

const RESET_AMBER =
  '#b7791f'

const SEGMENTS = [
  {
    key: 'closed' as const,
    minutes: cfg.closedMinutes,
    label: '关闭',
    en: 'CLOSED',
    color: SIGNAL_RED,
  },
  {
    key: 'open' as const,
    minutes: cfg.openMinutes,
    label: '开放',
    en: 'OPEN',
    color: SIGNAL_GREEN,
  },
  {
    key: 'reset' as const,
    minutes: cfg.resetMinutes,
    label: '重置',
    en: 'RESET',
    color: RESET_AMBER,
  },
]

export function CycleRail({
  progress,
}: {
  progress: number
}) {
  const pct =
    Math.min(
      100,
      Math.max(
        0,
        progress * 100,
      ),
    )

  const cursorPct =
    Math.min(
      99.2,
      Math.max(
        0.8,
        pct,
      ),
    )

  return (
    <div className="flex flex-col gap-4">

      <div className="flex items-center justify-between gap-3">

        <div>
          <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground">
            CYCLE PHASE RAIL
          </p>

          <p className="mt-1 text-xs font-medium text-neutral-800">
            周期阶段轨道
          </p>
        </div>

        <span className="font-mono text-[10px] font-semibold tabular-nums text-neutral-700">
          {pct.toFixed(1)}%
        </span>

      </div>


      {/* 主工业滑轨 */}
      <div className="relative rounded-xl border border-neutral-400/70 bg-[#d6d6d1] p-2 shadow-[inset_0_2px_5px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.8)]">

        {/* 轨道凹槽 */}
        <div className="relative h-8 overflow-hidden rounded-md border border-neutral-500/60 bg-[#858580] shadow-[inset_0_2px_5px_rgba(0,0,0,0.45)]">

          <div className="absolute inset-0.75 flex overflow-hidden rounded-md">

            {SEGMENTS.map(
              (
                segment,
              ) => (
                <div
                  key={
                    segment.key
                  }
                  className="relative h-full"
                  style={{
                    flex:
                      segment.minutes,
                  }}
                >

                  <div
                    className="absolute inset-0"
                    style={{
                      background: `
                        linear-gradient(
                          180deg,
                          color-mix(in oklab, ${segment.color} 38%, white) 0%,
                          ${segment.color} 48%,
                          color-mix(in oklab, ${segment.color} 68%, black) 100%
                        )
                      `,
                    }}
                  />

                  {/* 上沿高光 */}
                  <div className="absolute inset-x-0 top-0 h-px bg-white/35" />

                  {/* 分段边界 */}
                  <div className="absolute inset-y-0 right-0 w-px bg-black/35" />

                </div>
              ),
            )}

          </div>


          {/* 当前进度光标 */}
          <div
            className="absolute inset-y-0 z-20 w-0.75 -translate-x-1/2 transition-[left] duration-1000 ease-linear"
            style={{
              left:
                `${cursorPct}%`,
            }}
          >

            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />

            <div className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full border border-white bg-neutral-900 shadow-[0_0_8px_rgba(255,255,255,0.65)]" />

          </div>

        </div>


        {/* NOW 游标 */}
        <div
          className="pointer-events-none absolute -top-3 z-30 -translate-x-1/2 transition-[left] duration-1000 ease-linear"
          style={{
            left:
              `${cursorPct}%`,
          }}
          aria-hidden="true"
        >

          <div className="flex flex-col items-center">

            <span className="rounded-sm border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 font-mono text-[7px] leading-none text-white shadow-sm">
              NOW
            </span>

            <span className="mt-0.5 size-0 border-x-4 border-t-[5px] border-x-transparent border-t-neutral-900" />

          </div>

        </div>

      </div>


      {/* 三阶段说明 */}
      <div className="grid grid-cols-3 gap-3">

        {SEGMENTS.map(
          (
            segment,
          ) => (
            <div
              key={
                segment.key
              }
              className="min-w-0 rounded-lg border border-neutral-300/70 bg-[#f8f8f5] px-3 py-2.5"
            >

              <div className="flex items-center gap-2">

                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    background:
                      segment.color,

                    boxShadow:
                      `0 0 6px color-mix(in oklab, ${segment.color} 55%, transparent)`,
                  }}
                />

                <span className="truncate text-[10px] font-semibold text-neutral-800">
                  {segment.label}
                </span>

              </div>


              <div className="mt-1.5">

                <p
                  className="font-mono text-[9px] font-semibold tabular-nums"
                  style={{
                    color:
                      segment.color,
                  }}
                >
                  {segment.minutes} MIN
                </p>

                <p className="mt-0.5 text-[8px] tracking-[0.12em] text-muted-foreground">
                  {segment.en}
                </p>

              </div>

            </div>
          ),
        )}

      </div>

    </div>
  )
}