'use client'

import { cn } from '@/lib/utils'
import {
  HANGAR_PHASE_COLORS,
  type HangarPhase,
} from '@/lib/executive-hangar-config'

export function HangarSignalLights({
  phase,
  active,
  nextChange,
}: {
  phase: HangarPhase
  active: number
  nextChange: string
}) {
  const color =
    phase === 'open' ? HANGAR_PHASE_COLORS.open : HANGAR_PHASE_COLORS.closed

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.62rem] tracking-[0.28em] text-muted-foreground uppercase">
          Hangar Signal
        </span>
        <span className="font-display text-[0.62rem] tabular-nums tracking-[0.2em] text-muted-foreground">
          {active} / 5 ACTIVE
        </span>
      </div>

      <div className="flex items-end gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= active
          return (
            <div key={n} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={cn(
                  'h-6 w-full rounded-[4px] border transition-all duration-300 ease-out',
                  on ? 'border-transparent' : 'border-border bg-muted/60',
                )}
                style={
                  on
                    ? {
                        background: `linear-gradient(180deg, color-mix(in oklab, ${color} 78%, white) 0%, ${color} 100%)`,
                        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 55%, white)`,
                      }
                    : undefined
                }
                aria-hidden="true"
              />
              <span
                className={cn(
                  'font-display text-[0.55rem] tabular-nums tracking-[0.18em] transition-colors duration-300',
                  on ? 'text-foreground' : 'text-muted-foreground/60',
                )}
              >
                0{n}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-[0.68rem] tracking-[0.06em] text-muted-foreground">
        {phase === 'reset'
          ? `Blackout · system reset in ${nextChange}`
          : `Next signal change in ${nextChange}`}
      </p>
    </div>
  )
}
