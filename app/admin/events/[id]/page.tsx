import type {
  Metadata,
} from 'next'

import Link from 'next/link'

import {
  notFound,
  redirect,
} from 'next/navigation'

import {
  getAdminSession,
} from '@/lib/admin-auth'

import {
  createAdminClient,
} from '@/lib/supabase-admin'

import {
  AdminHeader,
} from '@/components/admin/admin-header'

import {
  EventEditor,
} from '@/components/admin/event-editor'

import type {
  EventCategory,
  EventStatus,
  EventSubcategory,
  EventSeries,
  EventSandboxType,
} from '@/lib/events'

export const metadata: Metadata = {
  title:
    '编辑活动 | StarClub Admin',

  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic =
  'force-dynamic'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

type CommunityEventRow = {
  id: string

  slug: string
  tag: string
  title: string
  subtitle: string | null

  date: string
  timezone: string | null
  start_times: string[] | null

  location: string

  category: EventCategory
  subcategory:
    | EventSubcategory
    | null

  series:
    | EventSeries
    | null

  sandbox_type:
    | EventSandboxType
    | null

  custom_tags:
    | string[]
    | null

  tags:
    | string[]
    | null

  status: EventStatus

  image: string
  alt: string | null

  description: string
  details: string | null

  rules:
    | string[]
    | null

  rewards:
    | string[]
    | null

  slots: string | null

  discord_url:
    | string
    | null

  archive_href:
    | string
    | null

  featured_on_home: boolean

  is_published: boolean

  sort_order: number

  deleted_at:
    | string
    | null
}

export default async function AdminEditEventPage({
  params,
}: PageProps) {
  const session =
    await getAdminSession()

  if (!session) {
    redirect(
      '/admin/login',
    )
  }

  const {
    id,
  } = await params

  const supabase =
    createAdminClient()

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'community_events',
      )
      .select(`
        id,
        slug,
        tag,
        title,
        subtitle,
        date,
        timezone,
        start_times,
        location,
        category,
        subcategory,
        series,
        sandbox_type,
        custom_tags,
        tags,
        status,
        image,
        alt,
        description,
        details,
        rules,
        rewards,
        slots,
        discord_url,
        archive_href,
        featured_on_home,
        is_published,
        sort_order,
        deleted_at
      `)
      .eq(
        'id',
        id,
      )
      .maybeSingle()

  if (error) {
    console.error(
      'Failed to load event for admin edit:',
      error,
    )

    notFound()
  }

  const event =
    data as
      | CommunityEventRow
      | null

  if (
    !event ||
    event.deleted_at
  ) {
    notFound()
  }

  const initialData = {
    id:
      event.id,

    slug:
      event.slug,

    tag:
      event.tag,

    title:
      event.title,

    subtitle:
      event.subtitle,

    date:
      event.date,

    timezone:
      event.timezone,

    startTimes:
      event.start_times ??
      [],

    location:
      event.location,

    category:
      event.category,

    subcategory:
      event.subcategory,

    series:
      event.series,

    sandboxType:
      event.sandbox_type,

    customTags:
      event.custom_tags ??
      [],

    tags:
      event.tags ??
      [],

    status:
      event.status,

    image:
      event.image,

    alt:
      event.alt,

    description:
      event.description,

    details:
      event.details,

    rules:
      event.rules ??
      [],

    rewards:
      event.rewards ??
      [],

    slots:
      event.slots,

    discordUrl:
      event.discord_url,

    archiveHref:
      event.archive_href,

    featuredOnHome:
      event.featured_on_home,

    isPublished:
      event.is_published,

    sortOrder:
      event.sort_order,
  }

  return (
    <div className="min-h-svh bg-background">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-10 pt-20">
        <AdminHeader
          adminEmail={
            session.email
          }
          active="events"
        />

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[0.65rem] tracking-[0.28em] text-primary">
                STARCLUB / ADMIN / EVENTS
              </p>

              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">
                编辑活动
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {event.title}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {event.is_published ? (
                <Link
                  href={`/events/${event.slug}`}
                  target="_blank"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  查看前台
                </Link>
              ) : null}

              <Link
                href="/admin/events"
                className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                返回活动管理
              </Link>
            </div>
          </div>

          <EventEditor
            mode="edit"
            initialData={
              initialData
            }
          />
        </section>
      </main>
    </div>
  )
}