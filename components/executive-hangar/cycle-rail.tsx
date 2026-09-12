'use client'

import {
  executiveHangarConfig as cfg,
  HANGAR_PHASE_COLORS,
} from '@/lib/executive-hangar-config'

const SEGMENTS = [
  {
    key: 'closed' as const,
    minutes: cfg.closedMinutes,
    label: 'CLOSED',
    color: HANGAR_PHASE_COLORS.closed,
  },
  {
    key: 'open' as const,
    minutes: cfg.openMinutes,
    label: 'OPEN',
    color: HANGAR_PHASE_COLORS.open,
  },
  {
    key: 'reset' as const,
    minutes: cfg.resetMinutes,
    label: 'RESET',
    color: HANGAR_PHASE_COLORS.reset,
  },
]

export function CycleRail({ progress }: { progress: number }) {
  const pct = Math.min(100, Math.max(0, progress * 100))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.62rem] tracking-[0.28em] text-muted-foreground uppercase">
          Cycle Phase Rail
        </span>
        <span className="font-display text-[0.62rem] tabular-nums tracking-[0.2em] text-muted-foreground">
          {pct.toFixed(1)}%
        </span>
      </div>

      <div className="relative pt-4">
        <div
          className="absolute top-0 z-10 -translate-x-1/2 transition-[left] duration-1000 ease-linear"
          style={{ left: `${pct}%` }}
          aria-hidden="true"
        >
          <div className="flex flex-col items-center">
            <span className="size-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-foreground" />
            <span className="h-[18px] w-px bg-foreground" />
          </div>
        </div>
        <div className="flex h-1.5 w-full overflow-hidden rounded-[2px]">
          {SEGMENTS.map((s) => (
            <span
              key={s.key}
              className="h-full"
              style={{
                flex: s.minutes,
                background: `color-mix(in oklab, ${s.color} 62%, white)`,
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <div className="flex w-full">
        {SEGMENTS.map((s) => (
          <div
            key={s.key}
            className="flex flex-col gap-0.5"
            style={{ flex: s.minutes }}
          >
            <span
              className="font-display text-[0.6rem] tabular-nums tracking-[0.18em]"
              style={{ color: s.color }}
            >
              {s.minutes}
            </span>
            <span className="text-[0.55rem] tracking-[0.2em] text-muted-foreground uppercase">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
