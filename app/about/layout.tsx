import type { ReactNode } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="pt-24 lg:pt-28">{children}</main>
      <SiteFooter />
    </>
  )
}