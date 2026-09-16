'use client'

import Image from 'next/image'
import {
  useEffect,
  useState,
} from 'react'

import {
  getVideoEmbedUrl,
} from '@/lib/video-embed'

export type GuideContentBlock = {
  id: string
  block_type: string
  block_order: number
  content: Record<string, unknown>
}

type Props = {
  blocks: GuideContentBlock[]
}

type LightboxImage = {
  src: string
  alt: string
} | null

type GalleryImage = {
  src: string
  alt: string
  caption: string
}

function getSupabasePreviewUrl(
  src: string,
  width: number,
  quality = 75,
) {
  try {
    const url = new URL(src)

    if (
      url.hostname !==
        'nngrkcavazaypdvwcdbb.supabase.co' ||
      !url.pathname.includes(
        '/storage/v1/object/public/',
      )
    ) {
      return src
    }

    url.pathname =
      url.pathname.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/',
      )

    url.searchParams.set(
      'width',
      String(width),
    )
    url.searchParams.set(
      'quality',
      String(quality),
    )
    url.searchParams.set(
      'resize',
      'contain',
    )

    return url.toString()
  } catch {
    return src
  }
}

export function GuideContentBlocks({
  blocks,
}: Props) {
  const [
    lightboxImage,
    setLightboxImage,
  ] = useState<LightboxImage>(null)

  useEffect(() => {
    if (!lightboxImage) {
      return
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        setLightboxImage(null)
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    const originalOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      'hidden'

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )

      document.body.style.overflow =
        originalOverflow
    }
  }, [lightboxImage])

  if (blocks.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <span className="font-display text-[0.62rem] tracking-[0.3em] text-primary">
          GUIDE CONTENT
        </span>

        <h2 className="mt-3 font-display text-2xl tracking-tight">
          攻略正文
        </h2>

        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          该攻略的正文内容正在整理中。
        </p>
      </div>
    )
  }

  return (
    <>
      <article className="mx-auto w-full max-w-6xl">
        <div className="space-y-12 lg:space-y-14">
          {blocks.map((block) => {
            const sectionNumber =
              block.block_type === 'section'
                ? blocks
                    .slice(
                      0,
                      blocks.indexOf(block) + 1,
                    )
                    .filter(
                      (item) =>
                        item.block_type ===
                        'section',
                    ).length
                : 0
            const content =
              block.content ?? {}

            switch (block.block_type) {
                            case 'section': {
                const title =
                  typeof content.title ===
                  'string'
                    ? content.title
                    : ''

                const author =
                  typeof content.author ===
                  'string'
                    ? content.author
                    : ''

                const authorUrl =
                  typeof content.author_url ===
                  'string'
                    ? content.author_url
                    : ''

                const description =
                  typeof content.description ===
                  'string'
                    ? content.description
                    : ''

                if (
                  !title &&
                  !author &&
                  !description
                ) {
                  return null
                }

                return (
                  <header
                    key={block.id}
                    className="border-t border-border/60 pt-12 first:border-t-0 first:pt-0 lg:pt-14"
                  >
                    <div className="mx-auto max-w-4xl">
                      <div className="flex items-center gap-4">
                        <span className="font-display text-[0.62rem] tracking-[0.32em] text-primary">
                          GUIDE SECTION {String(sectionNumber).padStart(2, '0')}
                        </span>
                        <span className="h-px flex-1 bg-border/70" />
                      </div>

                      {title && (
                        <h2 className="mt-5 font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
                          {title}
                        </h2>
                      )}

                      {description && (
                        <p className="mt-6 whitespace-pre-line text-[0.95rem] leading-8 text-muted-foreground sm:text-[1.05rem] sm:leading-9">
                          {description}
                        </p>
                      )}

                      {author && (
                        <div className="mt-8 flex items-center gap-3 border-t border-border/70 pt-5 text-sm">
                          <span className="text-muted-foreground">
                            作者
                          </span>

                          {authorUrl ? (
                            <a
                              href={authorUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-foreground transition-colors hover:text-primary"
                            >
                              {author}
                            </a>
                          ) : (
                            <span className="font-medium text-foreground">
                              {author}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </header>
                )
              }

              case 'heading': {
                const text =
                  typeof content.text ===
                  'string'
                    ? content.text
                    : ''

                const level =
                  typeof content.level ===
                  'number'
                    ? content.level
                    : 2

                if (!text) {
                  return null
                }

                if (level === 3) {
                  return (
                    <h3
                      key={block.id}
                      className="mx-auto max-w-4xl pt-2 font-display text-2xl tracking-tight sm:text-3xl"
                    >
                      {text}
                    </h3>
                  )
                }

                return (
                  <h2
                    key={block.id}
                    className="mx-auto max-w-4xl pt-3 font-display text-3xl tracking-tight sm:text-4xl"
                  >
                    {text}
                  </h2>
                )
              }

              case 'paragraph': {
                const text =
                  typeof content.text ===
                  'string'
                    ? content.text
                    : ''

                if (!text) {
                  return null
                }

                return (
                  <p
                    key={block.id}
                    className="mx-auto max-w-4xl whitespace-pre-line text-[0.95rem] leading-8 text-muted-foreground sm:text-[1.05rem] sm:leading-9"
                  >
                    {text}
                  </p>
                )
              }

              case 'image': {
                const src =
                  typeof content.src ===
                  'string'
                    ? content.src
                    : ''

                const alt =
                  typeof content.alt ===
                  'string'
                    ? content.alt
                    : ''

                const caption =
                  typeof content.caption ===
                  'string'
                    ? content.caption
                    : ''

                if (!src) {
                  return null
                }

                return (
                  <figure
                    key={block.id}
                    className="mx-auto w-full max-w-6xl space-y-3"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxImage({
                          src,
                          alt,
                        })
                      }
                      className="group block w-full cursor-zoom-in overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      aria-label="点击放大图片"
                    >
                      <Image
                        src={src}
                        alt={alt}
                        width={1600}
                        height={1200}
                        sizes="(min-width: 1280px) 1152px, (min-width: 1024px) 90vw, 100vw"
                        className="mx-auto h-auto max-h-[75vh] w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                      />
                    </button>

                    {caption && (
                      <figcaption className="text-center text-xs leading-6 text-muted-foreground">
                        {caption}
                      </figcaption>
                    )}
                  </figure>
                )
              }
              
                            case 'gallery': {
                const images =
                  Array.isArray(
                    content.images,
                  )
                    ? content.images
                        .filter(
                          (
                            image,
                          ): image is Record<
                            string,
                            unknown
                          > =>
                            Boolean(
                              image &&
                                typeof image ===
                                  'object',
                            ),
                        )
                        .map(
                          (
                            image,
                          ): GalleryImage => ({
                            src:
                              typeof image.src ===
                              'string'
                                ? image.src
                                : '',

                            alt:
                              typeof image.alt ===
                              'string'
                                ? image.alt
                                : '',

                            caption:
                              typeof image.caption ===
                              'string'
                                ? image.caption
                                : '',
                          }),
                        )
                        .filter(
                          (image) =>
                            Boolean(
                              image.src,
                            ),
                        )
                    : []

                if (
                  images.length ===
                  0
                ) {
                  return null
                }

                return (
                  <GuideGallery
                    key={block.id}
                    images={images}
                    onOpenImage={(
                      image,
                    ) =>
                      setLightboxImage({
                        src:
                          image.src,
                        alt:
                          image.alt,
                      })
                    }
                  />
                )
              }

              case 'list': {
                const items =
                  Array.isArray(content.items)
                    ? content.items.filter(
                        (
                          item,
                        ): item is string =>
                          typeof item ===
                          'string',
                      )
                    : []

                const ordered =
                  content.ordered === true

                if (items.length === 0) {
                  return null
                }

                const ListTag =
                  ordered ? 'ol' : 'ul'

                return (
                  <ListTag
                    key={block.id}
                    className={`mx-auto max-w-4xl space-y-3 pl-6 text-[0.95rem] leading-8 text-muted-foreground sm:text-[1.05rem] ${
                      ordered
                        ? 'list-decimal'
                        : 'list-disc'
                    }`}
                  >
                    {items.map(
                      (item, index) => (
                        <li key={index}>
                          {item}
                        </li>
                      ),
                    )}
                  </ListTag>
                )
              }

              case 'callout': {
                const title =
                  typeof content.title ===
                  'string'
                    ? content.title
                    : ''

                const text =
                  typeof content.text ===
                  'string'
                    ? content.text
                    : ''

                if (!title && !text) {
                  return null
                }

                return (
                  <div
                    key={block.id}
                    className="mx-auto max-w-4xl rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-7"
                  >
                    {title && (
                      <h3 className="font-medium text-foreground">
                        {title}
                      </h3>
                    )}

                    {text && (
                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                        {text}
                      </p>
                    )}
                  </div>
                )
              }

              case 'video': {
                const url =
                  typeof content.url ===
                  'string'
                    ? content.url
                    : ''

                const title =
                  typeof content.title ===
                  'string'
                    ? content.title
                    : ''

                if (!url) {
                  return null
                }

                const video =
                  getVideoEmbedUrl(url)

                if (!video) {
                  return null
                }

                return (
                  <figure
                    key={block.id}
                    className="mx-auto w-full max-w-6xl space-y-3"
                  >
                    <div className="overflow-hidden rounded-2xl bg-black">
                      <div className="relative aspect-video">
                        <iframe
                          src={video.embedUrl}
                          title={
                            title ||
                            '攻略视频'
                          }
                          className="absolute inset-0 h-full w-full"
                          allow="fullscreen"
                          allowFullScreen
                          frameBorder="0"
                        />
                      </div>
                    </div>

                    {title && (
                      <figcaption className="text-center text-xs leading-6 text-muted-foreground">
                        {title}
                      </figcaption>
                    )}
                  </figure>
                )
              }

              default:
                return null
            }
          })}
        </div>
      </article>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8"
          onClick={() =>
            setLightboxImage(null)
          }
        >
          <button
            type="button"
            onClick={() =>
              setLightboxImage(null)
            }
            className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/20"
            aria-label="关闭图片"
          >
            ×
          </button>

          <div
            className="relative flex h-full w-full items-center justify-center"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <Image
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              width={2400}
              height={1800}
              sizes="100vw"
              className="max-h-[92vh] w-auto max-w-[96vw] object-contain"
              priority
            />
          </div>
        </div>
      )}
    </>
  )
}

function GuideGallery({
  images,
  onOpenImage,
}: {
  images: GalleryImage[]
  onOpenImage: (
    image: GalleryImage,
  ) => void
}) {
  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0)

  const [
    touchStart,
    setTouchStart,
  ] = useState<
    number | null
  >(null)

  const [
    touchEnd,
    setTouchEnd,
  ] = useState<
    number | null
  >(null)

  const activeImage =
    images[activeIndex] ??
    images[0]

  const hasMultiple =
    images.length > 1

  function previous() {
    setActiveIndex(
      (current) =>
        current === 0
          ? images.length - 1
          : current - 1,
    )
  }

  function next() {
    setActiveIndex(
      (current) =>
        current ===
        images.length - 1
          ? 0
          : current + 1,
    )
  }

  function handleTouchStart(
    event: React.TouchEvent,
  ) {
    setTouchEnd(null)

    setTouchStart(
      event.targetTouches[0]
        .clientX,
    )
  }

  function handleTouchMove(
    event: React.TouchEvent,
  ) {
    setTouchEnd(
      event.targetTouches[0]
        .clientX,
    )
  }

  function handleTouchEnd() {
    if (
      touchStart === null ||
      touchEnd === null
    ) {
      return
    }

    const distance =
      touchStart - touchEnd

    const minimumSwipe =
      50

    if (
      distance >
      minimumSwipe
    ) {
      next()
    }

    if (
      distance <
      -minimumSwipe
    ) {
      previous()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  return (
    <figure className="mx-auto w-full max-w-6xl space-y-4">
      <div
        className="group relative overflow-hidden rounded-2xl border border-border bg-black"
        onTouchStart={
          handleTouchStart
        }
        onTouchMove={
          handleTouchMove
        }
        onTouchEnd={
          handleTouchEnd
        }
      >
        <button
          type="button"
          onClick={() =>
            onOpenImage(
              activeImage,
            )
          }
          className="block w-full cursor-zoom-in"
          aria-label="点击放大图片"
        >
          <div className="relative flex min-h-65 items-center justify-center sm:min-h-105">
            <Image
              src={activeImage.src}
              alt={
                activeImage.alt
              }
              width={1600}
              height={1000}
              sizes="(min-width: 1280px) 1152px, (min-width: 1024px) 90vw, 100vw"
              className="max-h-[70vh] h-auto w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
            />
          </div>
        </button>

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={
                previous
              }
              aria-label="上一张图片"
              className="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-xl text-white backdrop-blur-sm transition-all hover:bg-black/75 sm:left-4 sm:size-11"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="下一张图片"
              className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-xl text-white backdrop-blur-sm transition-all hover:bg-black/75 sm:right-4 sm:size-11"
            >
              ›
            </button>

            <div className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              {activeIndex + 1}
              {' / '}
              {images.length}
            </div>
          </>
        )}
      </div>

      {activeImage.caption && (
        <figcaption className="text-center text-xs leading-6 text-muted-foreground">
          {
            activeImage.caption
          }
        </figcaption>
      )}

      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map(
            (
              image,
              index,
            ) => (
              <button
                key={`${image.src}-${index}`}
                type="button"
                onClick={() =>
                  setActiveIndex(
                    index,
                  )
                }
                aria-label={`查看第 ${
                  index + 1
                } 张图片`}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-18 sm:w-28 ${
                  index ===
                  activeIndex
                    ? 'border-primary opacity-100'
                    : 'border-transparent opacity-55 hover:opacity-90'
                }`}
              >
                <Image
                src={image.src}
                  alt={
                    image.alt
                  }
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </button>
            ),
          )}
        </div>
      )}
    </figure>
  )
}