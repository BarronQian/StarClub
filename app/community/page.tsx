'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import Link from 'next/link'
import {
  ImageIcon,
  MessageCircle,
  Send,
  Heart,
  House,
  Users,
  Bell,
  Smile,
  FileText,
  CheckCheck,
} from 'lucide-react'

import {
  getSupabaseBrowser,
} from '@/lib/supabase-browser'

import {
  CommunityCommentDialog,
} from '@/components/community-comment-dialog'

import {
  CommunityPostCard,
} from '@/components/community/community-post-card'

import EmojiPicker, {
  EmojiClickData,
  Theme,
} from 'emoji-picker-react'

import { AuthLoginButton } from '@/components/auth-login-button'

type FeedMode =
  | 'community'
  | 'following'
  | 'notifications'
  | 'mine'
  | 'comments'

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

type MyCommentPost = {
  id: string
  author_id: string
  content: string
  created_at: string
  profiles:
    | PostAuthor
    | PostAuthor[]
    | null
}

type MyComment = {
  id: string
  post_id: string
  author_id: string
  content: string
  parent_comment_id: string | null
  parent_comment?: {
  id: string
  author_id: string
  profiles?: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
    star_citizen_handle: string | null
    profile_slug: string | null
  } | null
} | null
  created_at: string
  updated_at: string
  post: MyCommentPost | null
}

type CommunityNews = {
  id: string
  source: string
  title: string
  summary: string | null
  titleOriginal: string
  sourceUrl: string
  imageUrl: string | null
  publishedAt: string
}

type NotificationActor = {
  username: string | null
  display_name: string | null
  avatar_url: string | null
  star_citizen_handle: string | null
  profile_slug: string | null
}

