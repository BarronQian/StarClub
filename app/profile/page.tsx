'use client'

import { DISCORD_ROLE_IDENTITIES } from '@/lib/discord-identities'
import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { formatTimezone } from '@/lib/timezones'
import {
  Bookmark,
  Check,
  CircleCheck,
  FileText,
  Heart,
  Pencil,
  ShieldCheck,
  Ship,
  UserPlus,
  Users,
  Clock3,
} from 'lucide-react'

import { ProfileGuestbook } from '@/components/profile-guestbook'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import {
  UserVerificationBadges,
} from '@/components/user-verification-badges'

type Profile = {
  id: string
  discord_id: string | null
  username: string | null
  display_name: string | null
  avatar_url: string | null
  star_citizen_handle: string | null

  rsi_verified: boolean
  rsi_verified_at: string | null
  rsi_verification_code: string | null
  rsi_verification_expires_at: string | null
  rsi_verification_handle: string | null

  timezone: string | null
  bio: string | null
  cover_url: string | null
  cover_updated_at: string | null

  member_number: number | null
  profile_slug: string | null
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

export default function ProfilePage() {
  const router = useRouter()

  const [user, setUser] =
    useState<User | null>(null)

  const [
      accessToken,
      setAccessToken,
    ] = useState<string | null>(null)

  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [rsiBinding, setRsiBinding] =
    useState(false)

  const [rsiHandleInput, setRsiHandleInput] =
    useState('')

  const [
    rsiVerificationCode,
    setRsiVerificationCode,
  ] = useState('')

  const [
    rsiVerificationExpiresAt,
    setRsiVerificationExpiresAt,
  ] = useState('')

  const [rsiVerifying, setRsiVerifying] =
    useState(false)

  const [rsiStarting, setRsiStarting] =
    useState(false)

  const [
    rsiVerificationError,
    setRsiVerificationError,
  ] = useState('')

  const [rsiTimeLeft, setRsiTimeLeft] =
    useState(0)

  const [
    discordMembership,
    setDiscordMembership,
  ] = useState<boolean | null>(null)

  const [
    orgMembership,
    setOrgMembership,
  ] = useState<boolean | null>(null)

  const [
    discordVerified,
    setDiscordVerified,
  ] = useState(false)

  const [discordRoles, setDiscordRoles] =
    useState<string[]>([])

  const [visitors, setVisitors] =
    useState<ProfileVisitor[]>([])

  const [
    showAllVisitors,
    setShowAllVisitors,
  ] = useState(false)

  const VISITORS_PREVIEW_LIMIT = 10
  const [
    coverUploading,
    setCoverUploading,
  ] = useState(false)

  const [
    coverRulesOpen,
    setCoverRulesOpen,
  ] = useState(false)

  const coverInputRef =
    useRef<HTMLInputElement | null>(
      null
    )

  const [
    coverCropOpen,
    setCoverCropOpen,
  ] = useState(false)

  const [
    coverCropUrl,
    setCoverCropUrl,
  ] = useState('')

  const [
    coverSelectedFile,
    setCoverSelectedFile,
  ] = useState<File | null>(
    null
  )

  const [
    coverCropPosition,
    setCoverCropPosition,
  ] = useState({
    x: 50,
    y: 50,
  })

  const [
    coverCropZoom,
    setCoverCropZoom,
  ] = useState(1)

  const [
    coverDragging,
    setCoverDragging,
  ] = useState(false)

  const [
    coverDragStart,
    setCoverDragStart,
  ] = useState({
    x: 0,
    y: 0,
  })

  const [
    coverPositionStart,
    setCoverPositionStart,
  ] = useState({
    x: 50,
    y: 50,
  })

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
    followingCount,
    setFollowingCount,
  ] = useState(0)

  const [
    followerCount,
    setFollowerCount,
  ] = useState(0)

  useEffect(() => {
  if (!user?.id) {
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
              user.id,
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
              '读取个人动态失败',
          )
        }

        setProfilePosts(
          Array.isArray(data.posts)
            ? data.posts
            : [],
        )
      } catch (error) {
        console.error(
          'Failed to load profile posts:',
          error,
        )

        setProfilePosts([])
      } finally {
        setProfilePostsLoading(false)
      }
    }

  void loadProfilePosts()
}, [user?.id])

  useEffect(() => {
  if (!user?.id || !accessToken) {
    return
  }

  const loadFollowCounts = async () => {
    try {
      const response = await fetch(
        `/api/community/follows?profileId=${encodeURIComponent(
          user.id,
        )}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || '读取关注数据失败',
        )
      }

      setFollowingCount(
        typeof data.followingCount === 'number'
          ? data.followingCount
          : 0,
      )

      setFollowerCount(
        typeof data.followerCount === 'number'
          ? data.followerCount
          : 0,
      )
    } catch (error) {
      console.error(
        'Failed to load follow counts:',
        error,
      )

      setFollowingCount(0)
      setFollowerCount(0)
    }
  }

  void loadFollowCounts()
}, [user?.id, accessToken])

  useEffect(() => {
    const supabase =
      getSupabaseBrowser()

    const loadSession = async () => {
      const {
        data: { session },
      } =
        await supabase.auth.getSession()

      const currentUser =
          session?.user ?? null

        setUser(currentUser)

        setAccessToken(
          session?.access_token ?? null
        )

      if (currentUser) {
        const {
          data: profileData,
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
            rsi_verified_at,
            rsi_verification_handle,
            rsi_verification_code,
            rsi_verification_expires_at,
            timezone,
            bio,
            cover_url,
            cover_updated_at,
            member_number,
            profile_slug
          `)
          .eq(
            'id',
            currentUser.id
          )
          .maybeSingle()

        if (error) {
          console.error(
            'Failed to load profile:',
            error
          )
        } else {
          setProfile(profileData)
        }
      }

      setLoading(false)
    }

    loadSession()
  }, [])

  useEffect(() => {
    const supabase =
      getSupabaseBrowser()

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (
            event === 'SIGNED_OUT' ||
            !session
          ) {
            setUser(null)
            setAccessToken(null)
            setProfile(null)

            router.replace('/')
            router.refresh()
            return
          }

          setUser(
            session.user
          )

          setAccessToken(
            session.access_token
          )
        }
      )

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (
      !rsiVerificationExpiresAt
    ) {
      setRsiTimeLeft(0)
      return
    }

    const updateTimeLeft = () => {
      const expiresAt =
        new Date(
          rsiVerificationExpiresAt
        ).getTime()

      const remaining =
        Math.max(
          0,
          Math.floor(
            (
              expiresAt -
              Date.now()
            ) / 1000
          )
        )

      setRsiTimeLeft(remaining)
    }

    updateTimeLeft()

    const timer =
      window.setInterval(
        updateTimeLeft,
        1000
      )

    return () => {
      window.clearInterval(timer)
    }
  }, [rsiVerificationExpiresAt])

