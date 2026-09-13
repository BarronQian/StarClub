import type { Metadata } from 'next'

import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { Reveal } from '@/components/reveal'
import { GalleryPageGrid } from '@/components/gallery-page-grid'
import { GalleryFilmBackground } from '@/components/gallery-film-background'
import { getGalleryFromDb } from '@/lib/gallery-db'
import { PageCompanion } from '@/components/page-companion'

export const revalidate = 60

export const metadata: Metadata = {
  title: '社区影廊 | 星际酒馆 StarClub',
  description:
    '星际酒馆 StarClub 社区影廊：来自全球华人 Star Citizen 玩家社区飞行员镜头下的宇宙摄影作品。',
}

export default async function GalleryPage() {
  const shots =
    await getGalleryFromDb()

    const heroShots =
  shots.filter(
    (shot) =>
      shot.heroFeatured,
  )

  return (
    <div className="pb-24 lg:pb-32">
      <section className="relative overflow-hidden ">
        {/* 最底层：三行滚动摄影作品 */}
        <GalleryFilmBackground shots={heroShots} />

        {/* 原来的 HUD 网格 */}
        <div
          aria-hidden="true"
          className="hud-grid absolute inset-0 z-0 opacity-40"
        />

        {/* 原来的标题区域，位置不变 */}
        <div className="relative z-20 mx-auto max-w-7xl px-5 pt-16 pb-24 lg:px-10 lg:pt-24 lg:pb-40">
          <ArchiveBreadcrumb
            items={[
              {
                label: '首页',
                href: '/',
              },
              {
                label: '影廊',
              },
            ]}
          />

          <Reveal className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="font-display text-[0.65rem] tracking-[0.4em] text-primary">
                COMMUNITY GALLERY
              </span>

              <span
                className="h-px w-10 bg-primary/40"
                aria-hidden="true"
              />

              <span className="text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
                Photography
              </span>
            </div>

            <h1 className="max-w-3xl font-display text-4xl leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
              飞行员镜头下的宇宙
            </h1>

            <p className="max-w-2xl text-sm font-medium leading-relaxed text-foreground/75 sm:text-base">
              来自星际酒馆社区的 Star Citizen 摄影作品。
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-16 lg:px-10 lg:pt-24">
        <GalleryPageGrid
          shots={shots}
        />
      </section>
      
      <PageCompanion companion="shanora" />

    </div>
  )
}