type CommunityNotification = {
  id: string
  recipient_id: string
  actor_id: string
  type:
    | 'post_like'
    | 'post_comment'
    | 'comment_like'
    | 'comment_reply'
  post_id: string | null
  comment_id: string | null
  created_at: string
  seen_at: string | null
  read_at: string | null
  actor:
    | NotificationActor
    | NotificationActor[]
    | null
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

function getNotificationActor(
  notification: CommunityNotification,
): NotificationActor | null {
  if (!notification.actor) {
    return null
  }

  return Array.isArray(
    notification.actor,
  )
    ? notification.actor[0] ??
        null
    : notification.actor
}

function getNotificationText(
  type: CommunityNotification['type'],
) {
  switch (type) {
    case 'post_like':
      return '赞了你的动态'

    case 'post_comment':
      return '评论了你的动态'

    case 'comment_like':
      return '赞了你的评论'

    case 'comment_reply':
      return '回复了你的评论'

    default:
      return '与你进行了互动'
  }
}

export default function CommunityPage() {
  const [
    feedMode,
    setFeedMode,
  ] = useState<FeedMode>(
    'community',
  )

  const [
    posts,
    setPosts,
  ] = useState<
    CommunityPost[]
  >([])

  const [
    myComments,
    setMyComments,
  ] = useState<
    MyComment[]
  >([])

  const [
    commentPost,
    setCommentPost,
  ] = useState<
    CommunityPost | null
  >(null)

  const [
    deleteConfirmPost,
    setDeleteConfirmPost,
  ] = useState<
    CommunityPost | null
  >(null)

  const [
  adminDeletingPost,
  setAdminDeletingPost,
] = useState(false)

  const [
    moderationTargetPost,
    setModerationTargetPost,
  ] = useState<
    CommunityPost | null
  >(null)

  const [
    moderationAction,
    setModerationAction,
  ] = useState<
    'mute' |
    null
  >(null)

  const [
    moderationReason,
    setModerationReason,
  ] = useState('')

  const [
    moderationSubmitting,
    setModerationSubmitting,
  ] = useState(false)

  const [
    deletingPostId,
    setDeletingPostId,
  ] = useState<
    string | null
  >(null)

  const [
  deleteConfirmComment,
  setDeleteConfirmComment,
  ] = useState<
    MyComment | null
  >(null)

  const [
    deletingCommentId,
    setDeletingCommentId,
  ] = useState<
    string | null
  >(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false)

  const [
    hasMore,
    setHasMore,
  ] = useState(false)

  const [
    nextCursor,
    setNextCursor,
  ] = useState<
    string | null
  >(null)

  const [
    content,
    setContent,
  ] = useState('')

  const [
  emojiOpen,
  setEmojiOpen,
] = useState(false)

const textareaRef =
  useRef<HTMLTextAreaElement>(
    null,
  )

const emojiPickerRef =
  useRef<HTMLDivElement>(
    null,
  )

  const [
    publishing,
    setPublishing,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    loggedIn,
    setLoggedIn,
  ] = useState(false)

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState<
    string | null
  >(null)

  const [
    isAdmin,
    setIsAdmin,
  ] = useState(false)

  const [
    isOwner,
    setIsOwner,
  ] = useState(false)

  const [
    currentAvatar,
    setCurrentAvatar,
  ] = useState<
    string | null
  >(null)

  const [
    news,
    setNews,
  ] = useState<
    CommunityNews[]
  >([])

  const [
    newsLoading,
    setNewsLoading,
  ] = useState(true)

  const [
  notifications,
  setNotifications,
] = useState<
  CommunityNotification[]
>([])

const [
  unseenNotificationCount,
  setUnseenNotificationCount,
] = useState(0)

const [
  unreadNotificationCount,
  setUnreadNotificationCount,
] = useState(0)

const [
  notificationFilter,
  setNotificationFilter,
] = useState<
  'all' | 'replies' | 'likes'
>('all')

  const loadPosts =
    useCallback(
      async (
        cursor?:
          | string
          | null,
        append = false,
        mode: FeedMode =
          feedMode,
        userId:
          | string
          | null =
          currentUserId,
      ) => {
        try {
          if (append) {
            setLoadingMore(
              true,
            )
          } else {
            setLoading(
              true,
            )
          }

          setError(null)

          if (
            mode === 'mine' &&
            !userId
          ) {
            setPosts([])
            setHasMore(false)
            setNextCursor(null)
            return
          }

          if (
            mode === 'following' &&
            !userId
          ) {
            setPosts([])
            setHasMore(false)
            setNextCursor(null)
            setError(
              '请先登录后查看关注动态',
            )
            return
          }

          const params =
            new URLSearchParams()

          if (cursor) {
            params.set(
              'cursor',
              cursor,
            )
          }

          if (
            mode === 'mine' &&
            userId
          ) {
            params.set(
              'authorId',
              userId,
            )
          }

          if (
              mode === 'following'
            ) {
              params.set(
                'following',
                'true',
              )
            }

          const query =
            params.toString()

          const controller =
            new AbortController()

          const timeout =
            window.setTimeout(
              () => {
                controller.abort()
              },
              10000,
            )

            let accessToken:
              string | null = null

            const supabase =
              getSupabaseBrowser()

            const {
              data: {
                session,
              },
            } =
              await supabase.auth.getSession()

            accessToken =
              session?.access_token ??
              null

            if (
              mode === 'following' &&
              !accessToken
            ) {
              window.clearTimeout(
                timeout,
              )

              setPosts([])
              setHasMore(false)
              setNextCursor(null)
              setError(
                '请先登录后查看关注动态',
              )

              return
            }

              const response =
                await fetch(
                  `/api/community/posts${
                    query
                      ? `?${query}`
                      : ''
                  }`,
                  {
                    cache:
                      'no-store',

                    signal:
                      controller.signal,

                    ...(accessToken
                      ? {
                          headers: {
                            Authorization:
                              `Bearer ${accessToken}`,
                          },
                        }
                      : {}),
                  },
                )

          window.clearTimeout(
            timeout,
          )

          const data =
            await response.json()

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ||
                '读取动态失败',
            )
          }

          const newPosts:
            CommunityPost[] =
            Array.isArray(
              data.posts,
            )
              ? data.posts
              : []

          if (append) {
            setPosts(
              (
                currentPosts,
              ) => {
                const existingIds =
                  new Set(
                    currentPosts.map(
                      (
                        post,
                      ) =>
                        post.id,
                    ),
                  )

                const uniquePosts =
                  newPosts.filter(
                    (
                      post,
                    ) =>
                      !existingIds.has(
                        post.id,
                      ),
                  )

                return [
                  ...currentPosts,
                  ...uniquePosts,
                ]
              },
            )
          } else {
            setPosts(
              newPosts,
            )
          }

          setHasMore(
            data.hasMore ===
              true,
          )

          setNextCursor(
            typeof data.nextCursor ===
              'string'
              ? data.nextCursor
              : null,
          )
        } catch (
          error
        ) {
          console.error(
            'Failed to load posts:',
            error,
          )

          setError(
            error instanceof
              Error
              ? error.message
              : '读取动态失败',
          )
        } finally {
          if (append) {
            setLoadingMore(
              false,
            )
          } else {
            setLoading(
              false,
            )
          }
        }
      },
      [
        feedMode,
        currentUserId,
      ],
    )

  const loadMyComments =
    useCallback(
      async (
        cursor?: string | null,
        append = false,
      ) => {
        try {
          if (append) {
            setLoadingMore(true)
          } else {
            setLoading(true)
          }

          setError(null)

          const supabase =
            getSupabaseBrowser()

          const {
            data: { session },
          } =
            await supabase.auth.getSession()

          if (
            !session?.access_token
          ) {
            setMyComments([])
            setHasMore(false)
            setNextCursor(null)
            setError(
              '请先登录后查看我的评论',
            )
            return
          }

          const params =
            new URLSearchParams()

          if (cursor) {
            params.set(
              'cursor',
              cursor,
            )
          }

          const query =
            params.toString()

          const controller =
            new AbortController()

          const timeout =
            window.setTimeout(
              () => {
                controller.abort()
              },
              10000,
            )

          const response =
            await fetch(
              `/api/community/comments/mine${
                query
                  ? `?${query}`
                  : ''
              }`,
              {
                cache:
                  'no-store',
                signal:
                  controller.signal,
                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },
              },
            )

          window.clearTimeout(
            timeout,
          )

          const data =
            await response.json()

          if (!response.ok) {
            throw new Error(
              data.error ||
                '读取我的评论失败',
            )
          }

          const newComments:
            MyComment[] =
            Array.isArray(
              data.comments,
            )
              ? data.comments
              : []

          if (append) {
            setMyComments(
              (
                currentComments,
              ) => {
                const existingIds =
                  new Set(
                    currentComments.map(
                      (
                        comment,
                      ) =>
                        comment.id,
                    ),
                  )

                const uniqueComments =
                  newComments.filter(
                    (
                      comment,
                    ) =>
                      !existingIds.has(
                        comment.id,
                      ),
                  )

                return [
                  ...currentComments,
                  ...uniqueComments,
                ]
              },
            )
          } else {
            setMyComments(
              newComments,
            )
          }

          setHasMore(
            data.hasMore === true,
          )

          setNextCursor(
            typeof data.nextCursor ===
              'string'
              ? data.nextCursor
              : null,
          )
        } catch (error) {
          console.error(
            'Failed to load my comments:',
            error,
          )

          setError(
            error instanceof Error
              ? error.message
              : '读取我的评论失败',
          )
        } finally {
          if (append) {
            setLoadingMore(
              false,
            )
          } else {
            setLoading(
              false,
            )
          }
        }
      },
      [],
    )

  const loadNotifications =
  useCallback(
    async (
      cursor?: string | null,
      append = false,
    ) => {
      try {
        if (append) {
          setLoadingMore(true)
        } else {
          setLoading(true)
        }

        setError(null)

        const supabase =
          getSupabaseBrowser()

        const {
          data: { session },
        } =
          await supabase.auth.getSession()

        if (
          !session?.access_token
        ) {
          setNotifications([])
          setUnseenNotificationCount(0)
          setUnreadNotificationCount(0)
          setHasMore(false)
          setNextCursor(null)
          setError(
            '请先登录后查看我的消息',
          )
          return
        }

        const params =
          new URLSearchParams()

        if (cursor) {
          params.set(
            'cursor',
            cursor,
          )
        }

        const query =
          params.toString()

        const controller =
          new AbortController()

        const timeout =
          window.setTimeout(
            () => {
              controller.abort()
            },
            10000,
          )

        const response =
          await fetch(
            `/api/community/notifications${
              query
                ? `?${query}`
                : ''
            }`,
            {
              cache:
                'no-store',

              signal:
                controller.signal,

              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },
            },
          )

        window.clearTimeout(
          timeout,
        )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              '读取消息失败',
          )
        }

        const newNotifications:
          CommunityNotification[] =
          Array.isArray(
            data.notifications,
          )
            ? data.notifications
            : []

        if (append) {
          setNotifications(
            (
              currentNotifications,
            ) => {
              const existingIds =
                new Set(
                  currentNotifications.map(
                    (
                      notification,
                    ) =>
                      notification.id,
                  ),
                )

              const uniqueNotifications =
                newNotifications.filter(
                  (
                    notification,
                  ) =>
                    !existingIds.has(
                      notification.id,
                    ),
                )

              return [
                ...currentNotifications,
                ...uniqueNotifications,
              ]
            },
          )
        } else {
          setNotifications(
            newNotifications,
          )
        }

        setUnseenNotificationCount(
          typeof data.unseenCount ===
            'number'
            ? data.unseenCount
            : 0,
        )

        setUnreadNotificationCount(
          typeof data.unreadCount ===
            'number'
            ? data.unreadCount
            : 0,
        )

        setHasMore(
          data.hasMore === true,
        )

        setNextCursor(
          typeof data.nextCursor ===
            'string'
            ? data.nextCursor
            : null,
        )
      } catch (error) {
        console.error(
          'Failed to load notifications:',
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : '读取消息失败',
        )
      } finally {
        if (append) {
          setLoadingMore(false)
        } else {
          setLoading(false)
        }
      }
    },
    [],
  )

  const loadNotificationCounts =
  useCallback(
    async () => {
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
          setUnseenNotificationCount(
            0,
          )

          setUnreadNotificationCount(
            0,
          )

          return
        }

        const response =
          await fetch(
            '/api/community/notifications',
            {
              cache:
                'no-store',

              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },
            },
          )

        if (!response.ok) {
          return
        }

        const data =
          await response.json()

        setUnseenNotificationCount(
          typeof data.unseenCount ===
            'number'
            ? data.unseenCount
            : 0,
        )

        setUnreadNotificationCount(
          typeof data.unreadCount ===
            'number'
            ? data.unreadCount
            : 0,
        )
      } catch (error) {
        console.error(
          'Failed to load notification counts:',
          error,
        )
      }
    },
    [],
  )

  const markNotificationsSeen =
  useCallback(
    async () => {
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
          return
        }

        const response =
          await fetch(
            '/api/community/notifications',
            {
              method: 'PATCH',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${session.access_token}`,
              },

              body:
                JSON.stringify({
                  action: 'seen',
                }),
            },
          )

        if (!response.ok) {
          const data =
            await response.json()

          throw new Error(
            data.error ||
              '更新消息状态失败',
          )
        }

        setUnseenNotificationCount(
          0,
        )
      } catch (error) {
        console.error(
          'Failed to mark notifications seen:',
          error,
        )
      }
    },
    [],
  )

  const markAllNotificationsRead =
  async () => {
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
        return
      }

      const response =
        await fetch(
          '/api/community/notifications',
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body:
              JSON.stringify({
                action:
                  'read-all',
              }),
          },
        )

      if (!response.ok) {
        const data =
          await response.json()

        throw new Error(
          data.error ||
            '全部标为已读失败',
        )
      }

      const now =
        new Date().toISOString()

      setNotifications(
        (
          currentNotifications,
        ) =>
          currentNotifications.map(
            (
              notification,
            ) => ({
              ...notification,

              seen_at:
                notification.seen_at ??
                now,

              read_at:
                notification.read_at ??
                now,
            }),
          ),
      )

      setUnseenNotificationCount(
        0,
      )

      setUnreadNotificationCount(
        0,
      )
    } catch (error) {
      console.error(
        'Failed to mark all notifications read:',
        error,
      )

      setError(
        '全部标为已读失败',
      )
    }
  }

  const markNotificationRead =
  async (
    notificationId: string,
  ) => {
    const notification =
      notifications.find(
        (item) =>
          item.id ===
          notificationId,
      )

    if (
      !notification ||
      notification.read_at
    ) {
      return
    }

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
        return
      }

      const response =
        await fetch(
          '/api/community/notifications',
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body:
              JSON.stringify({
                action:
                  'read',

                notificationId,
              }),
          },
        )

      if (!response.ok) {
        return
      }

      const now =
        new Date().toISOString()

      setNotifications(
        (
          currentNotifications,
        ) =>
          currentNotifications.map(
            (item) =>
              item.id ===
              notificationId
                ? {
                    ...item,

                    seen_at:
                      item.seen_at ??
                      now,

                    read_at: now,
                  }
                : item,
          ),
      )

      setUnreadNotificationCount(
        (current) =>
          Math.max(
            0,
            current - 1,
          ),
      )
    } catch (error) {
      console.error(
        'Failed to mark notification read:',
        error,
      )
    }
  }

  const openNotificationPost =
  async (
    notification: CommunityNotification,
  ) => {
    if (!notification.post_id) {
      return
    }

    try {
      await markNotificationRead(
        notification.id,
      )

      const existingPost =
        posts.find(
          (post) =>
            post.id ===
            notification.post_id,
        )

      if (existingPost) {
        setCommentPost(
          existingPost,
        )

        return
      }

      const supabase =
        getSupabaseBrowser()

      const {
        data: { session },
      } =
        await supabase.auth.getSession()

      const params =
        new URLSearchParams({
          postId:
            notification.post_id,
        })

      const response =
        await fetch(
          `/api/community/posts?${params.toString()}`,
          {
            cache: 'no-store',

            ...(session
              ?.access_token
              ? {
                  headers: {
                    Authorization:
                      `Bearer ${session.access_token}`,
                  },
                }
              : {}),
          },
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            '读取动态失败',
        )
      }

      const post:
        CommunityPost | null =
        data.post ??
        (
          Array.isArray(
            data.posts,
          )
            ? data.posts[0] ??
              null
            : null
        )

      if (!post) {
        setError(
          '这条动态已不存在',
        )

        return
      }

      setCommentPost(post)
    } catch (error) {
      console.error(
        'Failed to open notification post:',
        error,
      )

      setError(
        error instanceof Error
          ? error.message
          : '打开动态失败',
      )
    }
  }

  const loadMorePosts =
    async () => {
      if (
        !hasMore ||
        !nextCursor ||
        loadingMore
      ) {
        return
      }

      if (
        feedMode ===
        'comments'
      ) {
        await loadMyComments(
          nextCursor,
          true,
        )

        return
      }

      if (
          feedMode ===
          'notifications'
        ) {
          await loadNotifications(
            nextCursor,
            true,
          )

          return
        }

      await loadPosts(
        nextCursor,
        true,
      )
    }

  const loadNews =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              '/api/community/news',
            )

          if (
            !response.ok
          ) {
            throw new Error(
              '读取资讯失败',
            )
          }

          const data =
            await response.json()

          setNews(
            Array.isArray(
              data.news,
            )
              ? data.news
              : [],
          )
        } catch (
          error
        ) {
          console.error(
            'Failed to load news:',
            error,
          )

          setNews([])
        } finally {
          setNewsLoading(
            false,
          )
        }
      },
      [],
    )

useEffect(() => {
  const supabase =
    getSupabaseBrowser()

  const applySession =
    async (
      session: any,
    ) => {
      const userId =
        session?.user?.id ??
        null

      if (!userId) {
        setLoggedIn(false)

        setCurrentUserId(
          null,
        )

        setCurrentAvatar(
          null,
        )

        setIsAdmin(false)
        setIsOwner(false)

        return
      }

      setLoggedIn(true)

      setCurrentUserId(
        userId,
      )

      const [
        profileResult,
        adminStatusResult,
      ] = await Promise.all([
        supabase
          .from(
            'profiles',
          )
          .select(
            'avatar_url',
          )
          .eq(
            'id',
            userId,
          )
          .maybeSingle(),

        session?.access_token
          ? fetch(
              '/api/community/admin-status',
              {
                cache:
                  'no-store',

                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },
              },
            )
          : Promise.resolve(
              null,
            ),
      ])

      setCurrentAvatar(
        profileResult.data
          ?.avatar_url ??
          null,
      )

      if (
        adminStatusResult &&
        adminStatusResult.ok
      ) {
        const adminData =
          await adminStatusResult.json()

        setIsAdmin(
          adminData.isAdmin ===
            true,
        )

        setIsOwner(
          adminData.isOwner ===
            true,
        )
      } else {
        setIsAdmin(false)
        setIsOwner(false)
      }
    }

  const initialize =
    async () => {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession()

      await applySession(
        session,
      )
    }

  void initialize()

  const {
    data: {
      subscription,
    },
  } =
    supabase.auth.onAuthStateChange(
      (
        _event,
        session,
      ) => {
        void applySession(
          session,
        )
      },
    )

  return () => {
    subscription.unsubscribe()
  }
}, [])

  useEffect(() => {
  if (!emojiOpen) {
    return
  }

  const handlePointerDown = (
    event: MouseEvent,
  ) => {
    const target =
      event.target as Node

    if (
      emojiPickerRef.current &&
      !emojiPickerRef.current.contains(
        target,
      )
    ) {
      setEmojiOpen(false)
    }
  }

  document.addEventListener(
    'mousedown',
    handlePointerDown,
  )

  return () => {
    document.removeEventListener(
      'mousedown',
      handlePointerDown,
    )
  }
}, [emojiOpen])

  useEffect(() => {
    if (
      feedMode ===
      'comments'
    ) {
      void loadMyComments(
        null,
        false,
      )

      return
    }

    if (
      feedMode ===
      'notifications'
    ) {
      void loadNotifications(
        null,
        false,
      )

      return
    }

    void loadPosts(
      null,
      false,
      feedMode,
      currentUserId,
    )
  }, [
    feedMode,
    currentUserId,
    loadPosts,
    loadMyComments,
    loadNotifications,
  ])

  useEffect(() => {
  const openPostFromUrl =
    async () => {
      const params =
        new URLSearchParams(
          window.location.search,
        )

      const postId =
        params.get('postId')

      if (!postId) {
        return
      }

      try {
        setError(null)

        const supabase =
          getSupabaseBrowser()

        const {
          data: { session },
        } =
          await supabase.auth.getSession()

        const response =
          await fetch(
            `/api/community/posts?postId=${encodeURIComponent(
              postId,
            )}`,
            {
              cache: 'no-store',

              ...(session
                ?.access_token
                ? {
                    headers: {
                      Authorization:
                        `Bearer ${session.access_token}`,
                    },
                  }
                : {}),
            },
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              '读取动态失败',
          )
        }

        const post:
          CommunityPost | null =
          data.post ??
          (Array.isArray(
            data.posts,
          )
            ? data.posts[0] ??
              null
            : null)

        if (!post) {
          setError(
            '这条动态已不存在',
          )

          return
        }

        setCommentPost(post)
      } catch (error) {
        console.error(
          'Failed to open post from URL:',
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : '打开动态失败',
        )
      }
    }

  void openPostFromUrl()
}, [])

  useEffect(() => {
    void loadNews()
  }, [loadNews])

  useEffect(() => {
  if (!loggedIn) {
    setUnseenNotificationCount(
      0,
    )

    setUnreadNotificationCount(
      0,
    )

    return
  }

  void loadNotificationCounts()
}, [
  loggedIn,
  loadNotificationCounts,
])

  useEffect(() => {
  if (
    feedMode !==
    'notifications'
  ) {
    return
  }

  void markNotificationsSeen()
}, [
  feedMode,
  markNotificationsSeen,
])

  const switchFeed =
    (
      mode: FeedMode,
    ) => {
        if (
          (mode === 'mine' ||
            mode === 'comments' ||
            mode === 'following' ||
            mode === 'notifications') &&
          !loggedIn
        ) {
          setError(
            mode === 'comments'
              ? '请先登录后查看我的评论'
              : mode === 'following'
                ? '请先登录后查看关注动态'
                : mode === 'notifications'
                  ? '请先登录后查看我的消息'
                  : '请先登录后查看我的帖子',
          )

          return
        }

      if (
        mode === feedMode
      ) {
        return
      }

      setError(null)
      setCommentPost(null)
      setDeleteConfirmPost(
        null,
      )
      setAdminDeletingPost(
        false,
      )
      setPosts([])
      setMyComments([])
      setHasMore(false)
      setNextCursor(null)
      setFeedMode(mode)
    }

  const publishPost =
    async () => {
      if (publishing) {
        return
      }

      const trimmed =
        content.trim()

      if (!trimmed) {
        return
      }

      setPublishing(true)
      setError(null)

      try {
        const supabase =
          getSupabaseBrowser()

        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession()

        if (
          !session
            ?.access_token
        ) {
          setError(
            '请先登录后再发布动态',
          )

          return
        }

        const response =
          await fetch(
            '/api/community/posts',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${session.access_token}`,
              },

              body:
                JSON.stringify(
                  {
                    content:
                      trimmed,
                  },
                ),
            },
          )

        const data =
          await response.json()

        if (
          !response.ok
        ) {
          setError(
            data.error ||
              '发布动态失败',
          )

          return
        }

        setContent('')
        setEmojiOpen(false)

        await loadPosts(
          null,
          false,
          feedMode,
          currentUserId,
        )
      } catch (
        error
      ) {
        console.error(
          'Failed to publish post:',
          error,
        )

        setError(
          '发布动态失败',
        )
      } finally {
        setPublishing(false)
      }
    }

  const toggleLike =
    async (
      postId: string,
    ) => {
      try {
        const supabase =
          getSupabaseBrowser()

        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession()

        if (
          !session
            ?.access_token
        ) {
          setError(
            '请先登录后再点赞',
          )

          return
        }

        const response =
          await fetch(
            `/api/community/posts/${postId}/like`,
            {
              method:
                'POST',

              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },
            },
          )

        const data =
          await response.json()

        if (
          !response.ok
        ) {
          setError(
            data.error ||
              '点赞失败',
          )

          return
        }

        setPosts(
          (
            currentPosts,
          ) =>
            currentPosts.map(
              (post) =>
                post.id ===
                postId
                  ? {
                      ...post,

                      like_count:
                        data.likeCount,

                      liked_by_me:
                        data.liked,
                    }
                  : post,
            ),
        )
      } catch (
        error
      ) {
        console.error(
          'Failed to toggle like:',
          error,
        )

        setError(
          '点赞失败',
        )
      }
    }
  
  const submitMute =
  async (
    duration:
      | '1h'
      | '24h'
      | '7d'
      | 'permanent',
  ) => {
    if (
      !moderationTargetPost ||
      moderationSubmitting
    ) {
      return
    }

    const reason =
      moderationReason.trim()

    if (!reason) {
      setError(
        '请填写禁言原因',
      )
      return
    }

    try {
      setError(null)
      setModerationSubmitting(
        true,
      )

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
        setError(
          '登录状态已失效',
        )
        return
      }

      const response =
        await fetch(
          '/api/community/admin/users/mute',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body:
              JSON.stringify({
                userId:
                  moderationTargetPost.author_id,

                duration,

                reason,
              }),
          },
        )

      const data =
        await response
          .json()
          .catch(() => ({}))

      if (!response.ok) {
        setError(
          data.error ||
            '禁言用户失败',
        )
        return
      }

      setModerationTargetPost(
        null,
      )

      setModerationAction(
        null,
      )

      setModerationReason(
        '',
      )
    } catch (error) {
      console.error(
        'Failed to mute user:',
        error,
      )

      setError(
        '禁言用户失败',
      )
    } finally {
      setModerationSubmitting(
        false,
      )
    }
  }

  const deletePost =
    async () => {
      if (
        !deleteConfirmPost ||
        deletingPostId
      ) {
        return
      }

      const postId =
        deleteConfirmPost.id

      try {
        setError(null)

        const supabase =
          getSupabaseBrowser()

        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession()

        if (
          !session
            ?.access_token
        ) {
          setError(
            '请先登录后再删除动态',
          )

          return
        }

        setDeletingPostId(
          postId,
        )

          const endpoint =
            adminDeletingPost
              ? `/api/community/admin/posts/${encodeURIComponent(
                  postId,
                )}`
              : `/api/community/posts?postId=${encodeURIComponent(
                  postId,
                )}`

          const response =
            await fetch(
              endpoint,
              {
                method:
                  'DELETE',

                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },
              },
            )

        const data =
          await response.json()

        if (
          !response.ok
        ) {
          setError(
            data.error ||
              '删除动态失败',
          )

          return
        }

        setPosts(
          (
            currentPosts,
          ) =>
            currentPosts.filter(
              (post) =>
                post.id !==
                postId,
            ),
        )

        setCommentPost(
          (
            currentPost,
          ) =>
            currentPost?.id ===
            postId
              ? null
              : currentPost,
        )

        setDeleteConfirmPost(
          null,
        )
        setAdminDeletingPost(
          false,
        )
      } catch (
        error
      ) {
        console.error(
          'Failed to delete post:',
          error,
        )

        setError(
          '删除动态失败',
        )

      } finally {
        setDeletingPostId(
          null,
        )
      }
    }

    const deleteComment =
  async () => {
    if (
      !deleteConfirmComment ||
      deletingCommentId
    ) {
      return
    }

    const commentId =
      deleteConfirmComment.id

    try {
      setError(null)

      const supabase =
        getSupabaseBrowser()

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession()

      if (
        !session
          ?.access_token
      ) {
        setError(
          '请先登录后再删除评论',
        )

        return
      }

      setDeletingCommentId(
        commentId,
      )

      const response =
        await fetch(
          `/api/community/comments?commentId=${encodeURIComponent(
            commentId,
          )}`,
          {
            method:
              'DELETE',

            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          },
        )

      const data =
        await response.json()

      if (
        !response.ok
      ) {
        setError(
          data.error ||
            '删除评论失败',
        )

        return
      }

      setMyComments(
        (
          currentComments,
        ) =>
          currentComments.filter(
            (
              comment,
            ) =>
              comment.id !==
              commentId,
          ),
      )

      setDeleteConfirmComment(
        null,
      )
    } catch (error) {
      console.error(
        'Failed to delete comment:',
        error,
      )

      setError(
        '删除评论失败',
      )
    } finally {
      setDeletingCommentId(
        null,
      )
    }
  }

