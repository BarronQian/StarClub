'use client'

import { useState } from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { utcStamp } from '@/lib/executive-hangar'
import { CLOSED_MS } from '@/lib/executive-hangar'

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
    <section className="corner-cut border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left lg:px-8"
      >
        <span className="flex flex-col gap-1">
          <span className="font-display text-[0.58rem] tracking-[0.3em] text-muted-foreground">
            ADVANCED
          </span>
          <span className="font-display text-sm tracking-[0.12em] text-foreground">
            LOCAL TIMER CALIBRATION
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
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-5 border-t border-border px-6 py-6 lg:px-8">
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              服务器重启或游戏版本更新可能导致循环发生偏移。若确认游戏内灯位发生变化，可使用新的同步时间重新校准。
            </p>
            <p className="max-w-2xl text-[0.7rem] leading-relaxed text-muted-foreground/80">
              仅调整当前浏览器中的计时基准，不会影响其他访客。
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex flex-1 flex-col gap-2">
                <span className="text-[0.58rem] tracking-[0.26em] text-muted-foreground uppercase">
                  Known cycle start · 最近一次转绿时间（本地）
                </span>
                <input
                  type="datetime-local"
                  step={1}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="h-11 w-full border border-border bg-card px-3 text-sm tabular-nums text-foreground outline-none transition-colors focus-visible:border-primary"
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const parsed = new Date(value).getTime()
                    if (!Number.isNaN(parsed)) onCalibrate(parsed)
                  }}
                  className="pill h-11 bg-primary px-6 font-display text-[0.62rem] tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-85"
                >
                  CALIBRATE
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('')
                    onReset()
                  }}
                  className="pill flex h-11 items-center gap-2 border border-border px-5 font-display text-[0.62rem] tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" strokeWidth={1.6} />
                  RESET DEFAULT
                </button>
              </div>
            </div>

            <p className="text-[0.68rem] tracking-[0.1em] text-muted-foreground">
              CURRENT ANCHOR ·{' '}
              <span className="tabular-nums text-foreground">
                {utcStamp(new Date(anchor + CLOSED_MS))}
              </span>{' '}
              <span className="text-muted-foreground/70">(green start)</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
