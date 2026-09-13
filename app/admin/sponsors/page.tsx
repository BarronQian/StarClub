import type { Metadata } from 'next'
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
  SponsorManager,
} from '@/components/admin/sponsor-manager'

export const metadata: Metadata = {
  title:
    '赞助榜管理 | 星际酒馆 StarClub',

  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic =
  'force-dynamic'

export default async function AdminSponsorsPage() {
  const session =
    await getAdminSession()

  if (!session) {
    redirect(
      '/admin/login',
    )
  }

  const supabase =
    createAdminClient()

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'sponsors',
      )
      .select(`
        id,
        name,
        nickname,
        badge,
        amount,
        sort_order,
        is_visible,
        created_at,
        updated_at
      `)
      .order(
        'amount',
        {
          ascending: false,
        },
      )
      .order(
        'sort_order',
        {
          ascending: false,
        },
      )

  if (error) {
    console.error(
      'Failed to load sponsors:',
      error,
    )
  }

  const sponsors =
    (data ?? []).map(
      (
        sponsor,
        index,
      ) => ({
        ...sponsor,
        amount:
          Number(
            sponsor.amount,
          ),
        rank:
          index + 1,
      }),
    )

  const totalAmount =
    sponsors.reduce(
      (
        sum,
        sponsor,
      ) =>
        sum +
        sponsor.amount,
      0,
    )

  const visibleCount =
    sponsors.filter(
      (sponsor) =>
        sponsor.is_visible,
    ).length

  return (
    <>
      <AdminHeader
        active="sponsors"
      />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-28 lg:px-8 lg:pt-32">
        <div className="mb-10">
          <p className="font-display text-[0.65rem] tracking-[0.28em] text-primary">
            SPONSOR MANAGEMENT
          </p>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
                赞助榜管理
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                管理赞助者、总赞助金额、昵称、荣誉称号、显示状态与排序。
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">
              赞助者总数
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {
                sponsors.length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">
              当前显示
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {
                visibleCount
              }
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">
              累计赞助
            </p>

            <p className="mt-2 text-2xl font-semibold">
              $
              {totalAmount.toLocaleString(
                'en-US',
                {
                  minimumFractionDigits:
                    2,
                  maximumFractionDigits:
                    2,
                },
              )}
            </p>
          </div>
        </div>

        <SponsorManager
          initialSponsors={
            sponsors
          }
        />
      </main>
    </>
  )
}