'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

type ZoneOption = { id: string; label: string; en: string }

const ZONES: ZoneOption[] = [
  { id: 'Asia/Shanghai', label: '北京', en: 'Beijing · UTC+8' },
  { id: 'America/Los_Angeles', label: '美西', en: 'US Pacific' },
  { id: 'America/New_York', label: '美东', en: 'US Eastern' },
  { id: 'UTC', label: 'UTC', en: 'Coordinated Universal Time' },
  { id: 'Europe/London', label: '伦敦', en: 'London' },
  { id: 'Europe/Berlin', label: '中欧', en: 'Central Europe' },
  { id: 'Asia/Tokyo', label: '东京', en: 'Tokyo' },
  { id: 'Australia/Sydney', label: '悉尼', en: 'Sydney' },
]

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = dtf.formatToParts(date)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  const hour = Number(map.hour) === 24 ? 0 : Number(map.hour)
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second),
  )
  return asUTC - date.getTime()
}

/** Converts a "wall clock" date/time in a given IANA timezone into the correct UTC instant. */
function zonedWallTimeToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  timeZone: string,
): Date {
  let utc = Date.UTC(y, mo, d, h, mi)
  const offset = getTimeZoneOffsetMs(new Date(utc), timeZone)
  utc -= offset
  return new Date(utc)
}

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

function ZoneCard({
  zone,
  instant,
  isSource,
}: {
  zone: ZoneOption
  instant: Date
  isSource: boolean
}) {
  const [copied, setCopied] = useState(false)
  const unix = Math.floor(instant.getTime() / 1000)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(id)
  }, [copied])

  const time = new Intl.DateTimeFormat('zh-CN', {
    timeZone: zone.id,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(instant)

  const date = new Intl.DateTimeFormat('zh-CN', {
    timeZone: zone.id,
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).format(instant)

  return (
    <div
      className={cn(
        'corner-cut relative flex flex-col gap-4 border bg-card p-5 transition-colors',
        isSource ? 'border-primary/60' : 'border-border',
      )}
    >
      {isSource && (
        <span className="absolute top-3 right-3 flex items-center gap-1 font-display text-[0.52rem] tracking-[0.2em] text-primary">
          <MapPin className="size-3" strokeWidth={1.8} />
          本地
        </span>
      )}
      <div className="flex flex-col gap-1">
        <span className="text-[0.58rem] tracking-[0.24em] text-muted-foreground uppercase">
          {zone.label} · {zone.en}
        </span>
        <span className="text-[0.6rem] tracking-[0.16em] text-muted-foreground">{date}</span>
      </div>
      <span
        className={cn(
          'font-display text-3xl tabular-nums tracking-tight',
          isSource ? 'text-primary' : 'text-foreground',
        )}
      >
        {time}
      </span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(`<t:${unix}:F>`)
            setCopied(true)
          } catch {
            setCopied(false)
          }
        }}
        className="pill mt-auto flex h-9 items-center justify-center gap-2 border border-border text-[0.58rem] tracking-[0.18em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        {copied ? <Check className="size-3.5" strokeWidth={1.8} /> : <Copy className="size-3.5" strokeWidth={1.6} />}
        {copied ? '已复制' : 'Discord 时间戳'}
      </button>
    </div>
  )
}

export function VerseLocalTimeTool() {
  const [value, setValue] = useState('')
  const [sourceZone, setSourceZone] = useState('Asia/Shanghai')

  useEffect(() => {
    setValue(toLocalInputValue(new Date()))
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (detected && ZONES.some((z) => z.id === detected)) {
        setSourceZone(detected)
      }
    } catch {
      // keep default
    }
  }, [])

  const instant = useMemo(() => {
    if (!value) return null
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
    if (!match) return null
    const [, y, mo, d, h, mi] = match.map(Number) as unknown as number[]
    return zonedWallTimeToUtc(y, mo - 1, d, h, mi, sourceZone)
  }, [value, sourceZone])

  return (
    <div className="flex flex-col gap-6">
      <div className="corner-cut flex flex-col gap-4 border border-border bg-card px-6 py-6 sm:flex-row sm:items-end sm:gap-6 lg:px-8">
        <label className="flex flex-col gap-2">
          <span className="text-[0.58rem] tracking-[0.26em] text-muted-foreground uppercase">
            活动日期与时间
          </span>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-11 w-full max-w-xs border border-border bg-background px-3 text-sm tabular-nums text-foreground outline-none transition-colors focus-visible:border-primary"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[0.58rem] tracking-[0.26em] text-muted-foreground uppercase">
            你所在的坐标时区
          </span>
          <select
            value={sourceZone}
            onChange={(e) => setSourceZone(e.target.value)}
            className="h-11 w-full max-w-xs border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary"
          >
            {ZONES.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.label} · {zone.en}
              </option>
            ))}
          </select>
        </label>
      </div>

      {instant ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ZONES.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} instant={instant} isSource={zone.id === sourceZone} />
          ))}
        </div>
      ) : (
        <div className="corner-cut border border-border bg-card px-6 py-16 text-center lg:px-8">
          <p className="text-sm text-muted-foreground">请选择一个日期与时间。</p>
        </div>
      )}
    </div>
  )
}
