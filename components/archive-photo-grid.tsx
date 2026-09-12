'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Expand, ImagePlus } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { PhotoLightbox } from '@/components/photo-lightbox'
import type { ArchivePhoto } from '@/lib/archive'
import { cn } from '@/lib/utils'

type ArchivePhotoGridProps = {
  photos: ArchivePhoto[]
  reservedSlots: number
  compact?: boolean
}

export function ArchivePhotoGrid({
  photos,
  reservedSlots,
  compact = false,
}: ArchivePhotoGridProps) {
  const slots = Array.from({ length: reservedSlots })
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div
  className={
    compact
      ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
      : 'grid gap-5 sm:grid-cols-2'
  }
>
      {photos.map((photo, i) => (
        <Reveal
          key={photo.src}
          delay={i * 70}
          className={cn(
  'flex flex-col',
  !compact && photo.wide && 'sm:col-span-2'
)}
        >
          <figure className="flex flex-col">
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`放大查看：${photo.caption ?? photo.alt}`}
              className="corner-cut group relative block w-full cursor-zoom-in border border-border bg-card transition-colors hover:border-foreground/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <Image
                src={photo.src || '/placeholder.svg'}
                alt={photo.alt}
                width={photo.width ?? 1920}
                height={photo.height ?? 1080}
                sizes={photo.wide ? '100vw' : '(max-width: 640px) 100vw, 50vw'}
                className="h-auto w-full transition-opacity group-hover:opacity-90"
              />

{compact && (
  <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-primary/90 px-2 py-1 font-display text-[0.62rem] tracking-[0.18em] text-primary-foreground shadow-sm">
    {String(i + 1).padStart(2, '0')}
  </span>
)}


              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-3 right-3 flex size-9 translate-y-1 items-center justify-center text-background opacity-0 transition duration-200 [filter:drop-shadow(0_1px_3px_rgb(0_0_0_/_0.55))] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [@media(pointer:coarse)]:translate-y-0 [@media(pointer:coarse)]:opacity-100"
              >
                <Expand className="size-5" strokeWidth={1.6} />
              </span>
            </button>
            {!compact && photo.caption ? (
              <figcaption className="mt-3 text-xs tracking-[0.12em] text-muted-foreground">
                {photo.caption}
              </figcaption>
            ) : null}
          </figure>
        </Reveal>
      ))}

      {slots.map((_, i) => (
        <Reveal
          key={`slot-${i}`}
          delay={(photos.length + i) * 70}
          className="flex flex-col"
        >
          <div className="corner-cut flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 border border-dashed border-border bg-card/50 text-center">
            <ImagePlus
              className="size-6 text-muted-foreground/50"
              strokeWidth={1.4}
              aria-hidden="true"
            />
            <p className="font-display text-[0.6rem] tracking-[0.28em] text-muted-foreground/70">
              预留位 {String(photos.length + i + 1).padStart(2, '0')}
            </p>
          </div>
          <p className="mt-3 text-xs tracking-[0.12em] text-muted-foreground/60">
            图注待填写
          </p>
        </Reveal>
      ))}

      {openIndex !== null ? (
        <PhotoLightbox
          photos={photos}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={(offset) =>
            setOpenIndex((current) =>
              current === null
                ? current
                : (current + offset + photos.length) % photos.length,
            )
          }
        />
      ) : null}
    </div>
  )
}
