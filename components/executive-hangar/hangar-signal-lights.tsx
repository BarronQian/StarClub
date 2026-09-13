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

  const signalLabels = [
    '01',
    '02',
    '03',
    '04',
    '05',
  ]

  return (
    <div className="flex flex-col gap-5">

      {/* 顶部标题 */}
      <div className="flex items-center justify-between gap-3">

        <div>
          <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground">
            SIGNAL ARRAY
          </p>

          <p className="mt-1 text-xs font-medium text-neutral-800">
            周期信号灯
          </p>
        </div>

        <div className="text-right">
          <p className="font-mono text-[10px] font-semibold tabular-nums text-neutral-800">
            {active} / 5
          </p>

          <p className="mt-0.5 text-[8px] tracking-[0.14em] text-muted-foreground">
            ACTIVE
          </p>
        </div>

      </div>


      {/* 五个圆形工业指示灯 */}
      <div className="grid grid-cols-5 gap-3">

        {signalLabels.map(
          (
            label,
            index,
          ) => {
            const on =
              index < active

            return (
              <div
                key={label}
                className="flex flex-col items-center gap-2"
              >

                <div className="relative flex aspect-square w-full max-w-13 items-center justify-center rounded-full border border-neutral-400 bg-[#d9d9d4] shadow-[inset_0_2px_4px_rgba(0,0,0,0.18),0_1px_0_rgba(255,255,255,0.8)]">

                  {/* 外圈金属环 */}
                  <div className="absolute inset-0.75 rounded-full border border-neutral-300 bg-[linear-gradient(145deg,#f4f4f0,#bfbfba)]" />

                  {/* 灯体 */}
                  <div
                    className={cn(
                      'relative size-[58%] rounded-full border transition-all duration-300',
                      on
                        ? 'border-white/70'
                        : 'border-neutral-400 bg-[#777773]',
                    )}
                    style={
                      on
                        ? {
                            background: `radial-gradient(circle at 35% 30%, white 0%, color-mix(in oklab, ${color} 72%, white) 20%, ${color} 58%, color-mix(in oklab, ${color} 65%, black) 100%)`,
                            boxShadow: `
                              0 0 10px color-mix(in oklab, ${color} 75%, transparent),
                              0 0 20px color-mix(in oklab, ${color} 40%, transparent),
                              inset 0 0 5px rgba(255,255,255,0.8)
                            `,
                          }
                        : {
                            boxShadow:
                              'inset 0 2px 4px rgba(0,0,0,0.35)',
                          }
                    }
                  />

                </div>

                <span
                  className={cn(
                    'font-mono text-[9px] tabular-nums tracking-[0.12em]',
                    on
                      ? 'text-neutral-800'
                      : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>

              </div>
            )
          },
        )}

      </div>


      {/* 底部状态文字 */}
      <div className="flex items-center justify-between gap-3 border-t border-neutral-300 pt-3">

        <p className="text-[9px] leading-4 text-muted-foreground">
          {phase === 'reset'
            ? '系统正在执行重置程序'
            : phase === 'open'
              ? '当前行政机库处于开放周期'
              : '当前行政机库处于关闭周期'}
        </p>

        <span className="shrink-0 font-mono text-[9px] tabular-nums text-neutral-700">
          {nextChange}
        </span>

      </div>

    </div>
  )
}