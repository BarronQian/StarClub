'use client'
import Link from 'next/link'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Loader2,
  MessageCircle,
  Smile,
  X,
} from 'lucide-react'

import EmojiPicker, {
  type EmojiClickData,
} from 'emoji-picker-react'

import {
  getSupabaseBrowser,
} from '@/lib/supabase-browser'

type PostAuthor = {
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
  star_citizen_handle?: string | null
  profile_slug?: string | null
}

export type CommunityCommentPost = {
  id: string
  content: string
  created_at: string
  author_id: string
  comment_count?: number
  profiles?: PostAuthor | null
}

type CommentAuthor = {
  username: string | null
  display_name: string | null
  avatar_url: string | null
  star_citizen_handle: string | null
  profile_slug: string | null
}

type CommunityComment = {
  id: string
  post_id: string
  author_id: string
  content: string
  parent_comment_id: string | null
  reply_to_comment_id: string | null
  created_at: string
  updated_at: string
  profiles?: CommentAuthor | null
}

type CommunityCommentDialogProps = {
  open: boolean
  post:
    | CommunityCommentPost
    | null
  onClose: () => void
  onCommentCreated?: (
    postId: string,
  ) => void
  onCommentDeleted?: (
    postId: string,
  ) => void
}

function getDisplayName(
  profile:
    | PostAuthor
    | CommentAuthor
    | null
    | undefined,
) {
  return (
    profile?.star_citizen_handle ||
    profile?.display_name ||
    profile?.username ||
    'StarClub 用户'
  )
}

function formatTime(
  value: string,
) {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return ''
  }

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

