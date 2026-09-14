import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

import { getAdminSession } from '@/lib/admin-auth'
import { AdminHeader } from '@/components/admin/admin-header'

import {
  AdminGuideOrderManager,
} from '@/components/admin-guide-order-manager'

function getSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL

  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !supabaseServiceRoleKey
  ) {
    return null
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

type GuideRow = {
  id: string
  slug: string
  title: string
  category: string
  type: string
  original: boolean
  published: boolean
  featured: boolean
  sort_order: number
  updated_at: string
}

async function getGuides() {
  const supabase =
    getSupabase()

  if (!supabase) {
    return []
  }

  const {
    data,
    error,
  } = await supabase
    .from('guides')
    .select(`
      id,
      slug,
      title,
      category,
      type,
      original,
      published,
      featured,
      sort_order,
      updated_at
    `)
    .order(
      'sort_order',
      {
        ascending: true,
      }
    )
    .order(
      'updated_at',
      {
        ascending: false,
      }
    )

  if (error) {
    console.error(
      '[ADMIN GUIDES] Failed to load guides:',
      error
    )

    return []
  }

  return (
    data ?? []
  ) as GuideRow[]
}

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      timeZone:
        'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }
  ).format(
    new Date(value)
  )
}

export default async function AdminGuidesPage() {
  const session =
    await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  const guides =
    await getGuides()

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-10 pt-20">
        <AdminHeader
          adminEmail={session.email}
          active="guides"
        />

        <div>
          <div className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-display text-[0.65rem] tracking-[0.32em] text-primary">
              ADMIN / GUIDES
            </span>

            <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
              攻略管理
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              管理中文攻略、视频攻略、分类、发布状态与正文内容。
            </p>
          </div>

          <Link
            href="/admin/guides/new"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            新建攻略
          </Link>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-xs text-muted-foreground">
                  <th className="px-5 py-4 font-medium">
                    攻略
                  </th>

                  <th className="px-5 py-4 font-medium">
                    分类
                  </th>

                  <th className="px-5 py-4 font-medium">
                    类型
                  </th>

                  <th className="px-5 py-4 font-medium">
                    状态
                  </th>

                  <th className="px-5 py-4 font-medium">
                    原创
                  </th>

                  <th className="px-5 py-4 font-medium">
                    更新
                  </th>

                  <th className="px-5 py-4 text-right font-medium">
                    操作
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {guides.map(
                  (guide) => (
                    <tr
                      key={guide.id}
                      className="transition-colors hover:bg-muted/20"
                    >
                      <td className="px-5 py-4">
                        <div className="max-w-[320px]">
                          <div className="font-medium text-foreground">
                            {guide.title}
                          </div>

                          <div className="mt-1 truncate text-xs text-muted-foreground">
                            /guides/{guide.slug}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {guide.category}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                          {guide.type ===
                          'video'
                            ? '视频'
                            : guide.type ===
                                'article'
                              ? '图文'
                              : guide.type}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {guide.published ? (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400">
                            已发布
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                            草稿
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {guide.original ? (
                          <span className="text-xs text-primary">
                            酒馆原创
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {formatDate(
                          guide.updated_at
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/guides/${guide.slug}`}
                            target="_blank"
                            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                          >
                            查看
                          </Link>

                          <Link
                            href={`/admin/guides/${guide.id}/edit`}
                            className="rounded-full border border-primary/30 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                          >
                            编辑
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                )}

                {guides.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center text-sm text-muted-foreground"
                    >
                      暂无攻略
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          共 {guides.length} 篇攻略
        </div>

        <AdminGuideOrderManager
            guides={guides}
          />

      </div>
    </main>
  </div>
)
}