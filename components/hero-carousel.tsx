'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const SLIDES = [
  {
    src: '/images/group-bonfire.jpg',
    alt: '星际酒馆百人合影：上百名玩家围坐在酒馆篝火旁',
    caption: '酒吧篝火区大合影',
    place: '旅行者酒吧篝火大厅',
  },
  {
    src: '/images/group-booths.jpg',
    alt: '上百名玩家在霓虹包厢区的合影',
    caption: '三包厢满座狂欢夜',
    place: '旅行者酒吧霓虹包厢区',
  },
  {
    src: '/images/group-terrace.jpg',
    alt: 'Voyager Bar 露台上的百人合影',
    caption: '酒吧露台黄昏合影',
    place: '旅行者酒吧露台',
  },
  {
    src: '/images/group-stairs.jpg',
    alt: '玩家在空间站自动扶梯上列队合影',
    caption: '阶梯列队大合影',
    place: '旅行者酒吧阶梯',
  },
  {
    src: '/images/group-starlancer.jpg',
    alt: '玩家在机库中沿 MISC Starlancer MAX 客机列队合影',
    caption: '酒馆星航登机安检',
    place: 'AEROVIEW 机库',
    position: 'center 75%',
  },
  {
    src: '/images/group-cabin.jpg',
    alt: '玩家们坐满客机机舱准备起飞',
    caption: '敞篷露天量子航行',
    place: '酒馆星航星枪MAX客机',
  },
]

const INTERVAL = 5000

export function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedRef = useRef(false)

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    if (paused || reducedRef.current) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
    }, INTERVAL)
    return () => window.clearInterval(id)
  }, [paused, index])

  return (
    <figure
      className="site-container relative mt-16 mb-14 lg:mt-24 lg:mb-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="corner-cut group relative aspect-[21/9] w-full overflow-hidden border border-border bg-card sm:aspect-[3/1]"
        role="region"
        aria-roledescription="carousel"
        aria-label="星际酒馆百人合影"
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className="absolute inset-0 transition-opacity duration-[1100ms] ease-out"
            style={{ opacity: i === index ? 1 : 0 }}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: slide.position ?? 'center' }}
            />
          </div>
        ))}

        {/* place label */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-foreground/55 to-transparent p-5 lg:p-7">
          <span className="font-display text-[0.6rem] tracking-[0.28em] text-background/90 lg:text-[0.68rem]">
            {SLIDES[index].place}
          </span>
          <span className="font-display text-[0.6rem] tracking-[0.28em] text-background/70">
            {String(index + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
          </span>
        </div>

        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="上一张合影"
          className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur transition-opacity hover:bg-background focus-visible:opacity-100 group-hover:opacity-100 lg:left-6"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="下一张合影"
          className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur transition-opacity hover:bg-background focus-visible:opacity-100 group-hover:opacity-100 lg:right-6"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <figcaption className="mt-5 flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm tracking-[0.24em] text-muted-foreground">
          <span>百人合影</span>
          <span aria-hidden="true" className="text-border">
            /
          </span>
          <span>{SLIDES[index].caption}</span>
        </div>

        <div className="flex items-center gap-2.5">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => go(i)}
              aria-label={`查看第 ${i + 1} 张：${slide.caption}`}
              aria-current={i === index}
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: i === index ? '2.25rem' : '0.75rem',
                backgroundColor:
                  i === index ? 'var(--primary)' : 'var(--border)',
              }}
            />
          ))}
        </div>
      </figcaption>
    </figure>
  )
}
