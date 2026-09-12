'use client'

import type { GalleryDbShot } from '@/lib/gallery-db'

function FilmRow({
  images,
  reverse = false,
  speed = 60,
}: {
  images: GalleryDbShot[]
  reverse?: boolean
  speed?: number
}) {
  if (images.length === 0) {
    return null
  }

  const repeated = [
    ...images,
    ...images,
  ]

  return (
    <div className="overflow-hidden">
      <div
        className={
          reverse
            ? 'gallery-film-track gallery-film-track-reverse'
            : 'gallery-film-track'
        }
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        {repeated.map(
          (shot, index) => (
            <div
              key={`${shot.id}-${index}`}
              className="gallery-film-frame"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot.src}
                alt=""
                draggable={false}
              />
            </div>
          ),
        )}
      </div>
    </div>
  )
}

function splitIntoRows(
  shots: GalleryDbShot[],
) {
  const row1: GalleryDbShot[] =
    []
  const row2: GalleryDbShot[] =
    []
  const row3: GalleryDbShot[] =
    []

  shots.forEach(
    (shot, index) => {
      const rowIndex =
        index % 3

      if (rowIndex === 0) {
        row1.push(shot)
        return
      }

      if (rowIndex === 1) {
        row2.push(shot)
        return
      }

      row3.push(shot)
    },
  )

  return {
    row1,
    row2,
    row3,
  }
}

export function GalleryFilmBackground({
  shots,
}: {
  shots: GalleryDbShot[]
}) {
  const featuredShots =
    shots.filter(
      (shot) =>
        shot.heroFeatured,
    )

  /*
   * 没有 Hero 精选时，
   * 不显示滚动背景。
   */
  if (
    featuredShots.length ===
    0
  ) {
    return null
  }

  const {
    row1,
    row2,
    row3,
  } =
    splitIntoRows(
      featuredShots,
    )

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-x-0 -bottom-2 flex flex-col gap-2 opacity-75">
        <FilmRow
          images={row1}
          reverse
          speed={58}
        />

        <FilmRow
          images={row2}
          speed={72}
        />

        <FilmRow
          images={row3}
          reverse
          speed={64}
        />
      </div>

      <div className="absolute inset-0 z-10 bg-linear-to-b from-background/72 via-background/58 via-32% to-background/12" />

      <div className="absolute left-[14%] top-[22%] z-10 h-[42%] w-[60%] bg-background/50 blur-3xl" />

      <div className="absolute inset-x-0 top-0 z-10 h-[42%] backdrop-blur-[1px] mask-[linear-gradient(to_bottom,black_0%,black_30%,transparent_100%)]" />

      <div className="absolute inset-x-0 bottom-0 z-10 h-24 bg-linear-to-t from-background via-background/55 to-transparent" />

      <div className="absolute inset-y-0 left-0 z-10 w-20 bg-linear-to-r from-background to-transparent lg:w-32" />

      <div className="absolute inset-y-0 right-0 z-10 w-20 bg-linear-to-l from-background to-transparent lg:w-32" />
    </div>
  )
}