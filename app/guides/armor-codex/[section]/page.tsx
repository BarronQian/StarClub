import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'

function getSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL

  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !supabaseServiceRoleKey
  ) {
    return null
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

type GuideSectionRow = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  image: string | null
  tags: string[] | null
  published: boolean
  sort_order: number
}

async function getArmorSection(
  sectionSlug: string
) {
  const supabase = getSupabase()

  if (!supabase) {
    return null
  }

  const {
    data: guide,
    error: guideError,
  } = await supabase
    .from('guides')
    .select('id')
    .eq('slug', 'armor-codex')
    .single()

  if (
    guideError ||
    !guide
  ) {
    return null
  }

  const {
    data,
    error,
  } = await supabase
    .from('guide_sections')
    .select(`
      id,
      slug,
      title,
      subtitle,
      description,
      image,
      tags,
      published,
      sort_order
    `)
    .eq(
      'guide_id',
      guide.id
    )
    .eq(
      'slug',
      sectionSlug
    )
    .eq(
      'published',
      true
    )
    .single()

  if (
    error ||
    !data
  ) {
    return null
  }

  return data as GuideSectionRow
}

type ArmorSectionPageProps = {
  params: Promise<{
    section: string
  }>
}

export async function generateMetadata({
  params,
}: ArmorSectionPageProps): Promise<Metadata> {
  const { section } =
    await params

  const armor =
    await getArmorSection(section)

  if (!armor) {
    return {
      title: '护甲系列不存在',
    }
  }

  const title =
    armor.subtitle
      ? `${armor.title}｜${armor.subtitle}`
      : armor.title

  const description =
    armor.description?.trim() ||
    `${armor.title}${armor.subtitle ? `（${armor.subtitle}）` : ''}护甲系列资料，包含外观、来源、获取方式与相关信息。`

  const image =
    armor.image ||
    undefined

  return {
    title,
    description,

    openGraph: {
      title,
      description,
      type: 'article',

      images:
        image
          ? [
              {
                url: image,
                alt:
                  armor.subtitle
                    ? `${armor.title} ${armor.subtitle}`
                    : armor.title,
              },
            ]
          : undefined,
    },

    twitter: {
      card:
        'summary_large_image',

      title,
      description,

      images:
        image
          ? [image]
          : undefined,
    },
  }
}

export default async function ArmorSectionPage({
  params,
}: ArmorSectionPageProps) {
  const {
    section,
  } = await params

  const armor =
    await getArmorSection(section)

  if (!armor) {
    notFound()
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
              {
                label: '首页',
                href: '/',
              },
              {
                label: '中文攻略',
                href: '/guides',
              },
              {
                label: '特色护甲图鉴',
                href: '/guides/armor-codex',
              },
              {
                label: armor.title,
              },
            ]}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-[0.65rem] tracking-[0.35em] text-primary">
                  ARMOR SERIES
                </span>

                <span className="h-px w-10 bg-primary/40" />

                <span className="text-[0.65rem] tracking-[0.3em] text-muted-foreground">
                  STARCLUB ARMOR CODEX
                </span>
              </div>

              <h1 className="mt-6 font-display text-4xl tracking-tight sm:text-5xl lg:text-6xl">
                {armor.title}
              </h1>

              {armor.subtitle && (
                <p className="mt-3 text-lg text-muted-foreground">
                  {armor.subtitle}
                </p>
              )}

              {armor.tags &&
                armor.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {armor.tags.map(
                      (tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-primary/8 px-3 py-1.5 text-xs tracking-[0.08em] text-primary"
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                )}

              <p className="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {armor.description ||
                  '该护甲系列的详细资料正在整理中，后续将持续补充护甲外观、来源、获取方式与相关信息。'}
              </p>
            </div>

            {armor.image && (
              <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-border bg-muted">
                <Image
                  src={armor.image}
                  alt={`${armor.title} ${armor.subtitle ?? ''}`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="site-container pt-12 lg:pt-16">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <span className="font-display text-[0.62rem] tracking-[0.3em] text-primary">
            SERIES DETAILS
          </span>

          <h2 className="mt-3 font-display text-2xl tracking-tight">
            系列详情
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            当前页面已经正式接入 Supabase。
            下一步我们会把每个护甲系列的具体护甲、图片、来源、获取方式等内容也迁进数据库，
            并由后台统一管理。
          </p>
        </div>
      </section>
    </div>
  )
}