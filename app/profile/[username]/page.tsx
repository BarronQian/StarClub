'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { formatTimezone } from '@/lib/timezones'
import {
  Bookmark,
  Check,
  CircleCheck,
  Clock3,
  FileText,
  Heart,
  ShieldCheck,
  Ship,
  TriangleAlert,
  UserPlus,
  Users,
} from 'lucide-react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { DISCORD_ROLE_IDENTITIES } from '@/lib/discord-identities'
import { ProfileGuestbook } from '@/components/profile-guestbook'
import {
  UserVerificationBadges,
} from '@/components/user-verification-badges'

type PublicProfile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  discord_id: string | null
  star_citizen_handle: string | null
  rsi_verified: boolean
  timezone: string | null
  bio: string | null
  cover_url: string | null
  member_number: number | null
  profile_slug: string | null
  banned_at: string | null
}

type ProfileVisitor = {
  id: string
  username: string | null
  profileSlug: string | null
  memberNumber: number | null
  displayName: string | null
  starCitizenHandle: string | null
  avatarUrl: string | null
  visitedAt: string
}

type ProfilePost = {
  id: string
  content: string
  created_at: string
  updated_at: string
  author_id: string
  like_count: number
  liked_by_me: boolean
}

export default function PublicProfilePage() {
  const params = useParams()

  const profileSlug = decodeURIComponent(
    String(params.username || '')
  )

  const [profile, setProfile] =
    useState<PublicProfile | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [notFound, setNotFound] =
    useState(false)

  const [visitors, setVisitors] =
    useState<ProfileVisitor[]>([])

  const [
    showAllVisitors,
    setShowAllVisitors,
  ] = useState(false)

  const VISITORS_PREVIEW_LIMIT = 10

  const [discordRoles, setDiscordRoles] =
    useState<string[]>([])

  const [
    discordMembership,
    setDiscordMembership,
  ] = useState<boolean | null>(null)

  const [
    discordVerified,
    setDiscordVerified,
  ] = useState(false)

  const [
    orgMembership,
    setOrgMembership,
  ] = useState<boolean | null>(null)

  const unlockedIdentities =
    DISCORD_ROLE_IDENTITIES.filter(
      (identity) =>
        discordRoles.includes(identity.id)
    )

  const starClubId =
    profile?.profile_slug &&
    profile?.member_number !== null &&
    profile?.member_number !== undefined
      ? `${profile.profile_slug}#${String(
          profile.member_number
        ).padStart(4, '0')}`
      : null
  
  const [
  followingCount,
  setFollowingCount,
] = useState(0)

const [
  followerCount,
  setFollowerCount,
] = useState(0)

  const [
    profilePosts,
    setProfilePosts,
  ] = useState<ProfilePost[]>([])

  const [
    profilePostsLoading,
    setProfilePostsLoading,
  ] = useState(true)

  const [
    showAllProfilePosts,
    setShowAllProfilePosts,
  ] = useState(false)

  const PROFILE_POSTS_PREVIEW_LIMIT = 10

  const [
  currentUserId,
  setCurrentUserId,
] = useState<string | null>(
  null,
)

const [
  following,
  setFollowing,
] = useState(false)

const [
  followLoading,
  setFollowLoading,
] = useState(false)

const [
  followStatusLoading,
  setFollowStatusLoading,
] = useState(true)

// 读取当前用户 + 公开关注统计 + 我的关注状态
useEffect(() => {
  if (!profile?.id) {
    return
  }

  const loadFollowStatus =
    async () => {
      try {
        setFollowStatusLoading(true)

        const supabase =
          getSupabaseBrowser()

        const {
          data: { session },
        } =
          await supabase.auth.getSession()

        const userId =
          session?.user?.id ?? null

        setCurrentUserId(userId)

        const headers:
          Record<string, string> = {}

        if (session?.access_token) {
          headers.Authorization =
            `Bearer ${session.access_token}`
        }

        const response =
          await fetch(
            `/api/community/follows?profileId=${encodeURIComponent(
              profile.id,
            )}`,
            {
              method: 'GET',
              headers,
              cache: 'no-store',
            },
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              '读取关注数据失败',
          )
        }

        // 公开统计数量
        setFollowingCount(
          typeof data.followingCount ===
            'number'
            ? data.followingCount
            : 0,
        )

        setFollowerCount(
          typeof data.followerCount ===
            'number'
            ? data.followerCount
            : 0,
        )

        // 只有登录并且正在看别人主页时，
        // 才需要显示“我是否关注了这个人”
        if (
          session?.access_token &&
          userId !== profile.id
        ) {
          setFollowing(
            data.following === true,
          )
        } else {
          setFollowing(false)
        }
      } catch (error) {
        console.error(
          'Failed to load follow status:',
          error,
        )

        setFollowing(false)
        setFollowingCount(0)
        setFollowerCount(0)
      } finally {
        setFollowStatusLoading(false)
      }
    }

  void loadFollowStatus()
}, [profile?.id])

