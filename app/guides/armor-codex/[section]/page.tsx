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

type GuideSectionItemRow = {
  id: string
  section_id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  image: string | null
  source: string | null
  acquisition: string | null
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

async function getArmorSectionItems(
  sectionId: string
) {
  const supabase = getSupabase()

  if (!supabase) {
    return []
  }

  const {
    data,
    error,
  } = await supabase
    .from('guide_section_items')
    .select(`
      id,
      section_id,
      slug,
      title,
      subtitle,
      description,
      image,
      source,
      acquisition,
      tags,
      published,
      sort_order
    `)
    .eq(
      'section_id',
      sectionId
    )
    .eq(
      'published',
      true
    )
    .order(
      'sort_order',
      {
        ascending: true,
      }
    )

  if (error) {
    console.error(
      '[ARMOR SECTION ITEMS] Failed to load:',
      error
    )

    return []
  }

  return (
    data ?? []
  ) as GuideSectionItemRow[]
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

    alternates: {
      canonical: `/guides/armor-codex/${encodeURIComponent(section)}`,
    },

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

  const items =
    await getArmorSectionItems(
      armor.id
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-display text-[0.62rem] tracking-[0.3em] text-primary">
              SERIES DETAILS
            </span>

            <h2 className="mt-3 font-display text-2xl tracking-tight sm:text-3xl">
              系列护甲
            </h2>

            <p className="mt-3 text-sm text-muted-foreground">
              共收录 {items.length} 件护甲
            </p>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map(
              (item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/35"
                >
                  {item.image && (
                    <div className="relative aspect-4/3 overflow-hidden border-b border-border bg-muted">
                      <Image
                        src={item.image}
                        alt={
                          item.subtitle
                            ? `${item.title} ${item.subtitle}`
                            : item.title
                        }
                        fill
                        sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl tracking-tight">
                          {item.title}
                        </h3>

                        {item.subtitle && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {item.tags &&
                      item.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.tags.map(
                            (tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-primary/8 px-2.5 py-1 text-[0.68rem] tracking-[0.06em] text-primary"
                              >
                                {tag}
                              </span>
                            )
                          )}
                        </div>
                      )}

                    {item.description && (
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    )}

                    {(item.source ||
                      item.acquisition) && (
                      <div className="mt-5 space-y-3 border-t border-border pt-4">
                        {item.source && (
                          <div>
                            <div className="text-[0.62rem] tracking-[0.18em] text-muted-foreground">
                              SOURCE
                            </div>

                            <div className="mt-1 text-sm">
                              {item.source}
                            </div>
                          </div>
                        )}

                        {item.acquisition && (
                          <div>
                            <div className="text-[0.62rem] tracking-[0.18em] text-muted-foreground">
                              ACQUISITION
                            </div>

                            <div className="mt-1 text-sm leading-6">
                              {item.acquisition}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
            <div className="font-display text-sm tracking-[0.18em] text-muted-foreground">
              NO ARMOR ITEMS
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              该系列的具体护甲资料正在整理中。
            </p>
          </div>
        )}
      </section>
    </div>
  )
}