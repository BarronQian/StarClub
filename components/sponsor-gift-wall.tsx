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
    'text-xl sm:text-2xl lg:text-[28px]',
} as const

const DEPTH_MAP = {
  back: {
    opacity: 0.52,
    blur: 0.2,
    scale: 1,
    zIndex: 10,
  },

  middle: {
    opacity: 0.78,
    blur: 0,
    scale: 1,
    zIndex: 20,
  },

  front: {
    opacity: 1,
    blur: 0,
    scale: 1,
    zIndex: 30,
  },
} as const

const SPEED_DURATION = {
  slow: 30,
  normal: 27,
  fast: 24,
} as const

const LANE_COUNT = 8

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

    // 同一时间最多一个轨道一个弹幕。
    // 从根本上避免同轨追尾和文字覆盖。
    const visibleGifts =
      gifts.slice(
        0,
        LANE_COUNT,
      )

    return visibleGifts.map(
      (gift, index) => {
        const hash =
          hashString(gift.id)

        const baseDuration =
          SPEED_DURATION[
            gift.speed
          ]

        const variation =
          (hash % 350) /
          100

        // 使用跳跃式轨道分配，
        // 避免视觉上全部从上到下机械排列。
        const laneOrder = [
          3,
          6,
          1,
          5,
          0,
          7,
          2,
          4,
        ]

        const lane =
          laneOrder[index]

        // 每条轨道只有一个动画，
        // delay 仅负责让进入页面时弹幕分散在不同横向位置。
        const duration =
          baseDuration +
          variation

        const progress =
          (
            index /
            visibleGifts.length +
            (hash % 17) / 100
          ) % 1

        return {
          key: gift.id,
          gift,
          lane,

          delay:
            -(duration * progress),

          duration,
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

            const sizeOffset =
              gift.font_size === 'xlarge'
                ? 0
                : gift.font_size === 'large'
                  ? 0.4
                  : gift.font_size === 'medium'
                    ? 0.8
                    : 1.2

            const top =
              usableTop +
              lane *
                laneHeight +
              laneHeight / 2 +
              sizeOffset

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