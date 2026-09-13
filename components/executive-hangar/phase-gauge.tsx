'use client'

import type { ReactNode } from 'react'
import {
  HANGAR_PHASE_COLORS,
  type HangarPhase,
} from '@/lib/executive-hangar-config'

const SIZE = 300
const R = 132
const START = 210
const SWEEP = 240

function point(angleDeg: number, radius = R) {
  const a = (angleDeg * Math.PI) / 180

  return {
    x: SIZE / 2 + radius * Math.cos(a),
    y: SIZE / 2 - radius * Math.sin(a),
  }
}

function arc(fromDeg: number, toDeg: number, radius = R) {
  const a = point(fromDeg, radius)
  const b = point(toDeg, radius)
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0

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
  const clamped = Math.min(1, Math.max(0, progress))
  const color = HANGAR_PHASE_COLORS[phase]

  const mainTrack = arc(START, START - SWEEP, 132)
  const outerTrack = arc(START, START - SWEEP, 141)
  const innerTrack = arc(START, START - SWEEP, 119)

  const mainLength =
    (SWEEP / 360) *
    2 *
    Math.PI *
    132

  const endpointAngle =
    START - SWEEP * clamped

  const endpoint =
    point(endpointAngle, 132)

  return (
    <div className="relative mx-auto w-full max-w-75">
      {/* 背景光晕 */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 size-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl transition-colors duration-700"
        style={{
          background: `radial-gradient(
            circle,
            color-mix(in oklab, ${color} 38%, transparent) 0%,
            transparent 70%
          )`,
        }}
      />

      {/* 内部仪表盘底板 */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 size-[65%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/70 bg-background/35 shadow-[inset_0_0_30px_rgba(0,0,0,0.04)] backdrop-blur-[2px]"
      />

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="relative mb-[-11%] w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter
            id={`gauge-glow-${phase}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur
              stdDeviation="4"
              result="blur"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient
            id={`gauge-gradient-${phase}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor={`color-mix(in oklab, ${color} 70%, white)`}
            />
            <stop
              offset="45%"
              stopColor={color}
            />
            <stop
              offset="100%"
              stopColor={`color-mix(in oklab, ${color} 78%, black)`}
            />
          </linearGradient>
        </defs>

        {/* 最外机械细环 */}
        <path
          d={outerTrack}
          fill="none"
          stroke="currentColor"
          className="text-border/80"
          strokeWidth={0.8}
        />

        {/* 内部辅助环 */}
        <path
          d={innerTrack}
          fill="none"
          stroke="currentColor"
          className="text-border/60"
          strokeWidth={0.8}
        />

        {/* 主轨道背景 */}
        <path
          d={mainTrack}
          fill="none"
          stroke={HANGAR_PHASE_COLORS.track}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.35}
        />

        {/* 主轨道内层细线 */}
        <path
          d={mainTrack}
          fill="none"
          stroke={HANGAR_PHASE_COLORS.track}
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.9}
        />

        {/* 发光底层进度 */}
        <path
          d={mainTrack}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${mainLength * clamped} ${mainLength}`}
          opacity={0.16}
          filter={`url(#gauge-glow-${phase})`}
          style={{
            transition:
              'stroke-dasharray 900ms linear',
          }}
        />

        {/* 主进度线 */}
        <path
          d={mainTrack}
          fill="none"
          stroke={`url(#gauge-gradient-${phase})`}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${mainLength * clamped} ${mainLength}`}
          filter={`url(#gauge-glow-${phase})`}
          style={{
            transition:
              'stroke-dasharray 900ms linear',
          }}
        />

        {/* 刻度 */}
        {Array.from(
          { length: 49 },
          (_, i) => {
            const angle =
              START -
              (SWEEP * i) / 48

            const major =
              i % 6 === 0

            const medium =
              i % 3 === 0

            const outer =
              point(angle, 145)

            const tickLength =
              major
                ? 13
                : medium
                  ? 8
                  : 4.5

            const inner =
              point(
                angle,
                145 - tickLength,
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
                    ? 'currentColor'
                    : HANGAR_PHASE_COLORS.track
                }
                className={
                  major
                    ? 'text-foreground/55'
                    : undefined
                }
                strokeWidth={
                  major
                    ? 1.3
                    : medium
                      ? 0.9
                      : 0.55
                }
                opacity={
                  major
                    ? 0.8
                    : medium
                      ? 0.6
                      : 0.4
                }
              />
            )
          },
        )}

        {/* 当前进度端点灯珠 */}
        {clamped > 0.01 && (
          <>
            <circle
              cx={endpoint.x}
              cy={endpoint.y}
              r={7}
              fill={color}
              opacity={0.18}
              filter={`url(#gauge-glow-${phase})`}
            />

            <circle
              cx={endpoint.x}
              cy={endpoint.y}
              r={3.2}
              fill={color}
              stroke="white"
              strokeWidth={1}
              filter={`url(#gauge-glow-${phase})`}
            />

            <circle
              cx={endpoint.x - 0.8}
              cy={endpoint.y - 0.8}
              r={1}
              fill="white"
              opacity={0.9}
            />
          </>
        )}

        {/* 左右底部端点 */}
        {[START, START - SWEEP].map(
          (angle, index) => {
            const p =
              point(angle, 132)

            return (
              <circle
                key={index}
                cx={p.x}
                cy={p.y}
                r={2}
                fill={HANGAR_PHASE_COLORS.track}
              />
            )
          },
        )}
      </svg>

      {/* 中央内容 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        {children}
      </div>
    </div>
  )
}