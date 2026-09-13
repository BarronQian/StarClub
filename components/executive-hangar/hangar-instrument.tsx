'use client'

import { Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  executiveHangarConfig as cfg,
  HANGAR_PHASE_COLORS,
} from '@/lib/executive-hangar-config'
import {
  clockInZone,
  dateInZone,
  formatDuration,
  formatMinutesRough,
  PHASE_META,
  utcStamp,
  type HangarState,
} from '@/lib/executive-hangar'
import { PhaseGauge } from './phase-gauge'
import { HangarSignalLights } from './hangar-signal-lights'
import { CycleRail } from './cycle-rail'

export function HangarInstrument({
  state,
  anchor,
  now,
}: {
  state: HangarState | null
  anchor: number
  now: number | null
}) {
  const phase =
    state?.phase ?? 'closed'

  const meta =
    PHASE_META[phase]

  const color =
    HANGAR_PHASE_COLORS[phase]

  const aging =
    now !== null &&
    now - anchor >
      cfg.syncAgingDays *
        86_400_000

  const nextTransition =
    state
      ? phase === 'open'
        ? state.nextClose
        : state.nextOpen
      : null

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-[#f5f5f2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">

      {/* 顶部工业状态条 */}
      <div className="border-b border-neutral-300/80 bg-[#ecece8] px-5 py-3">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center gap-3">

            <div className="flex size-8 items-center justify-center rounded-lg border border-neutral-300 bg-[#f8f8f5] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
              <Radio
                className="size-4 text-[#a66700]"
                strokeWidth={1.7}
              />
            </div>

            <div>
              <p className="font-display text-[0.58rem] tracking-[0.26em] text-neutral-800">
                {cfg.location}
              </p>

              <p className="mt-0.5 text-[9px] tracking-[0.16em] text-muted-foreground">
                行政机库周期监测系统
              </p>
            </div>

          </div>


          <div className="flex items-center gap-5 text-[10px] text-muted-foreground">

            <div className="flex items-center gap-2">

              <span
                className={cn(
                  'size-2 rounded-full',
                  aging
                    ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.75)]'
                    : state
                      ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]'
                      : 'bg-neutral-400',
                )}
              />

              <span className="font-medium tracking-[0.12em]">
                {state
                  ? aging
                    ? '校准数据可能过期'
                    : '周期同步正常'
                  : '正在同步'}
              </span>

            </div>

            <span className="hidden font-mono tabular-nums sm:inline">
              周期 {cfg.cycleMinutes} MIN
            </span>

          </div>

        </div>

      </div>


      <div className="grid lg:grid-cols-[0.95fr_1.05fr]">

        {/* 左侧主仪表 */}
        <div className="relative border-b border-neutral-300/80 px-5 py-7 lg:border-b-0 lg:border-r lg:px-7 lg:py-8">

          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 size-65 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
            style={{
              background: `radial-gradient(circle, color-mix(in oklab, ${color} 22%, transparent) 0%, transparent 70%)`,
            }}
          />

          <div className="relative z-10 flex flex-col items-center">

            <div className="mb-5 flex w-full items-center justify-between">

              <div>
                <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground">
                  主周期仪表
                </p>

                <p className="mt-1 text-xs text-neutral-600">
                  当前阶段剩余时间
                </p>
              </div>

              <div
                className="rounded-lg border px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em]"
                style={{
                  borderColor: color,
                  color,
                  background:
                    `color-mix(in oklab, ${color} 7%, white)`,
                }}
              >
                {meta.label}
              </div>

            </div>


            <PhaseGauge
              phase={phase}
              progress={
                state?.phaseProgress ??
                0
              }
            >
              <div className="flex items-center gap-2">

                <span
                  className="size-2 rounded-full"
                  style={{
                    background:
                      color,
                    boxShadow:
                      `0 0 12px ${color}`,
                  }}
                />

                <span
                  className="text-[10px] font-semibold tracking-[0.18em]"
                  style={{
                    color,
                  }}
                >
                  {meta.en}
                </span>

              </div>


              <span className="font-display text-[2.8rem] leading-none tabular-nums tracking-tight text-neutral-950 sm:text-[3.2rem]">
                {state
                  ? formatDuration(
                      state.phaseRemaining,
                    )
                  : '--:--'}
              </span>


              <span className="text-[10px] tracking-[0.14em] text-muted-foreground">
                距离下一状态变化
              </span>

            </PhaseGauge>


            <div className="mt-6 grid w-full grid-cols-2 gap-3">

              <div className="rounded-xl border border-neutral-300 bg-[#ededE9] px-4 py-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">

                <p className="text-[9px] tracking-[0.16em] text-muted-foreground">
                  下一状态时间
                </p>

                <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-neutral-900">
                  {nextTransition
                    ? clockInZone(
                        nextTransition,
                      )
                    : '--:--'}
                </p>

              </div>


              <div className="rounded-xl border border-neutral-300 bg-[#ededE9] px-4 py-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">

                <p className="text-[9px] tracking-[0.16em] text-muted-foreground">
                  当前阶段
                </p>

                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {meta.label}
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* 右侧设备状态区 */}
        <div className="flex flex-col gap-6 px-5 py-7 lg:px-7 lg:py-8">

          <div>

            <div className="mb-4 flex items-center justify-between">

              <div>
                <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground">
                  SIGNAL ARRAY
                </p>

                <h4 className="mt-1 text-sm font-semibold text-neutral-900">
                  信号灯状态
                </h4>
              </div>

              <span className="font-mono text-[10px] text-muted-foreground">
                {state
                  ? formatDuration(
                      state.signalRemaining,
                    )
                  : '--:--'}
              </span>

            </div>

            <div className="rounded-2xl border border-neutral-300 bg-[#e9e9e5] p-4 shadow-[inset_0_2px_5px_rgba(0,0,0,0.06)]">
              <HangarSignalLights
                phase={phase}
                active={
                  state?.activeSignals ??
                  0
                }
                nextChange={
                  state
                    ? formatDuration(
                        state.signalRemaining,
                      )
                    : '--:--'
                }
              />
            </div>

          </div>


          <dl className="grid gap-3 sm:grid-cols-2">

            <div className="rounded-2xl border border-neutral-300 bg-[#f8f8f5] p-4">

              <dt className="text-[9px] font-semibold tracking-[0.18em] text-muted-foreground">
                下一次开放
              </dt>

              <dd className="mt-2 font-display text-lg font-semibold tabular-nums tracking-tight text-neutral-950">
                {state
                  ? `${dateInZone(
                      state.nextOpen,
                    )} ${clockInZone(
                      state.nextOpen,
                    )}`
                  : '--'}
              </dd>

              <dd className="mt-1 text-[10px] text-muted-foreground">
                {state
                  ? `${formatMinutesRough(
                      state.untilNextOpen,
                    )} 后`
                  : '—'}
              </dd>

            </div>


            <div className="rounded-2xl border border-neutral-300 bg-[#f8f8f5] p-4">

              <dt className="text-[9px] font-semibold tracking-[0.18em] text-muted-foreground">
                下一次关闭
              </dt>

              <dd className="mt-2 font-display text-lg font-semibold tabular-nums tracking-tight text-neutral-950">
                {state
                  ? `${dateInZone(
                      state.nextClose,
                    )} ${clockInZone(
                      state.nextClose,
                    )}`
                  : '--'}
              </dd>

              <dd className="mt-1 text-[10px] text-muted-foreground">
                开放窗口 {cfg.openMinutes} 分钟
              </dd>

            </div>

          </dl>


          <div>

            <div className="mb-3 flex items-center justify-between">

              <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground">
                周期进度
              </p>

              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {Math.round(
                  (state?.cycleProgress ??
                    0) *
                    100,
                )}
                %
              </span>

            </div>

            <div className="rounded-xl border border-neutral-300 bg-[#ecece8] p-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]">
              <CycleRail
                progress={
                  state?.cycleProgress ??
                  0
                }
              />
            </div>

          </div>


          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-300 pt-4 text-[9px] tracking-[0.12em] text-muted-foreground">

            <span>
              最后校准 ·{' '}
              <span className="font-mono tabular-nums">
                {utcStamp(
                  new Date(
                    anchor,
                  ),
                )}
              </span>
            </span>

            <span>
              BUILD {cfg.gameVersion}
            </span>

          </div>

        </div>

      </div>

    </div>
  )
}