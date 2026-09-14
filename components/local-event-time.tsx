'use client'

import { useEffect, useState } from 'react'

type LocalEventTimeProps = {
  startTimes: string[]
  fallback?: string
}

type FormattedDateTime = {
  dateTime: string
  timeZone: string
}

function formatLocalDateTime(iso: string): FormattedDateTime {
  const date = new Date(iso)

  const parts = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).formatToParts(date)

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return {
    dateTime: `${get('year')}.${get('month')}.${get('day')} · ${get('hour')}:${get('minute')}`,
    timeZone: get('timeZoneName'),
  }
}

export function LocalEventTime({
  startTimes,
  fallback,
}: LocalEventTimeProps) {
  const [formattedTimes, setFormattedTimes] = useState<
    FormattedDateTime[] | null
  >(null)

  useEffect(() => {
    if (!startTimes.length) {
      setFormattedTimes([])
      return
    }

    setFormattedTimes(
      startTimes.map((time) => formatLocalDateTime(time))
    )
  }, [startTimes])

  if (!startTimes.length) {
    return fallback ? <span>{fallback}</span> : null
  }

  if (!formattedTimes) {
    return (
      <div className="flex flex-col gap-1">
        {startTimes.map((time) => (
          <span key={time} className="invisible">
            0000.00.00 · 00:00
          </span>
        ))}

        <span className="invisible text-xs text-muted-foreground">
          当地时间 · UTC
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {formattedTimes.map((formatted, index) => (
        <span key={startTimes[index]}>
          {formatted.dateTime}
        </span>
      ))}

      <span className="text-xs text-muted-foreground">
        当地时间 · {formattedTimes[0]?.timeZone}
      </span>
    </div>
  )
}