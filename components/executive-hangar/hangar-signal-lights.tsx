'use client'

import { cn } from '@/lib/utils'
import type {
  HangarPhase,
} from '@/lib/executive-hangar-config'
import type {
  SignalState,
} from '@/lib/executive-hangar'

export function HangarSignalLights({
  phase,
  signalStates,
  nextChange,
}: {
  phase: HangarPhase
  signalStates: SignalState[]
  nextChange: string
}) {
  const signalLabels = [
    '01',
    '02',
    '03',
    '04',
    '05',
  ]

  const greenCount =
    signalStates.filter(
      (state) =>
        state === 'green',
    ).length

  const redCount =
    signalStates.filter(
      (state) =>
        state === 'red',
    ).length

  const offCount =
    signalStates.filter(
      (state) =>
        state === 'off',
    ).length

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

          {phase === 'closed' ? (
            <>
              <p className="font-mono text-[10px] font-semibold tabular-nums text-neutral-800">
                {greenCount} GREEN · {redCount} RED
              </p>

              <p className="mt-0.5 text-[8px] tracking-[0.14em] text-muted-foreground">
                CHARGING
              </p>
            </>
          ) : phase === 'open' ? (
            <>
              <p className="font-mono text-[10px] font-semibold tabular-nums text-neutral-800">
                {greenCount} / 5
              </p>

              <p className="mt-0.5 text-[8px] tracking-[0.14em] text-muted-foreground">
                ACTIVE
              </p>
            </>
          ) : (
            <>
              <p className="font-mono text-[10px] font-semibold tabular-nums text-neutral-800">
                {offCount} / 5
              </p>

              <p className="mt-0.5 text-[8px] tracking-[0.14em] text-muted-foreground">
                BLACKOUT
              </p>
            </>
          )}

        </div>

      </div>


      {/* 五个周期信号灯 */}
      <div className="grid grid-cols-5 gap-3">

        {signalLabels.map(
          (
            label,
            index,
          ) => {
            const state =
              signalStates[index] ??
              'off'

            const isGreen =
              state === 'green'

            const isRed =
              state === 'red'

            const isOff =
              state === 'off'

            return (
              <div
                key={label}
                className="flex flex-col items-center gap-2"
              >

                {/* 工业灯座 */}
                <div className="relative flex aspect-square w-full max-w-13 items-center justify-center rounded-full border border-neutral-400 bg-[#d9d9d4] shadow-[inset_0_2px_4px_rgba(0,0,0,0.18),0_1px_0_rgba(255,255,255,0.8)]">

                  {/* 金属外环 */}
                  <div className="absolute inset-0.75 rounded-full border border-neutral-300 bg-[linear-gradient(145deg,#f4f4f0,#bfbfba)]" />


                  {/* 绿色 */}
                  {isGreen && (
                    <div
                      className="relative size-[58%] rounded-full border border-white/70"
                      style={{
                        background:
                          'radial-gradient(circle at 35% 30%, #f5fff6 0%, #8ee29c 20%, #3faa59 58%, #1d6a31 100%)',

                        boxShadow: `
                          0 0 10px rgba(63,170,89,0.8),
                          0 0 20px rgba(63,170,89,0.42),
                          inset 0 0 5px rgba(255,255,255,0.85)
                        `,
                      }}
                    />
                  )}


                  {/* 红色 */}
                  {isRed && (
                    <div
                      className="relative size-[58%] rounded-full border border-white/60"
                      style={{
                        background:
                          'radial-gradient(circle at 35% 30%, #fff1ef 0%, #ef8b82 20%, #c94840 58%, #7c2420 100%)',

                        boxShadow: `
                          0 0 9px rgba(201,72,64,0.65),
                          0 0 17px rgba(201,72,64,0.3),
                          inset 0 0 5px rgba(255,255,255,0.75)
                        `,
                      }}
                    />
                  )}


                  {/* 熄灭 / 黑灯 */}
                  {isOff && (
                    <div className="relative size-[58%] rounded-full border border-neutral-500 bg-[radial-gradient(circle_at_35%_30%,#8b8b87_0%,#62625f_35%,#444441_75%,#353532_100%)] shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]" />
                  )}

                </div>


                <span
                  className={cn(
                    'font-mono text-[9px] tabular-nums tracking-[0.12em]',
                    isGreen &&
                      'text-emerald-700',
                    isRed &&
                      'text-red-700',
                    isOff &&
                      'text-muted-foreground',
                  )}
                >
                  {label}
                </span>

              </div>
            )
          },
        )}

      </div>


      {/* 状态说明 */}
      <div className="border-t border-neutral-300 pt-3">

        <div className="flex items-center justify-between gap-3">

          <p className="text-[9px] leading-4 text-muted-foreground">
            {phase === 'closed'
              ? '当前处于充能阶段，红灯将依次转绿'
              : phase === 'open'
                ? '当前行政机库已开放，绿灯将依次熄灭'
                : '当前处于黑区重置阶段，全部信号灯已熄灭'}
          </p>

          <span className="shrink-0 font-mono text-[9px] tabular-nums text-neutral-700">
            {nextChange}
          </span>

        </div>

      </div>

    </div>
  )
}