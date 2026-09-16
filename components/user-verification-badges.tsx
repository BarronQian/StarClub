'use client'

import Image from 'next/image'
import {
  BadgeCheck,
} from 'lucide-react'

type Props = {
  rsiVerified?: boolean
  discordVerified?: boolean
  orgVerified?: boolean
  handle?: string | null
  size?: 'sm' | 'md'
  showLabels?: boolean
  onRsiClick?: () => void
}

export function UserVerificationBadges({
  rsiVerified = false,
  discordVerified = false,
  orgVerified = false,
  handle = null,
  size = 'sm',
  showLabels = false,
  onRsiClick,
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
    <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-2">
      {/* RSI Handle */}
        {rsiVerified && (
          <button
            type="button"
            onClick={onRsiClick}
            disabled={!onRsiClick}
            className={`group relative flex shrink-0 items-center gap-1.5 ${
              onRsiClick
                ? 'cursor-pointer'
                : 'cursor-default'
            }`}
          >
          <BadgeCheck
            className={`${iconSize} fill-[#1689e8] text-white transition-transform duration-150 group-hover:scale-110`}
            strokeWidth={2.5}
          />

          {showLabels && (
            <span className="text-xs text-muted-foreground">
              {handle
                ? `${handle} 已认证`
                : 'RSI Handle 已认证'}
            </span>
          )}

          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-neutral-950 px-2.5 py-1.5 text-[10px] font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
            该 Star Citizen RSI Handle 已完成身份认证
          </div>
        </button>
        )}

      {/* StarClub Discord */}
      {discordVerified && (
        <div className="group relative flex shrink-0 items-center gap-1.5">
          <div
            className={`${iconSize} flex items-center justify-center rounded-full bg-[#5865F2] transition-transform duration-150 group-hover:scale-110`}
          >
            <Image
              src="/images/social/discord.svg"
              alt="酒馆 Discord 认证"
              width={imageSize}
              height={imageSize}
              className="h-[65%] w-[65%] object-contain brightness-0 invert"
            />
          </div>

          {showLabels && (
            <span className="text-xs text-muted-foreground">
              酒馆 Discord 已认证
            </span>
          )}

          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-neutral-950 px-2.5 py-1.5 text-[10px] font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
            该 Discord 账号已加入星际酒馆并完成服务器认证
          </div>
        </div>
      )}

      {/* STARCLUB ORG */}
      {orgVerified && (
        <div className="group relative flex shrink-0 items-center gap-1.5">
          <Image
            src="/images/starclub-logo.png"
            alt="酒馆俱乐部 ORG 认证"
            width={imageSize}
            height={imageSize}
            className={`${iconSize} object-contain transition-transform duration-150 group-hover:scale-110`}
          />

          {showLabels && (
            <span className="text-xs text-muted-foreground">
              酒馆俱乐部ORG 已认证
            </span>
          )}

          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-neutral-950 px-2.5 py-1.5 text-[10px] font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
            该玩家已验证为星际酒馆官方俱乐部 ORG 成员
          </div>
        </div>
      )}
    </div>
  )
}