const toggleFollow =
  async () => {
    if (
      !profile?.id ||
      followLoading
    ) {
      return
    }

    try {
      setFollowLoading(true)

      const supabase =
        getSupabaseBrowser()

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession()

      if (
        !session?.access_token
      ) {
        alert(
          '请先登录后再关注酒友',
        )
        return
      }

      if (
        session.user.id ===
        profile.id
      ) {
        return
      }

      const response =
        await fetch(
          following
            ? `/api/community/follows?profileId=${encodeURIComponent(
                profile.id,
              )}`
            : '/api/community/follows',
          {
            method:
              following
                ? 'DELETE'
                : 'POST',

            headers: {
              Authorization:
                `Bearer ${session.access_token}`,

              ...(following
                ? {}
                : {
                    'Content-Type':
                      'application/json',
                  }),
            },

            ...(following
              ? {}
              : {
                  body:
                    JSON.stringify({
                      profileId:
                        profile.id,
                    }),
                }),
          },
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            (following
              ? '取消关注失败'
              : '关注失败'),
        )
      }

      setFollowing(
        data.following === true,
      )
    } catch (error) {
      console.error(
        'Failed to toggle follow:',
        error,
      )

      alert(
        error instanceof Error
          ? error.message
          : '操作失败，请稍后重试',
      )
    } finally {
      setFollowLoading(false)
    }
  }

  // 读取公开个人资料
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase =
          getSupabaseBrowser()

        const { data, error } =
          await supabase
            .from('profiles')
            .select(`
              id,
              username,
              display_name,
              avatar_url,
              discord_id,
              star_citizen_handle,
              rsi_verified,
              timezone,
              bio,
              cover_url,
              member_number,
              profile_slug,
              banned_at
            `)
            .ilike(
              'profile_slug',
              profileSlug
            )
            .maybeSingle()

        if (error) {
          console.error(
            'Failed to load public profile:',
            error
          )

          setNotFound(true)
          return
        }

        if (!data) {
          setNotFound(true)
          return
        }

        setProfile(data)
      } catch (error) {
        console.error(
          'Failed to load public profile:',
          error
        )

        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    if (profileSlug) {
      loadProfile()
    } else {
      setLoading(false)
      setNotFound(true)
    }
  }, [profileSlug])

  // 读取最近访客
  useEffect(() => {
    if (!profileSlug) return

    const loadVisitors = async () => {
      try {
        const response = await fetch(
          `/api/profile/${encodeURIComponent(
            profileSlug
          )}/visitors`
        )

        if (!response.ok) {
          console.error(
            'Failed to load profile visitors'
          )
          return
        }

        const data =
          await response.json()

        setVisitors(
          Array.isArray(data.visitors)
            ? data.visitors
            : []
        )
      } catch (error) {
        console.error(
          'Failed to load profile visitors:',
          error
        )
      }
    }

    loadVisitors()
  }, [profileSlug])

  // 记录当前登录用户访问
  useEffect(() => {
    if (!profileSlug) return

    const recordVisit = async () => {
      try {
        const supabase =
          getSupabaseBrowser()

        const {
          data: { session },
        } =
          await supabase.auth.getSession()

        // 未登录游客不记录
        if (!session?.access_token) {
          return
        }

        const response = await fetch(
          `/api/profile/${encodeURIComponent(
            profileSlug
          )}/visit`,
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        )

        const data =
          await response.json()

        if (!response.ok) {
          if (response.status !== 401) {
            console.error(
              'Failed to record profile visit:',
              data
            )
          }

          return
        }

        // 自己访问自己不记录
        if (data.recorded !== true) {
          return
        }

        // 成功记录以后刷新访客列表
        const visitorsResponse =
          await fetch(
            `/api/profile/${encodeURIComponent(
              profileSlug
            )}/visitors`
          )

        if (!visitorsResponse.ok) {
          return
        }

        const visitorsData =
          await visitorsResponse.json()

        setVisitors(
          Array.isArray(
            visitorsData.visitors
          )
            ? visitorsData.visitors
            : []
        )
      } catch (error) {
        console.error(
          'Failed to record profile visit:',
          error
        )
      }
    }

    recordVisit()
  }, [profileSlug])

  // 一次读取 Discord Membership / Roles / ORG Membership
  useEffect(() => {
    if (!profileSlug) return

    const loadMembership = async () => {
      try {
        const response = await fetch(
          `/api/profile/${encodeURIComponent(
            profileSlug
          )}/membership`
        )

        if (!response.ok) {
          console.error(
            'Failed to load public membership'
          )

          setDiscordMembership(false)
          setDiscordVerified(false)
          setDiscordRoles([])
          setOrgMembership(false)

          return
        }

        const data =
          await response.json()

        setDiscordMembership(
          data.discordMembership === true
        )

        setDiscordVerified(
          data.discordVerified === true
        )

        setDiscordRoles(
          Array.isArray(data.roles)
            ? data.roles
            : []
        )

        setOrgMembership(
          data.orgMembership === true
        )
      } catch (error) {
        console.error(
          'Failed to load public membership:',
          error
        )

        setDiscordMembership(false)
        setDiscordVerified(false)
        setDiscordRoles([])
        setOrgMembership(false)
      }
    }

    loadMembership()
  }, [profileSlug])

  // 读取访客主页动态
  useEffect(() => {
  if (!profile?.id) {
    setProfilePosts([])
    setProfilePostsLoading(false)
    return
  }

  const loadProfilePosts =
    async () => {
      try {
        setProfilePostsLoading(true)

        const response =
          await fetch(
            `/api/community/posts?authorId=${encodeURIComponent(
              profile.id,
            )}`,
            {
              method: 'GET',
              cache: 'no-store',
            },
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              '读取公开动态失败',
          )
        }

        setProfilePosts(
          Array.isArray(data.posts)
            ? data.posts
            : [],
        )
      } catch (error) {
        console.error(
          'Failed to load public profile posts:',
          error,
        )

        setProfilePosts([])
      } finally {
        setProfilePostsLoading(false)
      }
    }

  void loadProfilePosts()
}, [profile?.id])

