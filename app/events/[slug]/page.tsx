import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Images,
  MapPin,
  Users,
} from 'lucide-react'

import { Reveal } from '@/components/reveal'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { LocalEventTime } from '@/components/local-event-time'

import {
  EXTERNAL,
  DISCORD_URL,
} from '@/lib/links'

import {
  EVENT_STATUS_LABEL,
} from '@/lib/events'

import {
  getEventFromDb,
} from '@/lib/events-db'

type Params = {
  params: Promise<{
    slug: string
  }>
}

/**
 * 活动由后台数据库动态管理。
 * 不再使用 generateStaticParams，
 * 这样以后后台新建活动后无需重新维护静态 slug 列表。
 */
export const dynamic =
  'force-dynamic'

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const {
    slug,
  } = await params

  const event =
    await getEventFromDb(
      slug,
    )

  if (!event) {
    return {
      title: '未找到活动',
    }
  }

  return {
    title: event.title,

    description:
      event.description,

    alternates: {
      canonical: `/events/${encodeURIComponent(slug)}`,
    },
  }
}

export default async function EventDetailPage({
  params,
}: Params) {
  const {
    slug,
  } = await params

  const event =
    await getEventFromDb(
      slug,
    )

  if (!event) {
    notFound()
  }

  const ended =
    event.status ===
    'ended'

  const registrationUrl =
    event.discordUrl ??
    DISCORD_URL

  return (
    <div className="pb-24 lg:pb-32">
      <section className="relative border-b border-border">
        <div className="absolute inset-0 -z-10">
          <Image
            src={
              event.image ||
              '/placeholder.svg'
            }
            alt={event.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-background via-background/85 to-background/40"
          />
        </div>

        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-24">
          <ArchiveBreadcrumb
            items={[
              {
                label: '首页',
                href: '/',
              },
              {
                label: '活动',
                href: '/events',
              },
              {
                label:
                  event.title,
              },
            ]}
          />

          <Reveal className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="corner-cut w-fit bg-primary px-3 py-1.5 font-display text-[0.58rem] tracking-[0.26em] text-primary-foreground">
                {event.tag}
              </span>

              <span className="text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
                {
                  EVENT_STATUS_LABEL[
                    event.status
                  ]
                }
              </span>
            </div>

            <h1 className="max-w-3xl font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {event.title}
            </h1>

            {event.subtitle ? (
              <p className="text-sm tracking-[0.08em] text-muted-foreground sm:text-base">
                {
                  event.subtitle
                }
              </p>
            ) : null}
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-14 lg:px-10 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
          <Reveal className="flex flex-col gap-8">
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
              {event.details ??
                event.description}
            </p>

            {event.rules &&
            event.rules.length >
              0 ? (
              <div className="border-t border-border pt-6">
                <h2 className="font-display text-xs tracking-[0.28em] text-primary">
                  活动规则
                </h2>

                <ul className="mt-4 flex flex-col gap-3">
                  {event.rules.map(
                    (
                      rule,
                      index,
                    ) => (
                      <li
                        key={`${index}-${rule}`}
                        className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1 shrink-0 rounded-full bg-primary"
                        />

                        {rule}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ) : null}

            {event.rewards &&
            event.rewards
              .length > 0 ? (
              <div className="border-t border-border pt-6">
                <h2 className="font-display text-xs tracking-[0.28em] text-primary">
                  奖励
                </h2>

                <ul className="mt-4 flex flex-col gap-3">
                  {event.rewards.map(
                    (
                      reward,
                      index,
                    ) => (
                      <li
                        key={`${index}-${reward}`}
                        className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1 shrink-0 rounded-full bg-primary"
                        />

                        {reward}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ) : null}

            {event.archiveHref ? (
              <div className="border-t border-border pt-6">
                <Link
                  href={
                    event.archiveHref
                  }
                  className="group inline-flex items-center gap-2 font-display text-[0.65rem] tracking-[0.26em] text-primary"
                >
                  <Images
                    className="size-4"
                    strokeWidth={
                      1.5
                    }
                    aria-hidden="true"
                  />

                  查看往期合影

                  <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            ) : null}
          </Reveal>

          <Reveal delay={120}>
            <div className="corner-cut flex flex-col gap-6 border border-border bg-card p-6 lg:p-8">
              <dl className="flex flex-col gap-4 text-sm text-foreground/80">
                <div className="flex items-start gap-3">
                  <CalendarDays
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    strokeWidth={
                      1.5
                    }
                    aria-hidden="true"
                  />

                  <div>
                    <dt className="sr-only">
                      时间
                    </dt>

                    <dd>
                      {event
                        .startTimes
                        ?.length ? (
                        <LocalEventTime
                          startTimes={
                            event.startTimes
                          }
                        />
                      ) : (
                        <>
                          {
                            event.date
                          }

                          {event.timezone
                            ? ` · ${event.timezone}`
                            : ''}
                        </>
                      )}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    strokeWidth={
                      1.5
                    }
                    aria-hidden="true"
                  />

                  <div>
                    <dt className="sr-only">
                      地点
                    </dt>

                    <dd>
                      {
                        event.location
                      }
                    </dd>
                  </div>
                </div>

                {event.slots ? (
                  <div className="flex items-start gap-3">
                    <Users
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      strokeWidth={
                        1.5
                      }
                      aria-hidden="true"
                    />

                    <div>
                      <dt className="sr-only">
                        席位
                      </dt>

                      <dd>
                        {
                          event.slots
                        }
                      </dd>
                    </div>
                  </div>
                ) : null}
              </dl>

              {ended ? (
                <span className="pill w-full border border-border py-3 text-center font-display text-[0.65rem] tracking-[0.22em] text-muted-foreground">
                  活动已结束
                </span>
              ) : (
                <a
                  href={
                    registrationUrl
                  }
                  {...EXTERNAL}
                  className="pill w-full bg-primary py-3 text-center font-display text-[0.65rem] tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-85"
                >
                  前往 Discord
                  活动频道报名
                </a>
              )}
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-16">
          <Link
            href="/events"
            className="group inline-flex items-center gap-2 font-display text-[0.65rem] tracking-[0.26em] text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft
              className="size-3.5 transition-transform group-hover:-translate-x-1"
              strokeWidth={
                1.5
              }
              aria-hidden="true"
            />

            返回全部活动
          </Link>
        </Reveal>
      </section>
    </div>
  )
}