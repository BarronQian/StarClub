import type {
  Metadata,
} from 'next'

import {
  redirect,
} from 'next/navigation'

import {
  getAdminSession,
} from '@/lib/admin-auth'

import {
  createAdminClient,
} from '@/lib/supabase-admin'

import {
  CLOSED_MS,
} from '@/lib/executive-hangar'

import {
  AdminHeader,
} from '@/components/admin/admin-header'

import {
  ExecutiveHangarCalibration,
} from '@/components/admin/executive-hangar-calibration'

export const metadata: Metadata = {
  title:
    '行政机库管理 | 星际酒馆 StarClub',

  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic =
  'force-dynamic'

function formatTime(
  value: string | Date,
) {
  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone:
        'America/Los_Angeles',
    },
  ).format(
    new Date(value),
  )
}

function formatUtc(
  value: string | Date,
) {
  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    },
  ).format(
    new Date(value),
  )
}

export default async function ExecutiveHangarAdminPage() {
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
        'executive_hangar_config',
      )
      .select(`
        id,
        anchor_time,
        updated_at,
        updated_by
      `)
      .eq(
        'id',
        1,
      )
      .maybeSingle()

  if (error) {
    throw new Error(
      `Failed to load executive hangar config: ${error.message}`,
    )
  }

  const anchorTime =
    data?.anchor_time
      ? new Date(
          data.anchor_time,
        )
      : null

  const fullGreenTime =
    anchorTime
      ? new Date(
          anchorTime.getTime() +
            CLOSED_MS,
        )
      : null

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      <AdminHeader
        adminEmail={
          session.email
        }
        active="executive-hangar"
      />

      <div className="mt-8">

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Executive Hangar
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            行政机库全局校准
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            管理网站默认使用的行政机库周期基准。
            普通玩家自己的本地校准不会修改这里的数据。
          </p>
        </div>

        <section className="mt-6 rounded-xl border border-border bg-card p-5">

          <div className="flex items-center justify-between gap-4">

            <div>
              <p className="text-sm font-semibold">
                当前全局基准
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                网站默认行政机库周期数据
              </p>
            </div>

            <span className="rounded-full border border-border px-3 py-1 text-[10px] font-medium tracking-wider text-muted-foreground">
              GLOBAL
            </span>

          </div>

          {anchorTime &&
          fullGreenTime ? (

            <div className="mt-5 grid gap-3 md:grid-cols-2">

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground">
                  五灯全绿 / OPEN
                </p>

                <p className="mt-2 font-mono text-base font-semibold tabular-nums">
                  {formatTime(
                    fullGreenTime,
                  )}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Pacific Time
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground">
                  CLOSED 周期起点
                </p>

                <p className="mt-2 font-mono text-base font-semibold tabular-nums">
                  {formatTime(
                    anchorTime,
                  )}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Pacific Time
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground">
                  UTC 基准
                </p>

                <p className="mt-2 font-mono text-sm font-semibold tabular-nums">
                  {formatUtc(
                    anchorTime,
                  )}{' '}
                  UTC
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground">
                  最后更新
                </p>

                <p className="mt-2 font-mono text-sm font-semibold tabular-nums">
                  {data?.updated_at
                    ? formatTime(
                        data.updated_at,
                      )
                    : '—'}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {data?.updated_by
                    ? `更新者：${data.updated_by}`
                    : '无更新记录'}
                </p>
              </div>

            </div>

          ) : (

            <div className="mt-5 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              暂无行政机库全局校准数据
            </div>

          )}

        </section>

          {fullGreenTime && (
            <ExecutiveHangarCalibration
              currentFullGreenTime={
                fullGreenTime.toISOString()
              }
            />
          )}

      </div>

    </main>
  )
}