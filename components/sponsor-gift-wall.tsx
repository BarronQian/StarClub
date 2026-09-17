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
  gift: SponsorGiftRow
  lane: number
  delay: number
  duration: number
}

const FONT_SIZE_MAP = {
  small:
    'text-xs sm:text-sm',
  medium:
    'text-sm sm:text-base lg:text-lg',
  large:
    'text-base sm:text-xl lg:text-2xl',
  xlarge:
    'text-xl sm:text-2xl lg:text-3xl',
} as const

const DEPTH_MAP = {
  back: {
    opacity: 0.38,
    blur: 0.55,
    scale: 0.88,
    zIndex: 10,
  },
  middle: {
    opacity: 0.72,
    blur: 0,
    scale: 1,
    zIndex: 20,
  },
  front: {
    opacity: 1,
    blur: 0,
    scale: 1.08,
    zIndex: 30,
  },
} as const

const SPEED_DURATION = {
  slow: 28,
  normal: 22,
  fast: 17,
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
      return gifts.map(
        (gift, index) => {
          const hash =
            hashString(gift.id)

          const baseDuration =
            SPEED_DURATION[
              gift.speed
            ]

          const variation =
            (hash % 500) / 100

          return {
            gift,

            // 顺序分配轨道，避免少量记录随机撞进同一条轨道
            lane:
              index %
              LANE_COUNT,

            // 每条弹幕错开运动阶段
            delay:
              -(
                index * 4.8 +
                (hash % 240) / 100
              ),

            duration:
              baseDuration +
              variation,
          }
        },
      )
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
    <div className="relative overflow-hidden border-y border-[#e8e2d8] bg-[#f7f4ef]">
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
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(184,121,34,0.07), transparent 58%)',
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-40 w-24 bg-linear-to-r from-[#f7f4ef] to-transparent sm:w-44"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-40 w-24 bg-linear-to-l from-[#f7f4ef] to-transparent sm:w-44"
      />

      <div className="relative h-[85vh] min-h-190 lg:h-[calc(100vh-72px)] lg:min-h-220">
        {visualGifts.map(
          ({
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

            const usableTop = 8
            const usableHeight = 84

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
                key={gift.id}
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