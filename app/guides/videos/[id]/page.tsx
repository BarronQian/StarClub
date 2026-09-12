import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { GUIDES } from '@/lib/guides'

type VideoGuidePageProps = {
  params: Promise<{
    id: string
  }>
}

function getBilibiliEmbedUrl(url?: string) {
  if (!url) return null

  const match = url.match(/BV[a-zA-Z0-9]+/)
  if (!match) return null

  return `https://player.bilibili.com/player.html?bvid=${match[0]}&page=1&high_quality=1&danmaku=0`
}

export default async function VideoGuidePage({
  params,
}: VideoGuidePageProps) {
  const { id } = await params

  const guide = GUIDES.find(
    (item) => item.id === id && item.type === 'video',
  )

  if (!guide) {
    notFound()
  }

  const embedUrl = getBilibiliEmbedUrl(guide.videoUrl)

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
              {
                label: guide.category,
                href: `/guides?category=${encodeURIComponent(
                  guide.category,
                )}`,
              },
              { label: guide.title },
            ]}
          />

          <div className="mt-8 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display text-[0.65rem] tracking-[0.35em] text-primary">
                STARCLUB VIDEO GUIDE
              </span>

              <span className="h-px w-10 bg-primary/40" />

              <span className="text-[0.65rem] tracking-[0.3em] text-muted-foreground">
                BILIBILI
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
                {guide.title}
              </h1>

              {guide.original && (
                <span className="rounded-full bg-primary px-3 py-1.5 text-[0.62rem] tracking-[0.12em] text-primary-foreground">
                  酒馆原创
                </span>
              )}
            </div>

            <p className="mt-6 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              {guide.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{guide.category}</span>

              {guide.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2.5 py-1 text-[0.62rem]"
                >
                  {tag}
                </span>
              ))}

              {guide.author && (
  <>
    <span className="size-1 rounded-full bg-border" />
    <span>作者：{guide.author}</span>
  </>
)}

{guide.creator && (
  <>
    <span className="size-1 rounded-full bg-border" />
    <span>出品：{guide.creator}</span>
  </>
)}
            </div>
          </div>
        </div>
      </section>

      <section className="site-container pt-12 lg:pt-16">
        {embedUrl ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-sm">
            <div className="aspect-video">
              <iframe
                src={embedUrl}
                title={guide.title}
                className="h-full w-full"
                allowFullScreen
                scrolling="no"
                frameBorder="0"
                allow="fullscreen; picture-in-picture"
              />
            </div>
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-muted">
            <p className="text-sm text-muted-foreground">
              暂时无法加载视频播放器。
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-8">
          <div>
            <span className="font-display text-[0.6rem] tracking-[0.25em] text-primary">
              ORIGINAL VIDEO
            </span>

            <p className="mt-2 text-sm text-muted-foreground">
  作者：{guide.author || '未知'} · 出品：{guide.creator || '星际酒馆 StarClub'}
</p>
          </div>

          {guide.videoUrl && (
            <Link
              href={guide.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-xs text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              前往 Bilibili
              <ArrowUpRight className="size-3.5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}