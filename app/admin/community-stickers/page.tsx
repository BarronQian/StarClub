import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import {
  getAdminSession,
} from '@/lib/admin-auth'

import { AdminHeader } from '@/components/admin/admin-header'
import { CommunityStickerAdmin } from '@/components/admin/community-sticker-admin'

export const metadata: Metadata = {
  title: '社区表情包 | 星际酒馆 StarClub',
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = 'force-dynamic'

export default async function AdminCommunityStickersPage() {
  const session =
    await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-10 pt-20">
      <AdminHeader
        adminEmail={
          session.email
        }
        active="community-stickers"
      />

      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
              社区表情包
            </h2>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
              管理 StarClub 社区动态与评论中可使用的官方表情包。
              上传的原图将保留，同时生成适合网页加载的轻量版本。
            </p>
          </div>

          <span className="text-xs text-muted-foreground">
            0 个表情包
          </span>
        </div>
          <CommunityStickerAdmin />
      </section>
    </main>
  )
}