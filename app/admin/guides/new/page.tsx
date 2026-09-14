import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getAdminSession } from '@/lib/admin-auth'

import {
  AdminGuideForm,
} from '@/components/admin-guide-form'

import {
  AdminHeader,
} from '@/components/admin/admin-header'

export default async function NewGuidePage() {
  const session =
    await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-10 pt-20">
        <AdminHeader
          adminEmail={
            session.email
          }
          active="guides"
        />

        <div className="mx-auto w-full max-w-5xl">
          <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="font-display text-[0.65rem] tracking-[0.32em] text-primary">
                ADMIN / GUIDES
              </span>

              <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
                新建攻略
              </h1>

              <p className="mt-3 text-sm text-muted-foreground">
                创建新的图文攻略或视频攻略。
              </p>
            </div>

            <Link
              href="/admin/guides"
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              返回攻略管理
            </Link>
          </div>

          <div className="mt-8">
            <AdminGuideForm
              mode="create"
            />
          </div>
        </div>
      </main>
    </div>
  )
}