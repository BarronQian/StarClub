'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { AdminLogoutButton } from '@/components/admin/admin-logout-button'

type AdminSection =
  | 'gallery'
  | 'news'
  | 'community'
  | 'users'
  | 'market'
  | 'events'
  | 'executive-hangar'

export function AdminHeader({
  adminEmail,
  active,
}: {
  adminEmail: string
  active: AdminSection
}) {
  const router = useRouter()

  const go = (
    path: string,
  ) => {
    router.push(path)
  }

  return (
    <section className="border-b border-border pb-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="font-display text-[0.62rem] tracking-[0.4em] text-primary">
            STARCLUB / ADMIN
          </span>

          <h1 className="mt-1 font-display text-2xl tracking-tight text-foreground">
            后台管理
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {adminEmail}
          </span>

          <AdminLogoutButton />
        </div>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2">
        <Button
          variant={
            active === 'gallery'
              ? 'default'
              : 'outline'
          }
          size="sm"
          onClick={() =>
            go('/admin/gallery')
          }
        >
          影廊管理
        </Button>

        <Button
          variant={
            active === 'news'
              ? 'default'
              : 'outline'
          }
          size="sm"
          onClick={() =>
            go('/admin/news')
          }
        >
          最新资讯
        </Button>

        <Button
          variant={
            active === 'community'
              ? 'default'
              : 'outline'
          }
          size="sm"
          onClick={() =>
            go('/admin/community')
          }
        >
          社区管理
        </Button>

        <Button
          variant={
            active === 'users'
              ? 'default'
              : 'outline'
          }
          size="sm"
          onClick={() =>
            go('/admin/users')
          }
        >
          用户管理
        </Button>

        <Button
          variant={
            active === 'market'
              ? 'default'
              : 'outline'
          }
          size="sm"
          onClick={() =>
            go('/admin/market')
          }
        >
          市场管理
        </Button>

        <Button
          variant={
            active === 'events'
              ? 'default'
              : 'outline'
          }
          size="sm"
          onClick={() =>
            go('/admin/events')
          }
        >
          活动管理
        </Button>

        <Button
          variant={
            active === 'executive-hangar'
              ? 'default'
              : 'outline'
          }
          size="sm"
          onClick={() =>
            go('/admin/executive-hangar')
          }
        >
          行政机库
        </Button>

      </nav>
    </section>
  )
}