'use client'

type LocalEventTimeProps = {
  startTimes: string[]
  fallback?: string
}

function formatLocalDateTime(iso: string) {
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
  if (!startTimes.length) {
    return fallback ? <span>{fallback}</span> : null
  }

  return (
    <div className="flex flex-col gap-1">
      {startTimes.map((time) => {
        const formatted = formatLocalDateTime(time)

        return (
          <span key={time}>
            {formatted.dateTime}
          </span>
        )
      })}

      <span className="text-xs text-muted-foreground">
        当地时间 · {formatLocalDateTime(startTimes[0]).timeZone}
      </span>
    </div>
  )
}