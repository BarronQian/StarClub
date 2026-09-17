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

import {
  SponsorGiftManager,
} from '@/components/admin/sponsor-gift-manager'

import type {
  SponsorGiftRow,
} from '@/lib/sponsor-gifts-db'

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

const [
  sponsorsResult,
  giftsResult,
] =
  await Promise.all([
    supabase
      .from('sponsors')
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
      ),

    supabase
      .from('sponsor_gifts')
      .select(`
        id,
        sponsor_id,
        sponsor_name,
        recipient_name,
        event_name,
        gift_name,
        quantity,
        gift_value,
        gifted_at,
        text_color,
        font_size,
        speed,
        depth,
        is_visible,
        sort_order,
        counts_toward_total,
        created_at
      `)
      .order(
        'gifted_at',
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
  ])

if (
  sponsorsResult.error
) {
  console.error(
    'Failed to load sponsors:',
    sponsorsResult.error,
  )
}

if (
  giftsResult.error
) {
  console.error(
    'Failed to load sponsor gifts:',
    giftsResult.error,
  )
}

  const sponsors =
    (
      sponsorsResult.data ??
      []
    ).map(
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
  
  const gifts =
  (
    giftsResult.data ??
    []
  ).map(
    (gift) => ({
      ...gift,

      quantity:
        Number(
          gift.quantity,
        ),

      gift_value:
        Number(
          gift.gift_value,
        ),

      sort_order:
        Number(
          gift.sort_order,
        ),
    }),
  ) as SponsorGiftRow[]

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
  <div className="min-h-screen bg-background">
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-24 pt-20">
      <AdminHeader
        adminEmail={
          session.email
        }
        active="sponsors"
      />

      <div className="w-full">
        <div className="mb-10">
          <p className="font-display text-[0.65rem] tracking-[0.28em] text-primary">
            SPONSOR MANAGEMENT
          </p>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
                社区赞助管理
              </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  管理社区赞助者、累计礼物参考价值、赞助记录与公开赞助弹幕。
                </p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              累计礼物参考价值
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

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">
              赞助记录
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {gifts.length}
            </p>
          </div>
        </div>

        <SponsorManager
          initialSponsors={
            sponsors
          }
        />

        <div className="my-14 border-t border-border" />

          <SponsorGiftManager
            initialGifts={
              gifts
            }
            sponsors={
              sponsors.map(
                (sponsor) => ({
                  id:
                    sponsor.id,

                  name:
                    sponsor.name,

                  nickname:
                    sponsor.nickname,

                  amount:
                    sponsor.amount,
                }),
              )
            }
          />

      </div>
    </main>
  </div>
)
}