const pageTitle =
  feedMode === 'mine'
    ? '我的帖子'
    : feedMode ===
        'comments'
      ? '我的评论'
      : feedMode ===
          'following'
        ? '我的关注'
        : feedMode ===
            'notifications'
          ? '我的消息'
          : '社区动态'

const pageDescription =
  feedMode === 'mine'
    ? '查看和管理你在 StarClub 社区发布的动态。'
    : feedMode ===
        'comments'
      ? '查看你在 StarClub 社区参与过的讨论。'
      : feedMode ===
          'following'
        ? '查看你关注的酒友最新发布的动态。'
        : feedMode ===
            'notifications'
          ? '查看与你相关的点赞、评论和回复。'
          : '分享你在星际公民宇宙中的故事、截图和见闻。'

  return (
    <>
      <main className="mt-16 h-[calc(100vh-64px)] overflow-hidden bg-white">
        <div className="site-container h-full">

          <div className="grid h-full grid-cols-1 xl:grid-cols-[240px_minmax(0,780px)_360px] xl:justify-center">

            <aside className="hidden h-full px-5 pb-6 pt-14 xl:block">
                <nav className="sticky top-14 space-y-2">

                  <button
                    type="button"
                    onClick={() => {
                      switchFeed(
                        'community',
                      )
                    }}
                    className={
                      feedMode ===
                      'community'
                        ? 'flex h-11 w-full items-center gap-3 rounded-xl bg-neutral-100 px-4 text-left text-sm font-semibold text-foreground'
                        : 'flex h-11 w-full items-center gap-3 rounded-xl px-4 text-left text-sm text-muted-foreground transition-colors hover:bg-neutral-50 hover:text-foreground'
                    }
                  >
                    <House
                      className="size-5"
                      strokeWidth={1.8}
                      fill={
                        feedMode ===
                        'community'
                          ? 'currentColor'
                          : 'none'
                      }
                    />

                    <span>
                      社区主页
                    </span>
                  </button>


                  <button
                    type="button"
                    onClick={() => {
                      switchFeed(
                        'following',
                      )
                    }}
                    className={
                      feedMode ===
                      'following'
                        ? 'flex h-11 w-full items-center gap-3 rounded-xl bg-neutral-100 px-4 text-left text-sm font-semibold text-foreground'
                        : 'flex h-11 w-full items-center gap-3 rounded-xl px-4 text-left text-sm text-muted-foreground transition-colors hover:bg-neutral-50 hover:text-foreground'
                    }
                  >
                    <Users
                      className="size-5"
                      strokeWidth={1.8}
                      fill={
                        feedMode ===
                        'following'
                          ? 'currentColor'
                          : 'none'
                      }
                    />

                    <span>
                      关注
                    </span>
                  </button>


                  <button
                    type="button"
                    onClick={() => {
                      switchFeed(
                        'notifications',
                      )
                    }}
                    className={
                      feedMode ===
                      'notifications'
                        ? 'flex h-11 w-full items-center gap-3 rounded-xl bg-neutral-100 px-4 text-left text-sm font-semibold text-foreground'
                        : 'flex h-11 w-full items-center gap-3 rounded-xl px-4 text-left text-sm text-muted-foreground transition-colors hover:bg-neutral-50 hover:text-foreground'
                    }
                  >
                    <Bell
                      className="size-5"
                      strokeWidth={1.8}
                      fill={
                        feedMode ===
                        'notifications'
                          ? 'currentColor'
                          : 'none'
                      }
                    />

                    <span>
                      我的消息
                    </span>

                    {unseenNotificationCount >
                      0 && (
                      <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                        {unseenNotificationCount >
                        99
                          ? '99+'
                          : unseenNotificationCount}
                      </span>
                    )}
                  </button>


                  <button
                    type="button"
                    onClick={() => {
                      switchFeed(
                        'mine',
                      )
                    }}
                    className={
                      feedMode === 'mine'
                        ? 'flex h-11 w-full items-center gap-3 rounded-xl bg-neutral-100 px-4 text-left text-sm font-semibold text-foreground'
                        : 'flex h-11 w-full items-center gap-3 rounded-xl px-4 text-left text-sm text-muted-foreground transition-colors hover:bg-neutral-50 hover:text-foreground'
                    }
                  >
                    <FileText
                      className="size-5"
                      strokeWidth={1.8}
                      fill={
                        feedMode === 'mine'
                          ? 'currentColor'
                          : 'none'
                      }
                    />

                    <span>
                      我的帖子
                    </span>
                  </button>


                  <button
                    type="button"
                    onClick={() => {
                      switchFeed(
                        'comments',
                      )
                    }}
                    className={
                      feedMode ===
                      'comments'
                        ? 'flex h-11 w-full items-center gap-3 rounded-xl bg-neutral-100 px-4 text-left text-sm font-semibold text-foreground'
                        : 'flex h-11 w-full items-center gap-3 rounded-xl px-4 text-left text-sm text-muted-foreground transition-colors hover:bg-neutral-50 hover:text-foreground'
                    }
                  >
                    <MessageCircle
                      className="size-5"
                      strokeWidth={1.8}
                      fill={
                        feedMode ===
                        'comments'
                          ? 'currentColor'
                          : 'none'
                      }
                    />

                    <span>
                      我的评论
                    </span>
                  </button>

                </nav>
            </aside>

            <div className="h-full overflow-y-auto border-x border-border bg-[#f7f7f5] px-5 pb-6 pt-14 lg:px-6">

              <div className="mb-10 lg:mb-12">

                <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
                  {pageTitle}
                </h1>

                <p className="mt-3 text-sm text-muted-foreground lg:text-base">
                  {pageDescription}
                </p>

              </div>

                {feedMode !== 'comments' &&
                  feedMode !== 'following' &&
                  feedMode !==
                    'notifications' && (
                <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.04)]">

                {loggedIn ? (
                  <div className="flex gap-4">

                    {currentAvatar ? (
                      <img
                        src={
                          currentAvatar
                        }
                        alt="我的头像"
                        className="size-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="size-11 shrink-0 rounded-full bg-neutral-100" />
                    )}

                    <div className="min-w-0 flex-1">

                      <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(
                          event,
                        ) => {
                          if (
                            event
                              .target
                              .value
                              .length <=
                            1000
                          ) {
                            setContent(
                              event
                                .target
                                .value,
                            )
                          }
                        }}
                        placeholder="分享一下你在 Stanton / Pyro 的故事..."
                        rows={4}
                        className="w-full resize-none border-none bg-transparent p-0 text-sm leading-7 outline-none placeholder:text-muted-foreground"
                      />

                      {error && (
                        <p className="mt-3 text-xs text-red-600">
                          {error}
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">

                        <div className="flex items-center gap-2">

  <button
    type="button"
    disabled
    title="图片功能稍后加入"
    className="inline-flex size-9 cursor-not-allowed items-center justify-center rounded-full text-muted-foreground opacity-40"
  >
    <ImageIcon
      className="size-4"
      strokeWidth={1.7}
    />
  </button>


  <div
    ref={emojiPickerRef}
    className="relative"
  >
    <button
      type="button"
      onClick={() => {
        setEmojiOpen(
          (current) =>
            !current,
        )
      }}
      aria-label="添加表情"
      title="添加表情"
      className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Smile
        className="size-4"
        strokeWidth={1.7}
      />
    </button>


    {emojiOpen && (
      <div className="absolute bottom-11 left-0 z-50">
        <EmojiPicker
          theme={Theme.LIGHT}
          lazyLoadEmojis
          searchPlaceholder="搜索表情"
          previewConfig={{
            showPreview: false,
          }}
          onEmojiClick={(
            emojiData:
              EmojiClickData,
          ) => {
            const textarea =
              textareaRef.current

            if (!textarea) {
              return
            }

            const start =
              textarea.selectionStart

            const end =
              textarea.selectionEnd

            const next =
              content.slice(
                0,
                start,
              ) +
              emojiData.emoji +
              content.slice(end)

            if (
              next.length >
              1000
            ) {
              return
            }

            setContent(next)

            requestAnimationFrame(
              () => {
                const position =
                  start +
                  emojiData
                    .emoji.length

                textarea.focus()

                textarea.setSelectionRange(
                  position,
                  position,
                )
              },
            )

            setEmojiOpen(false)
          }}
        />
      </div>
    )}
  </div>


  <span className="text-xs text-muted-foreground">
    {content.length}/1000
  </span>

</div>

                        <button
                          type="button"
                          onClick={
                            publishPost
                          }
                          disabled={
                            publishing ||
                            !content.trim()
                          }
                          className="inline-flex h-9 items-center gap-2 rounded-full bg-neutral-950 px-4 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Send
                            className="size-3.5"
                            strokeWidth={
                              1.8
                            }
                          />

                          {publishing
                            ? '发布中...'
                            : '发布动态'}
                        </button>

                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-28 flex-col items-center justify-center text-center">
                    <p className="text-sm font-medium">
                      <AuthLoginButton variant="text" />
                      <span> 后参与社区</span>
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      登录 星际酒馆StarClub 账号后可以发布动态。
                    </p>
                  </div>
                )}

              </section>
              )}

              <section className="mt-6 space-y-4">

                {loading ? (
                  <div className="rounded-2xl border border-border bg-white p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      {feedMode ===
                      'mine'
                        ? '正在加载我的帖子...'
                        : feedMode ===
                            'comments'
                          ? '正在加载我的评论...'
                          : feedMode ===
                              'following'
                            ? '正在加载关注动态...'
                            : '正在加载社区动态...'}
                    </p>
                  </div>
                  ) : feedMode ===
                    'notifications' ? (
                    <div className="space-y-4">

                      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 shadow-[0_6px_20px_rgba(0,0,0,0.025)] sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-1 rounded-full bg-neutral-100 p-1">

                          <button
                            type="button"
                            onClick={() => {
                              setNotificationFilter(
                                'all',
                              )
                            }}
                            className={
                              notificationFilter ===
                              'all'
                                ? 'rounded-full bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-sm'
                                : 'rounded-full px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
                            }
                          >
                            全部
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setNotificationFilter(
                                'replies',
                              )
                            }}
                            className={
                              notificationFilter ===
                              'replies'
                                ? 'rounded-full bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-sm'
                                : 'rounded-full px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
                            }
                          >
                            评论与回复
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setNotificationFilter(
                                'likes',
                              )
                            }}
                            className={
                              notificationFilter ===
                              'likes'
                                ? 'rounded-full bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-sm'
                                : 'rounded-full px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
                            }
                          >
                            点赞
                          </button>

                        </div>

                        {unreadNotificationCount >
                          0 && (
                          <button
                            type="button"
                            onClick={() => {
                              void markAllNotificationsRead()
                            }}
                            className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:self-auto"
                          >
                            <CheckCheck
                              className="size-4"
                              strokeWidth={1.7}
                            />

                            全部标为已读
                          </button>
                        )}

                      </div>


                      {notifications.filter(
                        (notification) => {
                          if (
                            notificationFilter ===
                            'replies'
                          ) {
                            return (
                              notification.type ===
                                'post_comment' ||
                              notification.type ===
                                'comment_reply'
                            )
                          }

                          if (
                            notificationFilter ===
                            'likes'
                          ) {
                            return (
                              notification.type ===
                                'post_like' ||
                              notification.type ===
                                'comment_like'
                            )
                          }

                          return true
                        },
                      ).length > 0 ? (

                        <div className="overflow-hidden rounded-2xl border border-border bg-white">

                          {notifications
                            .filter(
                              (
                                notification,
                              ) => {
                                if (
                                  notificationFilter ===
                                  'replies'
                                ) {
                                  return (
                                    notification.type ===
                                      'post_comment' ||
                                    notification.type ===
                                      'comment_reply'
                                  )
                                }

                                if (
                                  notificationFilter ===
                                  'likes'
                                ) {
                                  return (
                                    notification.type ===
                                      'post_like' ||
                                    notification.type ===
                                      'comment_like'
                                  )
                                }

                                return true
                              },
                            )
                            .map(
                              (
                                notification,
                              ) => {
                                const actor =
                                  getNotificationActor(
                                    notification,
                                  )

                                const displayName =
                                  actor
                                    ?.star_citizen_handle ||
                                  actor
                                    ?.display_name ||
                                  actor?.username ||
                                  actor
                                    ?.profile_slug ||
                                  'StarClub 用户'

                                const unread =
                                  !notification.read_at

                                return (
                                  <button
                                    key={
                                      notification.id
                                    }
                                    type="button"
                                        onClick={() => {
                                          void openNotificationPost(
                                            notification,
                                          )
                                        }}
                                    className={
                                      unread
                                        ? 'group relative flex w-full items-start gap-4 border-b border-border bg-[#fffaf2] px-5 py-5 text-left transition-colors last:border-b-0 hover:bg-[#fff7e8]'
                                        : 'group relative flex w-full items-start gap-4 border-b border-border bg-white px-5 py-5 text-left transition-colors last:border-b-0 hover:bg-neutral-50'
                                    }
                                  >

                                    <div className="relative shrink-0">

                                      {actor
                                        ?.avatar_url ? (
                                        <img
                                          src={
                                            actor.avatar_url
                                          }
                                          alt={
                                            displayName
                                          }
                                          className="size-11 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="size-11 rounded-full bg-neutral-100" />
                                      )}

                                      {unread && (
                                        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-red-500" />
                                      )}

                                    </div>


                                    <div className="min-w-0 flex-1">

                                      <p
                                        className={
                                          unread
                                            ? 'text-sm leading-6 text-neutral-900'
                                            : 'text-sm leading-6 text-neutral-700'
                                        }
                                      >
                                        <span
                                          className={
                                            unread
                                              ? 'font-semibold'
                                              : 'font-medium'
                                          }
                                        >
                                          {displayName}
                                        </span>

                                        {' '}

                                        {
                                          getNotificationText(
                                            notification.type,
                                          )
                                        }
                                      </p>

                                      <p className="mt-1 text-xs text-muted-foreground">
                                        {formatPostTime(
                                          notification.created_at,
                                        )}
                                      </p>

                                    </div>


                                    {notification.type ===
                                      'post_like' ||
                                    notification.type ===
                                      'comment_like' ? (
                                      <Heart
                                        className="mt-1 size-4 shrink-0 fill-red-500 text-red-500"
                                        strokeWidth={
                                          1.6
                                        }
                                      />
                                    ) : (
                                      <MessageCircle
                                        className="mt-1 size-4 shrink-0 text-[#a66700]"
                                        strokeWidth={
                                          1.6
                                        }
                                      />
                                    )}

                                  </button>
                                )
                              },
                            )}

                        </div>

                      ) : (
                        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">

                          <Bell
                            className="mx-auto size-6 text-muted-foreground"
                            strokeWidth={1.5}
                          />

                          <p className="mt-4 text-base font-medium">
                            暂无消息
                          </p>

                          <p className="mt-2 text-sm text-muted-foreground">
                            与你相关的点赞、评论和回复会显示在这里。
                          </p>

                        </div>
                      )}

                    </div>

                  ) : feedMode ===
                    'comments' ? (
                  myComments.length >
                  0 ? (
                    myComments.map(
                      (comment) => {
                        const post =
                          comment.post

                        if (!post) {
                          return null
                        }

                        const rawAuthor =
                          post.profiles

                        const author =
                          Array.isArray(
                            rawAuthor,
                          )
                            ? rawAuthor[0] ??
                              null
                            : rawAuthor

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

                        const commentDialogPost: CommunityPost = {
                          id:
                            post.id,
                          content:
                            post.content,
                          created_at:
                            post.created_at,
                          updated_at:
                            post.created_at,
                          author_id:
                            post.author_id,
                          profiles:
                            post.profiles,
                          like_count: 0,
                          comment_count: 0,
                          liked_by_me:
                            false,
                        }

                        return (
                          <article
                            key={
                              comment.id
                            }
                            className="rounded-2xl border border-border bg-white p-5 shadow-[0_6px_20px_rgba(0,0,0,0.025)]"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-medium text-[#a66700]">
                                      我的评论
                                    </p>
                                      {comment.parent_comment_id ? (
                                        comment.parent_comment?.profiles ? (
                                          <Link
                                            href={`/profile/${
                                              comment.parent_comment.profiles.profile_slug ||
                                              comment.parent_comment.profiles.username
                                            }`}
                                            className="text-[11px] text-muted-foreground transition-colors hover:text-[#a66700]"
                                          >
                                            回复 @
                                            {comment.parent_comment.profiles.star_citizen_handle ||
                                              comment.parent_comment.profiles.display_name ||
                                              comment.parent_comment.profiles.username ||
                                              '用户'}
                                          </Link>
                                        ) : (
                                          <span className="text-[11px] text-muted-foreground">
                                            回复 @用户
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-[11px] text-muted-foreground">
                                          评论了动态
                                        </span>
                                      )}
                                  </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {formatPostTime(
                                    comment.created_at,
                                  )}
                                </p>
                              </div>

                              <MessageCircle
                                className="size-4 shrink-0 text-muted-foreground"
                                strokeWidth={
                                  1.6
                                }
                              />
                            </div>

                            <p className="mt-4 whitespace-pre-wrap wrap-break-word text-[15px] leading-7 text-neutral-900">
                              {
                                comment.content
                              }
                            </p>

                            <div className="mt-5 rounded-xl border border-border bg-[#f8f8f6] p-4">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-[11px] text-muted-foreground">
                                  回复于
                                </span>

                                {author
                                  ?.profile_slug ? (
                                  <Link
                                    href={`/profile/${encodeURIComponent(
                                      author.profile_slug,
                                    )}`}
                                    className="truncate text-xs font-semibold hover:underline"
                                  >
                                    {
                                      displayName
                                    }
                                  </Link>
                                ) : (
                                  <span className="truncate text-xs font-semibold">
                                    {
                                      displayName
                                    }
                                  </span>
                                )}

                                <span className="text-[11px] text-muted-foreground">
                                  ·{' '}
                                  {formatPostTime(
                                    post.created_at,
                                  )}
                                </span>
                              </div>

                              <p className="mt-2 line-clamp-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-neutral-700">
                                {
                                  post.content
                                }
                              </p>
                            </div>

                              <div className="mt-4 flex items-center justify-between">

                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteConfirmComment(
                                      comment,
                                    )
                                  }}
                                  className="text-xs font-medium text-red-500 transition-colors hover:text-red-600"
                                >
                                  删除评论
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setCommentPost(
                                      commentDialogPost,
                                    )
                                  }}
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#a66700] transition-colors hover:text-[#7a4b00]"
                                >
                                  查看讨论
                                  <span
                                    aria-hidden="true"
                                  >
                                    →
                                  </span>
                                </button>

                              </div>
                          </article>
                        )
                      },
                    )
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
                      <p className="text-base font-medium">
                        你还没有发表评论
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        参与社区讨论后，你的评论会显示在这里。
                      </p>
                    </div>
                  )
                ) : posts.length >
                  0 ? (
                    
                    posts.map(
                      (post) => (
                        <CommunityPostCard
                          key={
                            post.id
                          }
                          post={
                            post
                          }
                          currentUserId={
                            currentUserId
                          }
                            isAdmin={
                              isAdmin
                            }
                          onDelete={(
                            targetPost,
                          ) => {
                            setAdminDeletingPost(
                              false,
                            )

                            setDeleteConfirmPost(
                              targetPost,
                            )
                          }}
                          onEdit={(
                            targetPost,
                          ) => {
                            console.log(
                              'edit post',
                              targetPost.id,
                            )
                          }}
                          onToggleLike={(
                            postId,
                          ) => {
                            void toggleLike(
                              postId,
                            )
                          }}
                          onOpenComments={(
                            targetPost,
                          ) => {
                            setCommentPost(
                              targetPost,
                            )
                          }}
                          onAdminDelete={(
                            targetPost,
                          ) => {
                            setAdminDeletingPost(
                              true,
                            )

                            setDeleteConfirmPost(
                              targetPost,
                            )
                          }}

                            onMuteUser={(
                              targetPost,
                            ) => {
                              setModerationReason(
                                '',
                              )

                              setError(
                                null,
                              )

                              setModerationTargetPost(
                                targetPost,
                              )

                              setModerationAction(
                                'mute',
                              )
                            }}

                        />
                      ),
                    )

                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">

                      <p className="text-base font-medium">
                        {feedMode ===
                        'mine'
                          ? '你还没有发布帖子'
                          : feedMode ===
                              'following'
                            ? '暂无关注动态'
                            : '还没有人发布动态'}
                      </p>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {feedMode ===
                        'mine'
                          ? '发布第一条属于你的 StarClub 社区动态。'
                          : feedMode ===
                              'following'
                            ? '关注其他酒友后，他们发布的动态会显示在这里。'
                            : '成为第一个在 StarClub 分享故事的人。'}
                      </p>

                  </div>
                )}

                {hasMore && (
                  <div className="flex justify-center py-8">

                    <button
                      type="button"
                      disabled={
                        loadingMore
                      }
                      onClick={() => {
                        void loadMorePosts()
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                    {loadingMore
                      ? '加载中...'
                      : feedMode ===
                          'mine'
                        ? '加载更多帖子'
                        : feedMode ===
                            'comments'
                          ? '加载更多评论'
                          : feedMode ===
                              'following'
                            ? '加载更多关注动态'
                            : '加载更多动态'}
                    </button>

                  </div>
                )}

              </section>

            </div>

            <aside className="hidden h-full px-5 pb-6 pt-14 xl:block">

              <div className="space-y-5">

                <section className="overflow-hidden rounded-2xl border border-border bg-white">

                  <div className="flex items-center justify-between px-5 pb-3 pt-5">

                    <div>

                      <h2 className="text-base font-semibold">
                        最新资讯
                      </h2>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        STAR CITIZEN · RSI
                      </p>

                    </div>

                  </div>

                  <div className="divide-y divide-border">

                    {newsLoading ? (
                      <div className="px-5 py-6">

                        <p className="text-xs text-muted-foreground">
                          正在加载最新资讯...
                        </p>

                      </div>
                    ) : news.length >
                      0 ? (
                      news
                        .slice(
                          0,
                          5,
                        )
                        .map(
                          (
                            item,
                          ) => (
                            <a
                              key={
                                item.id
                              }
                              href={
                                item.sourceUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block px-5 py-4 transition-colors hover:bg-neutral-50"
                            >
                              <div className="flex gap-3">

                                {item.imageUrl && (
                                  <img
                                    src={
                                      item.imageUrl
                                    }
                                    alt=""
                                    loading="lazy"
                                    className="h-14.5 w-20.5 shrink-0 rounded-lg object-cover"
                                  />
                                )}

                                <div className="min-w-0 flex-1">

                                  <p className="line-clamp-2 text-[13px] font-medium leading-5 text-neutral-900 transition-colors group-hover:text-neutral-600">
                                    {
                                      item.title
                                    }
                                  </p>

                                  <p className="mt-1.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                                    RSI ·{' '}
                                    {new Date(
                                      item.publishedAt,
                                    ).toLocaleDateString(
                                      'zh-CN',
                                      {
                                        month:
                                          'numeric',
                                        day:
                                          'numeric',
                                      },
                                    )}
                                  </p>

                                </div>
                              </div>
                            </a>
                          ),
                        )
                    ) : (
                      <div className="px-5 py-6">

                        <p className="text-xs text-muted-foreground">
                          暂无最新资讯
                        </p>

                      </div>
                    )}

                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-white p-5">

                  <h2 className="text-base font-semibold">
                    推荐酒友
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    发现活跃在 StarClub 社区中的酒友。
                  </p>

                  <button
                    type="button"
                    disabled
                    className="mt-4 text-xs font-medium text-muted-foreground opacity-60"
                  >
                    即将开放
                  </button>

                </section>

                <section className="px-1">

                  <p className="text-xs leading-6 text-muted-foreground">
                    分享游戏内容、交流心得，与全球 Star Citizen 华人玩家一起探索宇宙。
                  </p>

                </section>

              </div>

            </aside>

          </div>
        </div>
      </main>

      {deleteConfirmPost && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
          onMouseDown={() => {
            if (
              !deletingPostId
            ) {
              setDeleteConfirmPost(
                null,
              )
              setAdminDeletingPost(
                false,
              )
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-post-title"
            onMouseDown={(
              event,
            ) => {
              event.stopPropagation()
            }}
            className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-2xl"
          >
            <h2
              id="delete-post-title"
              className="text-lg font-semibold"
            >
              {adminDeletingPost
                ? '管理员删除动态？'
                : '删除动态？'}
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {adminDeletingPost
                ? '你正在以管理员身份删除其他用户的动态。删除后该动态将不会再显示。'
                : '删除后这条动态将不会再显示。'}
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                disabled={
                  Boolean(
                    deletingPostId,
                  )
                }
                onClick={() => {
                  setDeleteConfirmPost(
                    null,
                  )

                  setAdminDeletingPost(
                    false,
                  )
                }}
                className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                取消
              </button>

              <button
                type="button"
                disabled={
                  Boolean(
                    deletingPostId,
                  )
                }
                onClick={() => {
                  void deletePost()
                }}
                className="inline-flex h-10 items-center justify-center rounded-full bg-red-600 px-5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
            {deletingPostId
              ? '删除中...'
              : adminDeletingPost
                ? '管理员删除'
                : '删除动态'}
              </button>

            </div>
          </div>
        </div>
      )}

{moderationTargetPost &&
  moderationAction ===
    'mute' && (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
      onMouseDown={() => {
        if (
          moderationSubmitting
        ) {
          return
        }

        setModerationTargetPost(
          null,
        )

        setModerationAction(
          null,
        )

        setModerationReason(
          '',
        )
        setError(
          null,
        )
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(
          event,
        ) => {
          event.stopPropagation()
        }}
        className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold">
          禁言用户
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          禁言后，该用户暂时无法发布动态、评论等社区内容。
        </p>

        <div className="mt-5">
          <label className="text-xs font-medium text-neutral-700">
            处罚原因
          </label>

          <textarea
            value={
              moderationReason
            }
            onChange={(
              event,
            ) => {
              setModerationReason(
                event.target.value,
              )
            }}
            maxLength={500}
            rows={3}
            placeholder="例如：多次发布违规内容"
            className="mt-2 w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-neutral-400"
          />

          <p className="mt-1 text-right text-[11px] text-muted-foreground">
            {
              moderationReason.length
            }
            /500
          </p>
        </div>

        <p className="mt-4 text-xs font-medium text-neutral-700">
          选择禁言时长
        </p>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={
              moderationSubmitting
            }
            onClick={() => {
              void submitMute(
                '1h',
              )
            }}
            className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            1 小时
          </button>

          <button
            type="button"
            disabled={
              moderationSubmitting
            }
            onClick={() => {
              void submitMute(
                '24h',
              )
            }}
            className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            24 小时
          </button>

          <button
            type="button"
            disabled={
              moderationSubmitting
            }
            onClick={() => {
              void submitMute(
                '7d',
              )
            }}
            className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            7 天
          </button>

          <button
            type="button"
            disabled={
              moderationSubmitting
            }
            onClick={() => {
              void submitMute(
                'permanent',
              )
            }}
            className="rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            永久禁言
          </button>
        </div>

        {error && (
          <p className="mt-4 text-xs text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={
              moderationSubmitting
            }
            onClick={() => {
              setModerationTargetPost(
                null,
              )

              setModerationAction(
                null,
              )

              setModerationReason(
                '',
              )
            }}
            className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )}

{deleteConfirmComment && (
  <div
    className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
    onMouseDown={() => {
      if (
        !deletingCommentId
      ) {
        setDeleteConfirmComment(
          null,
        )
      }
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-comment-title"
      onMouseDown={(
        event,
      ) => {
        event.stopPropagation()
      }}
      className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-2xl"
    >
      <h2
        id="delete-comment-title"
        className="text-lg font-semibold"
      >
        删除评论？
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        删除后这条评论将不会再显示。
      </p>

      <div className="mt-6 flex justify-end gap-3">

        <button
          type="button"
          disabled={
            Boolean(
              deletingCommentId,
            )
          }
          onClick={() => {
            setDeleteConfirmComment(
              null,
            )
          }}
          className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          取消
        </button>

        <button
          type="button"
          disabled={
            Boolean(
              deletingCommentId,
            )
          }
          onClick={() => {
            void deleteComment()
          }}
          className="inline-flex h-10 items-center justify-center rounded-full bg-red-600 px-5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deletingCommentId
            ? '删除中...'
            : '删除评论'}
        </button>

      </div>
    </div>
  </div>
)}

      <CommunityCommentDialog
        open={
          Boolean(
            commentPost,
          )
        }
        post={
          commentPost
            ? {
                ...commentPost,

                profiles:
                  getPostAuthor(
                    commentPost,
                  ),
              }
            : null
        }
        onClose={() => {
          setCommentPost(
            null,
          )
        }}
        onCommentCreated={(
          postId,
        ) => {
          setPosts(
            (
              currentPosts,
            ) =>
              currentPosts.map(
                (post) =>
                  post.id ===
                  postId
                    ? {
                        ...post,

                        comment_count:
                          (post.comment_count ??
                            0) +
                          1,
                      }
                    : post,
              ),
          )

          setCommentPost(
            (
              currentPost,
            ) =>
              currentPost
                ?.id ===
              postId
                ? {
                    ...currentPost,

                    comment_count:
                      (currentPost.comment_count ??
                        0) +
                      1,
                  }
                : currentPost,
          )
        }}
        onCommentDeleted={(
          postId,
        ) => {
          setPosts(
            (
              currentPosts,
            ) =>
              currentPosts.map(
                (post) =>
                  post.id ===
                  postId
                    ? {
                        ...post,

                        comment_count:
                          Math.max(
                            0,
                            (post.comment_count ??
                              0) -
                              1,
                          ),
                      }
                    : post,
              ),
          )

          setCommentPost(
            (
              currentPost,
            ) =>
              currentPost
                ?.id ===
              postId
                ? {
                    ...currentPost,

                    comment_count:
                      Math.max(
                        0,
                        (currentPost.comment_count ??
                          0) -
                          1,
                      ),
                  }
                : currentPost,
          )
        }}
      />
    </>
  )
}