const totalLikes =
  profilePosts.reduce(
    (total, post) =>
      total +
      (post.like_count ?? 0),
    0,
  )

const stats = [
  {
    label: '动态',
    value: profilePosts.length,
    icon: FileText,
  },
  {
    label: '获赞',
    value: totalLikes,
    icon: Heart,
  },
{
  label: '关注',
  value: followingCount,
  icon: UserPlus,
},
{
  label: '粉丝',
  value: followerCount,
  icon: Users,
},
  {
    label: '收藏',
    value: 0,
    icon: Bookmark,
  },
  {
    label: '舰船',
    value: 0,
    icon: Ship,
  },
]

  // 所有 Hooks 必须位于 conditional return 之前
  if (loading) {
    return (
      <main className="mx-auto min-h-[70vh] w-full max-w-7xl px-5 pb-16 pt-24 lg:px-10 lg:pt-28">
        <p className="text-sm text-muted-foreground">
          正在加载个人主页...
        </p>
      </main>
    )
  }

  if (notFound || !profile) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-7xl flex-col items-center justify-center px-5">
        <h1 className="text-2xl font-semibold">
          找不到这个酒友
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          该用户不存在，或者个人主页暂时不可访问。
        </p>

        <Link
          href="/"
          className="mt-6 text-sm font-medium text-[#a66700]"
        >
          返回星际酒馆
        </Link>
      </main>
    )
  }

  const displayName =
    profile.star_citizen_handle ||
    profile.display_name ||
    profile.username ||
    profile.profile_slug ||
    'StarClub 用户'

  return (
    <main className="min-h-screen bg-[#f7f7f5] pb-24 transition-colors dark:bg-[#2b2825]">
      <div className="site-container pt-20 lg:pt-24">

        {/* Profile hero */}
        <section className="overflow-hidden rounded-3xl border border-border bg-white dark:bg-[#37332f] shadow-[0_10px_35px_rgba(0,0,0,0.05)]">

          {/* Banner */}
          <div className="relative h-44 overflow-hidden bg-[#ece8e1] lg:h-56">

          {currentUserId === profile.id && (
            <div className="absolute right-4 top-4 z-20 lg:right-5 lg:top-5">
              <Link
                href="/profile"
                 className="inline-flex items-center rounded-full border border-white/60 bg-white/90 px-4 py-2 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md dark:border-white/15 dark:bg-black/55 dark:text-white dark:hover:bg-black/70"
              >
                ← 返回个人主页
              </Link>
            </div>
          )}

            {profile.cover_url ? (
              <img
                src={profile.cover_url}
                alt={`${displayName} 封面`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-linear-to-r from-[#f4eee5] via-[#ebe5db] to-[#ded7ca]" />
            )}

            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/10 to-transparent" />
          </div>

          {/* Main profile */}
          <div className="relative px-6 pb-7 lg:px-9 lg:pb-9">
            <div className="flex min-w-0 gap-5 lg:gap-7">

              {/* Avatar */}
              <div className="-mt-14 shrink-0 lg:-mt-16">
                <div className="size-28 overflow-hidden rounded-3xl border-[5px] border-white bg-muted shadow-lg lg:size-32">
                  <img
                    src={
                      profile.avatar_url ||
                      '/placeholder-user.jpg'
                    }
                    alt={`${displayName} 头像`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Information */}
              <div className="min-w-0 flex-1 pt-5 lg:pt-6">

              {/* Name */}
              <div className="flex min-w-0 items-start justify-between gap-4">

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">

                    <h1 className="truncate pb-1 text-3xl font-semibold leading-[1.2] tracking-tight">
                      {displayName}
                    </h1>

                    {starClubId && (
                      <span className="mb-1 text-sm text-muted-foreground">
                        @{starClubId}
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  <p className="mt-2.5 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {profile.bio ||
                      '这个酒友还没有填写个人简介。'}
                  </p>

                      {profile.banned_at && (
                        <div className="mt-4 flex max-w-3xl items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                          <TriangleAlert
                            className="mt-0.5 size-4 shrink-0"
                            strokeWidth={1.8}
                          />

                          <div>
                            <p className="text-sm font-medium">
                              此用户已被全站封禁
                            </p>

                            <p className="mt-1 text-xs leading-5 text-red-600">
                              因违反社区条例，此用户已被全站封禁。
                            </p>
                          </div>
                        </div>
                      )}

                    </div>

                      {currentUserId !== profile.id && (
                        <button
                          type="button"
                          disabled={
                            followLoading ||
                            followStatusLoading
                          }
                          onClick={() => {
                            void toggleFollow()
                          }}
                          className={`mt-0.5 inline-flex h-10 shrink-0 items-center justify-center rounded-full px-5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                            following
                              ? 'border border-border bg-white text-foreground hover:bg-muted'
                              : 'bg-[#a66700] text-white hover:bg-[#8f5900]'
                          }`}
                        >
                          {followLoading
                            ? '处理中...'
                            : following
                              ? '✓ 已关注'
                              : '+ 关注'}
                        </button>
                      )}                      
                </div>

                {/* Trust / identity status */}
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <UserVerificationBadges
                    rsiVerified={
                      profile.rsi_verified === true
                    }
                    handle={
                      profile.star_citizen_handle
                    }
                    discordVerified={
                      discordVerified
                    }
                    orgVerified={
                      orgMembership === true
                    }
                    size="md"
                    showLabels
                  />
                </div>

                {/* Timezone */}
                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3
                      className="size-3.5"
                      strokeWidth={1.6}
                    />

                    {formatTimezone(profile.timezone)}
                  </span>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-white dark:bg-[#37332f] shadow-[0_8px_24px_rgba(0,0,0,0.03)] sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat) => {
            const Icon = stat.icon

            return (
              <div
                key={stat.label}
                className="flex items-center gap-3 border-b border-r border-border px-5 py-5 last:border-r-0 sm:last:border-b-0 lg:border-b-0"
              >
                <div className="flex size-8 shrink-0 items-center justify-center">
                  <Icon
                    className="size-4 text-[#a66700]"
                    strokeWidth={1.6}
                  />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    {stat.label}
                  </p>

                  <p className="mt-0.5 text-xl font-medium">
                    {stat.value}
                  </p>
                </div>
              </div>
            )
          })}
        </section>

        {/* Lower content */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">

          {/* Main column */}
          <div className="flex flex-col gap-6">

            <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:border-white/8 dark:bg-[#37332f] dark:shadow-none">
              <div className="flex items-center border-b border-border px-6">
                <div className="border-b-2 border-primary py-5 text-sm text-foreground">
                  动态
                </div>
              </div>

                {profilePostsLoading ? (
                  <div className="flex min-h-96 items-center justify-center px-6 py-16">
                    <p className="text-sm text-muted-foreground">
                      正在加载动态...
                    </p>
                  </div>
                ) : profilePosts.length > 0 ? (
                  <div className="divide-y divide-border">
                    {profilePosts
                      .slice(
                        0,
                        showAllProfilePosts
                          ? profilePosts.length
                          : PROFILE_POSTS_PREVIEW_LIMIT,
                      )
                      .map(
                        (post) => (
                          <Link
                            key={post.id}
                              href={`/community?postId=${encodeURIComponent(
                                post.id,
                              )}`}
                            className="block px-6 py-6 transition-colors hover:bg-muted/30"
                          >
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-muted-foreground">
                              发布了动态
                            </span>

                            <span className="text-xs text-muted-foreground">
                              {new Date(
                                post.created_at,
                              ).toLocaleString(
                                'zh-CN',
                                {
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                            </span>
                          </div>

                          <p className="mt-3 whitespace-pre-wrap wrap-break-word text-[15px] leading-7 text-foreground/85">
                            {post.content}
                          </p>

                          <div className="mt-4 text-xs text-muted-foreground">
                            ♥ {post.like_count ?? 0}
                          </div>
                        </Link>
                      ),
                    )}

                    {profilePosts.length >
                      PROFILE_POSTS_PREVIEW_LIMIT && (
                      <div className="flex justify-center border-t border-border px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setShowAllProfilePosts(
                              (current) =>
                                !current,
                            )
                          }
                          className="text-sm font-medium text-[#a66700] transition-colors hover:text-[#8f5900]"
                        >
                          {showAllProfilePosts
                            ? '收起'
                            : `查看更多动态（${profilePosts.length - PROFILE_POSTS_PREVIEW_LIMIT}）`}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex min-h-96 items-center justify-center px-6 py-16">
                    <div className="text-center">
                      <p className="text-base font-medium">
                        还没有动态
                      </p>

                      <p className="mt-2 text-sm text-muted-foreground">
                        这个酒友暂时还没有公开动态。
                      </p>
                    </div>
                  </div>
                )}
            </section>

            {profile.profile_slug && (
              <ProfileGuestbook
                profileSlug={
                  profile.profile_slug
                }
              />
            )}
          </div>

          {/* Right column */}
          <aside className="flex flex-col gap-5">

            {/* Identities */}
            <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:border-white/8 dark:bg-[#37332f] dark:shadow-none">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">
                  酒馆身份
                </h2>

                {unlockedIdentities.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {unlockedIdentities.length}
                  </span>
                )}
              </div>

              {unlockedIdentities.length > 0 ? (
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {unlockedIdentities.map(
                    (identity) => (
                      <div
                        key={identity.id}
                        className="group flex min-w-0 flex-col items-center text-center"
                        title={`${identity.name}：${identity.description}`}
                      >
                        <div className="flex h-16 w-full items-center justify-center">
                          <img
                            src={identity.logo}
                            alt={identity.name}
                            className="
                              max-h-14 max-w-14 object-contain
                              drop-shadow-[0_2px_2px_rgba(0,0,0,0.20)]
                              transition-all duration-200
                              group-hover:-translate-y-1
                              group-hover:scale-105
                              group-hover:drop-shadow-[0_5px_5px_rgba(0,0,0,0.24)]
                            "
                          />
                        </div>

                        <p className="mt-1 max-w-23 text-[11px] font-medium leading-[1.3] text-foreground">
                          {identity.name}
                        </p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="mt-5 flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border">
                  <p className="text-xs text-muted-foreground">
                    暂无酒馆特殊身份
                  </p>
                </div>
              )}
            </section>

            {/* Visitors */}
            <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:border-white/8 dark:bg-[#37332f] dark:shadow-none">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">
                  最近访客
                </h2>

                <span className="text-xs text-muted-foreground">
                  {visitors.length}
                </span>
              </div>

              {visitors.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {visitors
                    .slice(
                      0,
                      showAllVisitors
                        ? visitors.length
                        : VISITORS_PREVIEW_LIMIT,
                    )
                    .map(
                      (visitor) => {
                      const visitorId =
                        visitor.profileSlug &&
                        visitor.memberNumber !==
                          null &&
                        visitor.memberNumber !==
                          undefined
                          ? `${visitor.profileSlug}#${String(
                              visitor.memberNumber
                            ).padStart(
                              4,
                              '0'
                            )}`
                          : null

                      const visitorName =
                        visitor.starCitizenHandle ||
                        visitor.displayName ||
                        visitor.username ||
                        visitor.profileSlug ||
                        'StarClub 用户'

                      return (
                        <Link
                          key={visitor.id}
                          href={
                            visitor.profileSlug
                              ? `/profile/${encodeURIComponent(
                                  visitor.profileSlug
                                )}`
                              : '#'
                          }
                          className="group flex items-center gap-3"
                        >
                          {visitor.avatarUrl ? (
                            <img
                              src={
                                visitor.avatarUrl
                              }
                              alt={visitorName}
                              className="size-9 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="size-9 shrink-0 rounded-full bg-neutral-100 dark:bg-white/10" />
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium transition-colors group-hover:text-[#a66700]">
                              {visitorName}
                            </p>

                            {visitorId && (
                              <p className="truncate text-[11px] text-muted-foreground">
                                @{visitorId}
                              </p>
                            )}
                          </div>

                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {new Date(
                              visitor.visitedAt
                            ).toLocaleDateString(
                              'zh-CN',
                              {
                                month: 'numeric',
                                day: 'numeric',
                              }
                            )}
                          </span>
                        </Link>
                      )
                    }
                  )}
                                    {visitors.length >
                    VISITORS_PREVIEW_LIMIT && (
                    <div className="flex justify-center border-t border-border pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          setShowAllVisitors(
                            (current) =>
                              !current,
                          )
                        }
                        className="text-xs font-medium text-[#a66700] transition-colors hover:text-[#8f5900]"
                      >
                        {showAllVisitors
                          ? '收起'
                          : `查看更多（${visitors.length - VISITORS_PREVIEW_LIMIT}）`}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-5 flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border">
                  <p className="text-xs text-muted-foreground">
                    暂无访客记录
                  </p>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}