export function CommunityCommentDialog({
  open,
  post,
  onClose,
  onCommentCreated,
  onCommentDeleted,
}: CommunityCommentDialogProps) {
  const [
    comments,
    setComments,
  ] = useState<
    CommunityComment[]
  >([])

  const [
    loading,
    setLoading,
  ] = useState(false)

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
  ] = useState<string | null>(
    null,
  )

  const [
    submitting,
    setSubmitting,
  ] = useState(false)

  const [
    content,
    setContent,
  ] = useState('')

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState<string | null>(
    null,
  )

  const [
    currentUserAvatar,
    setCurrentUserAvatar,
  ] = useState<string | null>(
    null,
  )

  const [
    deletingCommentId,
    setDeletingCommentId,
  ] = useState<string | null>(
    null,
  )

  const [
    replyingTo,
    setReplyingTo,
  ] = useState<
    CommunityComment | null
  >(null)

  const textareaRef =
  useRef<HTMLTextAreaElement | null>(
    null,
  )

  const emojiPickerRef =
  useRef<HTMLDivElement | null>(
    null,
  )

  const [
    emojiOpen,
    setEmojiOpen,
  ] = useState(false)

  const topLevelComments =
    useMemo(
      () =>
        comments.filter(
          (comment) =>
            !comment.parent_comment_id,
        ),
      [comments],
    )

  const repliesByParent =
    useMemo(() => {
      const map =
        new Map<
          string,
          CommunityComment[]
        >()

      for (
        const comment of
          comments
      ) {
        if (
          !comment.parent_comment_id
        ) {
          continue
        }

        const current =
          map.get(
            comment.parent_comment_id,
          ) ?? []

        current.push(
          comment,
        )

        map.set(
          comment.parent_comment_id,
          current,
        )
      }

      return map
    }, [comments])

  useEffect(() => {
    if (
      !open ||
      !post?.id
    ) {
      return
    }

    const loadComments =
      async () => {
        try {
          setLoading(true)
          setErrorMessage('')

          setComments([])
          setHasMore(false)
          setNextCursor(null)

          const response =
            await fetch(
              `/api/community/comments?postId=${encodeURIComponent(
                post.id,
              )}`,
              {
                cache:
                  'no-store',
              },
            )

          const data =
            await response.json()

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ||
                '读取评论失败',
            )
          }

          setComments(
            Array.isArray(
              data.comments,
            )
              ? data.comments
              : [],
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
            'Failed to load comments:',
            error,
          )

          setErrorMessage(
            error instanceof Error
              ? error.message
              : '读取评论失败',
          )
        } finally {
          setLoading(false)
        }
      }

    void loadComments()
  }, [
    open,
    post?.id,
  ])

  useEffect(
  () => {
    if (!emojiOpen) {
      return
    }

    const handlePointerDown = (
      event: MouseEvent,
    ) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(
          event.target as Node,
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
  },
  [
    emojiOpen,
  ],
)

  useEffect(() => {
    if (!open) {
      return
    }

    const loadCurrentUser =
      async () => {
        try {
          const supabase =
            getSupabaseBrowser()

          const {
            data: {
              session,
            },
          } =
            await supabase.auth.getSession()

          const userId =
            session?.user?.id ??
            null

          setCurrentUserId(
            userId,
          )

          if (!userId) {
            setCurrentUserAvatar(
              null,
            )
            return
          }

          const {
            data: profile,
          } = await supabase
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
            .maybeSingle()

          setCurrentUserAvatar(
            profile?.avatar_url ??
              null,
          )
        } catch (error) {
          console.error(
            'Failed to load current user:',
            error,
          )
        }
      }

    void loadCurrentUser()
  }, [open])

  useEffect(() => {
    if (!open) {
      setContent('')
      setErrorMessage('')
      setReplyingTo(null)
      setEmojiOpen(false)
      setDeletingCommentId(
        null,
      )
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
        'Escape'
      ) {
        onClose()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    open,
    onClose,
  ])

  const loadMoreComments =
    async () => {
      if (
        !post?.id ||
        !hasMore ||
        !nextCursor ||
        loadingMore
      ) {
        return
      }

      try {
        setLoadingMore(true)

        const response =
          await fetch(
            `/api/community/comments?postId=${encodeURIComponent(
              post.id,
            )}&cursor=${encodeURIComponent(
              nextCursor,
            )}`,
            {
              cache:
                'no-store',
            },
          )

        const data =
          await response.json()

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ||
              '加载更多回复失败',
          )
        }

        const newComments =
          Array.isArray(
            data.comments,
          )
            ? data.comments
            : []

        setComments(
          (
            current,
          ) => {
            const existing =
              new Set(
                current.map(
                  (comment) =>
                    comment.id,
                ),
              )

            return [
              ...current,
              ...newComments.filter(
                (
                  comment:
                    CommunityComment,
                ) =>
                  !existing.has(
                    comment.id,
                  ),
              ),
            ]
          },
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
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '加载更多回复失败',
        )
      } finally {
        setLoadingMore(false)
      }
    }

  const insertEmoji = (
  emojiData: EmojiClickData,
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
    500
  ) {
    return
  }

  setContent(next)

  requestAnimationFrame(
    () => {
      const position =
        start +
        emojiData.emoji.length

      textarea.focus()

      textarea.setSelectionRange(
        position,
        position,
      )
    },
  )

  setEmojiOpen(false)
}

  const submitComment =
    async () => {
      if (
        !post?.id ||
        submitting
      ) {
        return
      }

      const trimmed =
        content.trim()

      if (!trimmed) {
        setErrorMessage(
          '评论内容不能为空',
        )
        return
      }

      try {
        setSubmitting(true)
        setErrorMessage('')

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
          setErrorMessage(
            '请先登录后再评论',
          )
          return
        }

        const response =
          await fetch(
            '/api/community/comments',
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
                    postId:
                      post.id,

                    content:
                      trimmed,

                    parentCommentId:
                      replyingTo
                        ? (
                            replyingTo.parent_comment_id ??
                            replyingTo.id
                          )
                        : null,

                    replyToCommentId:
                      replyingTo
                        ? replyingTo.id
                        : null,
                  },
                ),
            },
          )

        const data =
          await response.json()

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ||
              '发表评论失败',
          )
        }

        const newComment =
          data.comment as CommunityComment

        setComments(
          (
            current,
          ) => {
            const alreadyExists =
              current.some(
                (comment) =>
                  comment.id ===
                  newComment.id,
              )

            if (
              alreadyExists
            ) {
              return current
            }

            return [
              ...current,
              newComment,
            ]
          },
        )

        setContent('')
        setReplyingTo(null)

        onCommentCreated?.(
          post.id,
        )
        
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '发表评论失败',
        )
      } finally {
        setSubmitting(false)
      }
    }

  const deleteComment =
    async (
      commentId: string,
    ) => {
      if (
        !post?.id ||
        deletingCommentId
      ) {
        return
      }

      try {
        setDeletingCommentId(
          commentId,
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
          !session
            ?.access_token
        ) {
          setErrorMessage(
            '请先登录',
          )
          return
        }

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
          throw new Error(
            data.error ||
              '删除评论失败',
          )
        }

          setComments(
            (current) =>
              current
                .filter(
                  (comment) =>
                    comment.id !==
                    commentId,
                )
                .map(
                  (comment) =>
                    comment.parent_comment_id ===
                    commentId
                      ? {
                          ...comment,
                          parent_comment_id:
                            null,
                        }
                      : comment,
                ),
          )

        if (
          replyingTo?.id ===
          commentId
        ) {
          setReplyingTo(null)
        }

        onCommentDeleted?.(
          post.id,
        )
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '删除评论失败',
        )
      } finally {
        setDeletingCommentId(
          null,
        )
      }
    }

  if (
    !open ||
    !post
  ) {
    return null
  }

  const postAuthor =
    post.profiles

  const renderComment = (
    comment: CommunityComment,
    nested = false,
  ) => {
    const author =
      comment.profiles

    const isOwnComment =
      currentUserId ===
      comment.author_id

    const childReplies =
      repliesByParent.get(
        comment.id,
      ) ?? []

    return (
      <div
        key={comment.id}
      >
        <article
          className={
            nested
              ? 'ml-12 border-l border-border px-4 py-4 sm:ml-14'
              : 'px-5 py-5 sm:px-6'
          }
        >
          <div className="flex gap-3">

            {author?.profile_slug ? (
              <Link
                href={`/profile/${author.profile_slug}`}
                onClick={(event) => {
                  event.stopPropagation()
                }}
                className="shrink-0"
              >
                <img
                  src={
                    author.avatar_url ||
                    '/placeholder-user.jpg'
                  }
                  alt=""
                  className="size-10 rounded-full object-cover transition-opacity hover:opacity-85"
                />
              </Link>
            ) : (
              <img
                src={
                  author?.avatar_url ||
                  '/placeholder-user.jpg'
                }
                alt=""
                className="size-10 shrink-0 rounded-full object-cover"
              />
            )}

            <div className="min-w-0 flex-1">

              <div className="flex items-center justify-between gap-3">

                <div className="flex min-w-0 flex-wrap items-center gap-x-2">

                  {author?.profile_slug ? (
                    <Link
                      href={`/profile/${author.profile_slug}`}
                      onClick={(event) => {
                        event.stopPropagation()
                      }}
                      className="truncate text-sm font-semibold transition-colors hover:text-[#a66700]"
                    >
                      {getDisplayName(
                        author,
                      )}
                    </Link>
                  ) : (
                    <span className="truncate text-sm font-semibold">
                      {getDisplayName(
                        author,
                      )}
                    </span>
                  )}

                  <span className="text-xs text-muted-foreground">
                    {formatTime(
                      comment.created_at,
                    )}
                  </span>

                </div>

                {isOwnComment && (
                  <button
                    type="button"
                    disabled={
                      deletingCommentId ===
                      comment.id
                    }
                    onClick={() => {
                      void deleteComment(
                        comment.id,
                      )
                    }}
                    className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-red-500 disabled:opacity-40"
                  >
                    {deletingCommentId ===
                    comment.id
                      ? '删除中...'
                      : '删除'}
                  </button>
                )}
              </div>

              <p className="mt-1.5 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-foreground/85">
                  {comment.reply_to_comment_id &&
                    (() => {
                      const repliedComment =
                        comments.find(
                          (item) =>
                            item.id ===
                            comment.reply_to_comment_id,
                        )

                      const repliedAuthor =
                        repliedComment?.profiles

                      return (
                        <>
                          <span className="mr-1 text-muted-foreground">
                            回复
                          </span>

                          {repliedAuthor?.profile_slug ? (
                            <Link
                              href={`/profile/${repliedAuthor.profile_slug}`}
                              onClick={(event) => {
                                event.stopPropagation()
                              }}
                              className="mr-1 font-medium text-[#a66700] hover:underline"
                            >
                              @
                              {getDisplayName(
                                repliedAuthor,
                              )}
                            </Link>
                          ) : repliedAuthor ? (
                            <span className="mr-1 font-medium text-[#a66700]">
                              @
                              {getDisplayName(
                                repliedAuthor,
                              )}
                            </span>
                          ) : null}
                        </>
                      )
                    })()}

                {comment.content}
              </p>

              <button
                type="button"
                  onClick={() => {
                    setReplyingTo(
                      comment,
                    )

                    setErrorMessage('')

                    requestAnimationFrame(() => {
                      textareaRef.current?.focus()
                    })
                  }}
                className="mt-2 text-xs font-medium text-muted-foreground transition-colors hover:text-[#a66700]"
              >
                回复
              </button>

            </div>
          </div>
        </article>

        {!nested &&
          childReplies.map(
            (reply) =>
              renderComment(
                reply,
                true,
              ),
          )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-0 py-0 sm:px-5 sm:py-10">

      <button
        type="button"
        aria-label="关闭评论窗口"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-background shadow-2xl sm:h-auto sm:max-h-[86vh] sm:max-w-2xl sm:rounded-2xl">

        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
          >
            <X
              className="size-5"
              strokeWidth={1.7}
            />
          </button>

          <p className="text-sm font-medium">
            回复动态
          </p>

          <div className="size-9" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">

          <div className="border-b border-border px-5 py-5 sm:px-6">

            <div className="flex gap-3">

            {postAuthor?.profile_slug ? (
              <Link
                href={`/profile/${postAuthor.profile_slug}`}
                onClick={(event) => {
                  event.stopPropagation()
                }}
                className="shrink-0"
              >
                <img
                  src={
                    postAuthor.avatar_url ||
                    '/placeholder-user.jpg'
                  }
                  alt=""
                  className="size-11 rounded-full object-cover transition-opacity hover:opacity-85"
                />
              </Link>
            ) : (
              <img
                src={
                  postAuthor?.avatar_url ||
                  '/placeholder-user.jpg'
                }
                alt=""
                className="size-11 shrink-0 rounded-full object-cover"
              />
            )}

              <div className="min-w-0 flex-1">

                <div className="flex flex-wrap items-center gap-x-2">

                  {postAuthor?.profile_slug ? (
                    <Link
                      href={`/profile/${postAuthor.profile_slug}`}
                      onClick={(event) => {
                        event.stopPropagation()
                      }}
                      className="truncate text-sm font-semibold transition-colors hover:text-[#a66700]"
                    >
                      {getDisplayName(
                        postAuthor,
                      )}
                    </Link>
                  ) : (
                    <span className="truncate text-sm font-semibold">
                      {getDisplayName(
                        postAuthor,
                      )}
                    </span>
                  )}

                  <span className="text-xs text-muted-foreground">
                    {formatTime(
                      post.created_at,
                    )}
                  </span>

                </div>

                <p className="mt-2 whitespace-pre-wrap wrap-break-word text-[15px] leading-7 text-foreground/90">
                  {post.content}
                </p>

              </div>
            </div>
          </div>

          <div className="border-b border-border px-5 py-4 sm:px-6">

            {replyingTo && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-muted px-3 py-2">

                <p className="text-xs text-muted-foreground">
                  正在回复{' '}
                  <span className="font-medium text-foreground">
                    @
                    {getDisplayName(
                      replyingTo.profiles,
                    )}
                  </span>
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null)
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  取消
                </button>
              </div>
            )}

            <div className="flex gap-3">

              {currentUserAvatar ? (
                <img
                  src={
                    currentUserAvatar
                  }
                  alt=""
                  className="size-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <MessageCircle
                    className="size-4 text-muted-foreground"
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">

              <textarea
                ref={textareaRef}
                value={content}
                onChange={(event) => {
                  setContent(
                    event.target.value,
                  )

                    if (
                      errorMessage
                    ) {
                      setErrorMessage(
                        '',
                      )
                    }
                  }}
                  placeholder={
                    replyingTo
                      ? `回复 @${getDisplayName(
                          replyingTo.profiles,
                        )}`
                      : '发表你的回复'
                  }
                  maxLength={500}
                  rows={2}
                  className="min-h-16 w-full resize-none bg-transparent text-[15px] leading-7 outline-none placeholder:text-muted-foreground"
                />

                {errorMessage && (
                  <p className="mt-2 text-xs text-destructive">
                    {errorMessage}
                  </p>
                )}

                  <div className="mt-2 flex items-center justify-between">

                    <div className="flex items-center gap-2">

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
                          className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label="添加表情"
                        >
                          <Smile
                            className="size-4"
                            strokeWidth={1.7}
                          />
                        </button>

                        {emojiOpen && (
                          <div className="absolute bottom-10 left-0 z-50">
                            <EmojiPicker
                              onEmojiClick={
                                insertEmoji
                              }
                              width={320}
                              height={400}
                              lazyLoadEmojis
                            />
                          </div>
                        )}
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {content.length}/500
                      </span>

                    </div>

                    <button
                      type="button"
                      disabled={
                        submitting ||
                        !content.trim()
                      }
                      onClick={() => {
                        void submitComment()
                      }}
                      className="inline-flex h-9 items-center justify-center rounded-full bg-[#a66700] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          回复中
                        </>
                      ) : (
                        '回复'
                      )}
                    </button>

                  </div>
              </div>
            </div>
          </div>

          <div>
            {loading ? (
              <div className="flex min-h-44 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length > 0 ? (
              <>
                <div className="divide-y divide-border">

                  {topLevelComments.map(
                    (comment) =>
                      renderComment(
                        comment,
                      ),
                  )}

                </div>

                {hasMore && (
                  <div className="border-t border-border px-5 py-5 text-center sm:px-6">

                    <button
                      type="button"
                      disabled={
                        loadingMore
                      }
                      onClick={() => {
                        void loadMoreComments()
                      }}
                      className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          加载中...
                        </>
                      ) : (
                        '加载更多回复'
                      )}
                    </button>

                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-44 flex-col items-center justify-center px-6 text-center">

                <MessageCircle
                  className="size-6 text-muted-foreground/50"
                  strokeWidth={1.5}
                />

                <p className="mt-3 text-sm font-medium">
                  还没有回复
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  成为第一个回复这条动态的人。
                </p>

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}