import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Images } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { ARCHIVE, countPhotos } from '@/lib/archive'
import { ArchiveCompanion } from '@/components/archive-companion'

export const metadata: Metadata = {
  title: '往期合影',
  description:
    '星际酒馆 StarClub 往期活动合影归档：沙盒副本、限时活动、飞船首飞、酒馆自定义活动与社区大型集体合影，记录全球华人 Star Citizen 玩家社区的每一次集结。',
  alternates: {
    canonical: '/archive',
  },
}

export default function ArchivePage() {
  return (
    <div className="pb-24 lg:pb-32">
      <section className="relative border-b border-border">
        <div
          aria-hidden="true"
          className="hud-grid absolute inset-0 -z-10 opacity-70"
        />
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-24">
          <ArchiveBreadcrumb
            items={[{ label: '首页', href: '/' }, { label: '往期活动合影' }]}
          />
          <Reveal className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="font-display text-[0.65rem] tracking-[0.4em] text-primary">
                ARCHIVE
              </span>
              <span className="h-px w-10 bg-primary/40" aria-hidden="true" />
              <span className="text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
                Group Photos
              </span>
            </div>
            <h1 className="max-w-3xl font-display text-4xl leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
              往期活动合影
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              每一次集体行动结束时，我们都会留一张全员合影。按活动类型归档，共
              {' '}
              {ARCHIVE.length} 个分类。
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-16 lg:px-10 lg:pt-24">
        <ul className="grid gap-6 lg:grid-cols-2">
          {ARCHIVE.map((category, i) => {
            const photoCount = countPhotos(category)
            const featured = category.slug === 'community'
            return (
              <Reveal
                key={category.slug}
                delay={i * 90}
                className={featured ? 'lg:col-span-2' : undefined}
              >
                <li className="h-full">
                  <Link
                    href={`/archive/${category.slug}`}
                    className="group relative block h-full overflow-hidden rounded-xl border border-border bg-card shadow-[0_3px_10px_rgba(0,0,0,0.06),0_14px_34px_rgba(0,0,0,0.10)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.015] hover:border-primary hover:ring-1 hover:ring-primary/40 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08),0_22px_48px_rgba(0,0,0,0.15)]"
                  >
                    <div
                      className={
                        featured
                          ? 'relative aspect-21/9 w-full'
                          : 'relative aspect-video w-full'
                      }
                    >
                      <Image
                        src={category.cover || '/placeholder.svg'}
                        alt=""
                        fill
                        sizes={
                          featured
                            ? '100vw'
                            : '(max-width: 1024px) 100vw, 50vw'
                        }
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-6 lg:p-8">
                      <div className="flex items-center gap-3">
                        <span className="font-display text-[0.62rem] tracking-[0.34em] text-primary">
                          {category.index}
                        </span>
                        <span
                          className="h-px w-8 bg-primary/40"
                          aria-hidden="true"
                        />
                        <span className="text-[0.62rem] tracking-[0.28em] text-muted-foreground uppercase">
                          {category.en}
                        </span>
                      </div>
                      <h2
                        className={
                          featured
                            ? 'font-display text-2xl leading-tight tracking-tight text-foreground lg:text-4xl'
                            : 'text-xl leading-snug text-foreground lg:text-2xl'
                        }
                      >
                        {category.title}
                      </h2>
                      <p
                        className={
                          featured
                            ? 'max-w-2xl text-sm leading-relaxed text-muted-foreground lg:text-base'
                            : 'max-w-xl text-sm leading-relaxed text-muted-foreground'
                        }
                      >
                        {category.summary}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-4 border-t border-border pt-5">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Images
                            className="size-3.5 text-primary"
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                          {category.albums.length} 个图集
                          <span aria-hidden="true" className="text-border">
                            ·
                          </span>
                          {photoCount > 0 ? `${photoCount} 张` : '待上传'}
                        </p>
                        <span className="flex items-center gap-2 font-display text-[0.62rem] tracking-[0.26em] text-primary">
                          进入
                          <ArrowRight
                            className="size-3.5 transition-transform group-hover:translate-x-1"
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              </Reveal>
            )
          })}
        </ul>
      </section>

      <ArchiveCompanion />
    </div>
  )
}
