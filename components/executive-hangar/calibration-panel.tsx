'use client'

import { useState } from 'react'
import {
  ChevronDown,
  RotateCcw,
  Wrench,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  clockInZone,
  dateInZone,
  utcStamp,
  CLOSED_MS,
} from '@/lib/executive-hangar'

export function CalibrationPanel({
  anchor,
  onCalibrate,
  onReset,
}: {
  anchor: number
  /** 传入的是「转绿时刻」，内部换算为周期起点 */
  onCalibrate: (
    greenStartMs: number,
  ) => void
  onReset: () => void
}) {
  const [open, setOpen] =
    useState(false)

  const [value, setValue] =
    useState('')

  const [calibrated, setCalibrated] =
    useState(false)

  const handleCalibrate = () => {
    const parsed =
      new Date(
        value,
      ).getTime()

    if (
      Number.isNaN(
        parsed,
      )
    ) {
      return
    }

    onCalibrate(
      parsed,
    )

    setCalibrated(true)

    window.setTimeout(
      () => {
        setCalibrated(
          false,
        )
      },
      1800,
    )
  }

  const handleReset = () => {
    setValue('')
    setCalibrated(false)
    onReset()
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-300 bg-[#ededE9] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">

      <button
        type="button"
        onClick={() =>
          setOpen(
            (v) =>
              !v,
          )
        }
        aria-expanded={
          open
        }
        className="flex w-full items-center justify-between gap-4 bg-[#e5e5e0] px-4 py-4 text-left transition-colors hover:bg-[#ddddD8] sm:px-5"
      >

        <div className="flex items-center gap-3">

          <div className="flex size-9 items-center justify-center rounded-lg border border-neutral-300 bg-[#f8f8f5] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
            <Wrench
              className="size-4 text-[#a66700]"
              strokeWidth={
                1.7
              }
            />
          </div>

          <div>
            <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground">
              MAINTENANCE
              / CALIBRATION
            </p>

            <p className="mt-1 text-sm font-semibold text-neutral-900">
              本地周期校准
            </p>
          </div>

        </div>


        <div className="flex items-center gap-3">

          <span className="hidden text-[9px] tracking-[0.12em] text-muted-foreground sm:block">
            ADVANCED
            CONTROL
          </span>

          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-300',
              open &&
                'rotate-180',
            )}
            strokeWidth={
              1.6
            }
          />

        </div>

      </button>


      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          open
            ? 'grid-rows-[1fr]'
            : 'grid-rows-[0fr]',
        )}
      >

        <div className="overflow-hidden">

          <div className="border-t border-neutral-300 px-4 py-5 sm:px-5">

            {/* 说明 */}
            <div className="rounded-xl border border-neutral-300 bg-[#f8f8f5] p-4">

              <div className="flex items-start gap-3">

                <span className="mt-1 size-2 shrink-0 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.55)]" />

                <div>
                  <p className="text-xs font-medium text-neutral-800">
                    什么时候需要校准？
                  </p>

                    <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-muted-foreground">
                      服务器重启、版本更新或游戏内周期发生偏移后，网页预测时间可能与实际灯位不同。
                      请记录游戏内
                      <span className="font-semibold text-neutral-800">
                        {' '}五盏信号灯全部转绿
                      </span>
                      、行政机库正式进入开放阶段的准确时间，并将该时间作为新的校准点。
                    </p>

                    <p className="mt-2 text-[10px] leading-4 text-amber-700/80">
                      注意：不要使用第一盏、第二盏或其他单独信号灯转绿的时间。
                    </p>

                    <p className="mt-2 text-[10px] leading-4 text-muted-foreground/75">
                      系统会根据这个“全绿时刻”自动向前推算 120 分钟，得到新的周期起点。
                    </p>
                </div>

              </div>

            </div>


            {/* 输入区 */}
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">

              <label className="flex flex-col gap-2">

                <div className="flex items-center justify-between gap-3">

                <span className="text-[9px] font-semibold tracking-[0.16em] text-muted-foreground">
                  最近一次五盏灯全部转绿时间
                </span>

                  <span className="text-[8px] tracking-[0.12em] text-muted-foreground">
                    LOCAL TIME
                  </span>

                </div>

                <div className="rounded-xl border border-neutral-400/70 bg-[#d9d9d4] p-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]">

                  <input
                    type="datetime-local"
                    step={1}
                    value={
                      value
                    }
                    onChange={(
                      e,
                    ) =>
                      setValue(
                        e
                          .target
                          .value,
                      )
                    }
                    className="h-11 w-full rounded-lg border border-neutral-400/70 bg-[#f8f8f5] px-3 font-mono text-sm tabular-nums text-neutral-900 outline-none transition-colors focus:border-[#b7791f]"
                  />

                </div>

              </label>


              <div className="flex flex-col gap-2 sm:flex-row">

                <button
                  type="button"
                  onClick={
                    handleCalibrate
                  }
                  disabled={
                    !value
                  }
                  className="flex h-12 items-center justify-center gap-2 rounded-lg border border-[#946000] bg-[#b7791f] px-5 text-[10px] font-semibold tracking-[0.12em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:bg-[#a86d1c] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {calibrated ? (
                    <Check
                      className="size-3.5"
                      strokeWidth={
                        1.8
                      }
                    />
                  ) : (
                    <Wrench
                      className="size-3.5"
                      strokeWidth={
                        1.6
                      }
                    />
                  )}

                  {calibrated
                    ? '校准完成'
                    : '应用校准'}
                </button>


                <button
                  type="button"
                  onClick={
                    handleReset
                  }
                  className="flex h-12 items-center justify-center gap-2 rounded-lg border border-neutral-400 bg-[#e5e5e0] px-4 text-[10px] font-semibold tracking-widest text-neutral-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-colors hover:bg-[#d9d9d4]"
                >
                  <RotateCcw
                    className="size-3.5"
                    strokeWidth={
                      1.6
                    }
                  />

                  恢复默认
                </button>

              </div>

            </div>


            {/* 当前基准 */}
              <div className="mt-4 rounded-xl border border-neutral-400/60 bg-[#d9d9d4] p-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]">

                <div className="rounded-lg border border-neutral-400/60 bg-[linear-gradient(180deg,#2c2c29_0%,#20201e_100%)] px-4 py-4">

                  <div>
                    <p className="text-[8px] font-semibold tracking-[0.16em] text-white/35">
                      FULL GREEN / OPEN ANCHOR
                    </p>

                    <p className="mt-1 text-[10px] text-white/45">
                      当前全绿 / 开放基准时间
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">

                    <div className="rounded-lg border border-white/10 bg-white/4 px-3 py-3">
                      <p className="text-[8px] font-semibold tracking-[0.14em] text-white/35">
                        LOCAL TIME
                      </p>

                      <p className="mt-1.5 font-mono text-sm font-semibold tabular-nums text-white/85">
                        {clockInZone(
                          new Date(
                            anchor +
                              CLOSED_MS,
                          ),
                        )}
                      </p>

                      <p className="mt-1 font-mono text-[9px] tabular-nums text-white/40">
                        {dateInZone(
                          new Date(
                            anchor +
                              CLOSED_MS,
                          ),
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/4 px-3 py-3">
                      <p className="text-[8px] font-semibold tracking-[0.14em] text-white/35">
                        UTC REFERENCE
                      </p>

                      <p className="mt-1.5 font-mono text-xs tabular-nums text-white/75 sm:text-sm">
                        {utcStamp(
                          new Date(
                            anchor +
                              CLOSED_MS,
                          ),
                        )}
                      </p>
                    </div>

                  </div>

                </div>

              </div>

          </div>

        </div>

      </div>

    </section>
  )
}