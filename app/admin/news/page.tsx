import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getAdminSession } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

import { AdminHeader } from '@/components/admin/admin-header'
import { NewsForm } from '@/components/admin/news-form'
import { NewsAdminList } from '@/components/admin/news-admin-list'

export const metadata: Metadata = {
  title: '最新资讯管理 | 星际酒馆 StarClub',
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = 'force-dynamic'

export default async function AdminNewsPage() {
  const session = await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  const supabase =
    createAdminClient()

  const {
    data: news,
    error,
  } = await supabase
    .from('sc_news')
    .select(`
      id,
      source,
      title_original,
      title_zh,
      summary_original,
      summary_zh,
      source_url,
      image_url,
      published_at
    `)
    .order('published_at', {
      ascending: false,
    })

  if (error) {
    console.error(
      '[v0] Admin news load error:',
      error,
    )
  }

  const items = news ?? []

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-10 pt-20">
      <AdminHeader
        adminEmail={
          session.email
        }
        active="news"
      />

      <section>
        <h2 className="mb-4 font-display text-sm tracking-[0.15em] text-foreground">
          发布最新资讯
        </h2>

        <div className="corner-cut border border-border bg-card p-6">
          <NewsForm />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
            已发布资讯（
            {items.length}
            ）
          </h2>
        </div>

        <NewsAdminList
          items={items}
        />
      </section>
    </main>
  )
}