'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  computeHangarState,
  listUpcomingWindows,
  CLOSED_MS,
} from '@/lib/executive-hangar'
import {
  executiveHangarConfig as cfg,
  type HangarTimezoneId,
} from '@/lib/executive-hangar-config'
import { HangarInstrument } from './hangar-instrument'
import { NextOpen } from './next-open'
import { UpcomingWindows } from './upcoming-windows'
import { CalibrationPanel } from './calibration-panel'

const DEFAULT_ANCHOR =
  new Date(
    cfg.anchorTime,
  ).getTime()

function formatLocalClock(
  value: number,
) {
  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    },
  ).format(
    new Date(value),
  )
}

function formatUtcClock(
  value: number,
) {
  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    },
  ).format(
    new Date(value),
  )
}

function formatUtcDateTime(
  value: number,
) {
  const date =
    new Date(value)

  const datePart =
    new Intl.DateTimeFormat(
      'zh-CN',
      {
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC',
      },
    ).format(date)

  const timePart =
    new Intl.DateTimeFormat(
      'zh-CN',
      {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      },
    ).format(date)

  return `${datePart} · ${timePart}`
}

export function ExecutiveHangarTool() {
  const [
    anchor,
    setAnchor,
  ] =
    useState(
      DEFAULT_ANCHOR,
    )

  const [
    timezone,
    setTimezone,
  ] =
    useState<HangarTimezoneId>(
      'local',
    )

  const [
    now,
    setNow,
  ] =
    useState<
      number | null
    >(null)

  useEffect(() => {
    setNow(Date.now())

    const id =
      window.setInterval(
        () => {
          setNow(
            Date.now(),
          )
        },
        1000,
      )

    return () =>
      window.clearInterval(
        id,
      )
  }, [])

  const state =
    useMemo(
      () =>
        now === null
          ? null
          : computeHangarState(
              now,
              anchor,
            ),
      [
        now,
        anchor,
      ],
    )

  const windows =
    useMemo(
      () =>
        state &&
        now !== null
          ? listUpcomingWindows(
              state,
              now,
              5,
            )
          : [],
      [
        state,
        now,
      ],
    )

  const statusLabel =
    state?.phase === 'open'
      ? '当前可进入'
      : state?.phase === 'reset'
        ? '正在重置'
        : state
          ? '等待开放'
          : '正在同步'

  const statusTone =
    state?.phase === 'open'
      ? 'text-emerald-700'
      : state?.phase === 'reset'
        ? 'text-yellow-700'
        : 'text-[#a66700]'

  const statusDot =
    state?.phase === 'open'
      ? 'bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.7)]'
      : state?.phase === 'reset'
        ? 'bg-yellow-400 shadow-[0_0_14px_rgba(250,204,21,0.65)]'
        : 'bg-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.55)]'

  return (
    <div className="flex flex-col gap-6">

      <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_16px_50px_rgba(0,0,0,0.055)]">

        <div className="border-b border-border bg-[linear-gradient(180deg,#ffffff_0%,#faf9f6_100%)] px-6 py-5 lg:px-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="flex items-center gap-3">
                <span
                  className={`size-2.5 rounded-full ${statusDot}`}
                />

                <p
                  className={`text-xs font-semibold tracking-[0.18em] ${statusTone}`}
                >
                  {statusLabel}
                </p>
              </div>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950 lg:text-3xl">
                行政机库状态控制台
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                根据当前周期计算行政机库开放状态、下一次开放时间与后续窗口。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

              <div className="rounded-2xl border border-border bg-white px-4 py-3">
                <p className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground">
                  当前时间
                </p>

                <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-neutral-900">
                {now !== null
                  ? formatLocalClock(
                      now,
                    )
                  : '--:--:--'}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-white px-4 py-3">
                <p className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground">
                  当前阶段
                </p>

                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {state?.phase === 'open'
                    ? '开放阶段'
                    : state?.phase === 'reset'
                      ? '重置阶段'
                      : state
                        ? '关闭阶段'
                        : '同步中'}
                </p>
              </div>

              <div className="col-span-2 rounded-2xl border border-border bg-white px-4 py-3 sm:col-span-1">
                <p className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground">
                  周期基准 UTC
                </p>

                <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-neutral-900">
                  {formatUtcDateTime(
                    anchor,
                  )}
                </p>
              </div>

            </div>

          </div>

        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">

          <div className="border-b border-border p-5 lg:border-b-0 lg:border-r lg:p-7">

            <div className="mb-4 flex items-center justify-between">

              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
                  CYCLE INSTRUMENT
                </p>

                <h3 className="mt-1 text-base font-semibold text-neutral-950">
                  周期主仪表
                </h3>
              </div>

            </div>

            <div className="rounded-2xl border border-border bg-[#fbfbfa] p-3 lg:p-4">
              <HangarInstrument
                state={
                  state
                }
                anchor={
                  anchor
                }
                now={
                  now
                }
              />
            </div>

          </div>

          <div className="flex flex-col gap-4 p-5 lg:p-7">

            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
                NEXT WINDOW
              </p>

              <h3 className="mt-1 text-base font-semibold text-neutral-950">
                下一次开放
              </h3>
            </div>

            {state ? (
              <NextOpen
                nextOpen={state.nextOpen}
                untilNextOpen={state.untilNextOpen}
                isOpenNow={state.phase === 'open'}
                phase={state.phase}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
                正在同步周期状态...
              </div>
            )}

          </div>

        </div>

      </section>


      {windows.length >
        0 &&
        now !==
          null && (
        <section className="rounded-3xl border border-border bg-white p-5 shadow-[0_12px_36px_rgba(0,0,0,0.04)] lg:p-7">

          <div className="mb-5">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
              UPCOMING WINDOWS
            </p>

            <h3 className="mt-1 text-lg font-semibold text-neutral-950">
              后续开放窗口
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              查看接下来几次行政机库开放时间，并可切换显示时区。
            </p>
          </div>

          <UpcomingWindows
            windows={
              windows
            }
            now={
              now
            }
            timezone={
              timezone
            }
            onTimezoneChange={
              setTimezone
            }
          />

        </section>
      )}


      <section className="rounded-3xl border border-border bg-white p-5 shadow-[0_12px_36px_rgba(0,0,0,0.04)] lg:p-7">

        <div className="mb-5">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
            CALIBRATION
          </p>

          <h3 className="mt-1 text-lg font-semibold text-neutral-950">
            周期校准
          </h3>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            如果游戏内实际开放时间与网页预测存在偏差，可以重新校准当前周期。
          </p>
        </div>

        <CalibrationPanel
          anchor={
            anchor
          }
          onCalibrate={(
            greenStart,
          ) =>
            setAnchor(
              greenStart -
                CLOSED_MS,
            )
          }
          onReset={() =>
            setAnchor(
              DEFAULT_ANCHOR,
            )
          }
        />

      </section>

    </div>
  )
}