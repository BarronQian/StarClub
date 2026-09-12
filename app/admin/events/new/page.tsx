import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getAdminSession } from '@/lib/admin-auth'

import { AdminHeader } from '@/components/admin/admin-header'
import { EventEditor } from '@/components/admin/event-editor'

export const metadata: Metadata = {
  title: '新增活动 | StarClub Admin',
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = 'force-dynamic'

export default async function AdminNewEventPage() {
  const session = await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-svh bg-background">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-10 pt-20">
        <AdminHeader
          adminEmail={session.email}
          active="events"
        />

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[0.65rem] tracking-[0.28em] text-primary">
                STARCLUB / ADMIN / EVENTS
              </p>

              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">
                新增活动
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                创建新的社区活动、赛事、教学或大型集体活动。
              </p>
            </div>

            <Link
              href="/admin/events"
              className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              返回活动管理
            </Link>
          </div>

          <EventEditor mode="create" />
        </section>
      </main>
    </div>
  )
}