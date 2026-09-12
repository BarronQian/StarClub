import { GALLERY_CATEGORY_LABEL, type GalleryCategory } from '@/lib/gallery'

/**
 * Live preview card for the publishing form, mirroring the public
 * GalleryMosaic card's visual language (corner-cut border, pill category
 * badge, 《caption》 / @author overlay) so admins see exactly what the
 * public gallery card will look like.
 */
export function GalleryPreviewCard({
  src,
  caption,
  author,
  category,
  publishedAt,
  alt,
  aspectRatio,
}: {
  src: string | null
  caption: string
  author: string
  category: GalleryCategory
  publishedAt: string
  alt: string
  aspectRatio: number
}) {
  return (
    <div className="corner-cut relative overflow-hidden border border-border bg-card">
      <div
        className="relative w-full bg-muted"
        style={{ aspectRatio: Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 16 / 9 }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt || caption || '预览图片'} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-[0.62rem] tracking-[0.2em] text-muted-foreground">
              暂无图片预览
            </span>
          </div>
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col justify-between gap-2 bg-gradient-to-t from-background/85 via-background/0 to-background/10 p-3"
        >
          <span className="self-start pill border border-border/60 bg-background/80 px-2 py-1 font-display text-[0.55rem] tracking-[0.18em] text-foreground backdrop-blur">
            {GALLERY_CATEGORY_LABEL[category]}
          </span>
          <div className="absolute bottom-3 left-3 right-3 flex flex-col items-start gap-0.5">
            <span className="text-sm font-medium text-white">
              《{caption || '未命名作品'}》
            </span>
            <span className="font-display text-[0.6rem] tracking-[0.12em] text-white/75">
              {author || '@未知作者'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <span className="font-display text-[0.6rem] tracking-[0.15em] text-muted-foreground">
          {publishedAt || '未设置日期'}
        </span>
      </div>
    </div>
  )
}
