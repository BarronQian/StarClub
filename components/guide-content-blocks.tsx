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
      <article className="mx-auto max-w-4xl">
        <div className="space-y-10">
          {blocks.map((block) => {
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
                    className="border-t border-border pt-10 first:border-t-0 first:pt-0"
                  >
                    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                      <span className="font-display text-[0.62rem] tracking-[0.3em] text-primary">
                        GUIDE SECTION
                      </span>

                      {title && (
                        <h2 className="mt-3 font-display text-2xl tracking-tight text-foreground sm:text-3xl">
                          {title}
                        </h2>
                      )}

                      {description && (
                        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">
                          {description}
                        </p>
                      )}

                      {author && (
                        <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-sm">
                          <span className="text-muted-foreground">
                            作者
                          </span>

                          {authorUrl ? (
                            <a
                              href={authorUrl}
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
                      className="pt-3 font-display text-xl tracking-tight sm:text-2xl"
                    >
                      {text}
                    </h3>
                  )
                }

                return (
                  <h2
                    key={block.id}
                    className="pt-4 font-display text-2xl tracking-tight sm:text-3xl"
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
                    className="whitespace-pre-line text-sm leading-8 text-muted-foreground sm:text-base"
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
                    className="space-y-3"
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
                        sizes="(min-width: 1024px) 896px, 100vw"
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
                    className={`space-y-2 pl-6 text-sm leading-7 text-muted-foreground sm:text-base ${
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
                    className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6"
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
                    className="space-y-3"
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