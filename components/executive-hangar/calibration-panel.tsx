'use client'

import { useState } from 'react'
import {
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CLOSED_MS,
  utcStamp,
} from '@/lib/executive-hangar'

export function CalibrationPanel({
  anchor,
  onCalibrate,
  onReset,
}: {
  anchor: number
  /** 传入的是「转绿时刻」，内部换算为周期起点 */
  onCalibrate: (greenStartMs: number) => void
  onReset: () => void
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  return (
    <section className="corner-cut relative overflow-hidden border border-border/80 bg-background">
      {/* 顶部装饰灯线 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[10%] top-0 h-px bg-primary/50 shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
      />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="relative z-10 flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/20 lg:px-8"
      >
        <span className="flex items-center gap-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border/70 bg-muted/20">
            <SlidersHorizontal
              className="size-4 text-primary"
              strokeWidth={1.6}
            />
          </span>

          <span className="flex flex-col gap-1">
            <span className="font-display text-[0.58rem] tracking-[0.22em] text-muted-foreground">
              高级设置
            </span>

            <span className="font-display text-sm tracking-widest text-foreground">
              本地计时器校准
            </span>
          </span>
        </span>

        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-300',
            open && 'rotate-180',
          )}
          strokeWidth={1.6}
        />
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
          <div className="relative flex flex-col gap-5 border-t border-border px-6 py-6 lg:px-8">
            {/* 内部状态导轨 */}
            <div
              aria-hidden="true"
              className="absolute left-6 top-0 h-px w-24 bg-primary/70 shadow-[0_0_8px_hsl(var(--primary)/0.4)] lg:left-8"
            />

            <div className="flex max-w-2xl flex-col gap-2">
              <p className="text-sm leading-relaxed text-muted-foreground">
                服务器重启或游戏版本更新后，行政机库循环时间可能发生偏移。
                如果你已经确认游戏内信号灯状态与本站计时不一致，可以输入最近一次
                <span className="mx-1 text-foreground">
                  转绿时间
                </span>
                来重新校准当前计时器。
              </p>

              <p className="text-[0.7rem] leading-relaxed text-muted-foreground/80">
                校准结果只会保存在当前浏览器，不会影响其他访客看到的默认时间。
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <label className="flex flex-col gap-2">
                <span className="text-[0.58rem] tracking-[0.18em] text-muted-foreground">
                  最近一次转绿时间（本地时间）
                </span>

                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 top-0 w-px bg-primary/40"
                  />

                  <input
                    type="datetime-local"
                    step={1}
                    value={value}
                    onChange={(e) =>
                      setValue(e.target.value)
                    }
                    className="h-11 w-full border border-border bg-card px-3 pl-4 text-sm tabular-nums text-foreground outline-none transition-colors focus-visible:border-primary"
                  />
                </div>
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const parsed =
                      new Date(value).getTime()

                    if (!Number.isNaN(parsed)) {
                      onCalibrate(parsed)
                    }
                  }}
                  className="pill h-11 bg-primary px-6 font-display text-[0.62rem] tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-85"
                >
                  应用校准
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setValue('')
                    onReset()
                  }}
                  className="pill flex h-11 items-center gap-2 border border-border px-5 font-display text-[0.62rem] tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw
                    className="size-3.5"
                    strokeWidth={1.6}
                  />
                  恢复默认
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
              <span className="text-[0.62rem] tracking-[0.12em] text-muted-foreground">
                当前校准基准
              </span>

              <span className="font-display text-[0.62rem] tabular-nums tracking-[0.12em] text-foreground">
                {utcStamp(
                  new Date(anchor + CLOSED_MS),
                )}
              </span>

              <span className="text-[0.58rem] tracking-widest text-muted-foreground/70">
                最近一次转绿时间
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}