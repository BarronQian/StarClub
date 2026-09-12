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
  const phase = state?.phase ?? 'closed'
  const meta = PHASE_META[phase]
  const color = HANGAR_PHASE_COLORS[phase]
  const aging =
    now !== null && now - anchor > cfg.syncAgingDays * 86_400_000

  return (
    <div className="corner-cut border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3.5 lg:px-8">
        <span className="flex items-center gap-2.5 font-display text-[0.58rem] tracking-[0.3em] text-muted-foreground">
          <Radio className="size-3.5 text-primary" strokeWidth={1.8} />
          {cfg.location} / LIVE SYNC
        </span>
        <span className="flex items-center gap-5 font-display text-[0.55rem] tracking-[0.26em] text-muted-foreground">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                'size-1.5 rounded-full',
                aging ? 'bg-primary' : 'bg-[oklch(0.62_0.135_150)]',
              )}
              aria-hidden="true"
            />
            {state ? (aging ? 'SYNC AGING' : 'SYNCED') : 'SYNCING'}
          </span>
          <span className="tabular-nums">CYCLE {cfg.cycleMinutes} MIN</span>
        </span>
      </div>

      <div className="grid gap-10 px-6 py-8 lg:grid-cols-[45fr_55fr] lg:gap-0 lg:px-0 lg:py-0">
        {/* 左：倒计时仪表 */}
        <div className="relative flex flex-col items-center gap-6 lg:justify-center lg:px-8 lg:py-10">
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -z-10 size-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl transition-colors duration-700"
            style={{
              background: `radial-gradient(circle, color-mix(in oklab, ${color} 30%, transparent) 0%, transparent 72%)`,
            }}
          />
          <PhaseGauge phase={phase} progress={state?.phaseProgress ?? 0}>
            <span className="flex items-center gap-2">
              <span
                className="size-2 rounded-full transition-colors duration-300"
                style={{ background: color }}
                aria-hidden="true"
              />
              <span
                className="font-display text-[0.66rem] font-medium tracking-[0.22em]"
                style={{ color }}
              >
                {meta.label}
              </span>
            </span>
            <span className="font-display text-[2.5rem] leading-none tabular-nums tracking-tight text-foreground sm:text-[3rem] lg:text-[3.5rem]">
              {state ? formatDuration(state.phaseRemaining) : '--:--'}
            </span>
            <span className="text-[0.55rem] tracking-[0.26em] text-muted-foreground uppercase">
              距离下一状态变化
            </span>
          </PhaseGauge>

          <div className="flex w-full items-center justify-between border-t border-border pt-5 text-[0.6rem] tracking-[0.16em] text-muted-foreground">
            <span>
              {phase === 'open' ? '关闭时间' : '开启时间'}{' '}
              <span className="tabular-nums text-foreground">
                {state
                  ? clockInZone(
                      phase === 'open' ? state.nextClose : state.nextOpen,
                    )
                  : '--:--'}
              </span>
            </span>
            <span className="font-display text-[0.55rem] tracking-[0.22em]">
              {meta.en}
            </span>
          </div>
        </div>

        {/* 右：信息栈 */}
        <div className="flex flex-col gap-7 border-t border-border pt-8 lg:border-t-0 lg:border-l lg:px-8 lg:py-10 lg:pt-10">
          <HangarSignalLights
            phase={phase}
            active={state?.activeSignals ?? 0}
            nextChange={state ? formatDuration(state.signalRemaining) : '--:--'}
          />

          <dl className="grid gap-6 border-y border-border py-6 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <dt
                className={cn(
                  'text-[0.55rem] tracking-[0.26em] uppercase',
                  phase === 'open' ? 'text-muted-foreground' : 'text-primary',
                )}
              >
                Next Open
              </dt>
              <dd
                className={cn(
                  'font-display text-xl tabular-nums tracking-tight',
                  phase === 'open' ? 'text-foreground' : 'text-foreground font-semibold',
                )}
              >
                {state
                  ? `${dateInZone(state.nextOpen)} ${clockInZone(state.nextOpen)}`
                  : '--'}
              </dd>
              <dd className="text-[0.62rem] tracking-[0.12em] text-muted-foreground">
                {state ? `in ${formatMinutesRough(state.untilNextOpen)}` : '—'}
              </dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt
                className={cn(
                  'text-[0.55rem] tracking-[0.26em] uppercase',
                  phase === 'open' ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                Next Close
              </dt>
              <dd
                className={cn(
                  'font-display text-xl tabular-nums tracking-tight',
                  phase === 'open' ? 'text-foreground font-semibold' : 'text-foreground',
                )}
              >
                {state
                  ? `${dateInZone(state.nextClose)} ${clockInZone(state.nextClose)}`
                  : '--'}
              </dd>
              <dd className="text-[0.62rem] tracking-[0.12em] text-muted-foreground">
                {cfg.openMinutes} min window
              </dd>
            </div>
          </dl>

          <CycleRail progress={state?.cycleProgress ?? 0} />

          <div className="flex flex-wrap items-center justify-between gap-3 text-[0.55rem] tracking-[0.22em] text-muted-foreground uppercase">
            <span>
              Last sync ·{' '}
              <span className="tabular-nums">{utcStamp(new Date(anchor))}</span>
            </span>
            <span>Build {cfg.gameVersion}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
