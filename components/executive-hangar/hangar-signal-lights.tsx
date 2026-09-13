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
    phase === 'open'
      ? HANGAR_PHASE_COLORS.open
      : HANGAR_PHASE_COLORS.closed

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.62rem] tracking-[0.28em] text-muted-foreground uppercase">
          Hangar Signal
        </span>

        <div className="flex items-center gap-2">
          <span
            className="size-1.5 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 8px ${color}, 0 0 16px color-mix(in oklab, ${color} 65%, transparent)`,
            }}
          />

          <span className="font-display text-[0.62rem] tabular-nums tracking-[0.2em] text-muted-foreground">
            {active} / 5 ACTIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= active

          return (
            <div
              key={n}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={cn(
                  'relative h-8 w-full overflow-hidden rounded-md border transition-all duration-300',
                  on
                    ? 'border-white/35'
                    : 'border-border/70 bg-muted/35',
                )}
                style={
                  on
                    ? {
                        background: `linear-gradient(
                          180deg,
                          color-mix(in oklab, ${color} 32%, white) 0%,
                          color-mix(in oklab, ${color} 88%, white) 35%,
                          ${color} 68%,
                          color-mix(in oklab, ${color} 78%, black) 100%
                        )`,
                        boxShadow: `
                          0 0 8px color-mix(in oklab, ${color} 80%, transparent),
                          0 0 20px color-mix(in oklab, ${color} 45%, transparent),
                          inset 0 1px 0 rgba(255,255,255,0.8),
                          inset 0 -2px 5px rgba(0,0,0,0.15)
                        `,
                      }
                    : undefined
                }
              >
                {/* 灯管内部高光 */}
                <div
                  className={cn(
                    'absolute inset-x-1 top-1 h-[35%] rounded-sm transition-opacity',
                    on
                      ? 'bg-white/35 opacity-100'
                      : 'bg-white/10 opacity-40',
                  )}
                />

                {/* 灯管底部暗部 */}
                <div
                  className={cn(
                    'absolute inset-x-0 bottom-0 h-[28%]',
                    on
                      ? 'bg-black/10'
                      : 'bg-black/5',
                  )}
                />

                {/* 中央发光芯 */}
                {on && (
                  <div
                    className="absolute inset-x-[24%] top-1/2 h-1 -translate-y-1/2 rounded-full blur-[2px]"
                    style={{
                      background: 'rgba(255,255,255,0.9)',
                      boxShadow: `0 0 10px white, 0 0 18px ${color}`,
                    }}
                  />
                )}
              </div>

              <span
                className={cn(
                  'font-display text-[0.55rem] tabular-nums tracking-[0.18em] transition-colors duration-300',
                  on
                    ? 'text-foreground'
                    : 'text-muted-foreground/45',
                )}
              >
                0{n}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-border/50 pt-3">
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{
            background: color,
            boxShadow: `0 0 7px ${color}`,
          }}
        />

        <p className="font-display text-[0.62rem] tracking-[0.12em] text-muted-foreground">
          {phase === 'reset'
            ? `BLACKOUT · SYSTEM RESET IN ${nextChange}`
            : `NEXT SIGNAL CHANGE IN ${nextChange}`}
        </p>
      </div>
    </div>
  )
}