import { About } from '@/components/about'
import { CommunitySupport } from '@/components/community-support'
import { CommunityStats } from '@/components/community-stats'
import { FeaturedEvents } from '@/components/featured-events'
import { Gallery } from '@/components/gallery'
import { Hero } from '@/components/hero'
import { HomeWelcomeDialog } from '@/components/home-welcome-dialog'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

export default function Page() {
  return (
    <>
      <SiteHeader />

      <HomeWelcomeDialog />

      <main>
        <Hero />
        <CommunityStats />
        <About />
        <FeaturedEvents />
        <Gallery />
        <CommunitySupport />
      </main>

      <SiteFooter />
    </>
  )
}