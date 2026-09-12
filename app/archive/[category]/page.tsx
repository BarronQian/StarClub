import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, ImagePlus, MapPin } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { ARCHIVE, countAlbumPhotos, getCategory } from '@/lib/archive'

type Params = { params: Promise<{ category: string }> }

export function generateStaticParams() {
  return ARCHIVE.map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) return { title: '未找到 · 星际酒馆 StarClub' }
  return {
    title: `${category.title} · 星际酒馆 StarClub`,
    description: category.summary,
  }
}

export default async function CategoryPage({ params }: Params) {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()

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
              { label: '往期活动合影', href: '/archive' },
              { label: category.title },
            ]}
          />
          <Reveal className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="font-display text-[0.65rem] tracking-[0.4em] text-primary">
                {category.index}
              </span>
              <span className="h-px w-10 bg-primary/40" aria-hidden="true" />
              <span className="text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
                {category.en}
              </span>
            </div>
            <h1 className="max-w-3xl font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {category.title}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {category.summary}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-14 lg:px-10 lg:pt-20">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {category.albums.map((album, i) => (
            <Reveal key={album.slug} delay={i * 80}>
              <li className="h-full">
                <Link
                  href={`/archive/${category.slug}/${album.slug}`}
                  className="group corner-cut relative flex h-full flex-col overflow-hidden border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-primary hover:shadow-[0_4px_12px_rgba(0,0,0,0.05),0_18px_42px_rgba(0,0,0,0.11)]"
                >
                  <div className="relative aspect-video w-full overflow-hidden">
                    {album.cover ? (
                      <Image
                        src={album.cover || '/placeholder.svg'}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 border-b border-dashed border-border bg-card/60">
                        <ImagePlus
                          className="size-6 text-muted-foreground/50"
                          strokeWidth={1.4}
                          aria-hidden="true"
                        />
                        <p className="font-display text-[0.58rem] tracking-[0.26em] text-muted-foreground/70">
                          封面待上传
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5 lg:p-6">
                    <span className="text-[0.6rem] tracking-[0.26em] text-muted-foreground uppercase">
                      {album.en}
                    </span>
                    <h2 className="text-base leading-snug text-foreground lg:text-lg">
                      {album.title}
                    </h2>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {album.summary}
                    </p>
                    {album.place ? (
                      <p className="flex items-center gap-2 text-[0.7rem] text-foreground/70">
                        <MapPin
                          className="size-3.5 text-primary"
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                        {album.place}
                      </p>
                    ) : null}
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                      <span className="text-[0.7rem] text-muted-foreground">
                        {album.sessions.length} 期
                        {countAlbumPhotos(album) > 0
                          ? ` · ${countAlbumPhotos(album)} 张`
                          : ' · 待上传'}
                      </span>
                      <span className="flex items-center gap-1.5 font-display text-[0.6rem] tracking-[0.24em] text-primary">
                        查看
                        <ArrowRight
                          className="size-3 transition-transform group-hover:translate-x-1"
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-14">
          <Link
            href="/archive"
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
    </div>
  )
}
