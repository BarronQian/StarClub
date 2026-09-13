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
        <div
            className="corner-cut relative overflow-hidden border border-border/80 bg-card shadow-[0_18px_60px_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(255,255,255,0.35)]"
            style={{
              boxShadow: `
                0 18px 60px rgba(0,0,0,0.05),
                inset 0 0 0 1px rgba(255,255,255,0.35),
                0 0 28px color-mix(in oklab, ${color} 10%, transparent)
              `,
            }}
          >

            {/* 外框技术装饰 */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0"
            >
              {/* 顶部发光导轨 */}
              <div
                className="absolute left-[8%] right-[8%] top-0 h-px"
                style={{
                  background: `linear-gradient(
                    90deg,
                    transparent,
                    color-mix(in oklab, ${color} 70%, white),
                    transparent
                  )`,
                  boxShadow: `0 0 12px color-mix(in oklab, ${color} 50%, transparent)`,
                }}
              />

              {/* 左侧机械导轨 */}
              <div className="absolute bottom-8 left-2 top-8 flex w-2 flex-col items-center justify-between">
                <span className="h-10 w-px bg-border/70" />
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    background: color,
                    boxShadow: `0 0 7px ${color}`,
                  }}
                />
                <span className="h-10 w-px bg-border/70" />
              </div>

              {/* 右侧机械导轨 */}
              <div className="absolute bottom-8 right-2 top-8 flex w-2 flex-col items-center justify-between">
                <span className="h-10 w-px bg-border/70" />
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    background: color,
                    boxShadow: `0 0 7px ${color}`,
                  }}
                />
                <span className="h-10 w-px bg-border/70" />
              </div>

              {/* 四角定位标记 */}
              <span className="absolute left-3 top-3 h-3 w-3 border-l border-t border-foreground/25" />
              <span className="absolute right-3 top-3 h-3 w-3 border-r border-t border-foreground/25" />
              <span className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-foreground/25" />
              <span className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-foreground/25" />
            </div>

        <div className="relative z-10 overflow-hidden border-b  border-border bg-muted/15 px-6 py-3.5 lg:px-8">
          {/* 顶部状态灯线 */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: aging
                ? HANGAR_PHASE_COLORS.reset
                : HANGAR_PHASE_COLORS.open,
              boxShadow: aging
                ? `0 0 14px ${HANGAR_PHASE_COLORS.reset}`
                : `0 0 14px ${HANGAR_PHASE_COLORS.open}`,
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* 小型设备图标框 */}
              <div className="grid size-8 place-items-center rounded-md border border-border/70 bg-background/70 shadow-[inset_0_0_10px_rgba(0,0,0,0.03)]">
                <Radio
                  className="size-3.5 text-primary"
                  strokeWidth={1.8}
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="font-display text-[0.58rem] tracking-[0.3em] text-foreground">
                  {cfg.location}
                </span>

                <span className="text-[0.5rem] tracking-[0.24em] text-muted-foreground">
                  行政机库控制节点
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* 同步状态 */}
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{
                    background: aging
                      ? HANGAR_PHASE_COLORS.reset
                      : HANGAR_PHASE_COLORS.open,
                    boxShadow: aging
                      ? `0 0 8px ${HANGAR_PHASE_COLORS.reset}`
                      : `0 0 8px ${HANGAR_PHASE_COLORS.open}`,
                  }}
                  aria-hidden="true"
                />

                <span className="font-display text-[0.55rem] tracking-[0.2em] text-muted-foreground">
                {state
                  ? aging
                    ? '同步数据较旧'
                    : '已同步'
                  : '正在同步'}
                </span>
              </div>

              {/* 周期参数 */}
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-1.5">
                <span className="text-[0.5rem] tracking-[0.18em] text-muted-foreground">
                  完整周期
                </span>

                <span className="font-display text-[0.58rem] tabular-nums tracking-[0.18em] text-foreground">
                  {cfg.cycleMinutes} 分钟
                </span>
              </div>
            </div>
          </div>
        </div>

      <div className="relative z-10 grid gap-10 px-6 py-8 lg:grid-cols-[45fr_55fr] lg:gap-0 lg:px-0 lg:py-0">
        {/* 左：倒计时仪表 */}
        <div className="relative flex flex-col items-center gap-6 lg:justify-center lg:px-8 lg:py-10">
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -z-10 size-70 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl transition-colors duration-700"
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
            <span className="text-[0.55rem] tracking-[0.2em] text-muted-foreground">
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
                {phase === 'open'
                  ? '机库开启中'
                  : phase === 'reset'
                    ? '系统重置中'
                    : '等待开启'}
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

          <dl className="grid gap-3 border-y border-border py-6 sm:grid-cols-2">
            <div
              className={cn(
                'relative overflow-hidden rounded-xl border p-4 transition-all',
                phase !== 'open'
                  ? 'border-border/70 bg-muted/20'
                  : 'border-border/50 bg-background/60',
              )}
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    phase !== 'open'
                      ? HANGAR_PHASE_COLORS.closed
                      : 'transparent',
                  boxShadow:
                    phase !== 'open'
                      ? `0 0 12px ${HANGAR_PHASE_COLORS.closed}`
                      : 'none',
                }}
              />

              <div className="mb-3 flex items-center justify-between gap-3">
                <dt
                  className={cn(
                    'text-[0.55rem] tracking-[0.18em]',
                    phase === 'open'
                      ? 'text-muted-foreground'
                      : 'text-foreground',
                  )}
                >
                  下次开启
                </dt>

                <span
                  className="size-2 rounded-full"
                  style={{
                    background:
                      phase === 'open'
                        ? HANGAR_PHASE_COLORS.track
                        : HANGAR_PHASE_COLORS.closed,
                    boxShadow:
                      phase === 'open'
                        ? 'none'
                        : `0 0 8px ${HANGAR_PHASE_COLORS.closed}`,
                  }}
                  aria-hidden="true"
                />
              </div>

              <dd
                className={cn(
                  'font-display text-xl tabular-nums tracking-tight',
                  phase === 'open'
                    ? 'text-foreground'
                    : 'font-semibold text-foreground',
                )}
              >
                {state
                  ? `${dateInZone(state.nextOpen)} ${clockInZone(state.nextOpen)}`
                  : '--'}
              </dd>

              <dd className="mt-1.5 text-[0.62rem] tracking-[0.12em] text-muted-foreground">
                {state
                  ? `距离开启 ${formatMinutesRough(state.untilNextOpen)}`
                  : '—'}
              </dd>
            </div>

            <div
              className={cn(
                'relative overflow-hidden rounded-xl border p-4 transition-all',
                phase === 'open'
                  ? 'border-border/70 bg-muted/20'
                  : 'border-border/50 bg-background/60',
              )}
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    phase === 'open'
                      ? HANGAR_PHASE_COLORS.open
                      : 'transparent',
                  boxShadow:
                    phase === 'open'
                      ? `0 0 12px ${HANGAR_PHASE_COLORS.open}`
                      : 'none',
                }}
              />

              <div className="mb-3 flex items-center justify-between gap-3">
                <dt
                  className={cn(
                    'text-[0.55rem] tracking-[0.18em]',
                    phase === 'open'
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  下次关闭
                </dt>

                <span
                  className="size-2 rounded-full"
                  style={{
                    background:
                      phase === 'open'
                        ? HANGAR_PHASE_COLORS.open
                        : HANGAR_PHASE_COLORS.track,
                    boxShadow:
                      phase === 'open'
                        ? `0 0 8px ${HANGAR_PHASE_COLORS.open}`
                        : 'none',
                  }}
                  aria-hidden="true"
                />
              </div>

              <dd
                className={cn(
                  'font-display text-xl tabular-nums tracking-tight',
                  phase === 'open'
                    ? 'font-semibold text-foreground'
                    : 'text-foreground',
                )}
              >
                {state
                  ? `${dateInZone(state.nextClose)} ${clockInZone(state.nextClose)}`
                  : '--'}
              </dd>

              <dd className="mt-1.5 text-[0.62rem] tracking-[0.12em] text-muted-foreground">
                开启窗口持续 {cfg.openMinutes} 分钟
              </dd>
            </div>
          </dl>

          <CycleRail progress={state?.cycleProgress ?? 0} />

          <div className="flex flex-wrap items-center justify-between gap-3 text-[0.55rem] tracking-[0.16em] text-muted-foreground">
            <span>
              最后同步 ·{' '}
              <span className="tabular-nums">
                {utcStamp(new Date(anchor))}
              </span>
            </span>

            <span>
              游戏版本 {cfg.gameVersion}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
