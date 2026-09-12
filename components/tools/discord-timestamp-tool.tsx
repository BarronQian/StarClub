'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'

type FormatKey = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R'

const FORMATS: { key: FormatKey; label: string; en: string }[] = [
  { key: 't', label: '短时间', en: 'Short Time' },
  { key: 'T', label: '长时间', en: 'Long Time' },
  { key: 'd', label: '短日期', en: 'Short Date' },
  { key: 'D', label: '长日期', en: 'Long Date' },
  { key: 'f', label: '短日期时间', en: 'Short Date/Time' },
  { key: 'F', label: '长日期时间', en: 'Long Date/Time' },
  { key: 'R', label: '相对时间', en: 'Relative Time' },
]

function formatPreview(unix: number, key: FormatKey): string {
  const date = new Date(unix * 1000)
  switch (key) {
    case 't':
      return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(date)
    case 'T':
      return new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date)
    case 'd':
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date)
    case 'D':
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date)
    case 'f':
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    case 'F':
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'long',
      }).format(date)
    case 'R': {
      const diffSec = Math.round((unix * 1000 - Date.now()) / 1000)
      const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })
      const abs = Math.abs(diffSec)
      if (abs < 60) return rtf.format(diffSec, 'second')
      if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
      if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
      return rtf.format(Math.round(diffSec / 86400), 'day')
    }
  }
}

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

function CopyRow({ format, unix }: { format: (typeof FORMATS)[number]; unix: number }) {
  const [copied, setCopied] = useState(false)
  const raw = `<t:${unix}:${format.key}>`

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(id)
  }, [copied])

  return (
    <div className="flex flex-col gap-3 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-2 text-[0.6rem] tracking-[0.24em] text-muted-foreground uppercase">
          {format.label} · {format.en}
        </span>
        <span className="font-display text-sm text-foreground">
          {formatPreview(unix, format.key)}
        </span>
        <code className="font-mono text-[0.7rem] text-muted-foreground/80">{raw}</code>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(raw)
            setCopied(true)
          } catch {
            setCopied(false)
          }
        }}
        className="pill flex h-10 shrink-0 items-center gap-2 border border-border px-4 font-display text-[0.6rem] tracking-[0.2em] text-foreground transition-colors hover:border-primary hover:text-primary"
      >
        {copied ? <Check className="size-3.5" strokeWidth={1.8} /> : <Copy className="size-3.5" strokeWidth={1.6} />}
        {copied ? '已复制' : '复制'}
      </button>
    </div>
  )
}

export function DiscordTimestampTool() {
  const [value, setValue] = useState('')

  useEffect(() => {
    setValue(toLocalInputValue(new Date()))
  }, [])

  const unix = useMemo(() => {
    if (!value) return null
    const parsed = new Date(value).getTime()
    return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000)
  }, [value])

  return (
    <div className="corner-cut border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-[0.58rem] tracking-[0.26em] text-muted-foreground uppercase">
            选择日期与时间（本地时间）
          </span>
          <input
            type="datetime-local"
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-11 w-full max-w-xs border border-border bg-background px-3 text-sm tabular-nums text-foreground outline-none transition-colors focus-visible:border-primary"
          />
        </label>
        <span className="font-display text-[0.6rem] tracking-[0.24em] text-muted-foreground">
          UNIX · {unix ?? '--'}
        </span>
      </div>

      <div className="px-6 py-2 lg:px-8">
        {unix !== null ? (
          FORMATS.map((format) => <CopyRow key={format.key} format={format} unix={unix} />)
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">请选择一个日期与时间。</p>
        )}
      </div>
    </div>
  )
}
