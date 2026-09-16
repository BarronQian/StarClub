'use client'

import Image from 'next/image'
import {
  BadgeCheck,
} from 'lucide-react'

type Props = {
  rsiVerified?: boolean
  discordVerified?: boolean
  orgVerified?: boolean
  size?: 'sm' | 'md'
}

export function UserVerificationBadges({
  rsiVerified = false,
  discordVerified = false,
  orgVerified = false,
  size = 'sm',
}: Props) {
  const iconSize =
    size === 'md'
      ? 'size-5'
      : 'size-4'

  const imageSize =
    size === 'md'
      ? 20
      : 16

  return (
    <div className="inline-flex items-center gap-1.5">
      {/* RSI Handle */}
      {rsiVerified && (
        <div className="group relative flex shrink-0 items-center">
          <BadgeCheck
            className={`${iconSize} fill-[#1689e8] text-white transition-transform duration-150 group-hover:scale-110`}
            strokeWidth={2.5}
          />

          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-neutral-950 px-2.5 py-1.5 text-[10px] font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
            RSI Handle 已认证
          </div>
        </div>
      )}

      {/* StarClub Discord */}
      {discordVerified && (
        <div className="group relative flex shrink-0 items-center">
          <Image
            src="/images/discord-logo.svg"
            alt="星际酒馆 Discord 认证"
            width={imageSize}
            height={imageSize}
            className={`${iconSize} object-contain transition-transform duration-150 group-hover:scale-110`}
          />

          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-neutral-950 px-2.5 py-1.5 text-[10px] font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
            星际酒馆 Discord 已认证
          </div>
        </div>
      )}

      {/* STARCLUB ORG */}
      {orgVerified && (
        <div className="group relative flex shrink-0 items-center">
          <Image
            src="/images/starclub-logo.png"
            alt="STARCLUB ORG 认证"
            width={imageSize}
            height={imageSize}
            className={`${iconSize} object-contain transition-transform duration-150 group-hover:scale-110`}
          />

          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-neutral-950 px-2.5 py-1.5 text-[10px] font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
            STARCLUB ORG 成员认证
          </div>
        </div>
      )}
    </div>
  )
}