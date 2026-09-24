'use client'

import {
  AdminHeader,
} from '@/components/admin/admin-header'

import type {
  ArchiveDbCategory,
} from '@/lib/archive-db'

export function ArchiveAdmin({
  initialCategories,
  adminEmail,
}: {
  initialCategories:
    ArchiveDbCategory[]

  adminEmail: string
}) {
  return (
    <div className="min-h-svh bg-background">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-10 pt-20">
        <AdminHeader
          adminEmail={
            adminEmail
          }
          active="archive"
        />

        <section>
          <div className="mb-4">
            <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
              合影管理
            </h2>

            <p className="mt-2 text-xs text-muted-foreground">
              管理合影分类、相册、期数与照片
            </p>
          </div>

          <div className="corner-cut border border-border bg-card p-6">
            <p className="text-sm text-foreground">
              Archive 后台连接成功
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              当前数据库分类：
              {' '}
              {
                initialCategories.length
              }
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}