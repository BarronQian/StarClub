'use client'

import {
  executiveHangarConfig as cfg,
  HANGAR_PHASE_COLORS,
} from '@/lib/executive-hangar-config'

const SEGMENTS = [
  {
    key: 'closed' as const,
    minutes: cfg.closedMinutes,
    label: '关闭',
    color: HANGAR_PHASE_COLORS.closed,
  },
  {
    key: 'open' as const,
    minutes: cfg.openMinutes,
    label: '开启',
    color: HANGAR_PHASE_COLORS.open,
  },
  {
    key: 'reset' as const,
    minutes: cfg.resetMinutes,
    label: '重置',
    color: HANGAR_PHASE_COLORS.reset,
  },
]

const LIGHT_COUNT = 42

export function CycleRail({
  progress,
}: {
  progress: number
}) {
  const pct = Math.min(
    100,
    Math.max(0, progress * 100),
  )

  const activeLights = Math.round(
    progress * LIGHT_COUNT,
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.62rem] tracking-[0.28em] text-muted-foreground uppercase">
          周期阶段轨道
        </span>

        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-foreground/70 shadow-[0_0_7px_rgba(0,0,0,0.25)]" />

          <span className="font-display text-[0.62rem] tabular-nums tracking-[0.2em] text-muted-foreground">
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="relative rounded-lg border border-border/70 bg-muted/20 px-3 pb-3 pt-6 shadow-[inset_0_0_18px_rgba(0,0,0,0.03)]">
        {/* 当前进度指针 */}
        <div
          className="absolute top-1 z-20 -translate-x-1/2 transition-[left] duration-1000 ease-linear"
          style={{
            left: `${pct}%`,
          }}
          aria-hidden="true"
        >
          <div className="flex flex-col items-center">
            <span className="size-1.5 rounded-full bg-foreground shadow-[0_0_8px_rgba(0,0,0,0.35)]" />

            <span className="mt-1 h-3 w-px bg-foreground/70" />
          </div>
        </div>

        {/* 发光灯带 */}
        <div className="grid grid-cols-42 gap-0.75">
          {Array.from(
            {
              length: LIGHT_COUNT,
            },
            (_, i) => {
              const lightProgress =
                (i + 1) /
                LIGHT_COUNT

              const on =
                i < activeLights

              const current =
                i ===
                activeLights - 1

              const cycleMinute =
                lightProgress *
                cfg.cycleMinutes

              let color: string =
                HANGAR_PHASE_COLORS.closed

              if (
                cycleMinute >
                cfg.closedMinutes
              ) {
                color =
                  HANGAR_PHASE_COLORS.open
              }

              if (
                cycleMinute >
                cfg.closedMinutes +
                  cfg.openMinutes
              ) {
                color =
                  HANGAR_PHASE_COLORS.reset
              }

              return (
                <span
                  key={i}
                  className="relative h-5 overflow-hidden rounded-[2px] border border-border/50 transition-all duration-300"
                  style={
                    on
                      ? {
                          background: `linear-gradient(
                            180deg,
                            color-mix(in oklab, ${color} 38%, white) 0%,
                            ${color} 52%,
                            color-mix(in oklab, ${color} 75%, black) 100%
                          )`,
                          borderColor: `color-mix(in oklab, ${color} 50%, white)`,
                          boxShadow: current
                            ? `
                              0 0 6px ${color},
                              0 0 14px color-mix(in oklab, ${color} 65%, transparent),
                              inset 0 1px 0 rgba(255,255,255,0.65)
                            `
                            : `
                              0 0 4px color-mix(in oklab, ${color} 55%, transparent),
                              inset 0 1px 0 rgba(255,255,255,0.45)
                            `,
                        }
                      : {
                          background:
                            'color-mix(in oklab, var(--muted) 75%, transparent)',
                        }
                  }
                  aria-hidden="true"
                >
                  <span
                    className="absolute inset-x-[18%] top-[15%] h-[25%] rounded-full bg-white/30"
                  />
                </span>
              )
            },
          )}
        </div>

        {/* 底部连续色带 */}
        <div className="mt-2 flex h-1 overflow-hidden rounded-full opacity-55">
          {SEGMENTS.map((s) => (
            <span
              key={s.key}
              className="h-full"
              style={{
                flex: s.minutes,
                background: s.color,
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* 三阶段参数 */}
      <div className="flex w-full">
        {SEGMENTS.map(
          (s, index) => (
            <div
              key={s.key}
              className="relative flex flex-col gap-1"
              style={{
                flex: s.minutes,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    background: s.color,
                    boxShadow: `0 0 6px ${s.color}`,
                  }}
                />

                <span
                  className="font-display text-[0.6rem] tabular-nums tracking-[0.18em]"
                  style={{
                    color: s.color,
                  }}
                >
                  {s.minutes} 分钟
                </span>
              </div>

              <span className="text-[0.55rem] tracking-[0.2em] text-muted-foreground uppercase">
                {s.label}
              </span>

              {index <
                SEGMENTS.length -
                  1 && (
                <span className="absolute right-2 top-0 h-full w-px bg-border/60" />
              )}
            </div>
          ),
        )}
      </div>
    </div>
  )
}
