import {
  executiveHangarConfig as cfg,
  type HangarPhase,
} from './executive-hangar-config'

const MIN = 60_000
export const CYCLE_MS = cfg.cycleMinutes * MIN
export const CLOSED_MS = cfg.closedMinutes * MIN
export const OPEN_MS = cfg.openMinutes * MIN
export const RESET_MS = cfg.resetMinutes * MIN

export type HangarWindow = { open: Date; close: Date }

export type HangarState = {
  phase: HangarPhase
  /** 当前周期已经过去的毫秒 */
  cycleElapsed: number
  /** 当前周期进度 0–1 */
  cycleProgress: number
  /** 当前阶段进度 0–1 */
  phaseProgress: number
  /** 当前阶段剩余毫秒 */
  phaseRemaining: number
  /** 当前亮起的灯数 0–5 */
  activeSignals: number
  /** 距离下一次灯位变化的毫秒 */
  signalRemaining: number
  cycleStart: Date
  currentWindow: HangarWindow
  nextOpen: Date
  nextClose: Date
  /** 距离下一次开启的毫秒（若正在开启中则为下一轮） */
  untilNextOpen: number
}

function mod(a: number, n: number) {
  return ((a % n) + n) % n
}

export function computeHangarState(now: number, anchor: number): HangarState {
  const elapsed = mod(now - anchor, CYCLE_MS)
  const cycleStartMs = now - elapsed
  const openStartMs = cycleStartMs + CLOSED_MS
  const closeMs = openStartMs + OPEN_MS

  let phase: HangarPhase
  let phaseRemaining: number
  let phaseProgress: number
  let activeSignals: number
  let signalRemaining: number

  if (elapsed < CLOSED_MS) {
    phase = 'closed'
    phaseRemaining = CLOSED_MS - elapsed
    phaseProgress = elapsed / CLOSED_MS
    const step = cfg.chargingLightInterval * MIN
    activeSignals = Math.min(5, Math.floor(elapsed / step))
    signalRemaining = step - (elapsed % step)
  } else if (elapsed < CLOSED_MS + OPEN_MS) {
    phase = 'open'
    const into = elapsed - CLOSED_MS
    phaseRemaining = OPEN_MS - into
    phaseProgress = into / OPEN_MS
    const step = cfg.activeLightInterval * MIN
    activeSignals = Math.max(0, 5 - Math.floor(into / step))
    signalRemaining = step - (into % step)
  } else {
    phase = 'reset'
    const into = elapsed - CLOSED_MS - OPEN_MS
    phaseRemaining = RESET_MS - into
    phaseProgress = into / RESET_MS
    activeSignals = 0
    signalRemaining = phaseRemaining
  }

  const isOpen = phase === 'open'
  const nextOpenMs = isOpen ? openStartMs + CYCLE_MS : openStartMs
  const nextCloseMs = isOpen ? closeMs : nextOpenMs + OPEN_MS

  return {
    phase,
    cycleElapsed: elapsed,
    cycleProgress: elapsed / CYCLE_MS,
    phaseProgress,
    phaseRemaining,
    activeSignals,
    signalRemaining,
    cycleStart: new Date(cycleStartMs),
    currentWindow: { open: new Date(openStartMs), close: new Date(closeMs) },
    nextOpen: new Date(nextOpenMs),
    nextClose: new Date(nextCloseMs),
    untilNextOpen: nextOpenMs - now,
  }
}

/** 从当前周期开始，列出未来若干个开启窗口（尚未结束的窗口都会包含） */
export function listUpcomingWindows(
  state: HangarState,
  now: number,
  count = 6,
): HangarWindow[] {
  const first =
    state.currentWindow.close.getTime() > now
      ? state.currentWindow.open.getTime()
      : state.currentWindow.open.getTime() + CYCLE_MS

  return Array.from({ length: count }, (_, i) => {
    const open = first + i * CYCLE_MS
    return { open: new Date(open), close: new Date(open + OPEN_MS) }
  })
}

export function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

export function formatMinutesRough(ms: number) {
  const total = Math.max(0, Math.round(ms / MIN))
  if (total < 60) return `${total} min`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export function formatInZone(
  date: Date,
  zone: string | undefined,
  opts: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat('zh-CN', {
    ...opts,
    hour12: false,
    timeZone: zone,
  }).format(date)
}

export function clockInZone(date: Date, zone?: string) {
  return formatInZone(date, zone, { hour: '2-digit', minute: '2-digit' })
}

export function dateInZone(date: Date, zone?: string) {
  return formatInZone(date, zone, { month: '2-digit', day: '2-digit' })
}

export function utcStamp(date: Date) {
  return `${formatInZone(date, 'UTC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '.')} · ${clockInZone(date, 'UTC')} UTC`
}

export const PHASE_META: Record<
  HangarPhase,
  { label: string; en: string; short: string }
> = {
  closed: { label: '红灯 · 充能中', en: 'CLOSED / CHARGING', short: 'CLOSED' },
  open: { label: '绿灯 · 开启中', en: 'OPEN / ACTIVE', short: 'OPEN' },
  reset: { label: '黑区 · 重置', en: 'RESET / BLACKOUT', short: 'RESET' },
}
