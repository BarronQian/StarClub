'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  SponsorGiftRow,
} from '@/lib/sponsor-gifts-db'

type SponsorGiftWallProps = {
  gifts: SponsorGiftRow[]
}

type LaneState = {
  giftIndex: number
  cycle: number
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
    opacity: 0.58,
    blur: 0,
    scale: 1,
    zIndex: 10,
  },

  middle: {
    opacity: 0.8,
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
  slow: 14,
  normal: 11.5,
  fast: 9,
} as const

const LANE_COUNT = 10

const LANE_ORDER = [
  4,
  8,
  1,
  6,
  3,
  9,
  0,
  7,
  2,
  5,
]

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
  const laneGifts =
    useMemo(() => {
      const lanes =
        Array.from(
          {
            length:
              LANE_COUNT,
          },
          () =>
            [] as SponsorGiftRow[],
        )

      gifts.forEach(
        (
          gift,
          index,
        ) => {
          const lane =
            index %
            LANE_COUNT

          lanes[
            lane
          ].push(
            gift,
          )
        },
      )

      return lanes
    }, [gifts])

  const [
    laneStates,
    setLaneStates,
  ] =
    useState<LaneState[]>(
      () =>
        Array.from(
          {
            length:
              LANE_COUNT,
          },
          () => ({
            giftIndex: 0,
            cycle: 0,
          }),
        ),
    )

  useEffect(() => {
    setLaneStates(
      Array.from(
        {
          length:
            LANE_COUNT,
        },
        () => ({
          giftIndex: 0,
          cycle: 0,
        }),
      ),
    )
  }, [gifts])

  if (
    gifts.length === 0
  ) {
    return (
      <div className="flex min-h-140 items-center justify-center border-y border-[#e8e2d8] transition-colors dark:border-white/8 dark:bg-[#2f2b27]">
        <div className="text-center">
          <span className="font-display text-[0.62rem] tracking-[0.3em] text-[#a66716]">
            COMMUNITY SUPPORT STREAM
          </span>

          <p className="mt-4 text-sm text-[#91897d] dark:text-[#aaa39b]">
            暂无社区赞助记录
          </p>
        </div>
      </div>
    )
  }

  function advanceLane(
    laneIndex: number,
  ) {
    const giftsInLane =
      laneGifts[
        laneIndex
      ]

    if (
      giftsInLane.length ===
      0
    ) {
      return
    }

    setLaneStates(
      (current) =>
        current.map(
          (
            state,
            index,
          ) => {
            if (
              index !==
              laneIndex
            ) {
              return state
            }

            return {
              giftIndex:
                (
                  state.giftIndex +
                  1
                ) %
                giftsInLane.length,

              cycle:
                state.cycle +
                1,
            }
          },
        ),
    )
  }

  return (
    <div className="relative overflow-hidden border-y border-[#eeeae4] bg-white transition-colors dark:border-white/8 dark:bg-[#302d29]">
      <style jsx>{`
        @keyframes sponsor-danmaku {
          from {
            transform:
              translate3d(
                100vw,
                0,
                0
              );
          }

          to {
            transform:
              translate3d(
                -100%,
                0,
                0
              );
          }
        }
      `}</style>

      {/* 左侧淡出 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-40 w-24 bg-linear-to-r from-white to-transparent dark:from-[#302d29] sm:w-44"
      />

      {/* 右侧淡出 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-40 w-24 bg-linear-to-l from-white to-transparent dark:from-[#302d29] sm:w-44"
      />

      <div className="relative h-[85vh] min-h-190 lg:h-[calc(100vh-72px)] lg:min-h-220">
        {laneGifts.map(
          (
            giftsInLane,
            laneIndex,
          ) => {
            if (
              giftsInLane.length ===
              0
            ) {
              return null
            }

            const state =
              laneStates[
                laneIndex
              ]

            const gift =
              giftsInLane[
                state.giftIndex %
                  giftsInLane.length
              ]

            const depth =
              DEPTH_MAP[
                gift.depth
              ]

            const message =
              buildGiftMessage(
                gift,
              )

            const lane =
              LANE_ORDER[
                laneIndex
              ]

            const usableTop =
              10

            const usableHeight =
              80

            const laneHeight =
              usableHeight /
              LANE_COUNT

            const top =
              usableTop +
              lane *
                laneHeight +
              laneHeight /
                2

            const laneVariation = [
              0,
              5.5,
              1.2,
              7,
              3.8,
              0.4,
              6,
              2.2,
              8,
              4.5,
            ]

            const duration =
              SPEED_DURATION[
                gift.speed
              ] +
              laneVariation[
                laneIndex
              ]

            /*
             * 每条轨道不同的初始延迟，
             * 避免 10 条弹幕同时从右侧出现。
             *
             * 后续 cycle > 0 后，
             * 当前弹幕跑完立即切换下一条。
             */
              const initialProgress = [
                0.04,
                0.34,
                0.12,
                0.46,
                0.22,
                0.08,
                0.40,
                0.17,
                0.50,
                0.28,
              ]

            const delay =
              state.cycle === 0
                ? -(
                    duration *
                    initialProgress[
                      laneIndex
                    ]
                  )
                : 0

            return (
              <div
                key={`${laneIndex}-${gift.id}-${state.cycle}`}
                className="pointer-events-none absolute left-0 whitespace-nowrap will-change-transform"
                onAnimationEnd={() =>
                  advanceLane(
                    laneIndex,
                  )
                }
                style={{
                  top:
                    `${top}%`,

                  opacity:
                    depth.opacity,

                  filter:
                    depth.blur >
                    0
                      ? `blur(${depth.blur}px)`
                      : undefined,

                  zIndex:
                    depth.zIndex,

                  animation:
                    `sponsor-danmaku ${duration}s linear ${delay}s 1 both`,
                }}
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
                    {
                      message.gift
                    }
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

          <p className="mt-1 text-[0.65rem] tracking-[0.08em] text-[#9a9185] dark:text-[#aaa39b]">
            社区赞助记录
          </p>
        </div>

        <span className="hidden text-[0.58rem] tracking-[0.18em] text-[#b1a89b] dark:text-[#8f8982] sm:block">
          DIRECT COMMUNITY GIFTS
        </span>
      </div>
    </div>
  )
}