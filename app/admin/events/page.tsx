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
  EventsSortableTable,
  type AdminEventRow,
} from '@/components/admin/events-sortable-table'

export const metadata: Metadata = {
  title:
    '活动管理 | 星际酒馆 StarClub',

  robots: {
    index: false,
    follow: false,
  },
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
    ) as AdminEventRow[]

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

         <EventsSortableTable
            initialEvents={
              events
            }
          />
        </section>
      </main>
    </div>
  )
}