useEffect(() => {
  if (
    !profile?.rsi_verification_handle ||
    !profile?.rsi_verification_code ||
    !profile?.rsi_verification_expires_at ||
    !accessToken
  ) {
    return
  }

  const expiresAt =
    new Date(
      profile.rsi_verification_expires_at
    ).getTime()

  if (expiresAt <= Date.now()) {
    const cleanupExpiredVerification =
      async () => {
        try {
          const response =
            await fetch(
              '/api/rsi/verification/cancel',
              {
                method: 'POST',
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              }
            )

          if (!response.ok) {
            console.error(
              'Failed to cleanup expired RSI verification'
            )
            return
          }

          setProfile(
            (current) =>
              current
                ? {
                    ...current,
                    rsi_verification_handle:
                      null,
                    rsi_verification_code:
                      null,
                    rsi_verification_expires_at:
                      null,
                  }
                : current
          )

          setRsiVerificationCode('')
          setRsiVerificationExpiresAt('')
          setRsiTimeLeft(0)
        } catch (error) {
          console.error(
            'Expired RSI verification cleanup error:',
            error
          )
        }
      }

    cleanupExpiredVerification()
    return
  }

  setRsiHandleInput(
    profile.rsi_verification_handle
  )

  setRsiVerificationCode(
    profile.rsi_verification_code
  )

  setRsiVerificationExpiresAt(
    profile.rsi_verification_expires_at
  )
}, [profile, accessToken])

  useEffect(() => {
    if (
      !user ||
      !accessToken
    ) {
      setDiscordVerified(false)
      return
    }

    const checkDiscordMembership =
      async () => {
        try {
          const response =
            await fetch(
              '/api/discord/membership',
              {
                method: 'GET',
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              }
            )

          const data =
            await response.json()

          if (!response.ok) {
            console.error(
              'Discord membership API error:',
              data
            )

            setDiscordVerified(false)
            return
          }

          setDiscordVerified(
            data.isMember === true &&
            data.isVerified === true
          )
        } catch (error) {
          console.error(
            'Discord membership check failed:',
            error
          )

          setDiscordVerified(false)
        }
      }

    checkDiscordMembership()
  }, [user, accessToken])

