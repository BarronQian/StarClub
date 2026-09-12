import type { Metadata } from 'next'
import Image from 'next/image'
import { Diamond } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { HallOfFameColumn } from '@/components/hall-of-fame-column'
import { HallOfFameRecords } from '@/components/hall-of-fame-records'
import {
  CASUAL_HONORS,
  CHAMPIONS,
  HALL_OF_FAME_CATEGORY_CODE,
  HALL_OF_FAME_CATEGORY_LABEL,
} from '@/lib/hall-of-fame'

export const metadata: Metadata = {
  title: '名人堂 | 星际酒馆 StarClub',
  description:
    '星际酒馆 StarClub 名人堂：记录 Star Citizen 全球华人玩家社区的赛事冠军、竞技荣誉与历史时刻。',
}

const STAT_ORDER = ['gun', 'ace', 'racing'] as const

export default function HallOfFamePage() {
  return (
    <div className="pb-24 lg:pb-32">
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden="true"
          className="hud-grid pyro-atmosphere absolute inset-0 -z-10"
        />
        <Image
          src="/images/starclub-logo.png"
          alt=""
          aria-hidden="true"
          width={480}
          height={480}
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-104 w-104 -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.04]"
        />
        <div className="mx-auto flex max-w-4xl flex-col items-center px-5 py-20 text-center lg:px-10 lg:py-28">
          <Reveal>
            <span className="corner-cut inline-block bg-primary/10 px-4 py-1.5 font-display text-[0.6rem] tracking-[0.3em] text-primary">
              荣誉存档 · EST. 2026
            </span>
          </Reveal>
          <Reveal delay={60} className="mt-3">
            <span className="font-display text-[0.65rem] tracking-[0.45em] text-muted-foreground">
              HALL OF FAME
            </span>
          </Reveal>
          <Reveal delay={100} className="mt-6">
            <h1 className="font-display text-4xl leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
              星际酒馆名人堂
            </h1>
          </Reveal>
          <Reveal delay={140} className="mt-5 max-w-xl">
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base">
              星际酒馆冠军荣誉殿堂，收录各类赛事、竞赛与社区活动历届冠军记录
            </p>
          </Reveal>
          <Reveal
            delay={180}
            className="mt-8 flex items-center gap-3"
          >
            <span className="h-px w-16 bg-primary/40" aria-hidden="true" />
            <Diamond
              className="size-3 text-primary"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span className="h-px w-16 bg-primary/40" aria-hidden="true" />
          </Reveal>
          <Reveal
            delay={220}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            {STAT_ORDER.map((category) => (
              <span
                key={category}
                className="corner-cut inline-flex items-center gap-2 border border-border bg-card px-4 py-2"
              >
                <span className="font-display text-[0.62rem] font-bold tracking-[0.15em] text-primary">
                  {HALL_OF_FAME_CATEGORY_CODE[category]}
                </span>
                <span className="font-display text-sm font-semibold text-foreground">
                  {CHAMPIONS[category].length}
                </span>
                <span className="text-xs text-muted-foreground">
                  {HALL_OF_FAME_CATEGORY_LABEL[category]}
                </span>
              </span>
            ))}
            <span className="corner-cut inline-flex items-center gap-2 border border-border bg-card px-4 py-2">
              <span className="font-display text-[0.62rem] font-bold tracking-[0.15em] text-primary">
                {HALL_OF_FAME_CATEGORY_CODE.casual}
              </span>
              <span className="font-display text-sm font-semibold text-foreground">
                {CASUAL_HONORS.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {HALL_OF_FAME_CATEGORY_LABEL.casual}
              </span>
            </span>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-16 lg:px-10 lg:pt-20">
        <div className="grid gap-6 lg:grid-cols-3">
          <HallOfFameColumn category="gun" delay={0} />
          <HallOfFameColumn category="ace" delay={100} />
          <HallOfFameColumn category="racing" delay={200} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-20 lg:px-10 lg:pt-24">
        <Reveal className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl tracking-tight text-foreground sm:text-2xl">
            休闲娱乐赛事榜
          </h2>
          <span className="font-display text-[0.6rem] tracking-[0.3em] text-muted-foreground">
            CASUAL RECORDS
          </span>
        </Reveal>
        <div className="mt-6">
          <HallOfFameRecords honors={CASUAL_HONORS} />
        </div>
      </section>
    </div>
  )
}
