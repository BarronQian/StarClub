import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import {
  GuideContentBlocks,
  type GuideContentBlock,
} from '@/components/guide-content-blocks'

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

type GuideRow = {
  id: string
  slug: string
  title: string
  description: string | null
  category: string
  tags: string[] | null
  type:
    | 'article'
    | 'video'
    | 'discord'
    | 'external'
  image: string | null
  author: string | null
  creator: string | null
  video_url: string | null
  original: boolean
  published: boolean
  published_at: string | null
}

async function getGuide(
  slug: string
) {
  const supabase =
    getSupabase()

  if (!supabase) {
    return null
  }

  const {
    data,
    error,
  } = await supabase
    .from('guides')
    .select(`
      id,
      slug,
      title,
      description,
      category,
      tags,
      type,
      image,
      author,
      creator,
      video_url,
      original,
      published,
      published_at
    `)
    .eq(
      'slug',
      slug
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

  return data as GuideRow
}

async function getGuideBlocks(
  guideId: string
) {
  const supabase =
    getSupabase()

  if (!supabase) {
    return []
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'guide_content_blocks'
    )
    .select(`
      id,
      block_type,
      block_order,
      content
    `)
    .eq(
      'guide_id',
      guideId
    )
    .order(
      'block_order',
      {
        ascending: true,
      }
    )

  if (error) {
    console.error(
      '[GUIDE BLOCKS] Failed to load:',
      error
    )

    return []
  }

  return (
    data ?? []
  ) as GuideContentBlock[]
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      timeZone:
        'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }
  ).format(
    new Date(value)
  )
}

function getBilibiliEmbedUrl(
  videoUrl: string
) {
  const bvMatch =
    videoUrl.match(
      /\/video\/(BV[a-zA-Z0-9]+)/
    )

  if (!bvMatch) {
    return null
  }

  const bvid =
    bvMatch[1]

  return `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0&autoplay=0`
}

type GuidePageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function GuidePage({
  params,
}: GuidePageProps) {
  const {
    slug,
  } = await params

  if (
    slug === 'armor-codex'
  ) {
    notFound()
  }

  const guide =
    await getGuide(slug)

  if (!guide) {
    notFound()
  }

  const date =
    formatDate(
      guide.published_at
    )

  const isVideo =
    guide.type === 'video'

  const bilibiliEmbedUrl =
    isVideo &&
    guide.video_url
      ? getBilibiliEmbedUrl(
          guide.video_url
        )
      : null

  const blocks =
    !isVideo
      ? await getGuideBlocks(
          guide.id
        )
      : []

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
                label:
                  guide.title,
              },
            ]}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-[0.65rem] tracking-[0.35em] text-primary">
                  {isVideo
                    ? 'VIDEO GUIDE'
                    : 'STAR CITIZEN GUIDE'}
                </span>

                <span className="h-px w-10 bg-primary/40" />

                <span className="text-[0.65rem] tracking-[0.3em] text-muted-foreground">
                  {
                    guide.category
                  }
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <h1 className="max-w-4xl font-display text-4xl tracking-tight sm:text-5xl lg:text-6xl">
                  {
                    guide.title
                  }
                </h1>

                {guide.original && (
                  <span className="rounded-full bg-primary px-3 py-1.5 text-[0.62rem] tracking-[0.12em] text-primary-foreground">
                    酒馆原创
                  </span>
                )}
              </div>

              {guide.description && (
                <p className="mt-6 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                  {
                    guide.description
                  }
                </p>
              )}

              {guide.tags &&
                guide.tags.length >
                  0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {guide.tags.map(
                      (
                        tag
                      ) => (
                        <span
                          key={
                            tag
                          }
                          className="rounded-full bg-primary/8 px-3 py-1.5 text-xs tracking-[0.08em] text-primary"
                        >
                          {
                            tag
                          }
                        </span>
                      )
                    )}
                  </div>
                )}

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                {guide.author && (
                  <span>
                    作者：
                    <strong className="font-medium text-foreground">
                      {
                        guide.author
                      }
                    </strong>
                  </span>
                )}

                {guide.creator && (
                  <span>
                    发布：
                    <strong className="font-medium text-foreground">
                      {
                        guide.creator
                      }
                    </strong>
                  </span>
                )}

                {date && (
                  <span>
                    发布时间：
                    <strong className="font-medium text-foreground">
                      {
                        date
                      }
                    </strong>
                  </span>
                )}
              </div>
            </div>

            {guide.image && (
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
                <Image
                  src={
                    guide.image
                  }
                  alt={
                    guide.title
                  }
                  fill
                  priority
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4">
                  <span className="rounded-full bg-black/70 px-3 py-1.5 text-[0.65rem] tracking-[0.12em] text-white backdrop-blur">
                    {isVideo
                      ? '视频攻略'
                      : '图文攻略'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="site-container pt-12 lg:pt-16">
        {isVideo &&
        guide.video_url ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-6 py-5 sm:px-8">
              <span className="font-display text-[0.62rem] tracking-[0.3em] text-primary">
                VIDEO GUIDE
              </span>

              <h2 className="mt-2 font-display text-2xl tracking-tight">
                视频攻略
              </h2>
            </div>

            <div className="p-6 sm:p-8">
              {bilibiliEmbedUrl && (
                <div className="overflow-hidden rounded-2xl bg-black">
                  <div className="relative aspect-video">
                    <iframe
                      src={
                        bilibiliEmbedUrl
                      }
                      title={
                        guide.title
                      }
                      className="absolute inset-0 h-full w-full"
                      allow="fullscreen"
                      allowFullScreen
                      scrolling="no"
                      frameBorder="0"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-display text-[0.6rem] tracking-[0.25em] text-primary">
                    ORIGINAL VIDEO
                  </span>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {guide.author && (
                      <>
                        作者：
                        <span className="text-foreground">
                          {
                            guide.author
                          }
                        </span>
                      </>
                    )}

                    {guide.creator && (
                      <>
                        {' · '}
                        出品：
                        <span className="text-foreground">
                          {
                            guide.creator
                          }
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <Link
                  href={
                    guide.video_url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-primary/30 px-5 py-2.5 text-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  前往 Bilibili ↗
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <GuideContentBlocks
            blocks={blocks}
          />
        )}
      </section>
    </div>
  )
}