useEffect(() => {
  if (
    !user ||
    !accessToken
  ) {
    return
  }

  const checkOrgMembership =
    async () => {
      try {
        const response =
          await fetch(
            '/api/rsi/org-membership',
            {
              method: 'GET',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          console.error(
            'RSI org membership API error:',
            data
          )

          setOrgMembership(false)
          return
        }

        setOrgMembership(
          data.isMember === true
        )
      } catch (error) {
        console.error(
          'RSI org membership check failed:',
          error
        )

        setOrgMembership(false)
      }
    }

  checkOrgMembership()
}, [user, accessToken])

  useEffect(() => {
    const profileSlug =
      profile?.profile_slug

    if (!profileSlug) return

    const loadVisitors =
      async () => {
        try {
          const response =
            await fetch(
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
            Array.isArray(
              data.visitors
            )
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
  }, [profile?.profile_slug])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="site-container py-24">
          <div className="h-128 animate-pulse rounded-3xl bg-muted" />
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <div className="site-container flex min-h-[70vh] items-center justify-center py-24">
          <div className="text-center">
            <p className="font-display text-sm tracking-[0.2em] text-primary">
              STARCLUB ACCOUNT
            </p>

            <h1 className="mt-4 text-3xl font-medium">
              请先登录
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              登录 StarClub
              后才能查看个人主页。
            </p>
          </div>
        </div>
      </main>
    )
  }

  const avatar =
    profile?.avatar_url ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    '/placeholder-user.jpg'

  const username =
    profile?.star_citizen_handle ||
    profile?.display_name ||
    profile?.username ||
    user.user_metadata
      ?.preferred_username ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'StarClub User'

  const totalLikes =
    profilePosts.reduce(
      (total, post) =>
        total + (post.like_count ?? 0),
      0,
    )
  const visibleVisitors =
  showAllVisitors
    ? visitors
    : visitors.slice(
        0,
        VISITORS_PREVIEW_LIMIT,
      )

  const visibleProfilePosts =
  showAllProfilePosts
    ? profilePosts
    : profilePosts.slice(
        0,
        PROFILE_POSTS_PREVIEW_LIMIT,
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

  const handleStartRsiVerification =
    async () => {
      if (rsiStarting) return

      const handle =
        rsiHandleInput.trim()

      if (!handle) {
        alert(
          '请输入你的 Star Citizen Handle'
        )
        return
      }

      setRsiStarting(true)

      try {
        const supabase =
          getSupabaseBrowser()

        const {
          data: { session },
        } =
          await supabase.auth.getSession()

        if (
          !session?.access_token
        ) {
          alert(
            '登录状态已失效，请重新登录。'
          )
          return
        }

        const response =
          await fetch(
            '/api/rsi/verification/start',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
                Authorization:
                  `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                handle,
              }),
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              '无法创建 RSI 验证请求'
          )
        }

        setRsiVerificationCode(
          data.verificationCode
        )

        setRsiVerificationExpiresAt(
          data.expiresAt
        )

        setRsiVerificationError('')
      } catch (error) {
        console.error(
          'RSI verification start error:',
          error
        )

        alert(
          error instanceof Error
            ? error.message
            : '无法创建 RSI 验证请求'
        )
      } finally {
        setRsiStarting(false)
      }
    }
  
  const handleCoverFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0]

    event.target.value = ''

    if (!file) return

    const requirements =
      '图片不符合封面要求。\n\n' +
      '封面图片要求：\n' +
      '• 支持 JPG、JPEG、PNG\n' +
      '• 文件大小不超过 5MB\n' +
      '• 图片宽度至少 1600px\n' +
      '• 上传后可移动、缩放并裁剪\n' +
      '• 最终封面比例为 6:1'

    const allowedTypes = [
      'image/jpeg',
      'image/png',
    ]

    if (
      !allowedTypes.includes(
        file.type
      ) ||
      file.size >
        5 * 1024 * 1024
    ) {
      alert(requirements)
      return
    }

    try {
      const dimensions =
        await new Promise<{
          width: number
          height: number
        }>((resolve, reject) => {
          const image =
            new window.Image()

          const objectUrl =
            URL.createObjectURL(
              file
            )

          image.onload = () => {
            const result = {
              width:
                image.naturalWidth,
              height:
                image.naturalHeight,
            }

            URL.revokeObjectURL(
              objectUrl
            )

            resolve(result)
          }

          image.onerror = () => {
            URL.revokeObjectURL(
              objectUrl
            )

            reject(
              new Error(
                '无法读取图片'
              )
            )
          }

          image.src =
            objectUrl
        })

      if (
        dimensions.width <
        1600
      ) {
        alert(requirements)
        return
      }

      const cropUrl =
        URL.createObjectURL(file)

      setCoverSelectedFile(file)
      setCoverCropUrl(cropUrl)

      setCoverCropPosition({
        x: 50,
        y: 50,
      })

      setCoverCropZoom(1)

      setCoverRulesOpen(false)
      setCoverCropOpen(true)
    } catch (error) {
      console.error(
        'Cover image validation failed:',
        error
      )

      alert(requirements)
    }
  }

const handleConfirmCoverUpload =
  async () => {
    if (
      !coverSelectedFile ||
      !coverCropUrl ||
      !user
    ) {
      return
    }

    const supabase =
      getSupabaseBrowser()

    let newFilePath:
      | string
      | null = null

    try {
      setCoverUploading(true)

      /*
       * 再检查一次 7 天冷却。
       * 这里只负责用户体验，
       * 真正无法绕过的限制由数据库 Trigger 负责。
       */
      if (
        profile?.cover_updated_at
      ) {
        const lastUpdated =
          new Date(
            profile.cover_updated_at
          )

        const nextAvailable =
          new Date(
            lastUpdated.getTime() +
              7 *
                24 *
                60 *
                60 *
                1000
          )

        if (
          Date.now() <
          nextAvailable.getTime()
        ) {
          alert(
            `每 7 天仅可更换一次封面。\n\n下次可更换时间：${nextAvailable.toLocaleString(
              'zh-CN',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }
            )}`
          )

          return
        }
      }

      /*
       * 读取原图
       */
      const image =
        await new Promise<HTMLImageElement>(
          (resolve, reject) => {
            const img =
              new window.Image()

            img.onload = () =>
              resolve(img)

            img.onerror = () =>
              reject(
                new Error(
                  '无法读取裁剪图片'
                )
              )

            img.src =
              coverCropUrl
          }
        )

      /*
       * 输出固定 2400 × 400
       */
      const OUTPUT_WIDTH =
        2400

      const OUTPUT_HEIGHT =
        400

      const OUTPUT_RATIO =
        OUTPUT_WIDTH /
        OUTPUT_HEIGHT

      const sourceWidth =
        image.naturalWidth

      const sourceHeight =
        image.naturalHeight

      const sourceRatio =
        sourceWidth /
        sourceHeight

      let baseCropWidth: number
      let baseCropHeight: number

      if (
        sourceRatio >
        OUTPUT_RATIO
      ) {
        baseCropHeight =
          sourceHeight

        baseCropWidth =
          sourceHeight *
          OUTPUT_RATIO
      } else {
        baseCropWidth =
          sourceWidth

        baseCropHeight =
          sourceWidth /
          OUTPUT_RATIO
      }

      const cropWidth =
        baseCropWidth /
        coverCropZoom

      const cropHeight =
        baseCropHeight /
        coverCropZoom

      const maxOffsetX =
        Math.max(
          0,
          sourceWidth -
            cropWidth
        )

      const maxOffsetY =
        Math.max(
          0,
          sourceHeight -
            cropHeight
        )

      const sourceX =
        maxOffsetX *
        (coverCropPosition.x /
          100)

      const sourceY =
        maxOffsetY *
        (coverCropPosition.y /
          100)

      /*
       * Canvas 裁剪
       */
      const canvas =
        document.createElement(
          'canvas'
        )

      canvas.width =
        OUTPUT_WIDTH

      canvas.height =
        OUTPUT_HEIGHT

      const context =
        canvas.getContext('2d')

      if (!context) {
        throw new Error(
          '无法创建图片裁剪画布'
        )
      }

      context.drawImage(
        image,
        sourceX,
        sourceY,
        cropWidth,
        cropHeight,
        0,
        0,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT
      )

      const blob =
        await new Promise<Blob>(
          (
            resolve,
            reject
          ) => {
            canvas.toBlob(
              (result) => {
                if (result) {
                  resolve(result)
                } else {
                  reject(
                    new Error(
                      '封面图片生成失败'
                    )
                  )
                }
              },
              'image/jpeg',
              0.9
            )
          }
        )

      /*
       * 上传新封面
       */
      newFilePath =
        `${user.id}/cover-${Date.now()}.jpg`

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            'profile-covers'
          )
          .upload(
            newFilePath,
            blob,
            {
              contentType:
                'image/jpeg',
              cacheControl:
                '3600',
              upsert: false,
            }
          )

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } =
        supabase.storage
          .from(
            'profile-covers'
          )
          .getPublicUrl(
            newFilePath
          )

      /*
       * 记住旧封面 URL。
       * 必须等数据库更新成功以后才能删除。
       */
      const oldCoverUrl =
        profile?.cover_url ||
        null

      const now =
        new Date().toISOString()

      /*
       * 更新数据库。
       *
       * 数据库 Trigger 会再次检查
       * 7 天冷却，并使用数据库时间
       * 写入 cover_updated_at。
       */
      const {
        data: updatedProfile,
        error: updateError,
      } =
        await supabase
          .from('profiles')
          .update({
            cover_url:
              publicUrl,
            updated_at:
              now,
          })
          .eq(
            'id',
            user.id
          )
          .select(
            'cover_url, cover_updated_at'
          )
          .single()

      /*
       * 数据库拒绝更新：
       * 立即删除刚才上传的新文件。
       */
      if (updateError) {
        if (newFilePath) {
          const {
            error:
              cleanupError,
          } =
            await supabase.storage
              .from(
                'profile-covers'
              )
              .remove([
                newFilePath,
              ])

          if (cleanupError) {
            console.error(
              'Failed to cleanup new cover:',
              cleanupError
            )
          }
        }

        newFilePath = null

        if (
          updateError.message.includes(
            'COVER_COOLDOWN_ACTIVE'
          )
        ) {
          throw new Error(
            'COVER_COOLDOWN_ACTIVE'
          )
        }

        throw updateError
      }

      /*
       * 数据库已经成功切换到新封面。
       * 现在才安全删除旧封面。
       */
      if (
        oldCoverUrl &&
        oldCoverUrl !==
          publicUrl
      ) {
        try {
          const marker =
            '/profile-covers/'

          const markerIndex =
            oldCoverUrl.indexOf(
              marker
            )

          if (
            markerIndex !== -1
          ) {
            const oldFilePath =
              decodeURIComponent(
                oldCoverUrl.slice(
                  markerIndex +
                    marker.length
                )
              )

            if (
              oldFilePath &&
              oldFilePath !==
                newFilePath
            ) {
              const {
                error:
                  deleteOldError,
              } =
                await supabase.storage
                  .from(
                    'profile-covers'
                  )
                  .remove([
                    oldFilePath,
                  ])

              if (
                deleteOldError
              ) {
                console.error(
                  'Failed to delete old cover:',
                  deleteOldError
                )
              }
            }
          }
        } catch (error) {
          /*
           * 删除旧图失败不能影响
           * 已经成功的新封面。
           */
          console.error(
            'Old cover cleanup failed:',
            error
          )
        }
      }

      /*
       * 更新本地状态
       */
      setProfile(
        (current) =>
          current
            ? {
                ...current,
                cover_url:
                  updatedProfile.cover_url,
                cover_updated_at:
                  updatedProfile.cover_updated_at,
              }
            : current
      )

      URL.revokeObjectURL(
        coverCropUrl
      )

      setCoverCropUrl('')
      setCoverSelectedFile(
        null
      )

      setCoverCropOpen(false)

      /*
       * 自动刷新个人主页
       */
      window.location.reload()
    } catch (error) {
      console.error(
        'Cover crop upload failed:',
        error
      )

      if (
        error instanceof Error &&
        error.message ===
          'COVER_COOLDOWN_ACTIVE'
      ) {
        const nextAvailable =
          profile?.cover_updated_at
            ? new Date(
                new Date(
                  profile.cover_updated_at
                ).getTime() +
                  7 *
                    24 *
                    60 *
                    60 *
                    1000
              )
            : null

        alert(
          nextAvailable
            ? `每 7 天仅可更换一次封面。\n\n下次可更换时间：${nextAvailable.toLocaleString(
                'zh-CN',
                {
                  year:
                    'numeric',
                  month:
                    'long',
                  day:
                    'numeric',
                  hour:
                    '2-digit',
                  minute:
                    '2-digit',
                }
              )}`
            : '每 7 天仅可更换一次封面，请稍后再试。'
        )

        return
      }

      /*
       * 如果错误发生在上传以后、
       * 数据库更新以前，再尝试清理新图。
       */
      if (newFilePath) {
        const {
          error:
            cleanupError,
        } =
          await supabase.storage
            .from(
              'profile-covers'
            )
            .remove([
              newFilePath,
            ])

        if (cleanupError) {
          console.error(
            'Failed to cleanup failed cover upload:',
            cleanupError
          )
        }
      }

      alert(
        '封面上传失败，请稍后再试。'
      )
    } finally {
      setCoverUploading(false)
    }
  }
  
  const handleCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0]

    if (!file || !user) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
    ]

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      alert(
        '封面仅支持 JPG、JPEG 和 PNG 格式。'
      )

      event.target.value = ''
      return
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        '封面图片不能超过 5MB。'
      )

      event.target.value = ''
      return
    }

    try {
      const imageDimensions =
        await new Promise<{
          width: number
          height: number
        }>(
          (
            resolve,
            reject
          ) => {
            const image =
              new window.Image()

            const objectUrl =
              URL.createObjectURL(
                file
              )

            image.onload =
              () => {
                const dimensions =
                  {
                    width:
                      image.naturalWidth,
                    height:
                      image.naturalHeight,
                  }

                URL.revokeObjectURL(
                  objectUrl
                )

                resolve(
                  dimensions
                )
              }

            image.onerror =
              () => {
                URL.revokeObjectURL(
                  objectUrl
                )

                reject(
                  new Error(
                    '无法读取图片尺寸'
                  )
                )
              }

            image.src =
              objectUrl
          }
        )

      const aspectRatio =
        imageDimensions.width /
        imageDimensions.height

      if (
        aspectRatio < 3 ||
        aspectRatio > 8
      ) {
        alert(
          `封面图片比例不合适。\n\n推荐比例：6:1\n允许范围：3:1 ～ 8:1\n当前图片：${aspectRatio.toFixed(
            2
          )}:1`
        )

        event.target.value = ''
        return
      }

      if (
        imageDimensions.width <
        1600
      ) {
        alert(
          '封面图片分辨率过低。\n\n宽度至少需要 1600px，推荐尺寸为 2400 × 400px。'
        )

        event.target.value = ''
        return
      }

      setCoverUploading(true)

      const supabase =
        getSupabaseBrowser()

      const extension =
        file.name
          .split('.')
          .pop()
          ?.toLowerCase() ||
        'jpg'

      const filePath =
        `${user.id}/cover-${Date.now()}.${extension}`

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            'profile-covers'
          )
          .upload(
            filePath,
            file,
            {
              cacheControl:
                '3600',
              upsert: false,
            }
          )

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } =
        supabase.storage
          .from(
            'profile-covers'
          )
          .getPublicUrl(
            filePath
          )

      const {
        error: updateError,
      } =
        await supabase
          .from('profiles')
          .update({
            cover_url:
              publicUrl,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            user.id
          )

      if (updateError) {
        throw updateError
      }

      setProfile(
        (current) =>
          current
            ? {
                ...current,
                cover_url:
                  publicUrl,
              }
            : current
      )
    } catch (error) {
      console.error(
        'Profile cover upload failed:',
        error
      )

      alert(
        '封面上传失败，请稍后再试。'
      )
    } finally {
      setCoverUploading(false)
      event.target.value = ''
    }
  }

  const handleVerifyRsi =
    async () => {
      const handle =
        rsiHandleInput.trim()

      if (rsiTimeLeft <= 0) {
        setRsiVerificationError(
          '验证码已过期，请重新开始验证。'
        )
        return
      }

      if (
        !handle ||
        !rsiVerificationCode
      ) {
        alert(
          '当前没有有效的 RSI 验证请求。'
        )
        return
      }

      try {
        setRsiVerifying(true)
        setRsiVerificationError(
          ''
        )

        const supabase =
          getSupabaseBrowser()

        const {
          data: { session },
        } =
          await supabase.auth.getSession()

        if (
          !session?.access_token
        ) {
          alert(
            '登录状态已失效，请重新登录。'
          )
          return
        }

        const response =
          await fetch(
            '/api/rsi/verification/verify',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
                Authorization:
                  `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                handle,
              }),
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              'RSI 验证失败'
          )
        }

        setProfile(
          (current) =>
            current
              ? {
                  ...current,
                  star_citizen_handle:
                    data.handle,
                  rsi_verified:
                    true,
                  rsi_verified_at:
                    data.verifiedAt,
                  rsi_verification_handle:
                    null,
                  rsi_verification_code:
                    null,
                  rsi_verification_expires_at:
                    null,
                }
              : current
        )

        setRsiVerificationCode(
          ''
        )

        setRsiVerificationExpiresAt(
          ''
        )

        setRsiBinding(false)

        alert(
          `RSI Handle ${data.handle} 验证成功！`
        )
      } catch (error) {
        console.error(
          'RSI verification error:',
          error
        )

        setRsiVerificationError(
          error instanceof Error
            ? error.message
            : 'RSI 验证失败，请稍后再试。'
        )
      } finally {
        setRsiVerifying(false)
      }
    }

  const handleCancelRsiVerification =
    async () => {
      try {
        const supabase =
          getSupabaseBrowser()

        const {
          data: { session },
        } =
          await supabase.auth.getSession()

        if (
          session?.access_token &&
          rsiVerificationCode
        ) {
          const response =
            await fetch(
              '/api/rsi/verification/cancel',
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
            throw new Error(
              data.error ||
                '取消 RSI 验证失败'
            )
          }
        }

        setRsiVerificationCode(
          ''
        )

        setRsiVerificationExpiresAt(
          ''
        )

        setRsiHandleInput('')
        setRsiVerificationError(
          ''
        )

        setRsiBinding(false)
      } catch (error) {
        console.error(
          'RSI verification cancel error:',
          error
        )

        alert(
          error instanceof Error
            ? error.message
            : '取消 RSI 验证失败，请稍后再试。'
        )
      }
    }

  const handleResetRsiVerification =
    async () => {
      try {
        const supabase =
          getSupabaseBrowser()

        const {
          data: { session },
        } =
          await supabase.auth.getSession()

        if (
          session?.access_token &&
          rsiVerificationCode
        ) {
          const response =
            await fetch(
              '/api/rsi/verification/cancel',
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
            throw new Error(
              data.error ||
                '重置 RSI 验证失败'
            )
          }
        }

        setRsiVerificationCode(
          ''
        )

        setRsiVerificationExpiresAt(
          ''
        )

        setRsiHandleInput('')
        setRsiVerificationError(
          ''
        )
      } catch (error) {
        console.error(
          'RSI verification reset error:',
          error
        )

        alert(
          error instanceof Error
            ? error.message
            : '重置 RSI 验证失败，请稍后再试。'
        )
      }
    }

  return (
    <main className="min-h-screen bg-[#f7f7f5] pb-24">
      <div className="site-container pt-20 lg:pt-24">

        {/* Profile hero */}
        <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_10px_35px_rgba(0,0,0,0.05)]">

          {/* Banner */}
          <div className="relative h-44 overflow-hidden bg-[#ece8e1] lg:h-56">
            {profile?.cover_url ? (
              <Image
                src={
                  profile.cover_url
                }
                alt={`${username} 封面`}
                fill
                sizes="100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-linear-to-r from-[#f4eee5] via-[#ebe5db] to-[#ded7ca]" />
            )}

            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/10 to-transparent" />

            <div className="absolute right-5 top-5 flex items-center gap-2">
              {profile?.profile_slug && (
                <Link
                  href={`/profile/${encodeURIComponent(
                    profile.profile_slug
                  )}`}
                  className="rounded-full border border-white/60 bg-white/80 px-4 py-2 text-xs font-medium text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-white"
                >
                  访客视角
                </Link>
              )}

              <button
                type="button"
                disabled={coverUploading}
                onClick={() => {
                  setCoverRulesOpen(true)
                }}
                className={`rounded-full border border-white/60 bg-white/80 px-4 py-2 text-xs font-medium text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-white ${
                  coverUploading
                    ? 'cursor-wait opacity-60'
                    : ''
                }`}
              >
                {coverUploading
                  ? '上传中...'
                  : '更换封面'}
              </button>
            </div>
          </div>

          {/* Main profile */}
          <div className="relative px-6 pb-7 lg:px-9 lg:pb-9">
            <div className="flex min-w-0 gap-5 lg:gap-7">

              {/* Avatar */}
              <div className="-mt-14 shrink-0 lg:-mt-16">
                <div className="relative size-28 overflow-hidden rounded-3xl border-[5px] border-white bg-muted shadow-lg lg:size-32">
                  <Image
                    src={avatar}
                    alt={`${username} 头像`}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Information */}
              <div className="min-w-0 flex-1 pt-5 lg:pt-6">

                {/* Name row */}
                <div className="flex items-start justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">

                      <h1 className="truncate pb-1 text-3xl font-semibold leading-[1.2] tracking-tight">
                        {username}
                      </h1>

                      {profile?.rsi_verified &&
                        profile?.star_citizen_handle && (
                          <button
                            type="button"
                            onClick={() => {
                              setRsiVerificationError(
                                ''
                              )
                              setRsiBinding(
                                true
                              )
                            }}
                            title="RSI Handle 已认证 · 点击管理"
                            className="group relative mb-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#b87300] text-white shadow-[0_2px_7px_rgba(184,115,0,0.28)] transition-all hover:scale-105 hover:bg-[#a66700]"
                          >
                            <Check
                              className="size-3.5"
                              strokeWidth={
                                2.7
                              }
                            />

                            <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-max max-w-56 -translate-x-1/2 translate-y-1 rounded-xl border border-black/5 bg-neutral-950 px-3 py-2 text-left text-[11px] font-normal leading-5 text-white opacity-0 shadow-xl transition-all group-hover:translate-y-0 group-hover:opacity-100">
                              RSI Handle
                              已认证
                              <span className="block text-white/60">
                                {
                                  profile.star_citizen_handle
                                }
                              </span>
                            </span>
                          </button>
                        )}

                      {starClubId && (
                        <span className="mb-1 text-sm text-muted-foreground">
                          @{starClubId}
                        </span>
                      )}
                    </div>

                    <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                      {profile?.bio ||
                        '探索宇宙，记录传奇，连接同好。'}
                    </p>
                  </div>

                  {/* Edit profile */}
                  <Link
                    href="/profile/settings"
                    className="mt-0.5 hidden shrink-0 items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-xs font-medium text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all hover:border-black/15 hover:bg-neutral-50 lg:inline-flex"
                  >
                    <Pencil
                      className="size-3.5"
                      strokeWidth={1.7}
                    />
                    编辑个人资料
                  </Link>
                </div>

                {/* Mobile edit */}
                <Link
                  href="/profile/settings"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-xs font-medium text-foreground lg:hidden"
                >
                  <Pencil className="size-3.5" />
                  编辑个人资料
                </Link>

                {/* Trust / identity status */}
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">

                  <div
                    className={`inline-flex items-center gap-2 text-xs ${
                      user
                        ? 'text-foreground/75'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <CircleCheck
                      className={`size-4 ${
                        user
                          ? 'text-[#a66700]'
                          : 'text-neutral-300'
                      }`}
                      strokeWidth={
                        1.8
                      }
                    />

                    <span>
                      Discord
                    </span>
                  </div>

                  <div
                    className={`inline-flex items-center gap-2 text-xs ${
                      discordMembership ===
                      true
                        ? 'text-foreground/75'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <Users
                      className={`size-4 ${
                        discordMembership ===
                        true
                          ? 'text-[#a66700]'
                          : 'text-neutral-300'
                      }`}
                      strokeWidth={
                        1.8
                      }
                    />

                    <span>
                      酒馆社区
                    </span>

                    {discordMembership ===
                      true && (
                      <Check
                        className="size-3 text-[#a66700]"
                        strokeWidth={
                          2.3
                        }
                      />
                    )}
                  </div>

                  <div
                    className={`inline-flex items-center gap-2 text-xs ${
                      orgMembership ===
                      true
                        ? 'text-foreground/75'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <ShieldCheck
                      className={`size-4 ${
                        orgMembership ===
                        true
                          ? 'text-[#a66700]'
                          : 'text-neutral-300'
                      }`}
                      strokeWidth={
                        1.8
                      }
                    />

                    <span>
                      STARCLUB ORG
                    </span>

                    {orgMembership ===
                      true && (
                      <Check
                        className="size-3 text-[#a66700]"
                        strokeWidth={
                          2.3
                        }
                      />
                    )}
                  </div>

                  {!profile?.rsi_verified && (
                    <button
                      type="button"
                      onClick={() => {
                        setRsiHandleInput(
                          ''
                        )
                        setRsiVerificationCode(
                          ''
                        )
                        setRsiBinding(
                          true
                        )
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-primary transition-opacity hover:opacity-70"
                    >
                      RSI Handle
                      未认证
                      <span>→</span>
                    </button>
                  )}
                </div>

                {/* Timezone */}
                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3
                      className="size-3.5"
                      strokeWidth={1.6}
                    />

                    {formatTimezone(profile?.timezone)}
                  </span>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03)] sm:grid-cols-3 lg:grid-cols-6">
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

            <section className="overflow-hidden rounded-2xl border border-border bg-white">
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
                    <>
                      <div className="divide-y divide-border">
                   {visibleProfilePosts.map(
                      (post) => (
                        <Link
                          key={post.id}
                          href={`/community?postId=${encodeURIComponent(
                            post.id,
                          )}`}
                          className="block px-6 py-6 transition-colors hover:bg-neutral-50/70"
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

                          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              ♥ {post.like_count ?? 0}
                            </span>
                          </div>
                        </Link>
                      ),
              )}
            </div>

            {profilePosts.length >
              PROFILE_POSTS_PREVIEW_LIMIT && (
              <div className="border-t border-border px-6 py-4 text-center">
                <button
                  type="button"
                  onClick={() =>
                    setShowAllProfilePosts(
                      (current) => !current,
                    )
                  }
                  className="text-xs font-medium text-primary transition-opacity hover:opacity-70"
                >
                  {showAllProfilePosts
                    ? '收起动态'
                    : `查看全部动态（${profilePosts.length}）`}
                </button>
              </div>
            )}
          </>
        ) : (
            <div className="flex min-h-96 items-center justify-center px-6 py-16">
                    <div className="text-center">
                      <p className="text-base font-medium">
                        还没有动态
                      </p>

                      <p className="mt-2 text-sm text-muted-foreground">
                        你在社区发布的动态会显示在这里。
                      </p>
                    </div>
                  </div>
                )}
            </section>

            {profile?.profile_slug && (
              <ProfileGuestbook
                profileSlug={
                  profile.profile_slug
                }
                isOwner
              />
            )}
          </div>

          {/* Right column */}
          <aside className="flex flex-col gap-5">

            <section className="rounded-2xl border border-border bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">
                  酒馆身份
                </h2>

                <Link
                  href="/profile/identities"
                  className="text-xs text-primary transition-opacity hover:opacity-70"
                >
                  查看全部 →
                </Link>
              </div>

              {unlockedIdentities.length >
              0 ? (
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {unlockedIdentities.map(
                    (
                      identity
                    ) => (
                      <div
                        key={
                          identity.id
                        }
                        className="flex min-w-0 flex-col items-center text-center"
                      >
                        <div className="flex h-16 w-full items-center justify-center">
                          <img
                            src={
                              identity.logo
                            }
                            alt={
                              identity.name
                            }
                            className="
                              max-h-14 max-w-14 object-contain
                              drop-shadow-[0_2px_2px_rgba(0,0,0,0.20)]
                              transition-all duration-200
                              hover:-translate-y-1
                              hover:scale-105
                              hover:drop-shadow-[0_5px_5px_rgba(0,0,0,0.24)]
                            "
                          />
                        </div>

                        <p className="mt-1 max-w-23 text-[11px] font-medium leading-[1.3] text-foreground">
                          {
                            identity.name
                          }
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

            <section className="rounded-2xl border border-border bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">
                  最近访客
                </h2>

                <span className="text-xs text-muted-foreground">
                  {visitors.length}
                </span>
              </div>

              {visitors.length >
              0 ? (
                <div className="mt-5 space-y-4">
                  {visibleVisitors.map(
                    (
                      visitor
                    ) => {
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

                      return (
                        <Link
                          key={
                            visitor.id
                          }
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
                              alt={
                                visitor.starCitizenHandle ||
                                visitor.displayName ||
                                visitor.profileSlug ||
                                '访客'
                              }
                              className="size-9 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="size-9 shrink-0 rounded-full bg-neutral-100" />
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium transition-colors group-hover:text-[#a66700]">
                              {visitor.starCitizenHandle ||
                                visitor.displayName ||
                                visitor.profileSlug ||
                                'StarClub 用户'}
                            </p>

                            {visitorId && (
                              <p className="truncate text-[11px] text-muted-foreground">
                                @
                                {
                                  visitorId
                                }
                              </p>
                            )}
                          </div>

                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {new Date(
                              visitor.visitedAt
                            ).toLocaleDateString(
                              'zh-CN',
                              {
                                month:
                                  'numeric',
                                day:
                                  'numeric',
                              }
                            )}
                          </span>
                        </Link>
                      )
                    }
                  )}

                  {visitors.length >
                    VISITORS_PREVIEW_LIMIT && (
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setShowAllVisitors(
                            (current) => !current,
                          )
                        }
                        className="text-xs font-medium text-primary transition-opacity hover:opacity-70"
                      >
                        {showAllVisitors
                          ? '收起访客'
                          : `查看全部访客（${visitors.length}）`}
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

      {/* RSI verification modal */}
      {rsiBinding && (
        <div className="fixed inset-0 z-130 flex items-center justify-center bg-black/25 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-[0.65rem] tracking-[0.22em] text-primary">
                  RSI VERIFICATION
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  绑定 Star Citizen
                  Handle
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  通过 RSI
                  公开个人主页验证该
                  Handle 确实属于你。
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleCancelRsiVerification
                }
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-sm text-muted-foreground transition-colors hover:bg-muted"
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            {!rsiVerificationCode ? (
              <>
                <label className="mt-6 block">
                  <span className="text-sm font-medium">
                    Star Citizen Handle
                  </span>

                  <input
                    value={
                      rsiHandleInput
                    }
                    onChange={(e) =>
                      setRsiHandleInput(
                        e.target.value
                      )
                    }
                    placeholder="例如 GuMieHaoRen"
                    autoComplete="off"
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                  />
                </label>

                <button
                  type="button"
                  onClick={
                    handleStartRsiVerification
                  }
                  disabled={
                    rsiStarting
                  }
                  className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {rsiStarting
                    ? '正在创建验证...'
                    : '开始验证'}
                </button>
              </>
            ) : (
              <div className="mt-6">

                <div className="rounded-2xl border border-border bg-muted/40 p-5">
                  <p className="text-xs font-medium text-muted-foreground">
                    你正在验证
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {rsiHandleInput.trim()}
                  </p>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  请将下面这段验证码临时添加到你的
                  RSI Profile Bio 中：
                </p>

                <div className="mt-3 select-all rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-center font-mono text-lg font-semibold tracking-wider text-primary">
                  {
                    rsiVerificationCode
                  }
                </div>

                <div className="mt-5 rounded-2xl border border-border p-4 text-sm leading-7 text-muted-foreground">
                  <p>
                    添加并保存 Bio
                    后，回到这里进行验证。验证成功后即可删除
                    Bio 中的验证码。
                  </p>

                  <p className="mt-2 font-medium text-foreground">
                    {rsiTimeLeft >
                    0 ? (
                      <>
                        验证码剩余有效时间：
                        {String(
                          Math.floor(
                            rsiTimeLeft /
                              60
                          )
                        ).padStart(
                          2,
                          '0'
                        )}
                        :
                        {String(
                          rsiTimeLeft %
                            60
                        ).padStart(
                          2,
                          '0'
                        )}
                      </>
                    ) : (
                      <>
                        验证码已过期
                      </>
                    )}
                  </p>
                </div>

                {rsiVerificationError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
                    {
                      rsiVerificationError
                    }

                    <p className="mt-1 text-xs text-red-600/80">
                      验证失败不会使验证码失效。请确认
                      RSI Bio
                      已保存，稍等片刻后可以再次验证。
                    </p>
                  </div>
                )}

                {rsiTimeLeft >
                0 ? (
                  <button
                    type="button"
                    onClick={
                      handleVerifyRsi
                    }
                    disabled={
                      rsiVerifying
                    }
                    className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {rsiVerifying
                      ? '正在验证...'
                      : '我已添加，开始验证'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={
                      handleResetRsiVerification
                    }
                    className="mt-6 w-full rounded-xl border border-border bg-muted px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
                  >
                    验证码已过期 ·
                    重新开始
                  </button>
                )}

                <button
                  type="button"
                  onClick={
                    handleResetRsiVerification
                  }
                  className="mt-3 w-full rounded-xl px-5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  ← 修改 Handle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {coverRulesOpen && (() => {
        const lastUpdated =
          profile?.cover_updated_at
            ? new Date(
                profile.cover_updated_at
              )
            : null

        const nextAvailable =
          lastUpdated
            ? new Date(
                lastUpdated.getTime() +
                  7 *
                    24 *
                    60 *
                    60 *
                    1000
              )
            : null

        const canChangeCover =
          !nextAvailable ||
          Date.now() >=
            nextAvailable.getTime()

        return (
          <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]"
            onMouseDown={() => {
              setCoverRulesOpen(false)
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              onMouseDown={(event) => {
                event.stopPropagation()
              }}
              className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-6 shadow-2xl"
            >
              {canChangeCover ? (
                <>
                  <h2 className="text-lg font-semibold">
                    更换个人封面
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    每 7 天仅可更换一次封面。上传成功后将开始计算新的 7 天更换周期。
                  </p>

                  <div className="mt-5 rounded-2xl bg-[#f7f7f5] p-4">
                    <p className="text-xs font-semibold text-foreground">
                      图片要求
                    </p>

                    <div className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
                      <p>
                        • 支持 JPG、JPEG、PNG
                      </p>

                      <p>
                        • 文件大小不超过 5MB
                      </p>

                      <p>
                        • 图片宽度至少 1600px
                      </p>

                      <p>
                        • 上传后可移动、缩放并裁剪
                      </p>

                      <p>
                        • 最终封面比例为 6:1
                      </p>
                    </div>
                  </div>

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={
                      handleCoverFileSelect
                    }
                    className="hidden"
                  />

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCoverRulesOpen(
                          false
                        )
                      }}
                      className="rounded-full border border-border px-5 py-2.5 text-xs font-medium transition-colors hover:bg-neutral-50"
                    >
                      取消
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        coverInputRef.current?.click()
                      }}
                      className="rounded-full bg-neutral-950 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
                    >
                      选择图片
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">
                    暂时无法更换封面
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    为避免频繁更换个人主页封面，每位用户每 7 天仅可更换一次。
                  </p>

                  <div className="mt-5 rounded-2xl bg-[#f7f7f5] p-4">
                    <p className="text-xs text-muted-foreground">
                      下次可更换时间
                    </p>

                    <p className="mt-1.5 text-sm font-semibold text-foreground">
                      {nextAvailable?.toLocaleString(
                        'zh-CN',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setCoverRulesOpen(
                          false
                        )
                      }}
                      className="rounded-full bg-neutral-950 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
                    >
                      知道了
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })()}

    {/* Cover crop modal */}
{coverCropOpen &&
  coverCropUrl && (
    <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl">
        <div>
          <h2 className="text-xl font-semibold">
            调整封面
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            拖动图片调整显示位置，并使用下方滑杆缩放图片。
          </p>
        </div>

        {/* 6:1 crop preview */}
        <div
          className={`relative mt-6 aspect-6/1 w-full select-none overflow-hidden rounded-2xl bg-neutral-950 ${
            coverDragging
              ? 'cursor-grabbing'
              : 'cursor-grab'
          }`}
          onMouseDown={(event) => {
            event.preventDefault()

            setCoverDragging(true)

            setCoverDragStart({
              x: event.clientX,
              y: event.clientY,
            })

            setCoverPositionStart(
              coverCropPosition
            )
          }}
          onMouseMove={(event) => {
            if (!coverDragging) {
              return
            }

            const rect =
              event.currentTarget.getBoundingClientRect()

            const deltaX =
              ((event.clientX -
                coverDragStart.x) /
                rect.width) *
              100

            const deltaY =
              ((event.clientY -
                coverDragStart.y) /
                rect.height) *
              100

            setCoverCropPosition({
              x: Math.max(
                0,
                Math.min(
                  100,
                  coverPositionStart.x +
                    deltaX
                )
              ),
              y: Math.max(
                0,
                Math.min(
                  100,
                  coverPositionStart.y +
                    deltaY
                )
              ),
            })
          }}
          onMouseUp={() => {
            setCoverDragging(false)
          }}
          onMouseLeave={() => {
            setCoverDragging(false)
          }}
        >
          <img
            src={coverCropUrl}
            alt="封面裁剪预览"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition: `${coverCropPosition.x}% ${coverCropPosition.y}%`,
              transform: `scale(${coverCropZoom})`,
            }}
          />

          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" />
        </div>

        {/* Zoom */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">
              图片缩放
            </span>

            <span className="text-xs text-muted-foreground">
              {Math.round(
                coverCropZoom * 100
              )}
              %
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={coverCropZoom}
            onChange={(event) => {
              setCoverCropZoom(
                Number(
                  event.target.value
                )
              )
            }}
            className="mt-3 w-full accent-neutral-950"
          />
        </div>

        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          最终封面将按照 6:1
          比例保存，当前预览区域显示的内容就是最终封面效果。
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setCoverCropOpen(false)

              if (coverCropUrl) {
                URL.revokeObjectURL(
                  coverCropUrl
                )
              }

              setCoverCropUrl('')
              setCoverSelectedFile(
                null
              )
            }}
            className="rounded-full border border-border px-5 py-2.5 text-xs font-medium transition-colors hover:bg-neutral-50"
          >
            取消
          </button>

          <button
            type="button"
            onClick={
              handleConfirmCoverUpload
            }
            disabled={
              !coverSelectedFile ||
              coverUploading
            }
            className="rounded-full bg-neutral-950 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {coverUploading
            ? '正在上传...'
            : '确认并上传'}
          </button>
        </div>
      </div>
    </div>
  )}

    </main>
  )
}