import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'
import { getCardAspectRatio, getDisplayAuthor } from '@/lib/gallery'
import { getFeaturedGalleryFromDb } from '@/lib/gallery-db'

export async function Gallery() {
  const shots = await getFeaturedGalleryFromDb()

  return (
    <section
      id="gallery"
      className="relative border-t border-border py-20 lg:py-32"
    >
      <div className="site-container">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            index="03"
            eyebrow="Community Gallery"
            title="星际公民眼里的宇宙"
            description="来自社区成员入选的精美截图投稿。"
          />
          <Reveal delay={140}>
            <Link
              href="/gallery"
              className="group inline-flex items-center gap-2 border-b border-primary/40 pb-1 font-display text-[0.65rem] tracking-[0.26em] text-primary"
            >
              查看完整影廊
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-6">
          {shots.map((shot, i) => (
            <Reveal
              key={shot.src}
              as="figure"
              delay={i * 90}
              className={shot.wide ? 'lg:col-span-3' : 'lg:col-span-2'}
            >
              <Link
                href="/gallery"
                className="corner-cut group relative block w-full border border-border bg-card"
                style={{ aspectRatio: getCardAspectRatio(shot) }}
              >
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 45vw"
                  className="object-cover transition-transform duration-1400 group-hover:scale-[1.04]"
                />
              </Link>
              <figcaption className="mt-4 flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-foreground">
                  《{shot.caption}》
                </span>
                <span className="font-display text-[0.58rem] tracking-[0.22em] text-muted-foreground">
                  {getDisplayAuthor(shot)}
                </span>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
