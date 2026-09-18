import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_SC, Orbitron } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import { PageNavigation } from '@/components/page-navigation'
import { SiteHeader } from '@/components/site-header'
import { ThemePullSwitch } from '@/components/theme-pull-switch'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.starclubsc.com'),
  title: 'StarClub 星际酒馆 | 全球华人 Star Citizen 玩家社区',
  description:
    'StarClub 星际酒馆 是面向全球华人的 Star Citizen 玩家社区，提供舰队行动、赛事活动、中文攻略与新人引导，欢迎加入我们的 Discord 与官方 ORG。',
  generator: 'v0.app',
  keywords: [
    'Star Citizen',
    '星际公民',
    '星际酒馆',
    'StarClub',
    '华人社区',
    'ORG',
    '中文攻略',
  ],
    openGraph: {
      title: 'StarClub 星际酒馆 | 全球华人 Star Citizen 玩家社区',
      description:
        '自由交流 · 社区活动 · 中文攻略 · 玩家影廊 · 实用工具',
      url: 'https://www.starclubsc.com',
      siteName: 'StarClub 星际酒馆',
      type: 'website',
      locale: 'zh_CN',
      images: [
        {
          url: '/images/og/starclub-og.jpg',
          width: 1200,
          height: 630,
          alt: 'StarClub 星际酒馆 | 全球华人 Star Citizen 玩家社区',
        },
      ],
    },
    twitter: {
  card: 'summary_large_image',
  title: 'StarClub 星际酒馆 | 全球华人 Star Citizen 玩家社区',
  description:
    '自由交流 · 社区活动 · 中文攻略 · 玩家影廊 · 实用工具',
  images: ['/images/og/starclub-og.jpg'],
},
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    {
      media: '(prefers-color-scheme: light)',
      color: '#ffffff',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: '#0d0f12',
    },
  ],
}

const themeScript = `
  (() => {
    try {
      const savedTheme =
        localStorage.getItem('starclub-theme')

      const prefersDark =
        window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches

      const shouldUseDark =
        savedTheme === 'dark' ||
        (
          !savedTheme &&
          prefersDark
        )

      document.documentElement.classList.toggle(
        'dark',
        shouldUseDark
      )
    } catch {}
  })()
`

export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode
  }>) {

  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`bg-background ${orbitron.variable} ${notoSansSC.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>

      <body className="font-sans antialiased">
        <SiteHeader />
        <ThemePullSwitch />
        {children}
        <PageNavigation />
        <Toaster />
        {process.env.NODE_ENV ===
          'production' && <Analytics />}
      </body>
    </html>
  )
}
