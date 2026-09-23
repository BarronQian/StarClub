import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Star Citizen 玩家市场',
  description:
    '星际酒馆 StarClub 的 Star Citizen（星际公民）玩家市场，为玩家提供游戏内物品的出售 WTS、求购 WTB 与交换 WTT 信息发布和交易交流平台。',
  alternates: {
    canonical: '/market',
  },
}

export default function MarketLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}