import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import {
  getAdminSession,
  isOwnerEmail,
  isOwnerUserId,
  isAdminUserId,
} from '@/lib/admin-auth'

import { createAdminClient } from '@/lib/supabase-admin'

import { AdminHeader } from '@/components/admin/admin-header'
import { UserAdminList } from '@/components/admin/user-admin-list'

export const metadata: Metadata = {
  title: '用户管理 | 星际酒馆 StarClub',
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  const supabase =
    createAdminClient()

  const {
    data: profiles,
    error,
  } = await supabase
    .from('profiles')
    .select(`
      id,
      discord_id,
      username,
      display_name,
      avatar_url,
      star_citizen_handle,
      rsi_verified,
      member_number,
      profile_slug,
      created_at,
      muted_until,
      banned_at,
      moderation_reason,
      moderated_by
    `)
    .order('created_at', {
      ascending: false,
    })
    .limit(500)

  if (error) {
    console.error(
      '[v0] Admin users load error:',
      error,
    )
  }

  const items =
    profiles ?? []

  /*
   * 社区 Owner：
   * 直接使用 STARCLUB_OWNER_USER_ID 判断，
   * 不再通过后台登录邮箱寻找 Auth UUID。
   */
  const ownerProfile =
    items.find((profile) =>
      isOwnerUserId(profile.id),
    )

  const ownerUserId =
    ownerProfile?.id ?? null

  /*
   * 社区管理组：
   * Owner 会自动包含在 isAdminUserId() 中。
   *
   * 以后 STARCLUB_ADMIN_USER_IDS
   * 添加其他管理的社区 UUID 后，
   * 这里会自动识别。
   */
  const adminUserIds =
    items
      .filter((profile) =>
        isAdminUserId(profile.id),
      )
      .map((profile) =>
        profile.id,
      )

  /*
   * 当前登录后台的人是否为最高权限 Admin。
   * 这里仍然按 STARCLUB_OWNER_EMAIL 判断。
   */
  const currentAdminIsOwner =
    isOwnerEmail(
      session.email,
    )

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-10 pt-20">
      <AdminHeader
        adminEmail={
          session.email
        }
        active="users"
      />

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
              用户管理
            </h2>

            <p className="mt-2 text-xs text-muted-foreground">
              搜索用户并管理社区禁言与封禁状态。
            </p>
          </div>

          <span className="text-xs text-muted-foreground">
            当前用户{' '}
            {items.length} 人
          </span>
        </div>

        <UserAdminList
          items={items}
          ownerUserId={
            ownerUserId
          }
          adminUserIds={
            adminUserIds
          }
          currentAdminIsOwner={
            currentAdminIsOwner
          }
        />
      </section>
    </main>
  )
}