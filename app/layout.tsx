import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_SC, Orbitron } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import { PageNavigation } from '@/components/page-navigation'
import { SiteHeader } from '@/components/site-header'
import { ThemePullSwitch } from '@/components/theme-pull-switch'
import { AiAssistant } from '@/components/ai-assistant/ai-assistant'

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
  metadataBase: new URL(
    'https://www.starclubsc.com',
  ),

  title: {
    default:
      '星际酒馆 StarClub | 全球华人 Star Citizen 玩家社区',
    template:
      '%s | 星际酒馆 StarClub',
  },

  description:
    '星际酒馆 StarClub 是面向全球华人的 Star Citizen（星际公民）玩家社区，提供社区活动、赛事、中文攻略、玩家市场、社区影廊、实用工具与新人帮助，并运营 Star Citizen 官方 ORG STARCLUBCN。',

  applicationName:
    '星际酒馆 StarClub',

  authors: [
    {
      name: '星际酒馆 StarClub',
      url: 'https://www.starclubsc.com',
    },
  ],

  creator:
    '星际酒馆 StarClub',

  publisher:
    '星际酒馆 StarClub',

  keywords: [
    '星际酒馆',
    '星际酒馆 StarClub',
    '星际酒馆StarClub',
    'StarClub',
    'Star Citizen',
    '星际公民',
    'Star Citizen 中文社区',
    '星际公民中文社区',
    'Star Citizen 华人社区',
    'Star Citizen 海外华人社区',
    'Star Citizen 全球华人社区',
    '星际公民华人社区',
    'STARCLUBCN',
    'Star Citizen ORG',
    '星际公民攻略',
    'Star Citizen 中文攻略',
  ],

  alternates: {
    canonical:
      'https://www.starclubsc.com',
  },

  openGraph: {
    title:
      '星际酒馆 StarClub | 全球华人 Star Citizen 玩家社区',

    description:
      '全球华人 Star Citizen 玩家社区：社区活动、中文攻略、玩家市场、社区影廊、实用工具与新人帮助。',

    url:
      'https://www.starclubsc.com',

    siteName:
      '星际酒馆 StarClub',

    type: 'website',

    locale: 'zh_CN',

    images: [
      {
        url:
          '/images/og/starclub-og.jpg',
        width: 1200,
        height: 630,
        alt:
          '星际酒馆 StarClub | 全球华人 Star Citizen 玩家社区',
      },
    ],
  },

  twitter: {
    card:
      'summary_large_image',

    title:
      '星际酒馆 StarClub | 全球华人 Star Citizen 玩家社区',

    description:
      '全球华人 Star Citizen 玩家社区：社区活动、中文攻略、玩家市场、社区影廊与实用工具。',

    images: [
      '/images/og/starclub-og.jpg',
    ],
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      'max-image-preview':
        'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  icons: {
    icon: [
      {
        url:
          '/icon-light-32x32.png',
        media:
          '(prefers-color-scheme: light)',
      },
      {
        url:
          '/icon-dark-32x32.png',
        media:
          '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],

    apple:
      '/apple-icon.png',
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
          data-scroll-behavior="smooth"
          className={`bg-background ${orbitron.variable} ${notoSansSC.variable}`}
        >
      <head>
        <script
          suppressHydrationWarning
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
        <AiAssistant />
        <Toaster />
        {process.env.NODE_ENV ===
          'production' && <Analytics />}
      </body>
    </html>
  )
}
