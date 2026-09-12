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
import { CommunityAdminList } from '@/components/admin/community-admin-list'

export const metadata: Metadata = {
  title: '社区管理 | 星际酒馆 StarClub',
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = 'force-dynamic'

export default async function AdminCommunityPage() {
  const session =
    await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  const supabase =
    createAdminClient()

  const {
    data: posts,
    error,
  } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      updated_at,
      author_id,
      visibility,
      deleted_at,
      profiles!posts_author_id_fkey (
        username,
        display_name,
        avatar_url,
        star_citizen_handle,
        rsi_verified,
        member_number,
        profile_slug
      )
    `)
    .is(
      'deleted_at',
      null,
    )
    .order(
      'created_at',
      {
        ascending: false,
      },
    )
    .limit(100)

  if (error) {
    console.error(
      '[v0] Admin community load error:',
      error,
    )
  }

  const items =
    posts ?? []

  /*
   * 找出社区 Owner。
   */
  const ownerPost =
    items.find((post) =>
      isOwnerUserId(
        post.author_id,
      ),
    )

  const ownerUserId =
    ownerPost?.author_id ??
    process.env
      .STARCLUB_OWNER_USER_ID
      ?.trim() ??
    null

  /*
   * 收集当前动态作者里属于管理组的 UUID。
   *
   * Owner 单独显示 OWNER，
   * 所以这里会排除 Owner。
   */
  const adminUserIds =
    Array.from(
      new Set(
        items
          .map(
            (post) =>
              post.author_id,
          )
          .filter(
            (userId) =>
              !isOwnerUserId(
                userId,
              ) &&
              isAdminUserId(
                userId,
              ),
          ),
      ),
    )

  /*
   * 当前登录后台的人是否为最高权限 Owner。
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
        active="community"
      />

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
              社区动态
            </h2>

            <p className="mt-2 text-xs text-muted-foreground">
              查看并处理 StarClub 社区中的违规动态。
            </p>
          </div>

          <span className="text-xs text-muted-foreground">
            当前动态{' '}
            {items.length} 条
          </span>
        </div>

        <CommunityAdminList
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