'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

type PostAuthor = {
  username: string | null
  display_name: string | null
  avatar_url: string | null
  star_citizen_handle: string | null
  rsi_verified: boolean
  member_number: number | null
  profile_slug: string | null
}

type AdminCommunityPost = {
  id: string
  content: string
  created_at: string
  updated_at: string
  author_id: string
  visibility: string | null
  deleted_at: string | null
  profiles: PostAuthor | PostAuthor[] | null
}

function getAuthor(
  post: AdminCommunityPost,
): PostAuthor | null {
  if (!post.profiles) {
    return null
  }

  return Array.isArray(post.profiles)
    ? post.profiles[0] ?? null
    : post.profiles
}

function formatDate(value: string) {
  const date = new Date(value)

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CommunityAdminList({
  items,
  ownerUserId,
  adminUserIds = [],
  currentAdminIsOwner,
}: {
  items: AdminCommunityPost[]
  ownerUserId: string | null
  adminUserIds?: string[]
  currentAdminIsOwner: boolean
}) {
  const router = useRouter()

  const [deletingId, setDeletingId] =
    useState<string | null>(null)

  const adminUserIdSet =
    useMemo(
      () =>
        new Set(
          adminUserIds,
        ),
      [adminUserIds],
    )

  const handleDelete = async (
    post: AdminCommunityPost,
  ) => {
    const isOwnerPost =
      ownerUserId !== null &&
      post.author_id === ownerUserId

    if (
      isOwnerPost &&
      !currentAdminIsOwner
    ) {
      toast.error(
        '最高权限账号的动态不可删除',
      )
      return
    }

    const confirmed =
      window.confirm(
        `确定要删除这条社区动态吗？

${post.content.slice(0, 120)}

删除后会从社区隐藏，但数据库仍会保留记录。`,
      )

    if (!confirmed) {
      return
    }

    setDeletingId(post.id)

    try {
      const response =
        await fetch(
          '/api/admin/community/delete',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              id: post.id,
            }),
          },
        )

      const data =
        await response
          .json()
          .catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error ||
            '删除动态失败，请重试',
        )
      }

      toast.success(
        '动态已删除',
      )

      router.refresh()
    } catch (error) {
      console.error(
        '[v0] Community delete error:',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '删除动态失败，请重试',
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="corner-cut border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        暂无社区动态
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((post) => {
        const author =
          getAuthor(post)

        const displayName =
          author?.star_citizen_handle ||
          author?.display_name ||
          author?.username ||
          author?.profile_slug ||
          'StarClub 用户'

        const starClubId =
          author?.profile_slug &&
          author?.member_number !== null &&
          author?.member_number !== undefined
            ? `${author.profile_slug}#${String(
                author.member_number,
              ).padStart(4, '0')}`
            : null

        const isDeleting =
          deletingId === post.id

        const isOwnerPost =
          ownerUserId !== null &&
          post.author_id === ownerUserId

        const isAdminPost =
          !isOwnerPost &&
          adminUserIdSet.has(
            post.author_id,
          )

        /*
         * 只有 Owner 动态受到删除保护。
         *
         * Admin 动态不受此保护，
         * 因此 Admin 之间仍然可以互相删除动态。
         */
        const cannotDelete =
          isOwnerPost &&
          !currentAdminIsOwner

        return (
          <article
            key={post.id}
            className="corner-cut border border-border bg-card p-5"
          >
            <div className="flex gap-4">
              <div className="shrink-0">
                {author?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      author.avatar_url
                    }
                    alt={
                      displayName
                    }
                    className="size-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-11 rounded-full bg-muted" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">
                        {
                          displayName
                        }
                      </span>

                      {author?.rsi_verified &&
                        author?.star_citizen_handle && (
                          <span
                            title="RSI Handle 已认证"
                            className="inline-flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground"
                          >
                            ✓
                          </span>
                        )}

                      {isOwnerPost && (
                        <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
                          OWNER
                        </span>
                      )}

                      {isAdminPost && (
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-600">
                          ADMIN
                        </span>
                      )}

                      <span className="text-xs text-muted-foreground">
                        {formatDate(
                          post.created_at,
                        )}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {starClubId && (
                        <span>
                          @{starClubId}
                        </span>
                      )}

                      <span>
                        用户 ID:{' '}
                        {
                          post.author_id
                        }
                      </span>

                      <span>
                        {post.visibility ===
                        'public'
                          ? '公开动态'
                          : post.visibility ||
                            '未知权限'}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {author?.profile_slug && (
                      <Link
                        href={`/profile/${encodeURIComponent(
                          author.profile_slug,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        查看用户
                      </Link>
                    )}

                    {cannotDelete ? (
                      <div className="inline-flex h-8 items-center justify-center rounded-md border border-primary/30 bg-primary/5 px-3 text-xs font-medium text-primary">
                        最高权限账号 ·
                        不可删除
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          isDeleting
                        }
                        onClick={() =>
                          handleDelete(
                            post,
                          )
                        }
                        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting
                          ? '删除中...'
                          : '删除动态'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-md border border-border bg-background p-4">
                  <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-foreground">
                    {
                      post.content
                    }
                  </p>
                </div>

                <div className="mt-3 text-[11px] text-muted-foreground">
                  Post ID:{' '}
                  {post.id}
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}