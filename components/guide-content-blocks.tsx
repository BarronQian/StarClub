import Image from 'next/image'

export type GuideContentBlock = {
  id: string
  block_type: string
  block_order: number
  content: Record<string, unknown>
}

type Props = {
  blocks: GuideContentBlock[]
}

export function GuideContentBlocks({
  blocks,
}: Props) {
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
    <article className="mx-auto max-w-4xl">
      <div className="space-y-8">
        {blocks.map((block) => {
          const content =
            block.content ?? {}

          switch (block.block_type) {
            case 'heading': {
              const text =
                typeof content.text === 'string'
                  ? content.text
                  : ''

              const level =
                typeof content.level === 'number'
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
                typeof content.text === 'string'
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
                typeof content.src === 'string'
                  ? content.src
                  : ''

              const alt =
                typeof content.alt === 'string'
                  ? content.alt
                  : ''

              const caption =
                typeof content.caption === 'string'
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
                  <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
                    <Image
                      src={src}
                      alt={alt}
                      fill
                      sizes="(min-width: 1024px) 896px, 100vw"
                      className="object-contain"
                    />
                  </div>

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
                        item
                      ): item is string =>
                        typeof item ===
                        'string'
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
                    )
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
                typeof content.url === 'string'
                  ? content.url
                  : ''

              if (!url) {
                return null
              }

              return (
                <div
                  key={block.id}
                  className="overflow-hidden rounded-2xl border border-border bg-black"
                >
                  <div className="relative aspect-video">
                    <iframe
                      src={url}
                      title={
                        typeof content.title ===
                        'string'
                          ? content.title
                          : 'Guide video'
                      }
                      className="absolute inset-0 h-full w-full"
                      allow="fullscreen"
                      allowFullScreen
                      frameBorder="0"
                    />
                  </div>
                </div>
              )
            }

            default:
              return null
          }
        })}
      </div>
    </article>
  )
}