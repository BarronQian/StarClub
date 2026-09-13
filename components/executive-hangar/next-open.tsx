'use client'

import {
  useEffect,
  useState,
} from 'react'

import {
  Check,
  Clock3,
  Copy,
} from 'lucide-react'

import {
  clockInZone,
  dateInZone,
  formatMinutesRough,
} from '@/lib/executive-hangar'

import type {
  HangarPhase,
} from '@/lib/executive-hangar-config'

type NextOpenProps = {
  nextOpen: Date
  untilNextOpen: number
  isOpenNow: boolean
  phase: HangarPhase
}

export function NextOpen({
  nextOpen,
  untilNextOpen,
  isOpenNow,
  phase,
}: NextOpenProps) {
  const [
    copied,
    setCopied,
  ] = useState(false)

  useEffect(() => {
    if (!copied) {
      return
    }

    const id =
      window.setTimeout(
        () => {
          setCopied(false)
        },
        2200,
      )

    return () =>
      window.clearTimeout(
        id,
      )
  }, [copied])

  const copy =
    async () => {
      const stamp =
        `<t:${Math.floor(
          nextOpen.getTime() /
            1000,
        )}:F>`

      try {
        await navigator.clipboard.writeText(
          stamp,
        )

        setCopied(true)
      } catch {
        setCopied(false)
      }
    }

  const statusLabel =
    isOpenNow
      ? 'CURRENT WINDOW OPEN'
      : phase === 'reset'
        ? 'SYSTEM RESET'
        : 'LIVE CALCULATION'

  const countdownLabel =
    phase === 'reset'
      ? '重置结束后开放'
      : '距离开放'

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-300 bg-[#efefeb] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">

      {/* 顶部状态条 */}
      <div className="flex items-center justify-between gap-4 border-b border-neutral-300 bg-[#e6e6e1] px-4 py-3">

        <div className="flex items-center gap-2.5">

          <div className="flex size-7 items-center justify-center rounded-md border border-neutral-300 bg-[#f7f7f4]">
            <Clock3
              className="size-3.5 text-[#a66700]"
              strokeWidth={1.7}
            />
          </div>

          <div>
            <p className="text-[9px] font-semibold tracking-[0.18em] text-neutral-700">
              NEXT EXECUTIVE HANGAR
            </p>

            <p className="mt-0.5 text-[9px] text-muted-foreground">
              下一次行政机库开放
            </p>
          </div>

        </div>

        <div className="flex items-center gap-2">

          <span
            className={
              isOpenNow
                ? 'size-2 rounded-full bg-emerald-500 shadow-[0_0_9px_rgba(16,185,129,0.65)]'
                : phase === 'reset'
                  ? 'size-2 rounded-full bg-yellow-400 shadow-[0_0_9px_rgba(250,204,21,0.65)]'
                  : 'size-2 rounded-full bg-amber-500 shadow-[0_0_9px_rgba(245,158,11,0.55)]'
            }
          />

          <span className="text-[8px] font-medium tracking-[0.12em] text-muted-foreground">
            {statusLabel}
          </span>

        </div>

      </div>

      <div className="p-4">

        {/* 主时间显示 */}
        <div className="rounded-xl border border-neutral-500/50 bg-[linear-gradient(180deg,#282825_0%,#1d1d1b_100%)] px-5 py-5 shadow-[inset_0_0_24px_rgba(0,0,0,0.65)]">

          <p className="text-[8px] tracking-[0.18em] text-white/35">
            LOCAL OPEN TIME
          </p>

          <div className="mt-2 flex items-end gap-3">

            <span className="font-mono text-4xl font-semibold leading-none tabular-nums tracking-tight text-white sm:text-5xl">
              {clockInZone(
                nextOpen,
              )}
            </span>

            <span className="pb-1 text-[10px] text-white/40">
              LOCAL
            </span>

          </div>

          <p className="mt-2 font-mono text-[10px] tabular-nums text-white/45">
            {dateInZone(
              nextOpen,
            )}
          </p>

        </div>

        {/* 第二时区 + 倒计时 */}
        <div className="mt-3 grid grid-cols-2 gap-3">

          <div className="rounded-xl border border-neutral-300 bg-[#f8f8f5] p-4">

            <p className="text-[8px] font-semibold tracking-[0.16em] text-muted-foreground">
              北京时间
            </p>

            <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-neutral-950">
              {clockInZone(
                nextOpen,
                'Asia/Shanghai',
              )}
            </p>

            <p className="mt-1 text-[9px] text-muted-foreground">
              UTC+8
            </p>

          </div>

          <div className="rounded-xl border border-neutral-300 bg-[#f8f8f5] p-4">

            <p className="text-[8px] font-semibold tracking-[0.16em] text-muted-foreground">
              {countdownLabel}
            </p>

            <p className="mt-2 text-xl font-semibold tracking-tight text-[#a66700]">
              {formatMinutesRough(
                untilNextOpen,
              )}
            </p>

            <p className="mt-1 text-[9px] text-muted-foreground">
              COUNTDOWN
            </p>

          </div>

        </div>

        {/* 当前已开放提示 */}
        {isOpenNow && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">

            <div className="flex items-center gap-2">

              <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]" />

              <p className="text-xs font-medium text-emerald-800">
                当前正处于开放窗口
              </p>

            </div>

            <p className="mt-1.5 text-[10px] leading-4 text-emerald-700/75">
              上方时间显示的是当前窗口结束后的下一次开放时间。
            </p>

          </div>
        )}

        {/* 黑区重置提示 */}
        {phase === 'reset' && (
          <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">

            <div className="flex items-center gap-2">

              <span className="size-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.55)]" />

              <p className="text-xs font-medium text-yellow-800">
                当前处于黑区重置阶段
              </p>

            </div>

            <p className="mt-1.5 text-[10px] leading-4 text-yellow-800/70">
              信号灯已全部熄灭，重置完成后将进入下一轮充能周期。
            </p>

          </div>
        )}

        {/* Discord 时间戳 */}
        <div className="mt-4 border-t border-neutral-300 pt-4">

          <button
            type="button"
            onClick={copy}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-neutral-400 bg-[#e5e5e0] px-4 text-[10px] font-semibold tracking-[0.12em] text-neutral-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-colors hover:bg-[#dbdbd5]"
          >
            {copied ? (
              <Check
                className="size-3.5"
                strokeWidth={1.8}
              />
            ) : (
              <Copy
                className="size-3.5"
                strokeWidth={1.6}
              />
            )}

            {copied
              ? '已复制 Discord 时间'
              : '复制 Discord 时间'}
          </button>

          <p
            aria-live="polite"
            className={`mt-2 text-center text-[9px] text-muted-foreground transition-opacity duration-300 ${
              copied
                ? 'opacity-100'
                : 'opacity-0'
            }`}
          >
            Discord timestamp copied
          </p>

        </div>

      </div>

    </section>
  )
}