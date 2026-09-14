'use client'

import Link from 'next/link'

import {
  Heart,
  MessageCircle,
} from 'lucide-react'

import {
  CommunityPostMenu,
} from '@/components/community-post-menu'

type PostAuthor = {
  username: string | null
  display_name: string | null
  avatar_url: string | null
  star_citizen_handle: string | null
  rsi_verified: boolean
  member_number: number | null
  profile_slug: string | null
}

type CommunityPost = {
  id: string
  content: string
  created_at: string
  updated_at: string
  author_id: string
  profiles:
    | PostAuthor
    | PostAuthor[]
    | null
  like_count: number
  comment_count: number
  liked_by_me: boolean
}

function getPostAuthor(
  post: CommunityPost,
): PostAuthor | null {
  if (!post.profiles) {
    return null
  }

  return Array.isArray(
    post.profiles,
  )
    ? post.profiles[0] ??
        null
    : post.profiles
}

function formatPostTime(
  value: string,
) {
  const date =
    new Date(value)

  return date.toLocaleString(
    'zh-CN',
    {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

export function CommunityPostCard({
  post,
  currentUserId,
  onDelete,
  onEdit,
  onToggleLike,
  onOpenComments,
}: {
  post: CommunityPost
  currentUserId: string | null
  onDelete: (
    post: CommunityPost,
  ) => void
  onEdit: (
    post: CommunityPost,
  ) => void
  onToggleLike: (
    postId: string,
  ) => void
  onOpenComments: (
    post: CommunityPost,
  ) => void
}) {
  const author =
    getPostAuthor(post)

  const displayName =
    author
      ?.star_citizen_handle ||
    author
      ?.display_name ||
    author
      ?.username ||
    author
      ?.profile_slug ||
    'StarClub 用户'

  const starClubId =
    author
      ?.profile_slug &&
    author
      ?.member_number !==
      null &&
    author
      ?.member_number !==
      undefined
      ? `${author.profile_slug}#${String(
          author.member_number,
        ).padStart(
          4,
          '0',
        )}`
      : null

  const isOwner =
    currentUserId ===
    post.author_id

  return (
    <article className="rounded-2xl border border-border bg-white p-5 shadow-[0_6px_20px_rgba(0,0,0,0.025)]">
      <div className="flex gap-3">

        {author?.profile_slug ? (
          <Link
            href={`/profile/${encodeURIComponent(
              author.profile_slug,
            )}`}
            className="shrink-0"
          >
            {author.avatar_url ? (
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
              <div className="size-11 rounded-full bg-neutral-100" />
            )}
          </Link>
        ) : (
          <div className="size-11 shrink-0 rounded-full bg-neutral-100" />
        )}

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">

                {author
                  ?.profile_slug ? (
                  <Link
                    href={`/profile/${encodeURIComponent(
                      author.profile_slug,
                    )}`}
                    className="truncate text-sm font-semibold hover:underline"
                  >
                    {displayName}
                  </Link>
                ) : (
                  <span className="truncate text-sm font-semibold">
                    {displayName}
                  </span>
                )}

                {author
                  ?.rsi_verified &&
                  author
                    ?.star_citizen_handle && (
                    <span
                      title="RSI Handle 已认证"
                      className="inline-flex size-4 items-center justify-center rounded-full bg-[#b87300] text-[9px] font-bold text-white"
                    >
                      ✓
                    </span>
                  )}

                <span className="text-xs text-muted-foreground">
                  {formatPostTime(
                    post.created_at,
                  )}
                </span>

              </div>

              {starClubId && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  @{starClubId}
                </p>
              )}

            </div>

            <CommunityPostMenu
              createdAt={
                post.created_at
              }
              isOwner={
                isOwner
              }
              onEdit={() => {
                onEdit(post)
              }}
              onDelete={() => {
                onDelete(post)
              }}
            />

          </div>

          <p className="mt-4 whitespace-pre-wrap wrap-break-word text-[15px] leading-7 text-neutral-800">
            {post.content}
          </p>

          <div className="mt-5 flex items-center gap-6 border-t border-border pt-4">

            <button
              type="button"
              onClick={() =>
                onToggleLike(
                  post.id,
                )
              }
              className={
                post.liked_by_me
                  ? 'inline-flex items-center gap-1.5 text-xs text-red-500 transition-colors'
                  : 'inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-red-500'
              }
            >
              <Heart
                className={
                  post.liked_by_me
                    ? 'size-4 fill-red-500 text-red-500'
                    : 'size-4'
                }
                strokeWidth={
                  1.6
                }
              />

              {post.like_count ??
                0}
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenComments(
                  post,
                )
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-[#a66700]"
            >
              <MessageCircle
                className="size-4"
                strokeWidth={
                  1.6
                }
              />

              {post.comment_count ??
                0}
            </button>

          </div>

        </div>
      </div>
    </article>
  )
}