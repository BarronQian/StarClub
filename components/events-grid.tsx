'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/reveal'
import { LocalEventTime } from '@/components/local-event-time'
import {
  EVENT_STATUS_LABEL,
  type EventItem,
  type EventStatus,
  type EventCategory,
  type EventSubcategory,
  type EventSeries,
  type EventSandboxType,
  type EventCustomTag,
} from '@/lib/events'

const STATUS_FILTERS: { key: EventStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'ongoing', label: '进行中' },
  { key: 'open', label: '报名中' },
  { key: 'upcoming', label: '即将开始' },
  { key: 'ended', label: '已结束' },
]

const TYPE_FILTERS: { key: EventCategory | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'activity', label: '活动' },
  { key: 'competition', label: '赛事' },
  { key: 'teaching', label: '教学' },
  { key: 'group-photo', label: '大合影' },
  { key: 'other', label: '其他' },
]

const ACTIVITY_SUBCATEGORY_FILTERS: {
  key: EventSubcategory | 'all'
  label: string
}[] = [
  { key: 'all', label: '全部' },
  { key: 'sandbox', label: '沙盒活动' },
  { key: 'limited-time', label: '限时活动' },
  { key: 'ship-flight', label: '飞船群飞活动' },
  { key: 'custom', label: '自定义玩法集体活动' },
  { key: 'community', label: '社区活动' },
  { key: 'other', label: '其他' },
]

const COMPETITION_SERIES_FILTERS: {
  key: EventSeries | 'all'
  label: string
}[] = [
  { key: 'all', label: '全部' },
  { key: 'gun-king', label: '绝境枪王' },
  { key: 'air-combat-ace', label: '空战英豪' },
  { key: 'star-wing', label: '逐星之翼' },
  { key: 'casual-competition', label: '休闲娱乐赛事' },
  { key: 'other', label: '其他' },
]

const SANDBOX_TYPE_FILTERS: {
  key: EventSandboxType | 'all'
  label: string
}[] = [
  { key: 'all', label: '全部' },
  { key: 'executive-hangar', label: '争夺区行政机库' },
  { key: 'asd-onyx', label: 'ASD 玛瑙设施' },
  { key: 'laser-alignment', label: '激光校准站' },
  { key: 'storm-breaker', label: '风暴突袭者' },
  { key: 'tsg', label: '战术打击群 TSG' },
  { key: 'other', label: '其他' },
]

const CUSTOM_TAG_FILTERS: {
  key: EventCustomTag
  label: string
}[] = [
  { key: 'casual', label: '休闲' },
  { key: 'air-combat', label: '空战' },
  { key: 'fps', label: 'FPS' },
  { key: 'entertainment', label: '娱乐' },
  { key: 'racing', label: '竞速' },
  { key: 'tribute', label: '致敬' },
  { key: 'other', label: '其他' },
]

const STATUS_ACCENT: Record<EventStatus, string> = {
  open: 'text-[#2F8F68]',
  upcoming: 'text-[#3F6F9F]',
  ongoing: 'text-[#D99A2B]',
  ended: 'text-[#737373]',
}

const STATUS_PRIORITY: Record<EventStatus, number> = {
  ongoing: 0,
  open: 1,
  upcoming: 2,
  ended: 3,
}

