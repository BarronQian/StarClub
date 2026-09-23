import type { Metadata } from 'next'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { Reveal } from '@/components/reveal'
import { EventsGrid } from '@/components/events-grid'
import { getEventsFromDb } from '@/lib/events-db'
import { EventsCompanion } from '@/components/events-companion'

export const metadata: Metadata = {
  title: '社区活动',
  description:
    '星际酒馆 StarClub 的 Star Citizen（星际公民）社区活动中心，记录大型集体活动、竞技赛事、挑战赛、社区合影、教学活动与玩家活动。',
  alternates: {
    canonical: '/events',
  },
}

export default async function EventsPage() {
  const events = await getEventsFromDb()
  return (
    <div className="pb-24 lg:pb-32">
      <section className="relative border-b border-border">
        <div
          aria-hidden="true"
          className="hud-grid absolute inset-0 -z-10 opacity-70"
        />
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-24">
          <ArchiveBreadcrumb
            items={[{ label: '首页', href: '/' }, { label: '活动' }]}
          />
          <Reveal className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="font-display text-[0.65rem] tracking-[0.4em] text-primary">
                STARCLUB EVENTS
              </span>
              <span className="h-px w-10 bg-primary/40" aria-hidden="true" />
              <span className="text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
                Community Events
              </span>
            </div>
            <h1 className="max-w-3xl font-display text-4xl leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
              社区活动
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              从竞技赛事到大型集体行动，记录酒馆正在发生与即将发生的一切。
            </p>
          </Reveal>
        </div>
      </section>

            <section className="mx-auto max-w-7xl px-5 pt-16 lg:px-10 lg:pt-24">
        <EventsGrid events={events} />
      </section>

      <EventsCompanion />
    </div>
  )
}
