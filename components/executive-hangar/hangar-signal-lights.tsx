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
        <span className="text-[0.62rem] tracking-[0.2em] text-muted-foreground">
          行政机库信号灯
        </span>

        <div className="flex items-center gap-2">
          <span
            className="size-1.5 rounded-full"
            style={{
              background: color,
              boxShadow: `
                0 0 6px ${color},
                0 0 14px color-mix(in oklab, ${color} 60%, transparent)
              `,
            }}
          />

          <span className="font-display text-[0.62rem] tabular-nums tracking-[0.16em] text-muted-foreground">
            {active} / 5 已激活
          </span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= active

          return (
            <div
              key={n}
              className="flex flex-col items-center gap-2.5"
            >
              {/* 外层灯槽 */}
              <div className="relative w-full px-1.5 py-2">
                {/* 灯光打到槽体上的环境辉光 */}
                {on && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-[10%] top-1/2 h-6 -translate-y-1/2 rounded-full blur-lg"
                    style={{
                      background: `color-mix(in oklab, ${color} 28%, transparent)`,
                    }}
                  />
                )}

                <div className="relative h-7 w-full rounded-md border border-border/70 bg-muted/40 px-2 shadow-[inset_0_2px_5px_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(255,255,255,0.5)]">
                  {/* 内部暗槽 */}
                  <div className="absolute inset-x-1.5 top-1/2 h-3.5 -translate-y-1/2 rounded-full border border-black/10 bg-black/4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)]" />

                  {/* 左端固定件 */}
                  <div
                    aria-hidden="true"
                    className="absolute left-1.75 top-1/2 z-20 h-3 w-1.25 -translate-y-1/2 rounded-l-sm border border-border/70 bg-muted"
                  />

                  {/* 右端固定件 */}
                  <div
                    aria-hidden="true"
                    className="absolute right-1.75 top-1/2 z-20 h-3 w-1.25 -translate-y-1/2 rounded-r-sm border border-border/70 bg-muted"
                  />

                  {/* 真正玻璃灯管 */}
                  <div
                    className={cn(
                      'absolute left-2.75 right-2.75 top-1/2 z-10 h-3 -translate-y-1/2 overflow-hidden rounded-full border transition-all duration-300',
                      on
                        ? 'border-white/50'
                        : 'border-border/60',
                    )}
                    style={{
                      background: on
                        ? `
                          linear-gradient(
                            180deg,
                            color-mix(in oklab, ${color} 42%, white) 0%,
                            color-mix(in oklab, ${color} 78%, white) 20%,
                            ${color} 48%,
                            color-mix(in oklab, ${color} 88%, black) 76%,
                            color-mix(in oklab, ${color} 68%, black) 100%
                          )
                        `
                        : `
                          linear-gradient(
                            180deg,
                            rgba(255,255,255,0.55) 0%,
                            rgba(255,255,255,0.14) 26%,
                            rgba(0,0,0,0.03) 60%,
                            rgba(0,0,0,0.08) 100%
                          )
                        `,
                      boxShadow: on
                        ? `
                          0 0 5px ${color},
                          0 0 12px color-mix(in oklab, ${color} 75%, transparent),
                          0 0 20px color-mix(in oklab, ${color} 40%, transparent),
                          inset 0 1px 0 rgba(255,255,255,0.8),
                          inset 0 -2px 3px rgba(0,0,0,0.18)
                        `
                        : `
                          inset 0 1px 0 rgba(255,255,255,0.55),
                          inset 0 -2px 3px rgba(0,0,0,0.06)
                        `,
                    }}
                  >
                    {/* 上方玻璃反光 */}
                    <div
                      aria-hidden="true"
                      className={cn(
                        'absolute left-[8%] right-[8%] top-0.5 h-0.75 rounded-full',
                        on
                          ? 'bg-white/55'
                          : 'bg-white/25',
                      )}
                    />

                    {/* 中央灯芯 */}
                    {on && (
                      <div
                        aria-hidden="true"
                        className="absolute left-[18%] right-[18%] top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-white/90 blur-[0.8px]"
                        style={{
                          boxShadow: `
                            0 0 4px white,
                            0 0 9px ${color},
                            0 0 15px ${color}
                          `,
                        }}
                      />
                    )}

                    {/* 底部阴影，增加圆柱感 */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-[35%] bg-black/12"
                    />
                  </div>
                </div>
              </div>

              <span
                className={cn(
                  'font-display text-[0.55rem] tabular-nums tracking-[0.16em] transition-colors duration-300',
                  on
                    ? 'text-foreground'
                    : 'text-muted-foreground/40',
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
            ? `信号熄灭 · 系统将在 ${nextChange} 后重置`
            : `距离下次信号变化 ${nextChange}`}
        </p>
      </div>
    </div>
  )
}