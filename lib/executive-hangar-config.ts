/**
 * 行政机库计时器 · 全局参数
 * 所有周期常量集中在此，禁止在组件中散落硬编码。
 */
export const executiveHangarConfig = {
  cycleMinutes: 185,

  /** 每轮周期额外偏移，来源于当前行政机库周期数据 */
  cycleOffsetMs: 699,

  closedMinutes: 120,
  openMinutes: 60,
  resetMinutes: 5,

  /** 充能阶段每盏灯间隔（分钟） */
  chargingLightInterval: 24,
  /** 开启阶段每盏灯熄灭间隔（分钟） */
  activeLightInterval: 12,

  /** 基准：一次关闭阶段起点的 UTC 时间 */
  anchorTime: '2026-09-13T09:11:52Z',

  location: 'PYAM-EXHANG',
  gameVersion: '4.10.0-HOTFIX',

  /** 基准超过该天数未复核则标记 SYNC AGING */
  syncAgingDays: 14,
} as const

export const HANGAR_PHASE_COLORS = {
  closed: 'oklch(0.55 0.145 27)',
  open: 'oklch(0.62 0.135 150)',
  reset: 'oklch(0.57 0.125 64)',
  track: 'oklch(0.21 0.008 60 / 0.12)',
} as const

export type HangarPhase = 'closed' | 'open' | 'reset'

export const HANGAR_TIMEZONES = [
  { id: 'local', label: 'LOCAL TIME', zone: undefined as string | undefined },
  { id: 'beijing', label: 'BEIJING · UTC+8', zone: 'Asia/Shanghai' },
  { id: 'pacific', label: 'PACIFIC TIME', zone: 'America/Los_Angeles' },
  { id: 'eastern', label: 'EASTERN TIME', zone: 'America/New_York' },
  { id: 'utc', label: 'UTC', zone: 'UTC' },
] as const

export type HangarTimezoneId = (typeof HANGAR_TIMEZONES)[number]['id']
