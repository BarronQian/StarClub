import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

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
  Badge,
} from '@/components/ui/badge'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  EVENT_CATEGORY_LABEL,
  EVENT_STATUS_LABEL,
} from '@/lib/events'

import type {
  EventCategory,
  EventStatus,
} from '@/lib/events'

import {
  EventActions,
} from '@/components/admin/event-actions'

export const metadata: Metadata = {
  title:
    '活动管理 | 星际酒馆 StarClub',

  robots: {
    index: false,
    follow: false,
  },
}

type CommunityEventRow = {
  id: string

  slug: string
  tag: string
  title: string
  subtitle: string | null

  date: string
  location: string

  category: EventCategory
  status: EventStatus

  featured_on_home: boolean
  is_published: boolean

  sort_order: number

  deleted_at: string | null

  created_at: string
  updated_at: string
}

function getStatusClass(
  status: EventStatus,
) {
  if (status === 'open') {
    return 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
  }

  if (status === 'ongoing') {
    return 'border-blue-500/30 text-blue-600 dark:text-blue-400'
  }

  if (status === 'upcoming') {
    return 'border-amber-500/30 text-amber-600 dark:text-amber-400'
  }

  return 'border-muted-foreground/30 text-muted-foreground'
}

export default async function AdminEventsPage() {
  const session =
    await getAdminSession()

  if (!session) {
    redirect(
      '/admin/login',
    )
  }

  const supabase =
    createAdminClient()

  const [
    eventsResult,
    totalResult,
    publishedResult,
    featuredResult,
  ] =
    await Promise.all([
      supabase
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
          location,
          category,
          status,
          featured_on_home,
          is_published,
          sort_order,
          deleted_at,
          created_at,
          updated_at
        `)
        .is(
          'deleted_at',
          null,
        )
        .order(
          'sort_order',
          {
            ascending: false,
          },
        )
        .order(
          'created_at',
          {
            ascending: false,
          },
        ),

      supabase
        .from(
          'community_events',
        )
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          },
        )
        .is(
          'deleted_at',
          null,
        ),

      supabase
        .from(
          'community_events',
        )
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          },
        )
        .eq(
          'is_published',
          true,
        )
        .is(
          'deleted_at',
          null,
        ),

      supabase
        .from(
          'community_events',
        )
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          },
        )
        .eq(
          'featured_on_home',
          true,
        )
        .eq(
          'is_published',
          true,
        )
        .is(
          'deleted_at',
          null,
        ),
    ])

  if (
    eventsResult.error
  ) {
    throw new Error(
      `Failed to load community events: ${eventsResult.error.message}`,
    )
  }

  const events =
    (
      eventsResult.data ??
      []
    ) as CommunityEventRow[]

  const totalCount =
    totalResult.count ?? 0

  const publishedCount =
    publishedResult.count ?? 0

  const featuredCount =
    featuredResult.count ?? 0

  return (
    <div className="min-h-svh bg-background">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-10 pt-20">
        <AdminHeader
          adminEmail={
            session.email
          }
          active="events"
        />

        <section>
          <div className="mb-4">
            <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
              活动概览
            </h2>

            <p className="mt-2 text-xs text-muted-foreground">
              管理星际酒馆社区活动、赛事、教学与大型集体活动。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="corner-cut border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">
                全部活动
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {totalCount}
              </p>
            </div>

            <div className="corner-cut border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">
                已发布
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {publishedCount}
              </p>
            </div>

            <div className="corner-cut border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">
                首页推荐
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {featuredCount}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
                活动管理
              </h2>

              <p className="mt-2 text-xs text-muted-foreground">
                当前数据库中的全部活动
              </p>
            </div>

            <Link
              href="/admin/events/new"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-85"
            >
              新增活动
            </Link>
          </div>

          <div className="corner-cut overflow-hidden border border-border bg-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      活动
                    </TableHead>

                    <TableHead>
                      分类
                    </TableHead>

                    <TableHead>
                      状态
                    </TableHead>

                    <TableHead>
                      日期
                    </TableHead>

                    <TableHead>
                      发布
                    </TableHead>

                    <TableHead>
                      首页
                    </TableHead>

                    <TableHead className="text-right">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {events.length ===
                  0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        当前没有活动
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map(
                      (
                        event,
                      ) => (
                        <TableRow
                          key={
                            event.id
                          }
                        >
                          <TableCell className="max-w-72">
                            <div className="font-medium text-foreground">
                              {
                                event.title
                              }
                            </div>

                            {event.subtitle ? (
                              <div className="mt-1 truncate text-[0.68rem] text-muted-foreground">
                                {
                                  event.subtitle
                                }
                              </div>
                            ) : null}

                            <div className="mt-1 text-[0.65rem] text-muted-foreground/70">
                              {
                                event.slug
                              }
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline">
                              {
                                EVENT_CATEGORY_LABEL[
                                  event.category
                                ]
                              }
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                getStatusClass(
                                  event.status,
                                )
                              }
                            >
                              {
                                EVENT_STATUS_LABEL[
                                  event.status
                                ]
                              }
                            </Badge>
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {
                              event.date
                            }
                          </TableCell>

                          <TableCell>
                            {event.is_published ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              >
                                已发布
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-muted-foreground/30 text-muted-foreground"
                              >
                                草稿
                              </Badge>
                            )}
                          </TableCell>

                              <TableCell>
                                {event.featured_on_home ? (
                                  <Badge
                                    variant="outline"
                                    className="border-primary/30 text-primary"
                                  >
                                    推荐
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </TableCell>

                              <TableCell className="text-right">
                                <EventActions
                                  id={event.id}
                                  slug={event.slug}
                                  status={event.status}
                                />
                              </TableCell>
                        </TableRow>
                      ),
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}