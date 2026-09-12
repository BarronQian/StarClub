'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Maximize2 } from 'lucide-react'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'

export default function FleetOverviewPage() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
    const [zoom, setZoom] = useState(1)

const [isDragging, setIsDragging] = useState(false)
const [dragStartX, setDragStartX] = useState(0)
const [dragStartY, setDragStartY] = useState(0)
const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 })

  return (
    <div className="pb-24 lg:pb-32">
      <section className="relative border-b border-border">
        <div
          aria-hidden="true"
          className="hud-grid absolute inset-0 -z-10 opacity-70"
        />

        <div className="site-container py-16 lg:py-24">
          <ArchiveBreadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '中文攻略', href: '/guides' },
              { label: '舰船武器组件', href: '/guides?category=舰船武器组件' },
              { label: '星际公民全舰船总览图' },
            ]}
          />

          <div className="mt-8 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display text-[0.65rem] tracking-[0.35em] text-primary">
                STAR CITIZEN FLEET GUIDE
              </span>

              <span className="h-px w-10 bg-primary/40" />

              <span className="text-[0.65rem] tracking-[0.3em] text-muted-foreground">
                FLEET OVERVIEW
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl tracking-tight sm:text-5xl lg:text-6xl">
                星际公民全舰船总览图
              </h1>

              <span className="rounded-full bg-primary px-3 py-1.5 text-[0.62rem] tracking-[0.12em] text-primary-foreground">
                酒馆原创
              </span>
            </div>

            <p className="mt-6 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              汇总《星际公民》各大舰船制造商旗下舰船与载具，
              方便快速查看不同厂商舰船的外观、体型与整体分布。
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>舰船武器组件</span>
              <span className="size-1 rounded-full bg-border" />
              <span>舰船介绍</span>
              <span className="size-1 rounded-full bg-border" />
              <span>作者：MR-STEVEN</span>
            </div>
          </div>
        </div>
      </section>

      <section className="site-container pt-12 lg:pt-16">
        <div className="mb-8">
          <span className="font-display text-[0.62rem] tracking-[0.3em] text-primary">
            FULL FLEET CHART
          </span>

          <h2 className="mt-3 font-display text-2xl tracking-tight sm:text-3xl">
            全舰船总览
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            下图为完整高清舰船总览图。建议在桌面端查看，以便观察舰船名称、
            厂商分类及不同舰船之间的尺寸与外观差异。
          </p>
        </div>

<button
  type="button"
  onClick={() => {
  setZoom(1)
  setLightboxOpen(true)
}}
  className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-card text-left"
>
  <Image
    src="/images/guides/ships/star-citizen-fleet-overview.jpg"
    alt="星际公民全舰船总览图"
    width={4096}
    height={4096}
    sizes="100vw"
    className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.005]"
    priority
  />

  <span className="absolute right-5 top-5 flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
    <Maximize2 className="size-3.5" />
    点击放大
  </span>
</button>

        <div className="mt-8 border-t border-border pt-6 text-xs leading-6 text-muted-foreground">
          制作：MR-STEVEN
        </div>
      </section>

      {lightboxOpen && (
  <div
    className="fixed inset-0 z-100 bg-black/95"
    onClick={() => setLightboxOpen(false)}
  >
    <button
      type="button"
      onClick={() => setLightboxOpen(false)}
      className="fixed right-6 top-6 z-110 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
      aria-label="关闭图片"
    >
      <X className="size-5" />
    </button>

    <div
  className="fixed bottom-6 left-1/2 z-110 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/70 p-1.5 text-white shadow-xl backdrop-blur-md"
  onClick={(e) => e.stopPropagation()}
>
  <button
    type="button"
    onClick={() =>
      setZoom((value) => Math.max(0.5, value - 0.25))
    }
    className="flex size-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-white/10"
    aria-label="缩小"
  >
    −
  </button>

  <button
    type="button"
    onClick={() => setZoom(1)}
    className="min-w-16 rounded-full px-3 py-2 text-xs transition-colors hover:bg-white/10"
  >
    {Math.round(zoom * 100)}%
  </button>

  <button
    type="button"
    onClick={() =>
      setZoom((value) => Math.min(4, value + 0.25))
    }
    className="flex size-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-white/10"
    aria-label="放大"
  >
    +
  </button>
</div>

        <div
          className={`h-full w-full overflow-auto p-4 sm:p-8 ${
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
onWheel={(e) => {
  e.preventDefault()
  e.stopPropagation()

  const container = e.currentTarget
  const oldZoom = zoom
  const step = e.deltaY < 0 ? 0.15 : -0.15
  const newZoom = Math.min(4, Math.max(0.5, oldZoom + step))

  if (newZoom === oldZoom) return

  const rect = container.getBoundingClientRect()

  const mouseX =
    e.clientX - rect.left + container.scrollLeft

  const mouseY =
    e.clientY - rect.top + container.scrollTop

  const scale = newZoom / oldZoom

  setZoom(newZoom)

  requestAnimationFrame(() => {
    container.scrollLeft =
      mouseX * scale - (e.clientX - rect.left)

    container.scrollTop =
      mouseY * scale - (e.clientY - rect.top)
  })
}}
          onMouseDown={(e) => {
            if (e.button !== 0) return

            const target = e.currentTarget

            setIsDragging(true)
            setDragStartX(e.clientX)
            setDragStartY(e.clientY)

            setScrollStart({
              left: target.scrollLeft,
              top: target.scrollTop,
            })
          }}
          onMouseMove={(e) => {
            if (!isDragging) return

            const target = e.currentTarget

            target.scrollLeft =
              scrollStart.left - (e.clientX - dragStartX)

            target.scrollTop =
              scrollStart.top - (e.clientY - dragStartY)
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >

      <div
  className="mx-auto w-fit"
  onClick={(e) => e.stopPropagation()}
>
        <Image
          src="/images/guides/ships/star-citizen-fleet-overview.jpg"
          alt="星际公民全舰船总览图高清查看"
          width={4096}
          height={4096}
          sizes="100vw"
          className="h-auto max-w-none origin-top transition-[width] duration-200"
          style={{
            width: `${zoom * 100}vw`,
          }}
          priority
        />
      </div>
    </div>
  </div>
)}

    </div>
  )
}