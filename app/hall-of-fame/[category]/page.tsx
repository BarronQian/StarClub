import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { Reveal } from '@/components/reveal'
import { HallOfFameHistory } from '@/components/hall-of-fame-history'
import { HallOfFameRecords } from '@/components/hall-of-fame-records'
import { PageCompanion } from '@/components/page-companion'
import {
  CASUAL_HONORS,
  HALL_OF_FAME_CATEGORIES,
  HALL_OF_FAME_CATEGORY_DESC,
  HALL_OF_FAME_CATEGORY_EN,
  HALL_OF_FAME_CATEGORY_LABEL,
  HALL_OF_FAME_EDITIONS,
  type HallOfFameCategory,
} from '@/lib/hall-of-fame'

type Params = { params: Promise<{ category: string }> }

function isCategory(value: string): value is HallOfFameCategory {
  return (HALL_OF_FAME_CATEGORIES as string[]).includes(value)
}

export function generateStaticParams() {
  return HALL_OF_FAME_CATEGORIES.map((category) => ({ category }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params
  if (!isCategory(category)) return { title: '未找到 · 星际酒馆 StarClub' }
  return {
    title: `${HALL_OF_FAME_CATEGORY_LABEL[category]} · 名人堂 · 星际酒馆 StarClub`,
    description: HALL_OF_FAME_CATEGORY_DESC[category],
  }
}

export default async function HallOfFameCategoryPage({ params }: Params) {
  const { category } = await params
  if (!isCategory(category)) notFound()

  return (
    <div className="pb-24 lg:pb-32">
      <section className="relative border-b border-border">
        <div
          aria-hidden="true"
          className="hud-grid absolute inset-0 -z-10 opacity-70"
        />
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-20">
          <ArchiveBreadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '名人堂', href: '/hall-of-fame' },
              { label: HALL_OF_FAME_CATEGORY_LABEL[category] },
            ]}
          />
          <Reveal className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="font-display text-[0.65rem] tracking-[0.4em] text-primary">
                STARCLUB HALL OF FAME
              </span>
              <span className="h-px w-10 bg-primary/40" aria-hidden="true" />
              <span className="text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
                {HALL_OF_FAME_CATEGORY_EN[category]}
              </span>
            </div>
            <h1 className="max-w-3xl font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {HALL_OF_FAME_CATEGORY_LABEL[category]}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {HALL_OF_FAME_CATEGORY_DESC[category]}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-14 lg:px-10 lg:pt-20">
        {category === 'casual' ? (
          <HallOfFameRecords honors={CASUAL_HONORS} />
        ) : (
          <HallOfFameHistory
            editions={HALL_OF_FAME_EDITIONS[category]}
            category={category}
          />
        )}

        <Reveal className="mt-14">
          <Link
            href="/hall-of-fame"
            className="group inline-flex items-center gap-2 font-display text-[0.65rem] tracking-[0.26em] text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft
              className="size-3.5 transition-transform group-hover:-translate-x-1"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            返回全部分类
          </Link>
        </Reveal>
      </section>

      {category === 'racing' && (
  <PageCompanion companion="inorath" />
)}

{category === 'gun' && (
  <PageCompanion companion="ilqwqli" />
)}
    </div>
  )
}
