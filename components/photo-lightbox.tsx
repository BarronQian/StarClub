'use client'

import { useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { ArchivePhoto } from '@/lib/archive'

type PhotoLightboxProps = {
  photos: ArchivePhoto[]
  index: number
  onClose: () => void
  /** Steps by a relative offset so rapid clicks never reuse a stale index. */
  onNavigate: (offset: number) => void
}

export function PhotoLightbox({ photos, index, onClose, onNavigate }: PhotoLightboxProps) {
  const photo = photos[index]
  const hasMultiple = photos.length > 1

  const goPrev = useCallback(() => {
    onNavigate(-1)
  }, [onNavigate])

  const goNext = useCallback(() => {
    onNavigate(1)
  }, [onNavigate])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose, goPrev, goNext])

  if (!photo) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption ?? photo.alt}
      className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm"
    >
      <button
        type="button"
        aria-label="关闭大图"
        onClick={onClose}
        className="absolute inset-0 cursor-zoom-out"
      />

      <header className="relative z-10 flex items-center justify-between gap-4 border-b border-border/60 px-5 py-4">
        <p className="font-display text-[0.6rem] tracking-[0.28em] text-muted-foreground">
          {String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭大图"
          className="pill flex items-center gap-2 border border-border px-4 py-2 font-display text-[0.6rem] tracking-[0.28em] text-foreground transition-colors hover:bg-card"
        >
          <X className="size-3.5" strokeWidth={1.6} aria-hidden="true" />
          关闭
        </button>
      </header>

      <div className="pointer-events-none relative z-10 flex flex-1 items-center justify-center overflow-auto p-4 sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src || '/placeholder.svg'}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          className="pointer-events-auto max-h-full w-auto max-w-full object-contain"
        />
      </div>

      {hasMultiple ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="上一张"
            className="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:bg-card sm:left-6"
          >
            <ChevronLeft className="size-5" strokeWidth={1.6} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="下一张"
            className="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:bg-card sm:right-6"
          >
            <ChevronRight className="size-5" strokeWidth={1.6} aria-hidden="true" />
          </button>
        </>
      ) : null}

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-5 py-4">
        <p className="text-xs tracking-[0.12em] text-muted-foreground">
          {photo.caption ?? photo.alt}
        </p>
        {photo.width && photo.height ? (
          <p className="font-display text-[0.6rem] tracking-[0.28em] text-muted-foreground/70">
            原图 {photo.width} × {photo.height}
          </p>
        ) : null}
      </footer>
    </div>
  )
}
