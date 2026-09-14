import Link from 'next/link'

import {
  AdminGuideForm,
} from '@/components/admin-guide-form'

export default function NewGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="site-container max-w-5xl py-10 lg:py-14">
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
    </div>
  )
}