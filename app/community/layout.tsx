import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: '社区',
  description:
    '星际酒馆 StarClub 社区动态中心，与全球华人《Star Citizen / 星际公民》玩家交流互动、分享游戏经历、社区内容与玩家创作。',
}

export default function CommunityLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}