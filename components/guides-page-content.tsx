'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { Reveal } from '@/components/reveal'
import { PageCompanion } from '@/components/page-companion'

import {
  GUIDE_TAGS,
  type GuideCategory,
} from '@/lib/guides'

export type GuideListItem = {
  id: string
  slug: string
  title: string
  description: string
  category: GuideCategory
  tags?: string[]
  type: 'article' | 'video' | 'discord' | 'external'
  image?: string
  author?: string
  creator?: string
  videoUrl?: string
  original?: boolean
  date?: string
}

const categories: GuideCategory[] = [
  '萌新入门',
  'FPS单兵战斗',
  '飞船空战',
  '舰船武器组件',
  '单兵武器装备',
  '经济 / 赚钱',
  '探索 / 旅游',
  '沙盒活动',
  '限时活动',
  '维克洛商店',
  '舰船升级CCU',
  '其他',
]

type GuidesPageContentProps = {
  guides: GuideListItem[]
}

export function GuidesPageContent({
  guides,
}: GuidesPageContentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [activeCategory, setActiveCategory] =
    useState<GuideCategory | '全部攻略'>('全部攻略')

  const [activeTag, setActiveTag] = useState('全部')

  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const tagParam = searchParams.get('tag')

    if (
      categoryParam &&
      categories.includes(categoryParam as GuideCategory)
    ) {
      const category = categoryParam as GuideCategory

      setActiveCategory(category)

      if (
        tagParam &&
        GUIDE_TAGS[category]?.includes(tagParam)
      ) {
        setActiveTag(tagParam)
      } else {
        setActiveTag('全部')
      }
    } else {
      setActiveCategory('全部攻略')
      setActiveTag('全部')
    }
  }, [searchParams])

  const activeTags =
    activeCategory === '全部攻略'
      ? []
      : GUIDE_TAGS[activeCategory]

  const filteredGuides = guides.filter((guide) => {
    const categoryMatch =
      activeCategory === '全部攻略' ||
      guide.category === activeCategory

    const tagMatch =
      activeTag === '全部' ||
      guide.tags?.includes(activeTag)

    return categoryMatch && tagMatch
  })

  const selectCategory = (
    category: GuideCategory | '全部攻略'
  ) => {
    setActiveCategory(category)
    setActiveTag('全部')

    if (category === '全部攻略') {
      router.push('/guides')
    } else {
      router.push(
        `/guides?category=${encodeURIComponent(category)}`
      )
    }
  }

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
              { label: '中文攻略' },
            ]}
          />

          <Reveal className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="font-display text-[0.65rem] tracking-[0.4em] text-primary">
                STAR CITIZEN GUIDES
              </span>

              <span className="h-px w-10 bg-primary/40" />

              <span className="text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
                Chinese Guides
              </span>
            </div>

            <h1 className="font-display text-4xl tracking-tight sm:text-5xl lg:text-6xl">
              中文攻略
            </h1>

            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              从萌新入门到进阶玩法，整理星际酒馆与中文社区制作的
              《星际公民》攻略、教学与实用指南。
            </p>
          </Reveal>
        </div>
      </section>

      <section
        id="guide-list"
        className="site-container pt-12 lg:pt-16"
      >
        <div className="border-b border-border pb-8">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectCategory('全部攻略')}
              className={`rounded-full border px-4 py-2 text-xs transition-all ${
                activeCategory === '全部攻略'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              全部
            </button>

            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => selectCategory(category)}
                className={`rounded-full border px-4 py-2 text-xs transition-all ${
                  activeCategory === category
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {activeCategory !== '全部攻略' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTag('全部')
                  router.push(
                    `/guides?category=${encodeURIComponent(activeCategory)}`
                  )
                }}
                className={`rounded-full border px-4 py-2 text-xs transition-all ${
                  activeTag === '全部'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                全部
              </button>

              {activeTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setActiveTag(tag)
                    router.push(
                      `/guides?category=${encodeURIComponent(activeCategory)}&tag=${encodeURIComponent(tag)}`
                    )
                  }}
                  className={`rounded-full border px-4 py-2 text-xs transition-all ${
                    activeTag === tag
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 flex items-end justify-between border-b border-border pb-5">
          <div>
            <span className="font-display text-[0.62rem] tracking-[0.3em] text-primary">
              LATEST GUIDES
            </span>

            <h2 className="mt-3 font-display text-2xl tracking-tight sm:text-3xl">
              {activeCategory === '全部攻略'
                ? '最新攻略'
                : activeTag === '全部'
                  ? activeCategory
                  : activeTag}
            </h2>
          </div>

          <span className="hidden text-xs text-muted-foreground sm:block">
            {filteredGuides.length} 篇攻略
          </span>
        </div>

        <div className="divide-y divide-border">
          {filteredGuides.length === 0 && (
            <div className="flex min-h-70 flex-col items-center justify-center text-center">
              <span className="font-display text-[0.6rem] tracking-[0.3em] text-primary">
                NO GUIDES YET
              </span>

              <h3 className="mt-4 font-display text-xl tracking-tight">
                暂无攻略
              </h3>

              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                该分类的攻略内容正在整理中，敬请期待。
              </p>
            </div>
          )}

          {filteredGuides.map((guide) => {
            const href =
              guide.type === 'external' ||
              guide.type === 'discord'
                ? guide.videoUrl || '#'
                : `/guides/${guide.slug}`

            return (
              <a
                key={guide.id}
                href={href}
                {...(guide.type === 'external' ||
                guide.type === 'discord'
                  ? {
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    }
                  : {})}
                className="group grid gap-8 py-8 md:grid-cols-[400px_1fr_auto] md:items-center"
              >
                {guide.image && (
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={guide.image}
                      alt={guide.title}
                      fill
                      sizes="(min-width: 768px) 400px, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />

                    {guide.original && (
                      <span className="absolute right-0 top-0 z-10 rounded-bl-lg bg-primary px-3 py-1.5 font-display text-[0.58rem] tracking-[0.12em] text-primary-foreground shadow-sm">
                        酒馆原创
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-[0.58rem] tracking-[0.2em] text-primary">
                      {guide.category}
                    </span>

                    <span className="text-[0.6rem] tracking-[0.12em] text-muted-foreground/60">
                      {guide.type === 'article' && '文章'}
                      {guide.type === 'video' && '视频'}
                      {guide.type === 'discord' && 'Discord'}
                      {guide.type === 'external' && '外部链接'}
                    </span>
                  </div>

                  <h3 className="mt-2 font-display text-xl font-medium tracking-tight transition-colors group-hover:text-primary">
                    {guide.title}
                  </h3>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                    {guide.description}
                  </p>

                  {guide.tags && guide.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {guide.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2.5 py-1 text-[0.62rem] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {(guide.author || guide.date) && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-[0.68rem] text-muted-foreground/70">
                      {guide.author && (
                        <span>{guide.author}</span>
                      )}

                      {guide.author && guide.date && (
                        <span className="size-1 rounded-full bg-border" />
                      )}

                      {guide.date && (
                        <span>{guide.date}</span>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-xl text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary">
                  →
                </span>
              </a>
            )
          })}
        </div>
      </section>

      <PageCompanion companion="asrcwww" />
    </div>
  )
}