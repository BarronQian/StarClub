import Image from 'next/image'
import {
  DISCORD_URL,
  QQ_URL,
  ORG_URL,
  BILIBILI_URL,
  EMAIL_URL,
  EXTERNAL,
  BILIBILI_STARCLUB_URL,
  DOUYIN_URL,
  XIAOHONGSHU_URL,
  INSTAGRAM_URL,
  YOUTUBE_URL,
} from '@/lib/links'
import type { ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'

type FooterLink = {
  label: string
  href: string
  external?: boolean
  icon?: ReactNode
}

const COLUMNS: { title: string; en: string; links: FooterLink[] }[] = [
  {
    title: '社区',
    en: 'COMMUNITY',
    links: [
      { label: '关于我们', href: '/about' },
      { label: '社区规章', href: '/rules' },
      { label: '管理组', href: '/team' },
      { label: '合作组织', href: '/partners' },
    ],
  },

  {
    title: '资源',
    en: 'RESOURCES',
    links: [
      { label: '中文攻略', href: '/guides' },
      { label: '活动日程', href: '/events' },
      { label: '社区影廊', href: '/gallery' },
      { label: '实用工具', href: '/tools' },
    ],
  },
  {

    title: '联络',
    en: 'CONNECT',
    links: [
      {
  label: 'Discord',
  href: DISCORD_URL,
  external: true,
  icon: (
    <Image
      src="/images/social/discord.svg"
      alt=""
      width={16}
      height={16}
      className="size-4 object-contain"
    />
  ),
},
      {
  label: 'QQ 接待群',
  href: QQ_URL,
  external: true,
  icon: (
    <Image
      src="/images/social/qq.svg"
      alt=""
      width={16}
      height={16}
      className="size-4 object-contain"
    />
  ),
},
      {
  label: 'RSI官网 ORG',
  href: ORG_URL,
  external: true,
  icon: (
    <Image
      src="/images/social/starclub-icon-black.svg"
      alt=""
      width={16}
      height={16}
      className="size-4 object-contain"
    />
  ),
},
      {
  label: '邮件联系',
  href: EMAIL_URL,
  external: true,
  icon: (
    <Image
      src="/images/social/gmail.svg"
      alt=""
      width={16}
      height={16}
      className="size-4 object-contain"
    />
  ),
},
    ],
  },

  {
    title: '社交媒体',
    en: 'SOCIAL MEDIA',
    links: [
      {
  label: 'Bilibili · 星际酒馆',
  href: BILIBILI_STARCLUB_URL,
  external: true,
  icon: (
    <Image
      src="/images/social/bilibili.svg"
      alt=""
      width={16}
      height={16}
      className="size-4 object-contain"
    />
  ),
},
      {
  label: 'Bilibili · 姑蔑好人',
  href: BILIBILI_URL,
  external: true,
  icon: (
    <Image
      src="/images/social/bilibili.svg"
      alt=""
      width={16}
      height={16}
      className="size-4 object-contain"
    />
  ),
},
      {
  label: '抖音',
  href: DOUYIN_URL,
  external: true,
  icon: (
    <Image
      src="/images/social/douyin.svg"
      alt=""
      width={16}
      height={16}
      className="size-4 object-contain"
    />
  ),
},
      {
  label: '小红书',
  href: XIAOHONGSHU_URL,
  external: true,
  icon: (
    <Image
      src="/images/social/xiaohongshu.svg"
      alt=""
      width={16}
      height={16}
      className="size-4 object-contain"
    />
  ),
},
      {
  label: 'Instagram',
  href: INSTAGRAM_URL,
  external: true,
  icon: (
    <Image
      src="/images/social/instagram.svg"
      alt=""
      width={16}
      height={16}
      className="size-4 object-contain"
    />
  ),
},
      {
  label: 'YouTube',
  href: YOUTUBE_URL,
  external: true,
  icon: (
    <Image
      src="/images/social/youtube.svg"
      alt=""
      width={16}
      height={16}
      className="size-4 object-contain"
    />
  ),
},
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="site-container py-14 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
          <div>
            
  <div className="flex items-center gap-3">
    <Image
      src="/images/starclub-logo.png"
      alt="星际酒馆 StarClub 徽标"
      width={40}
      height={40}
      className="size-10 shrink-0 object-contain"
    />

    <div className="flex h-10 flex-col justify-center">
      <span className="font-display text-sm leading-none tracking-[0.34em] text-foreground">
        STARCLUB
      </span>

      <span className="mt-2 text-[0.6rem] leading-none tracking-[0.3em] text-muted-foreground">
        星际酒馆
      </span>
    </div>
  </div>

  <div className="mt-5 max-w-xs">
    <p className="text-sm leading-relaxed text-foreground/80">
      全球华人 Star Citizen 玩家社区
    </p>

    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
      A Global Chinese Star Citizen Community
    </p>

    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
      自由的人，自然会相遇。
    </p>
  </div>
</div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <nav key={col.en} aria-label={col.title}>
                <h3 className="font-display text-[0.6rem] tracking-[0.3em] text-primary">
                  {col.en}
                </h3>
                <ul className="mt-5 flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
<a
  href={link.href}
  {...(link.external ? EXTERNAL : {})}
  className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
>
  {link.icon && (
    <span className="flex size-4 shrink-0 items-center justify-center">
      {link.icon}
    </span>
  )}

  <span>{link.label}</span>

  {link.external && (
    <ExternalLink className="size-3 opacity-0 transition-opacity group-hover:opacity-50" />
  )}
</a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-5 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
          <div className="flex shrink-0 flex-col gap-2">
            <p>
              © 2026 StarClub 星际酒馆 · 非官方玩家社区
            </p>

            <div className="flex items-center gap-3">
              <a
                href="/privacy"
                className="transition-colors hover:text-foreground"
              >
                Privacy Policy
              </a>

              <span className="text-border">•</span>

              <a
                href="/terms"
                className="transition-colors hover:text-foreground"
              >
                Terms of Use
              </a>
            </div>
          </div>

          <div className="max-w-xl text-left sm:text-right">
            <p>
              Star Citizen® and Cloud Imperium® are trademarks of Cloud Imperium Rights LLC.
            </p>

            <p className="mt-1">
              StarClub is an independent, unofficial fan community and is not affiliated with or endorsed by Cloud Imperium Games.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
