import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, Layers, MapPin } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { ArchivePhotoGrid } from '@/components/archive-photo-grid'
import { PageCompanion } from '@/components/page-companion'
import { ARCHIVE, countAlbumPhotos, getAlbum } from '@/lib/archive'
import { cn } from '@/lib/utils'

type Params = { params: Promise<{ category: string; album: string }> }

export function generateStaticParams() {
  return ARCHIVE.flatMap((c) =>
    c.albums.map((a) => ({ category: c.slug, album: a.slug })),
  )
}

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const {
    category,
    album,
  } = await params

  const found =
    getAlbum(category, album)

  if (!found) {
    return {
      title: '未找到',
    }
  }

  return {
    title: `${found.album.title} · ${found.category.title}`,
    description:
      found.album.summary,

    alternates: {
      canonical: `/archive/${encodeURIComponent(category)}/${encodeURIComponent(album)}`,
    },
  }
}

export default async function AlbumPage({ params }: Params) {
  const { category: categorySlug, album: albumSlug } = await params
  const found = getAlbum(categorySlug, albumSlug)
  if (!found) notFound()

  const { category, album } = found
  const photoCount = countAlbumPhotos(album)
const sortedSessions = [...album.sessions].sort((a, b) => {
  // 两个都有日期：日期新的在前
  if (a.date && b.date) {
    return b.date.localeCompare(a.date)
  }

  // 有日期的排在没日期的前面
  if (a.date && !b.date) return -1
  if (!a.date && b.date) return 1

  // 都没有日期时，按第几期倒序
  const getNumber = (label: string) =>
    Number(label.match(/\d+/)?.[0] ?? 0)

  return getNumber(b.label) - getNumber(a.label)
})

  return (
    <div className="pb-24 lg:pb-32">
      <section className="relative border-b border-border">
        <div
          aria-hidden="true"
          className="hud-grid absolute inset-0 -z-10 opacity-70"
        />
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-10 lg:py-20">
          <ArchiveBreadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '往期活动合影', href: '/archive' },
              { label: category.title, href: `/archive/${category.slug}` },
              { label: album.title },
            ]}
          />
          <Reveal className="mt-8 flex flex-col gap-5">
            <span className="text-[0.65rem] tracking-[0.32em] text-muted-foreground uppercase">
              {album.en}
            </span>
            {/* 图集标题 */}
            <h1 className="max-w-3xl font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {album.title}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {album.summary}
            </p>
            <dl className="flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-5 text-xs text-foreground/80">
              <div className="flex items-center gap-2">
                <Layers
                  className="size-3.5 text-primary"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <dt className="sr-only">场次</dt>
                <dd className="tracking-[0.08em]">
                  {album.sessions.length} 期 ·{' '}
                  {photoCount > 0 ? `${photoCount} 张` : '待上传'}
                </dd>
              </div>
              {album.place ? (
                <div className="flex items-center gap-2">
                  <MapPin
                    className="size-3.5 text-primary"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <dt className="sr-only">地点</dt>
                  <dd>{album.place}</dd>
                </div>
              ) : null}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-14 lg:px-10 lg:pt-20">
        {photoCount === 0 ? (
          <Reveal className="corner-cut mb-12 border border-border bg-card px-6 py-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              这个图集按场次分开了，每一期是
              {' '}
              <code className="text-foreground">lib/archive.ts</code>
              {' '}
              里的一个
              {' '}
              <code className="text-foreground">session</code>
              ：填上
              {' '}
              <code className="text-foreground">date</code>
              {' '}
              和
              {' '}
              <code className="text-foreground">photos</code>
              {' '}
              即可，预留位会自动被替换。
            </p>
          </Reveal>
        ) : null}

        {/* 按时间分开的场次 */}
        <ol className="flex flex-col gap-16 lg:gap-24">
{[...album.sessions]
  .sort((a, b) => {
    if (a.date && b.date) {
      return b.date.localeCompare(a.date)
    }

    if (a.date && !b.date) return -1
    if (!a.date && b.date) return 1

    const getNumber = (label: string) =>
      Number(label.match(/\d+/)?.[0] ?? 0)

    return getNumber(b.label) - getNumber(a.label)
  })
  .map((session, i) => (
            <li key={session.slug} className="relative">
              <Reveal className="flex flex-col gap-5 border-b border-border pb-6">
                <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
<h2 className="font-display text-xl leading-tight tracking-tight sm:text-2xl">
  {(() => {
    const match = session.label.match(/^第(.+?)(期|阶段)$/)

    return match ? (
      <>
        第
        <span className="font-semibold text-primary text-[1.08em]">
          {match[1]}
        </span>
        {match[2]}
      </>
    ) : (
      session.label
    )
  })()}
</h2>
                  {session.captains?.length ? (
  <p className="mt-2 text-xs tracking-[0.12em] text-muted-foreground">
    北极星舰长：{session.captains.join(' · ')}
  </p>
) : null}
                  {session.title ? (
                    <span className="text-[0.7rem] tracking-[0.2em] text-muted-foreground">
                      {session.title}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      'ml-auto flex items-center gap-2 text-xs tracking-[0.14em]',
                      session.date
                        ? 'text-foreground/80'
                        : 'text-muted-foreground/60',
                    )}
                  >
                    <CalendarDays
                      className="size-3.5 text-primary"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    {session.date ?? '日期待填写'}
{session.photos.length > 0
  ? ` · ${session.photos.length} 张照片`
  : ' · 待上传'}
                  </span>
                </div>
                {session.note ? (
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {session.note}
                  </p>
                ) : null}
              </Reveal>

              <div className="mt-8">
                <ArchivePhotoGrid
                  photos={session.photos}
                  reservedSlots={session.reservedSlots}
                  compact={
  category.slug === 'sandbox' ||
  album.slug === 'b-t-r' ||
  album.slug === 'sightseeing-tours' ||
  album.slug === 'ski-adventure' ||
  album.slug === 'squid-game' ||
  album.slug === 'idris-cf' ||
  album.slug === 'battle-royal-game' ||
  album.slug === 'k-o-f' ||
  album.slug === 'demolition' ||
  album.slug === 'supply-or-die'
}
                />
              </div>
              {session.videoUrl ? (
  <div className="mt-10 border-t border-border pt-6">
    <p className="mb-3 font-display text-[0.65rem] tracking-[0.18em] text-muted-foreground">
      ACTIVITY VIDEO
    </p>

    <a
      href={session.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-primary transition-opacity hover:opacity-70"
    >
      更多精彩画面请点击观看活动视频
      <span aria-hidden="true">→</span>
    </a>
  </div>
) : null}

{session.videoEmbedUrl ? (
  <div className="mt-10 border-t border-border pt-6">
    <p className="mb-3 font-display text-[0.65rem] tracking-[0.18em] text-muted-foreground">
      ACTIVITY VIDEO
    </p>

    <h3 className="mb-5 text-lg font-medium">
      更多精彩画面
    </h3>

    <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-sm">
      <iframe
        src={session.videoEmbedUrl}
        title={`${album.title} ${session.label} 活动视频`}
        className="h-full w-full"
        allow="fullscreen; picture-in-picture"
        allowFullScreen
        scrolling="no"
        frameBorder="0"
      />
    </div>
  </div>
) : null}
{session.videos?.length ? (
  <div className="mt-10 border-t border-border pt-6">
    <p className="mb-6 font-display text-[0.65rem] tracking-[0.18em] text-muted-foreground">
      ACTIVITY VIDEOS
    </p>

    <div className="space-y-12">
{session.videos.map((video) => (
  <div key={video.title}>
    <h3 className="mb-4 flex items-center gap-2 text-lg font-medium">
      {video.platform === 'youtube' ? (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 text-red-600"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
        </svg>
) : (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 shrink-0 text-[#00AEEC]"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="6" width="18" height="14" rx="3" />
    <path d="M8 3l4 3 4-3" />
    <path d="M8 12h.01" />
    <path d="M16 12h.01" />
  </svg>
)}

      <span>{video.title}</span>
    </h3>

          <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-sm">
            <iframe
              src={video.embedUrl}
              title={`${album.title} ${session.label} ${video.title}`}
              className="h-full w-full"
              allow="fullscreen; picture-in-picture"
              allowFullScreen
              scrolling="no"
              frameBorder="0"
            />
          </div>
        </div>
      ))}
    </div>
  </div>
) : null}
            </li>
          ))}
        </ol>

        <Reveal className="mt-16">
          <Link
            href={`/archive/${category.slug}`}
            className="group inline-flex items-center gap-2 font-display text-[0.65rem] tracking-[0.26em] text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft
              className="size-3.5 transition-transform group-hover:-translate-x-1"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            返回{category.title}
          </Link>
        </Reveal>
      </section>
      
            {category.slug === 'sandbox' && album.slug === 'contested-zone' && (
        <PageCompanion companion="furysoulfy" />
      )}
    </div>
  )
}
