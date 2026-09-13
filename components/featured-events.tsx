import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, CalendarDays, MapPin, Users } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'
import { EVENT_STATUS_LABEL } from '@/lib/events'
import { getHomeFeaturedEventsFromDb } from '@/lib/events-db'

export async function FeaturedEvents() {
  const [featured, ...rest] =
    await getHomeFeaturedEventsFromDb()

  if (!featured) return null

  return (
    <section
      id="events"
      className="relative border-t border-border bg-[#f5f5f7] py-20 lg:py-32"
    >
      <div className="site-container">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            index="02"
            eyebrow="StarClub Events"
            title="星际酒馆社区活动"
            description="日常活动、社区赛事与大型企划，都在这里发生。"
          />
          <Reveal delay={140}>
            <Link
              href="/events"
              className="group inline-flex items-center gap-2 border-b border-primary/40 pb-1 font-display text-[0.65rem] tracking-[0.26em] text-primary"
            >
              查看全部日程
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-5">
          <Reveal>
            <Link
              href={`/events/${featured.slug}`}
              className="group corner-cut relative isolate flex min-h-104 flex-col overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300 transform-gpu backface-hidden hover:-translate-y-0.5 hover:scale-[1.015] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05),0_18px_42px_rgba(0,0,0,0.11)] lg:min-h-136"
            >
<div className="absolute inset-0 -z-20 scale-[1.08] overflow-hidden rounded-[inherit] transition-transform duration-1200 group-hover:scale-[1.11]">
  <Image
    src={featured.image || '/placeholder.svg'}
    alt={featured.alt}
    fill
    sizes="(max-width: 1024px) 100vw, 60vw"
    className="object-cover"
  />

  <div
    aria-hidden="true"
    className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent"
  />
</div>
              <div className="relative flex h-full flex-1 flex-col justify-end gap-4 p-6 lg:p-9">
                <span className="corner-cut w-fit bg-primary px-3 py-1.5 font-display text-[0.58rem] tracking-[0.26em] text-primary-foreground">
                  {featured.tag}
                </span>
                <h3 className="max-w-md text-2xl font-semibold leading-snug text-balance text-white lg:text-4xl">
                  {featured.title}
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-white/80">
                  {featured.description}
                </p>
                <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/20 pt-5 text-xs text-white/80 lg:text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-3.5 text-primary" strokeWidth={1.5} />
                    <dt className="sr-only">时间</dt>
                    <dd className="tracking-[0.08em]">
                      {featured.date}
                      {featured.timezone ? ` · ${featured.timezone}` : ''}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-primary" strokeWidth={1.5} />
                    <dt className="sr-only">地点</dt>
                    <dd>{featured.location}</dd>
                  </div>
                  {featured.slots ? (
                    <div className="flex items-center gap-2">
                      <Users className="size-3.5 text-primary" strokeWidth={1.5} />
                      <dt className="sr-only">席位</dt>
                      <dd>{featured.slots}</dd>
                    </div>
                  ) : null}
                </dl>
                <span className="flex items-center gap-2 font-display text-[0.6rem] tracking-[0.26em] text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {EVENT_STATUS_LABEL[featured.status]} · 查看活动
                  <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
                </span>
              </div>
            </Link>
          </Reveal>

          <div className="grid gap-4 lg:gap-5">
            {rest.map((event, i) => (
              <Reveal key={event.slug} delay={120 + i * 120}>
                <Link
                  href={`/events/${event.slug}`}
                  className="group corner-cut relative isolate flex h-full min-h-60 flex-col overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300 transform-gpu backface-hidden hover:-translate-y-0.5 hover:scale-[1.025] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05),0_18px_42px_rgba(0,0,0,0.11)]"
                >
<div className="absolute inset-0 -z-20 scale-[1.005] overflow-hidden rounded-[inherit] transition-transform duration-1200 group-hover:scale-[1.05]">
  <Image
    src={event.image || '/placeholder.svg'}
    alt={event.alt}
    fill
    sizes="(max-width: 1024px) 100vw, 40vw"
    className="object-cover opacity-90 transition-opacity duration-1200 group-hover:opacity-100"
  />

  <div
    aria-hidden="true"
    className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent"
  />
</div>
                  <div className="relative flex flex-1 flex-col justify-end gap-3 p-6 lg:p-7">
                    <span className="font-display text-[0.58rem] tracking-[0.26em] text-primary">
                      {event.tag}
                    </span>
                    <h3 className="text-lg font-semibold leading-snug text-white lg:text-xl">
                      {event.title}
                    </h3>
                    <p className="max-w-xs text-xs leading-relaxed text-white/75 lg:text-sm">
                      {event.description}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-[0.72rem] text-white/75 lg:text-xs">
                      <CalendarDays className="size-3.5 text-primary" strokeWidth={1.5} />
                      {event.date}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
