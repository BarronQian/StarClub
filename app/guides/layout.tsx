import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: '中文攻略 | 星际酒馆 StarClub',
  description:
    '星际酒馆整理的 Star Citizen 中文攻略、玩法教学与实用指南。',
}

export default function GuidesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="pt-24 lg:pt-28">{children}</main>
      <SiteFooter />
    </>
  )
}