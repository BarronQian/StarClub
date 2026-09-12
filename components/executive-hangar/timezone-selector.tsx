'use client'

import { ChevronDown } from 'lucide-react'
import {
  HANGAR_TIMEZONES,
  type HangarTimezoneId,
} from '@/lib/executive-hangar-config'

export function TimezoneSelector({
  value,
  onChange,
}: {
  value: HangarTimezoneId
  onChange: (id: HangarTimezoneId) => void
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="text-[0.58rem] tracking-[0.28em] text-muted-foreground uppercase">
        Timezone
      </span>
      <span className="relative flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as HangarTimezoneId)}
          className="appearance-none border-b border-border bg-transparent py-1 pr-6 pl-0 font-display text-[0.62rem] tracking-[0.2em] text-foreground outline-none transition-colors hover:border-primary focus-visible:border-primary"
        >
          {HANGAR_TIMEZONES.map((tz) => (
            <option key={tz.id} value={tz.id}>
              {tz.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-0 size-3.5 text-muted-foreground"
          strokeWidth={1.6}
        />
      </span>
    </label>
  )
}