function EventCard({ event, index }: { event: EventItem; index: number }) {
  const ended = event.status === 'ended'
  const ongoing = event.status === 'ongoing'
  const open = event.status === 'open'
  const upcoming = event.status === 'upcoming'
  return (
    <Reveal delay={index * 80} className="h-full">
      <Link
  href={`/events/${event.slug}`}
  className={cn(
    'group corner-cut relative flex h-full flex-col overflow-hidden border border-border bg-white',
    'shadow-[0_8px_22px_rgba(0,0,0,0.10),0_24px_48px_rgba(0,0,0,0.14)]',
    'transition-all duration-300 ease-out',

    ended
      ? 'border-neutral-200 bg-neutral-50/80 hover:-translate-y-1 hover:scale-[1.005]'
      : 'hover:-translate-y-1.5 hover:scale-[1.015] hover:border-primary hover:ring-1 hover:ring-primary/40',

    ended
      ? 'hover:shadow-[0_6px_16px_rgba(0,0,0,0.08),0_18px_36px_rgba(0,0,0,0.10)]'
      : 'hover:shadow-[0_6px_16px_rgba(0,0,0,0.08),0_22px_48px_rgba(0,0,0,0.15)]',
  )}
>

{ongoing && (
  <div className="pointer-events-none absolute left-0 top-0 z-20 h-23 w-23 overflow-hidden">
    <div className="absolute -left-8.5 top-4.75 w-33 -rotate-45 bg-[#D99A2B] py-2 text-center font-display text-[0.68rem] tracking-[0.14em] text-white shadow-[0_6px_14px_rgba(0,0,0,0.28)]">
      进行中
    </div>
  </div>
)}

{open && (
  <div className="pointer-events-none absolute left-0 top-0 z-20 h-23 w-23 overflow-hidden">
    <div className="absolute -left-8.5 top-4.75 w-33 -rotate-45 bg-[#2F8F68] py-2 text-center font-display text-[0.68rem] tracking-[0.14em] text-white shadow-[0_6px_14px_rgba(0,0,0,0.22)]">
      报名中
    </div>
  </div>
)}

{upcoming && (
  <div className="pointer-events-none absolute left-0 top-0 z-20 h-23 w-23 overflow-hidden">
    <div className="absolute -left-8.5 top-4.75 w-33 -rotate-45 bg-[#3F6F9F] py-2 text-center font-display text-[0.68rem] tracking-[0.14em] text-white shadow-[0_6px_14px_rgba(0,0,0,0.22)]">
      即将开始
    </div>
  </div>
)}

{ended && (
  <div className="pointer-events-none absolute left-0 top-0 z-20 h-23 w-23 overflow-hidden">
    <div className="absolute -left-8.5 top-4.75 w-33 -rotate-45 bg-neutral-500 py-2 text-center font-display text-[0.68rem] tracking-[0.14em] text-white shadow-[0_4px_10px_rgba(0,0,0,0.18)]">
      已结束
    </div>
  </div>
)}

        <div className="relative aspect-16/10 w-full">
          <Image
            src={event.image || '/placeholder.svg'}
            alt={event.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn(
              'object-cover transition-transform duration-1200 group-hover:scale-[1.04]',
              ended && 'grayscale-35 saturate-70 brightness-[0.92] opacity-75',
            )}
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-6 lg:p-7">
          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-[0.6rem] tracking-[0.26em] text-primary">
              {event.tag}
            </span>
            <span
              className={cn(
                'font-display text-[0.58rem] tracking-[0.24em]',
                STATUS_ACCENT[event.status],
              )}
            >
              {EVENT_STATUS_LABEL[event.status]}
            </span>
          </div>
          <h3 className="line-clamp-2 min-h-14 text-lg leading-snug text-foreground lg:text-xl">
           {event.title}
          </h3>
          <p className="line-clamp-3 min-h-18 text-sm leading-relaxed text-muted-foreground">
          {event.description}
          </p>
          <dl className="mt-1 flex flex-col gap-2 border-t border-border pt-4 text-xs text-foreground/80">
           
           <div className="flex items-start gap-2">
  <CalendarDays
    className="mt-0.5 size-3.5 shrink-0 text-primary"
    strokeWidth={1.5}
  />
  <dt className="sr-only">时间</dt>

<dd>
  {event.startTimes?.length ? (
    <LocalEventTime startTimes={event.startTimes} />
  ) : (
    <>
      {event.date}
      {event.timezone ? ` · ${event.timezone}` : ''}
    </>
  )}
</dd>
</div>

            <div className="flex items-center gap-2">
              <MapPin className="size-3.5 text-primary" strokeWidth={1.5} />
              <dt className="sr-only">地点</dt>
              <dd>{event.location}</dd>
            </div>
          </dl>
          <span className="mt-auto flex items-center gap-2 pt-4 font-display text-[0.65rem] tracking-[0.24em] text-primary">
            {ended ? '查看记录' : '查看活动'}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </span>
        </div>
      </Link>
    </Reveal>
  )
}

