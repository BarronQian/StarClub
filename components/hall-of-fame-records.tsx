'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import type { CasualHonor } from '@/lib/hall-of-fame'

const BANU_MEMBERS = [
  'HotpotKing “火锅”',
  'TTV550',
  'ASRC_WWW',
  'ilQwQli',
]

export function HallOfFameRecords({ honors }: { honors: CasualHonor[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="corner-cut overflow-hidden border border-border bg-card">
      {honors.map((honor, i) => {
        const expandable = honor.holder === '巴奴火锅队'
        const expanded = expandedId === honor.id

        return (
          <Reveal
            key={honor.id}
            delay={(i % 8) * 90}
            className="border-b border-border last:border-b-0"
          >
            <div>
              {expandable ? (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId((current) =>
                      current === honor.id ? null : honor.id,
                    )
                  }
                  aria-expanded={expanded}
                  className="group relative grid w-full min-h-30 grid-cols-[3.5rem_4.5rem_minmax(0,1fr)] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-background/60 lg:grid-cols-[4rem_5rem_minmax(0,1fr)] lg:gap-5 lg:px-7"
                >
                  {/* 赛事 Logo */}
                  <div className="flex items-center justify-center">
                    <div className="relative size-14 lg:size-16">
                      <Image
                        src={honor.eventLogo || '/placeholder.svg'}
                        alt={`${honor.awardTitle} Logo`}
                        fill
                        sizes="64px"
                        className="object-contain"
                      />
                    </div>
                  </div>

                  {/* 队伍头像 */}
                  <div className="flex items-center justify-center">
                    <div className="relative size-16 overflow-hidden rounded-xl border border-border bg-background lg:size-18">
                      <Image
                        src={honor.avatar || '/placeholder.svg'}
                        alt={`${honor.holder} 头像`}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* 信息 */}
                  <div className="grid min-w-0 gap-3 pr-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10">
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-5 gap-y-1">
                      <span className="font-display text-[0.95rem] font-medium tracking-[0.08em] text-primary">
                        {honor.edition} · {honor.awardTitle}
                      </span>

                      <span className="font-display text-xl font-semibold tracking-tight text-foreground">
                        {honor.holder}
                      </span>
                    </div>

                    {honor.quote && (
                      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground lg:text-right">
                        {honor.quote}
                      </p>
                    )}
                  </div>

                  {/* 展开箭头 */}
                  <div className="absolute bottom-4 right-5 flex items-center gap-1.5 text-[0.65rem] text-muted-foreground transition-colors group-hover:text-primary lg:right-7">
                    <span className="hidden tracking-[0.12em] sm:inline">
                      队伍成员
                    </span>

                    <ChevronDown
                      className={`size-4 transition-transform duration-300 ${
                        expanded ? 'rotate-180' : ''
                      }`}
                      strokeWidth={1.7}
                    />
                  </div>
                </button>
              ) : (
                <div className="grid min-h-30 grid-cols-[3.5rem_4.5rem_minmax(0,1fr)] items-center gap-4 px-5 py-4 lg:grid-cols-[4rem_5rem_minmax(0,1fr)] lg:gap-5 lg:px-7">
                  {/* 赛事 Logo */}
                  <div className="flex items-center justify-center">
                    <div className="relative size-14 lg:size-16">
                      <Image
                        src={honor.eventLogo || '/placeholder.svg'}
                        alt={`${honor.awardTitle} Logo`}
                        fill
                        sizes="64px"
                        className="object-contain"
                      />
                    </div>
                  </div>

                  {/* 获奖者头像 */}
                  <div className="flex items-center justify-center">
                    <div className="relative size-16 overflow-hidden rounded-xl border border-border bg-background lg:size-18">
                      <Image
                        src={honor.avatar || '/placeholder.svg'}
                        alt={`${honor.holder} 头像`}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* 信息 */}
                  <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10">
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-5 gap-y-1">
                      <span className="font-display text-[0.95rem] font-medium tracking-[0.08em] text-primary">
                        {honor.edition} · {honor.awardTitle}
                      </span>

                      <span className="font-display text-xl font-semibold tracking-tight text-foreground">
                        {honor.holder}
                      </span>
                    </div>

                    {honor.quote && (
                      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground lg:text-right">
                        {honor.quote}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 巴奴火锅队展开区域 */}
              {expandable && (
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-border bg-background/55 px-6 py-5 backdrop-blur-xl lg:px-7">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="shrink-0">
                          <p className="font-display text-[0.62rem] tracking-[0.24em] text-primary">
                            TEAM ROSTER
                          </p>

                          <p className="mt-1 text-sm font-medium text-foreground">
                            巴奴火锅队全队成员
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:ml-auto">
                          {BANU_MEMBERS.map((member) => (
                            <span
                              key={member}
                              className="rounded-full border border-border bg-card px-4 py-2 font-display text-xs tracking-wider text-foreground shadow-sm"
                            >
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}