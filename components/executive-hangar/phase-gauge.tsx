'use client'

import type { ReactNode } from 'react'
import {
  HANGAR_PHASE_COLORS,
  type HangarPhase,
} from '@/lib/executive-hangar-config'

const SIZE = 300
const R = 132
const START = 210 // 240° 弧：从 210° 顺时针到 -30°（底部留 120° 缺口）
const SWEEP = 240

function point(angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180
  return {
    x: SIZE / 2 + R * Math.cos(a),
    y: SIZE / 2 - R * Math.sin(a),
  }
}

function arc(fromDeg: number, toDeg: number) {
  const a = point(fromDeg)
  const b = point(toDeg)
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0
  return `M ${a.x} ${a.y} A ${R} ${R} 0 ${large} 1 ${b.x} ${b.y}`
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
  const track = arc(START, START - SWEEP)
  const length = (SWEEP / 360) * 2 * Math.PI * R
  const color = HANGAR_PHASE_COLORS[phase]

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-mb-[11%] w-full"
        aria-hidden="true"
      >
        <path
          d={track}
          fill="none"
          stroke={HANGAR_PHASE_COLORS.track}
          strokeWidth={1.5}
        />
        <path
          d={track}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="butt"
          strokeDasharray={`${length * clamped} ${length}`}
          style={{ transition: 'stroke-dasharray 900ms linear' }}
        />
        {Array.from({ length: 25 }, (_, i) => {
          const angle = START - (SWEEP * i) / 24
          const outer = point(angle)
          const inner = {
            x: SIZE / 2 + (R - (i % 6 === 0 ? 12 : 6)) * Math.cos((angle * Math.PI) / 180),
            y: SIZE / 2 - (R - (i % 6 === 0 ? 12 : 6)) * Math.sin((angle * Math.PI) / 180),
          }
          return (
            <line
              key={i}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              stroke={HANGAR_PHASE_COLORS.track}
              strokeWidth={i % 6 === 0 ? 1.2 : 0.7}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        {children}
      </div>
    </div>
  )
}