export function EventsGrid({ events }: { events: EventItem[] }) {
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<EventCategory | 'all'>('all')
  const [subcategoryFilter, setSubcategoryFilter] =
  useState<EventSubcategory | 'all'>('all')
  const [seriesFilter, setSeriesFilter] =
  useState<EventSeries | 'all'>('all')
  const [sandboxTypeFilter, setSandboxTypeFilter] =
  useState<EventSandboxType | 'all'>('all')
  const [customTagFilters, setCustomTagFilters] =
  useState<EventCustomTag[]>([])
  const toggleCustomTag = (tag: EventCustomTag) => {
  setCustomTagFilters((current) =>
    current.includes(tag)
      ? current.filter((item) => item !== tag)
      : [...current, tag],
  )
}

const filtered = events
  .filter((event) => {
    const matchesStatus =
      statusFilter === 'all' || event.status === statusFilter

    const matchesType =
      typeFilter === 'all' || event.category === typeFilter

    const matchesSubcategory =
      typeFilter !== 'activity' ||
      subcategoryFilter === 'all' ||
      event.subcategory === subcategoryFilter

    const matchesSeries =
      typeFilter !== 'competition' ||
      seriesFilter === 'all' ||
      event.series === seriesFilter

    const matchesSandboxType =
      typeFilter !== 'activity' ||
      subcategoryFilter !== 'sandbox' ||
      sandboxTypeFilter === 'all' ||
      event.sandboxType === sandboxTypeFilter
    
    const matchesCustomTags =
  typeFilter !== 'activity' ||
  subcategoryFilter !== 'custom' ||
  customTagFilters.length === 0 ||
  customTagFilters.some((tag) => event.customTags?.includes(tag))

    return (
      matchesStatus &&
      matchesType &&
      matchesSubcategory &&
      matchesSeries &&
      matchesSandboxType &&
      matchesCustomTags
    )
  })
  .sort((a, b) => {
  const statusDiff =
    STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]

  if (statusDiff !== 0) return statusDiff

const getEventTime = (event: EventItem) => {
  if (event.startTimes?.length) {
    return Math.max(
      ...event.startTimes.map((time) => new Date(time).getTime()),
    )
  }

  const dateMatch = event.date.match(/\d{4}[.-]\d{2}[.-]\d{2}/)
  if (!dateMatch) return 0

  const timeMatch = event.date.match(/\d{1,2}:\d{2}/)

  const normalizedDate = dateMatch[0].replace(/\./g, '-')
  const normalizedTime = timeMatch ? timeMatch[0] : '00:00'

  return new Date(`${normalizedDate}T${normalizedTime}:00`).getTime()
}

return getEventTime(b) - getEventTime(a)
})

  return (
    <div>
      <div
        role="tablist"
        aria-label="活动状态筛选"
        className="flex flex-wrap gap-2"
      >
        {STATUS_FILTERS.map((f) => {
          const active = f.key === statusFilter
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'pill border px-5 py-2.5 font-display text-[0.72rem] tracking-[0.18em] transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          )
        })}
      </div>
     
     <div
  role="tablist"
  aria-label="活动类型筛选"
  className="mt-3 flex flex-wrap gap-2"
>
  {TYPE_FILTERS.map((f) => {
    const active = f.key === typeFilter

    return (
      <button
        key={f.key}
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => {
  setTypeFilter(f.key)
  setSubcategoryFilter('all')
  setSeriesFilter('all')
  setSandboxTypeFilter('all')
  setCustomTagFilters([])
}}
        className={cn(
          'pill border px-5 py-2.5 font-display text-[0.72rem] tracking-[0.18em] transition-colors',
          active
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
        )}
      >
        {f.label}
      </button>
    )
  })}
</div>

{typeFilter === 'activity' && (
  <div
    role="tablist"
    aria-label="活动分类筛选"
    className="mt-3 flex flex-wrap gap-2"
  >
    {ACTIVITY_SUBCATEGORY_FILTERS.map((f) => {
      const active = f.key === subcategoryFilter

      return (
        <button
          key={f.key}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => {
  setSubcategoryFilter(f.key)
  setSandboxTypeFilter('all')
  setCustomTagFilters([])
}}
          className={cn(
            'pill border px-4 py-2 font-display text-[0.62rem] tracking-[0.22em] transition-colors',
            active
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
          )}
        >
          {f.label}
        </button>
      )
    })}
  </div>
)}

{typeFilter === 'activity' && subcategoryFilter === 'sandbox' && (
  <div
    role="tablist"
    aria-label="沙盒活动类型筛选"
    className="mt-3 flex flex-wrap gap-2"
  >
    {SANDBOX_TYPE_FILTERS.map((f) => {
      const active = f.key === sandboxTypeFilter

      return (
        <button
          key={f.key}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => setSandboxTypeFilter(f.key)}
          className={cn(
            'pill border px-4 py-2 font-display text-[0.62rem] tracking-[0.22em] transition-colors',
            active
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
          )}
        >
          {f.label}
        </button>
      )
    })}
  </div>
)}

{typeFilter === 'activity' && subcategoryFilter === 'custom' && (
  <div
    role="group"
    aria-label="自定义玩法标签筛选"
    className="mt-3 flex flex-wrap gap-2"
  >
    {CUSTOM_TAG_FILTERS.map((f) => {
      const active = customTagFilters.includes(f.key)

      return (
        <button
          key={f.key}
          type="button"
          aria-pressed={active}
          onClick={() => toggleCustomTag(f.key)}
          className={cn(
            'pill border px-4 py-2 font-display text-[0.62rem] tracking-[0.22em] transition-colors',
            active
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
          )}
        >
          {f.label}
        </button>
      )
    })}
  </div>
)}

{typeFilter === 'competition' && (
  <div
    role="tablist"
    aria-label="赛事系列筛选"
    className="mt-3 flex flex-wrap gap-2"
  >
    {COMPETITION_SERIES_FILTERS.map((f) => {
      const active = f.key === seriesFilter

      return (
        <button
          key={f.key}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => setSeriesFilter(f.key)}
          className={cn(
            'pill border px-4 py-2 font-display text-[0.62rem] tracking-[0.22em] transition-colors',
            active
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
          )}
        >
          {f.label}
        </button>
      )
    })}
  </div>
)}

      {filtered.length > 0 ? (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event, i) => (
            <li key={event.slug} className="h-full">
              <EventCard event={event} index={i} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-14 text-center text-sm text-muted-foreground">
          该分类下暂无活动。
        </p>
      )}
    </div>
  )
}
