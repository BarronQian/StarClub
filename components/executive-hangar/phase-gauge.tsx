'use client'

import type { ReactNode } from 'react'
import {
  HANGAR_PHASE_COLORS,
  type HangarPhase,
} from '@/lib/executive-hangar-config'

const SIZE = 320
const R = 134
const START = 210
const SWEEP = 240

function point(
  angleDeg: number,
  radius = R,
) {
  const a =
    (angleDeg * Math.PI) /
    180

  return {
    x:
      SIZE / 2 +
      radius * Math.cos(a),

    y:
      SIZE / 2 -
      radius * Math.sin(a),
  }
}

function arc(
  fromDeg: number,
  toDeg: number,
  radius = R,
) {
  const a =
    point(
      fromDeg,
      radius,
    )

  const b =
    point(
      toDeg,
      radius,
    )

  const large =
    Math.abs(
      toDeg - fromDeg,
    ) > 180
      ? 1
      : 0

  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y}`
}

export function PhaseGauge({
  phase,
  progress,
  children,
}: {
  phase: HangarPhase
  progress: number
  children: ReactNode
}) {
  const clamped =
    Math.min(
      1,
      Math.max(
        0,
        progress,
      ),
    )

  const track =
    arc(
      START,
      START - SWEEP,
    )

  const innerTrack =
    arc(
      START,
      START - SWEEP,
      R - 11,
    )

  const length =
    (SWEEP / 360) *
    2 *
    Math.PI *
    R

  const color =
    HANGAR_PHASE_COLORS[
      phase
    ]

  const activeAngle =
    START -
    SWEEP * clamped

  const activePoint =
    point(
      activeAngle,
    )

  return (
    <div className="relative mx-auto w-full max-w-[320px]">

      {/* 仪表外壳 */}
      <div className="relative aspect-square rounded-full border border-neutral-400 bg-[linear-gradient(145deg,#ecece8,#c9c9c4)] p-2.5 shadow-[inset_0_2px_5px_rgba(255,255,255,0.8),inset_0_-3px_7px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.08)]">

        {/* 金属内圈 */}
        <div className="absolute inset-2 rounded-full border border-neutral-300 bg-[linear-gradient(145deg,#f7f7f3,#deded9)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]" />

        {/* 黑色/深灰仪表盘 */}
        <div className="absolute inset-4.25 rounded-full border border-neutral-500/50 bg-[radial-gradient(circle_at_50%_38%,#393936_0%,#252522_58%,#1d1d1b_100%)] shadow-[inset_0_0_30px_rgba(0,0,0,0.7)]" />


        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="relative z-10 h-full w-full"
          aria-hidden="true"
        >

          {/* 外层暗轨道 */}
          <path
            d={track}
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={10}
            strokeLinecap="round"
          />

          {/* 内层结构轨道 */}
          <path
            d={innerTrack}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />


          {/* 激活进度 */}
          <path
            d={track}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${length * clamped} ${length}`}
            style={{
              transition:
                'stroke-dasharray 900ms linear',

              filter:
                `drop-shadow(0 0 5px ${color})`,
            }}
          />


          {/* 刻度 */}
          {Array.from(
            {
              length: 41,
            },
            (
              _,
              i,
            ) => {
              const angle =
                START -
                (SWEEP * i) /
                  40

              const major =
                i % 5 === 0

              const outer =
                point(
                  angle,
                  R - 15,
                )

              const inner =
                point(
                  angle,
                  R -
                    (major
                      ? 30
                      : 23),
                )

              return (
                <line
                  key={i}
                  x1={outer.x}
                  y1={outer.y}
                  x2={inner.x}
                  y2={inner.y}
                  stroke={
                    major
                      ? 'rgba(255,255,255,0.52)'
                      : 'rgba(255,255,255,0.20)'
                  }
                  strokeWidth={
                    major
                      ? 1.8
                      : 0.8
                  }
                  strokeLinecap="round"
                />
              )
            },
          )}


          {/* 主要刻度文字 */}
          {[
            {
              value: '0',
              index: 0,
            },
            {
              value: '25',
              index: 10,
            },
            {
              value: '50',
              index: 20,
            },
            {
              value: '75',
              index: 30,
            },
            {
              value: '100',
              index: 40,
            },
          ].map(
            ({
              value,
              index,
            }) => {
              const angle =
                START -
                (SWEEP *
                  index) /
                  40

              const p =
                point(
                  angle,
                  R - 45,
                )

              return (
                <text
                  key={
                    value
                  }
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(255,255,255,0.38)"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {value}
                </text>
              )
            },
          )}


          {/* 当前进度指示灯 */}
          <circle
            cx={
              activePoint.x
            }
            cy={
              activePoint.y
            }
            r={7}
            fill={color}
            stroke="rgba(255,255,255,0.85)"
            strokeWidth={2}
            style={{
              filter:
                `drop-shadow(0 0 7px ${color})`,
            }}
          />

          <circle
            cx={
              activePoint.x
            }
            cy={
              activePoint.y
            }
            r={2}
            fill="white"
          />

        </svg>


        {/* 中央数据显示 */}
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-16 text-center text-white">

          {children}

        </div>


        {/* 底部仪表标签 */}
        <div className="pointer-events-none absolute bottom-10.5 left-1/2 z-20 -translate-x-1/2">

          <div className="rounded border border-white/10 bg-black/25 px-3 py-1 backdrop-blur-sm">

            <span className="font-mono text-[8px] tracking-[0.18em] text-white/35">
              CYCLE POSITION
            </span>

          </div>

        </div>

      </div>

    </div>
  )
}
