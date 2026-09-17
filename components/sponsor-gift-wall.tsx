'use client'

import {
  useMemo,
} from 'react'

import type {
  SponsorGiftRow,
} from '@/lib/sponsor-gifts-db'

type SponsorGiftWallProps = {
  gifts: SponsorGiftRow[]
}

type GiftVisual = {
  key: string
  gift: SponsorGiftRow
  lane: number
  delay: number
  duration: number
}

const FONT_SIZE_MAP = {
  small:
    'text-sm sm:text-base lg:text-[17px]',
  medium:
    'text-base sm:text-lg lg:text-xl',
  large:
    'text-lg sm:text-xl lg:text-2xl',
  xlarge:
    'text-xl sm:text-2xl lg:text-3xl',
} as const

const DEPTH_MAP = {
  back: {
    opacity: 0.48,
    blur: 0.25,
    scale: 0.86,
    zIndex: 10,
  },

  middle: {
    opacity: 0.76,
    blur: 0,
    scale: 0.96,
    zIndex: 20,
  },

  front: {
    opacity: 1,
    blur: 0,
    scale: 1.05,
    zIndex: 30,
  },
} as const

const SPEED_DURATION = {
  slow: 30,
  normal: 26,
  fast: 22,
} as const

const LANE_COUNT = 12

function hashString(
  value: string,
) {
  let hash = 0

  for (
    let i = 0;
    i < value.length;
    i += 1
  ) {
    hash =
      (hash * 31 +
        value.charCodeAt(i)) >>>
      0
  }

  return hash
}

function buildGiftMessage(
  gift: SponsorGiftRow,
) {
  const quantity =
    gift.quantity > 1
      ? ` ×${gift.quantity}`
      : ''

  return {
    recipient:
      gift.recipient_name,

    gift:
      `${gift.gift_name}${quantity}`,

    sponsor:
      gift.sponsor_name,

    event:
      gift.event_name,
  }
}

export function SponsorGiftWall({
  gifts,
}: SponsorGiftWallProps) {
const visualGifts =
  useMemo<GiftVisual[]>(() => {
    if (gifts.length === 0) {
      return []
    }

    // 数据少的时候自动增加视觉实例，
    // 让弹幕墙保持足够密度。
    // 数据越来越多后会自动减少重复。
    const repeatCount =
      gifts.length <= 5
        ? 3
        : gifts.length <= 10
          ? 2
          : 1

    const instances: GiftVisual[] = []

    for (
      let repeat = 0;
      repeat < repeatCount;
      repeat += 1
    ) {
      gifts.forEach(
        (gift, index) => {
          const instanceIndex =
            repeat *
              gifts.length +
            index

          const hash =
            hashString(
              `${gift.id}-${repeat}`,
            )

          const baseDuration =
            SPEED_DURATION[
              gift.speed
            ]

          const variation =
            (hash % 350) /
            100

          // 依次分配轨道。
          // 同一批视觉实例不会占用相同轨道。
          const lane =
            instanceIndex %
            LANE_COUNT

          // 根据轨道和批次错开运动阶段，
          // 避免多条弹幕同时堆在屏幕中央。
          const phase =
            lane * 2.15 +
            repeat * 7.4 +
            index * 1.3

          instances.push({
            key:
              `${gift.id}-${repeat}`,

            gift,

            lane,

            delay:
              -phase,

            duration:
              baseDuration +
              variation,
          })
        },
      )
    }

    return instances
  }, [gifts])

  if (gifts.length === 0) {
    return (
      <div className="flex min-h-140 items-center justify-center border-y border-[#e8e2d8]">
        <div className="text-center">
          <span className="font-display text-[0.62rem] tracking-[0.3em] text-[#a66716]">
            COMMUNITY SUPPORT STREAM
          </span>

          <p className="mt-4 text-sm text-[#91897d]">
            暂无社区赞助记录
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden border-y border-[#eeeae4] bg-white">
      <style jsx>{`
        @keyframes sponsor-danmaku {
          from {
            transform:
              translate3d(
                calc(100vw + 100%),
                0,
                0
              )
              scale(var(--gift-scale));
          }

          to {
            transform:
              translate3d(
                calc(-100vw - 100%),
                0,
                0
              )
              scale(var(--gift-scale));
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-40 w-24 bg-linear-to-r from-white to-transparent sm:w-44"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-40 w-24 bg-linear-to-l from-white to-transparent sm:w-44"
      />

      <div className="relative h-[85vh] min-h-190 lg:h-[calc(100vh-72px)] lg:min-h-220">
        {visualGifts.map(
          ({
            key,
            gift,
            lane,
            delay,
            duration,
          }) => {
            const depth =
              DEPTH_MAP[
                gift.depth
              ]

            const message =
              buildGiftMessage(
                gift,
              )

            const usableTop = 10
            const usableHeight = 80

            const laneHeight =
              usableHeight /
              LANE_COUNT

            const top =
              usableTop +
              lane *
                laneHeight +
              laneHeight / 2

            return (
              <div
                key={key}
                className="pointer-events-none absolute left-0 whitespace-nowrap will-change-transform"
                style={
                  {
                    top: `${top}%`,
                    opacity:
                      depth.opacity,
                    filter:
                      depth.blur > 0
                        ? `blur(${depth.blur}px)`
                        : undefined,
                    zIndex:
                      depth.zIndex,

                    '--gift-scale':
                      depth.scale,

                    animation:
                      `sponsor-danmaku ${duration}s linear ${delay}s infinite`,
                  } as React.CSSProperties
                }
              >
                <div
                  className={`flex items-center gap-2 font-medium tracking-wide drop-shadow-sm ${FONT_SIZE_MAP[gift.font_size]}`}
                  style={{
                    color:
                      gift.text_color,
                  }}
                >
                  {message.event && (
                    <>
                      <span className="opacity-55">
                        {
                          message.event
                        }
                      </span>

                      <span className="opacity-25">
                        /
                      </span>
                    </>
                  )}

                  <span className="font-semibold">
                    {
                      message.recipient
                    }
                  </span>

                  <span className="opacity-55">
                    获得
                  </span>

                  <span className="font-semibold">
                    {message.gift}
                  </span>

                  <span className="opacity-40">
                    ·
                  </span>

                  <span className="opacity-60">
                    由
                  </span>

                  <span className="font-semibold">
                    {
                      message.sponsor
                    }
                  </span>

                  <span className="opacity-60">
                    赞助
                  </span>
                </div>
              </div>
            )
          },
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-5 sm:px-8">
        <div>
          <span className="font-display text-[0.58rem] tracking-[0.3em] text-[#a66716]">
            COMMUNITY SUPPORT STREAM
          </span>

          <p className="mt-1 text-[0.65rem] tracking-[0.08em] text-[#9a9185]">
            社区赞助记录
          </p>
        </div>

        <span className="hidden text-[0.58rem] tracking-[0.18em] text-[#b1a89b] sm:block">
          DIRECT COMMUNITY GIFTS
        </span>
      </div>
    </div>
  )
}