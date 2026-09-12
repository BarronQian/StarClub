'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'

type ArmorSource =
  | '只可搜刮'
  | '可购买'
  | '维克洛兑换'

type ArmorSeries = {
  id: string
  name: string
  cn: string
  image: string
  sources: ArmorSource[]
}

const filters: Array<'全部' | ArmorSource> = [
  '全部',
  '只可搜刮',
  '可购买',
  '维克洛兑换',
]

const armorSeries: ArmorSeries[] = [
  {
    id: 'palatino',
    name: 'Palatino',
    cn: '帕拉提诺护甲系列',
    image: '/images/guides/armor/palatino-armor-cover.jpg',
    sources: ['只可搜刮'],
  },
  {
    id: 'monde',
    name: 'Monde',
    cn: '蒙德护甲系列',
    image: '/images/guides/armor/monde-armor-cover.jpg',
    sources: ['只可搜刮'],
  },
  {
    id: 'geist',
    name: 'Geist',
    cn: '幽影护甲系列',
    image: '/images/guides/armor/geist-armor-cover.jpg',
    sources: ['只可搜刮'],
  },
  {
    id: 'wikelo',
    name: 'Wikelo',
    cn: '维克洛稀有护甲',
    image: '/images/guides/armor/wikelo-armor-cover.jpg',
    sources: ['维克洛兑换'],
  },
  {
    id: 'ninetail',
    name: 'Nine Tails',
    cn: '九尾护甲系列',
    image: '/images/guides/armor/ninetail-armor-cover.jpg',
    sources: ['只可搜刮'],
  },
  {
    id: 'overlord',
    name: 'Overlord',
    cn: '领主护甲系列',
    image: '/images/guides/armor/overlord-armor-cover.jpg',
    sources: ['只可搜刮'],
  },
]

export default function ArmorCodexPage() {
  const [activeFilter, setActiveFilter] =
    useState<(typeof filters)[number]>('全部')

  const filteredArmor =
    activeFilter === '全部'
      ? armorSeries
      : armorSeries.filter((armor) =>
          armor.sources.includes(activeFilter),
        )

  return (
    <div className="pb-24 lg:pb-32">
      <section className="relative border-b border-border">
        <div
          aria-hidden="true"
          className="hud-grid absolute inset-0 -z-10 opacity-70"
        />

        <div className="site-container py-16 lg:py-24">
          <ArchiveBreadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '中文攻略', href: '/guides' },
              { label: '特色护甲图鉴' },
            ]}
          />

          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display text-[0.65rem] tracking-[0.35em] text-primary">
                STAR CITIZEN ARMOR CODEX
              </span>

              <span className="h-px w-10 bg-primary/40" />

              <span className="text-[0.65rem] tracking-[0.3em] text-muted-foreground">
                STARCLUB ORIGINAL
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl tracking-tight sm:text-5xl lg:text-6xl">
                星际公民特色护甲图鉴
              </h1>

              <span className="rounded-full bg-primary px-3 py-1.5 text-[0.62rem] tracking-[0.12em] text-primary-foreground">
                酒馆原创
              </span>
            </div>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              收录《星际公民》中具有特色外观、特殊获取方式及收藏价值的护甲系列，
              整理护甲外观、名称、来源与获取方式。
            </p>

            <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
              <span>
                已收录{' '}
                <strong className="font-medium text-foreground">
                  {armorSeries.length}
                </strong>{' '}
                个系列
              </span>

              <span className="h-3 w-px bg-border" />

              <span>持续更新</span>
            </div>
          </div>
        </div>
      </section>

      <section className="site-container pt-12 lg:pt-16">
        <div className="flex flex-wrap gap-2 border-b border-border pb-8">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-4 py-2 text-xs transition-all ${
                activeFilter === filter
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredArmor.map((armor) => (
            <article
              key={armor.id}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-muted">
                <Image
                  src={armor.image}
                  alt={`${armor.name} ${armor.cn}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>

              <div className="p-5">
                <div className="flex flex-wrap gap-1.5">
                  {armor.sources.map((source) => (
                    <span
                      key={source}
                      className="rounded-full bg-primary/8 px-2.5 py-1 text-[0.6rem] tracking-[0.08em] text-primary"
                    >
                      {source}
                    </span>
                  ))}
                </div>

                <h2 className="mt-4 font-display text-xl tracking-tight">
                  {armor.name}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {armor.cn}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}