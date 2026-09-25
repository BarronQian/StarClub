'use client'

import {
  Fragment,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'

import {
  toast,
} from 'sonner'

import {
  createClient,
} from '@supabase/supabase-js'

import {
  AdminHeader,
} from '@/components/admin/admin-header'

import {
  Button,
} from '@/components/ui/button'

import {
  Badge,
} from '@/components/ui/badge'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  uploadArchiveImage,
} from '@/lib/archive-upload'

import type {
  ArchiveDbCategory,
} from '@/lib/archive-db'

import {
  ArchiveCategoryEditDialog,
} from '@/components/admin/archive-category-edit-dialog'

import {
  ArchiveAlbumCreateDialog,
} from '@/components/admin/archive-album-create-dialog'

import {
  ArchiveAlbumEditDialog,
} from '@/components/admin/archive-album-edit-dialog'

import {
  ArchiveSessionCreateDialog,
} from '@/components/admin/archive-session-create-dialog'

import {
  ArchiveSessionEditDialog,
} from '@/components/admin/archive-session-edit-dialog'

import {
  ArchiveVideoCreateDialog,
} from '@/components/admin/archive-video-create-dialog'

import {
  ArchiveVideoEditDialog,
} from '@/components/admin/archive-video-edit-dialog'

import {
  ArchivePhotoUploadDialog,
} from '@/components/admin/archive-photo-upload-dialog'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type CategoryFormState = {
  indexLabel: string
  title: string
  en: string
  slug: string
  summary: string
  isPublished: boolean
}

const EMPTY_FORM: CategoryFormState = {
  indexLabel: '',
  title: '',
  en: '',
  slug: '',
  summary: '',
  isPublished: true,
}

function createSlug(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(
      /[^a-z0-9-_]/g,
      '',
    )
    .replace(/-+/g, '-')
    .replace(
      /^[-_]+|[-_]+$/g,
      '',
    )
}

function getErrorMessage(
  value: unknown,
  fallback: string,
) {
  if (
    value &&
    typeof value === 'object' &&
    'error' in value &&
    typeof (
      value as {
        error?: unknown
      }
    ).error === 'string'
  ) {
    return (
      value as {
        error: string
      }
    ).error
  }

  return fallback
}

export function ArchiveAdmin({
  initialCategories,
  adminEmail,
}: {
  initialCategories:
    ArchiveDbCategory[]

  adminEmail: string
}) {
  const [
    categories,
    setCategories,
  ] = useState<
    ArchiveDbCategory[]
  >(initialCategories)

  const [
    editingCategory,
    setEditingCategory,
  ] =
    useState<
      ArchiveDbCategory | null
    >(null)

  const [
    deletingCategory,
    setDeletingCategory,
  ] =
    useState<
      ArchiveDbCategory | null
    >(null)

  const [
    isDeleting,
    setIsDeleting,
  ] =
    useState(false)

  const [
    isReordering,
    setIsReordering,
  ] =
    useState(false)
  
  const [
    creatingAlbumCategory,
    setCreatingAlbumCategory,
  ] =
    useState<
      ArchiveDbCategory | null
    >(null)

  const [
  editingAlbum,
  setEditingAlbum,
] =
  useState<
    ArchiveDbCategory['albums'][number] | null
  >(null)

  const [
  editingSession,
  setEditingSession,
] =
  useState<
    ArchiveDbCategory['albums'][number]['sessions'][number] | null
  >(null)

  const [
    deletingSession,
    setDeletingSession,
  ] =
    useState<
      ArchiveDbCategory['albums'][number]['sessions'][number] | null
    >(null)

  const [
    isDeletingSession,
    setIsDeletingSession,
  ] =
    useState(false)

  const [
    reorderingSessionAlbumId,
    setReorderingSessionAlbumId,
  ] =
    useState<string | null>(
      null,
    )
  
  const [
    creatingVideoSession,
    setCreatingVideoSession,
  ] =
    useState<
      ArchiveDbCategory['albums'][number]['sessions'][number] | null
    >(null)

  const [
    editingVideo,
    setEditingVideo,
  ] =
    useState<
      ArchiveDbCategory['albums'][number]['sessions'][number]['videos'][number] | null
    >(null)

  const [
    deletingVideo,
    setDeletingVideo,
  ] =
    useState<
      ArchiveDbCategory['albums'][number]['sessions'][number]['videos'][number] | null
    >(null)

  const [
    isDeletingVideo,
    setIsDeletingVideo,
  ] =
    useState(false)

  const [
    uploadingPhotoSession,
    setUploadingPhotoSession,
  ] =
    useState<
      ArchiveDbCategory['albums'][number]['sessions'][number] | null
    >(null)

  const [
    deletingAlbum,
    setDeletingAlbum,
  ] =
    useState<
      ArchiveDbCategory['albums'][number] | null
    >(null)

  const [
    isDeletingAlbum,
    setIsDeletingAlbum,
  ] =
    useState(false)

  const [
    reorderingCategoryId,
    setReorderingCategoryId,
  ] =
    useState<string | null>(
      null,
    )

    const [
    creatingSessionAlbum,
    setCreatingSessionAlbum,
  ] =
    useState<
      ArchiveDbCategory['albums'][number] | null
    >(null)

    const [
      form,
      setForm,
    ] =
      useState<CategoryFormState>(
        EMPTY_FORM,
      )

    const [
      coverFile,
      setCoverFile,
    ] =
      useState<File | null>(
        null,
      )

    const [
      coverPreview,
      setCoverPreview,
    ] =
      useState<string | null>(
        null,
      )

    const [
      isSubmitting,
      setIsSubmitting,
    ] =
      useState(false)

    const [
      uploadStage,
      setUploadStage,
    ] =
      useState('')

  function updateForm<
    K extends keyof CategoryFormState,
  >(
    key: K,
    value: CategoryFormState[K],
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [key]: value,
      }),
    )
  }

  function handleTitleChange(
    value: string,
  ) {
    setForm(
      (previous) => {
        const shouldGenerateSlug =
          !previous.slug ||
          previous.slug ===
            createSlug(
              previous.title,
            )

        return {
          ...previous,
          title: value,

          slug:
            shouldGenerateSlug
              ? createSlug(value)
              : previous.slug,
        }
      },
    )
  }

  function handleCoverChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (
      !allowedTypes.includes(
        file.type,
      )
    ) {
      toast.error(
        '封面仅支持 JPG、PNG、WebP',
      )

      event.target.value = ''

      return
    }

    if (
      file.size >
      30 * 1024 * 1024
    ) {
      toast.error(
        '封面不能超过 30MB',
      )

      event.target.value = ''

      return
    }

  if (
    coverPreview?.startsWith(
      'blob:',
    )
  ) {
    URL.revokeObjectURL(
      coverPreview,
    )
  }

    const preview =
      URL.createObjectURL(file)

    setCoverFile(file)
    setCoverPreview(preview)
  }

  function clearCover() {
    if (
      coverPreview?.startsWith(
        'blob:',
      )
    ) {
      URL.revokeObjectURL(
        coverPreview,
      )
    }

    setCoverFile(null)
    setCoverPreview(null)
  }

  async function getAccessToken() {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL

    const anonKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (
      !supabaseUrl ||
      !anonKey
    ) {
      throw new Error(
        'Supabase 浏览器配置缺失',
      )
    }

    const supabase =
      createClient(
        supabaseUrl,
        anonKey,
      )

    const {
      data,
    } =
      await supabase.auth
        .getSession()

    const accessToken =
      data.session
        ?.access_token

    if (!accessToken) {
      throw new Error(
        '登录状态已失效，请重新登录',
      )
    }

    return {
      supabase,
      accessToken,
    }
  }

  function handleCategorySaved(
  updated:
    ArchiveDbCategory,
) {
  setCategories(
    (previous) =>
      previous.map(
        (category) =>
          category.id ===
          updated.id
            ? updated
            : category,
      ),
  )

  setEditingCategory(null)
}

  function handleAlbumCreated(
  createdAlbum:
    ArchiveDbCategory['albums'][number],
) {
  setCategories(
    (previous) =>
      previous.map(
        (category) => {
          if (
            category.id !==
            createdAlbum.categoryId
          ) {
            return category
          }

          return {
            ...category,

            albums: [
              ...category.albums,
              createdAlbum,
            ].sort(
              (
                first,
                second,
              ) =>
                first.sortOrder -
                second.sortOrder,
            ),
          }
        },
      ),
  )

  setCreatingAlbumCategory(
    null,
  )
}
  
function handleSessionCreated(
  createdSession:
    ArchiveDbCategory['albums'][number]['sessions'][number],
) {
  if (!creatingSessionAlbum) {
    return
  }

  const albumId =
    creatingSessionAlbum.id

  setCategories(
    (previous) =>
      previous.map(
        (category) => ({
          ...category,

          albums:
            category.albums.map(
              (album) => {
                if (
                  album.id !==
                  albumId
                ) {
                  return album
                }

                return {
                  ...album,

                  sessions: [
                    ...album.sessions,
                    createdSession,
                  ].sort(
                    (
                      first,
                      second,
                    ) =>
                      first.sortOrder -
                      second.sortOrder,
                  ),
                }
              },
            ),
        }),
      ),
  )

  setCreatingSessionAlbum(
    null,
  )
}

  function handleSessionSaved(
    updatedSession:
      ArchiveDbCategory['albums'][number]['sessions'][number],
  ) {
    setCategories(
      (previous) =>
        previous.map(
          (category) => ({
            ...category,

            albums:
              category.albums.map(
                (album) => ({
                  ...album,

                  sessions:
                    album.sessions.map(
                      (session) =>
                        session.id ===
                        updatedSession.id
                          ? updatedSession
                          : session,
                    ),
                }),
              ),
          }),
        ),
    )

    setEditingSession(
      null,
    )
  }

  async function handleDeleteSession() {
  if (
    !deletingSession ||
    isDeletingSession
  ) {
    return
  }

  setIsDeletingSession(true)

  try {
    const response =
      await fetch(
        `/api/admin/archive/sessions/${encodeURIComponent(
          deletingSession.id,
        )}`,
        {
          method: 'DELETE',
        },
      )

    const result =
      await response
        .json()
        .catch(() => null)

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          result,
          '删除 Session 失败',
        ),
      )
    }

    setCategories(
      (previous) =>
        previous.map(
          (category) => ({
            ...category,

            albums:
              category.albums.map(
                (album) => ({
                  ...album,

                  sessions:
                    album.sessions.filter(
                      (session) =>
                        session.id !==
                        deletingSession.id,
                    ),
                }),
              ),
          }),
        ),
    )

    toast.success(
      'Session 已删除',
    )

    setDeletingSession(
      null,
    )
  } catch (error) {
    console.error(
      '[Archive session delete]',
      error,
    )

    toast.error(
      error instanceof Error
        ? error.message
        : '删除 Session 失败，请重试',
    )
  } finally {
    setIsDeletingSession(
      false,
    )
  }
}

  async function moveSession(
  albumId: string,
  sessionId: string,
  direction: -1 | 1,
) {
  if (
    reorderingSessionAlbumId
  ) {
    return
  }

  let currentSessions:
    ArchiveDbCategory['albums'][number]['sessions'] =
      []

  for (const category of categories) {
    const album =
      category.albums.find(
        (item) =>
          item.id === albumId,
      )

    if (album) {
      currentSessions =
        album.sessions

      break
    }
  }

  const currentIndex =
    currentSessions.findIndex(
      (session) =>
        session.id ===
        sessionId,
    )

  if (currentIndex < 0) {
    return
  }

  const nextIndex =
    currentIndex +
    direction

  if (
    nextIndex < 0 ||
    nextIndex >=
      currentSessions.length
  ) {
    return
  }

  const reordered =
    [...currentSessions]

  const [
    movedSession,
  ] =
    reordered.splice(
      currentIndex,
      1,
    )

  reordered.splice(
    nextIndex,
    0,
    movedSession,
  )

  const normalized =
    reordered.map(
      (
        session,
        index,
      ) => ({
        ...session,
        sortOrder: index,
      }),
    )

  setReorderingSessionAlbumId(
    albumId,
  )

  try {
    const response =
      await fetch(
        '/api/admin/archive/sessions/reorder',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              album_id:
                albumId,

              items:
                normalized.map(
                  (
                    session,
                    index,
                  ) => ({
                    id:
                      session.id,

                    sort_order:
                      index,
                  }),
                ),
            }),
        },
      )

    const result =
      await response
        .json()
        .catch(() => null)

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          result,
          'Session 排序失败',
        ),
      )
    }

    setCategories(
      (previous) =>
        previous.map(
          (category) => ({
            ...category,

            albums:
              category.albums.map(
                (album) =>
                  album.id ===
                  albumId
                    ? {
                        ...album,
                        sessions:
                          normalized,
                      }
                    : album,
              ),
          }),
        ),
    )

    toast.success(
      'Session 顺序已更新',
    )
  } catch (error) {
    console.error(
      '[Archive session reorder]',
      error,
    )

    toast.error(
      error instanceof Error
        ? error.message
        : 'Session 排序失败，请重试',
    )
  } finally {
    setReorderingSessionAlbumId(
      null,
    )
  }
}

  function handleVideoCreated(
  createdVideo:
    ArchiveDbCategory['albums'][number]['sessions'][number]['videos'][number],
) {
  if (!creatingVideoSession) {
    return
  }

  const targetSessionId =
    creatingVideoSession.id

  setCategories(
    (previous) =>
      previous.map(
        (category) => ({
          ...category,

          albums:
            category.albums.map(
              (album) => ({
                ...album,

                sessions:
                  album.sessions.map(
                    (session) =>
                      session.id ===
                      targetSessionId
                        ? {
                            ...session,

                            videos: [
                              ...session.videos,
                              createdVideo,
                            ].sort(
                              (
                                a,
                                b,
                              ) =>
                                a.sortOrder -
                                b.sortOrder,
                            ),
                          }
                        : session,
                  ),
              }),
            ),
        }),
      ),
  )

  setCreatingVideoSession(
    null,
  )
}

function handleVideoSaved(
  updatedVideo:
    ArchiveDbCategory['albums'][number]['sessions'][number]['videos'][number],
) {
  setCategories(
    (previous) =>
      previous.map(
        (category) => ({
          ...category,

          albums:
            category.albums.map(
              (album) => ({
                ...album,

                sessions:
                  album.sessions.map(
                    (session) => ({
                      ...session,

                      videos:
                        session.videos.map(
                          (video) =>
                            video.id ===
                            updatedVideo.id
                              ? updatedVideo
                              : video,
                        ),
                    }),
                  ),
              }),
            ),
        }),
      ),
  )

  setEditingVideo(
    null,
  )
}

async function handleDeleteVideo() {
  if (
    !deletingVideo ||
    isDeletingVideo
  ) {
    return
  }

  const targetVideoId =
    deletingVideo.id

  setIsDeletingVideo(
    true,
  )

  try {
    const response =
      await fetch(
        `/api/admin/archive/videos/${encodeURIComponent(
          targetVideoId,
        )}`,
        {
          method: 'DELETE',
        },
      )

    const result =
      await response
        .json()
        .catch(() => null)

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          result,
          '删除视频失败',
        ),
      )
    }

    setCategories(
      (previous) =>
        previous.map(
          (category) => ({
            ...category,

            albums:
              category.albums.map(
                (album) => ({
                  ...album,

                  sessions:
                    album.sessions.map(
                      (session) => ({
                        ...session,

                        videos:
                          session.videos.filter(
                            (video) =>
                              video.id !==
                              targetVideoId,
                          ),
                      }),
                    ),
                }),
              ),
          }),
        ),
    )

    toast.success(
      '视频已删除',
    )

    setDeletingVideo(
      null,
    )
  } catch (error) {
    console.error(
      '[Archive video delete]',
      error,
    )

    toast.error(
      error instanceof Error
        ? error.message
        : '删除视频失败，请重试',
    )
  } finally {
    setIsDeletingVideo(
      false,
    )
  }
}

function handlePhotosUploaded(
  uploadedPhotos:
    ArchiveDbCategory['albums'][number]['sessions'][number]['photos'],
) {
  if (!uploadingPhotoSession) {
    return
  }

  const targetSessionId =
    uploadingPhotoSession.id

  setCategories(
    (previous) =>
      previous.map(
        (category) => ({
          ...category,

          albums:
            category.albums.map(
              (album) => ({
                ...album,

                sessions:
                  album.sessions.map(
                    (session) =>
                      session.id ===
                      targetSessionId
                        ? {
                            ...session,

                            photos: [
                              ...session.photos,
                              ...uploadedPhotos,
                            ].sort(
                              (
                                a,
                                b,
                              ) =>
                                a.sortOrder -
                                b.sortOrder,
                            ),
                          }
                        : session,
                  ),
              }),
            ),
        }),
      ),
  )

  setUploadingPhotoSession(
    null,
  )
}

  function handleAlbumSaved(
  updatedAlbum:
    ArchiveDbCategory['albums'][number],
  previousCategoryId:
    string,
) {
  setCategories(
    (previous) =>
      previous.map(
        (category) => {
          /*
           * 如果发生跨 Category 移动，
           * 先从旧 Category 删除。
           */
          if (
            previousCategoryId !==
              updatedAlbum.categoryId &&
            category.id ===
              previousCategoryId
          ) {
            return {
              ...category,

              albums:
                category.albums.filter(
                  (album) =>
                    album.id !==
                    updatedAlbum.id,
                ),
            }
          }

          /*
           * 目标 Category：
           *
           * 同 Category 编辑 → 替换
           * 跨 Category 移动 → 加入
           */
          if (
            category.id ===
            updatedAlbum.categoryId
          ) {
            const alreadyExists =
              category.albums.some(
                (album) =>
                  album.id ===
                  updatedAlbum.id,
              )

            const albums =
              alreadyExists
                ? category.albums.map(
                    (album) =>
                      album.id ===
                      updatedAlbum.id
                        ? updatedAlbum
                        : album,
                  )
                : [
                    ...category.albums,
                    updatedAlbum,
                  ]

            return {
              ...category,

              albums:
                albums.sort(
                  (
                    first,
                    second,
                  ) =>
                    first.sortOrder -
                    second.sortOrder,
                ),
            }
          }

          return category
        },
      ),
  )

  setEditingAlbum(null)
}

async function handleDeleteAlbum() {
  if (
    !deletingAlbum ||
    isDeletingAlbum
  ) {
    return
  }

  setIsDeletingAlbum(true)

  try {
    const response =
      await fetch(
        `/api/admin/archive/albums/${encodeURIComponent(
          deletingAlbum.id,
        )}`,
        {
          method:
            'DELETE',
        },
      )

    const result =
      await response
        .json()
        .catch(() => null)

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          result,
          '删除 Album 失败',
        ),
      )
    }

    setCategories(
      (previous) =>
        previous.map(
          (category) => ({
            ...category,

            albums:
              category.albums.filter(
                (album) =>
                  album.id !==
                  deletingAlbum.id,
              ),
          }),
        ),
    )

    toast.success(
      'Album 已删除',
    )

    setDeletingAlbum(null)
  } catch (error) {
    console.error(
      '[Archive album delete]',
      error,
    )

    toast.error(
      error instanceof Error
        ? error.message
        : '删除 Album 失败，请重试',
    )
  } finally {
    setIsDeletingAlbum(
      false,
    )
  }
}

async function moveAlbum(
  categoryId: string,
  albumId: string,
  direction:
    | 'up'
    | 'down',
) {
  if (
    reorderingCategoryId
  ) {
    return
  }

  const category =
    categories.find(
      (item) =>
        item.id ===
        categoryId,
    )

  if (!category) {
    return
  }

  const currentIndex =
    category.albums.findIndex(
      (album) =>
        album.id ===
        albumId,
    )

  if (
    currentIndex === -1
  ) {
    return
  }

  const targetIndex =
    direction === 'up'
      ? currentIndex - 1
      : currentIndex + 1

  if (
    targetIndex < 0 ||
    targetIndex >=
      category.albums.length
  ) {
    return
  }

  const previousCategories =
    categories

  const reordered =
    [...category.albums]

  const [
    movedAlbum,
  ] =
    reordered.splice(
      currentIndex,
      1,
    )

  reordered.splice(
    targetIndex,
    0,
    movedAlbum,
  )

  const normalized =
    reordered.map(
      (
        album,
        index,
      ) => ({
        ...album,
        sortOrder:
          index,
      }),
    )

  setCategories(
    (previous) =>
      previous.map(
        (item) =>
          item.id ===
          categoryId
            ? {
                ...item,
                albums:
                  normalized,
              }
            : item,
      ),
  )

  setReorderingCategoryId(
    categoryId,
  )

  try {
    const response =
      await fetch(
        '/api/admin/archive/albums/reorder',
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              category_id:
                categoryId,

              items:
                normalized.map(
                  (album) => ({
                    id:
                      album.id,
                  }),
                ),
            }),
        },
      )

    const result =
      await response
        .json()
        .catch(() => null)

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          result,
          '保存 Album 排序失败',
        ),
      )
    }

    toast.success(
      'Album 顺序已保存',
    )
  } catch (error) {
    /*
     * API 失败恢复修改前状态。
     */
    setCategories(
      previousCategories,
    )

    console.error(
      '[Archive album reorder]',
      error,
    )

    toast.error(
      error instanceof Error
        ? error.message
        : '保存 Album 排序失败',
    )
  } finally {
    setReorderingCategoryId(
      null,
    )
  }
}

async function handleDeleteCategory() {
  if (
    !deletingCategory ||
    isDeleting
  ) {
    return
  }

  /*
   * Category 下面已经存在 Album 时，
   * 不允许从后台直接删除。
   *
   * 数据库本身也有 RESTRICT，
   * 这里提前给管理员更友好的提示。
   */
  if (
    deletingCategory.albums
      .length > 0
  ) {
    toast.error(
      '该分类下还有 Album，请先移动或删除其中的 Album',
    )

    setDeletingCategory(null)

    return
  }

  setIsDeleting(true)

  try {
    const response =
      await fetch(
        `/api/admin/archive/categories/${encodeURIComponent(
          deletingCategory.id,
        )}`,
        {
          method:
            'DELETE',
        },
      )

    const result =
      await response
        .json()
        .catch(() => null)

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          result,
          '删除分类失败',
        ),
      )
    }

    setCategories(
      (previous) =>
        previous.filter(
          (category) =>
            category.id !==
            deletingCategory.id,
        ),
    )

    toast.success(
      '合影分类已删除',
    )

    setDeletingCategory(null)
  } catch (error) {
    console.error(
      '[Archive category delete]',
      error,
    )

    toast.error(
      error instanceof Error
        ? error.message
        : '删除分类失败，请重试',
    )
  } finally {
    setIsDeleting(false)
  }
}

async function moveCategory(
  categoryId: string,
  direction:
    | 'up'
    | 'down',
) {
  if (isReordering) {
    return
  }

  const currentIndex =
    categories.findIndex(
      (category) =>
        category.id ===
        categoryId,
    )

  if (currentIndex === -1) {
    return
  }

  const targetIndex =
    direction === 'up'
      ? currentIndex - 1
      : currentIndex + 1

  if (
    targetIndex < 0 ||
    targetIndex >=
      categories.length
  ) {
    return
  }

  const previousCategories =
    [...categories]

  const reordered =
    [...categories]

  const [
    movedCategory,
  ] =
    reordered.splice(
      currentIndex,
      1,
    )

  reordered.splice(
    targetIndex,
    0,
    movedCategory,
  )

  const normalized =
    reordered.map(
      (
        category,
        index,
      ) => ({
        ...category,
        sortOrder: index,
      }),
    )

  /*
   * 先立即更新画面，
   * 后台操作感觉会更快。
   * API 失败再恢复。
   */
  setCategories(
    normalized,
  )

  setIsReordering(true)

  try {
    const response =
      await fetch(
        '/api/admin/archive/categories/reorder',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              items:
                normalized.map(
                  (
                    category,
                  ) => ({
                    id:
                      category.id,
                  }),
                ),
            }),
        },
      )

    const result =
      await response
        .json()
        .catch(() => null)

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          result,
          '保存分类排序失败',
        ),
      )
    }

    toast.success(
      '分类顺序已保存',
    )
  } catch (error) {
    setCategories(
      previousCategories,
    )

    console.error(
      '[Archive category reorder]',
      error,
    )

    toast.error(
      error instanceof Error
        ? error.message
        : '保存分类排序失败',
    )
  } finally {
    setIsReordering(false)
  }
}

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault()

    if (
      !form.title.trim()
    ) {
      toast.error(
        '请填写分类名称',
      )

      return
    }

    if (
      !form.slug.trim()
    ) {
      toast.error(
        '请填写分类 Slug',
      )

      return
    }

    setIsSubmitting(true)
    setUploadStage('')

    try {
      let coverOriginalUrl:
        string | null = null

      let coverDisplayUrl:
        string | null = null

      let coverThumbnailUrl:
        string | null = null

    if (coverFile) {
      const {
        supabase,
        accessToken,
      } =
        await getAccessToken()

      const uploaded =
        await uploadArchiveImage({
          supabase,
          accessToken,
          file: coverFile,
          kind: 'cover',
          onStage:
            setUploadStage,
        })

      coverOriginalUrl =
        uploaded.originalUrl

      coverDisplayUrl =
        uploaded.displayUrl

      coverThumbnailUrl =
        uploaded.thumbnailUrl
    }

      setUploadStage(
        '正在保存分类...',
      )

      const response =
        await fetch(
          '/api/admin/archive/categories',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                slug:
                  form.slug,

                index_label:
                  form.indexLabel,

                title:
                  form.title,

                en:
                  form.en,

                summary:
                  form.summary,

                cover_original_url:
                  coverOriginalUrl,

                cover_display_url:
                  coverDisplayUrl,

                cover_thumbnail_url:
                  coverThumbnailUrl,

                is_published:
                  form.isPublished,
              }),
          },
        )

      const result =
        await response
          .json()
          .catch(() => null)

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            '创建分类失败',
          ),
        )
      }

      if (
        !result?.category
      ) {
        throw new Error(
          '服务器没有返回新分类',
        )
      }

    const created:
      ArchiveDbCategory = {
      id:
        result.category.id,

      slug:
        result.category.slug,

      index:
        result.category
          .index_label,

      title:
        result.category.title,

      en:
        result.category.en,

      summary:
        result.category.summary,

      coverOriginalUrl:
        result.category
          .cover_original_url,

      coverDisplayUrl:
        result.category
          .cover_display_url,

      coverThumbnailUrl:
        result.category
          .cover_thumbnail_url,

      sortOrder:
        result.category
          .sort_order,

      isPublished:
        result.category
          .is_published,

      albums: [],
    }

    setCategories(
      (previous) => [
        ...previous,
        created,
      ],
    )

      setForm(
        EMPTY_FORM,
      )

      clearCover()

      toast.success(
        '合影分类创建成功',
      )
    } catch (error) {
      console.error(
        '[Archive category create]',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '创建分类失败，请重试',
      )
    } finally {
      setIsSubmitting(false)
      setUploadStage('')
    }
  }

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
              新建合影分类
            </h2>

            <p className="mt-2 text-xs text-muted-foreground">
              Category 是合影页面的最上层分类，之后可以在分类内建立多个 Album。
            </p>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="corner-cut border border-border bg-card p-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">
                  分类名称 *
                </span>

                <input
                  value={
                    form.title
                  }
                  onChange={(
                    event,
                  ) =>
                    handleTitleChange(
                      event.target
                        .value,
                    )
                  }
                  placeholder="例如：大型活动合影"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">
                  英文名称
                </span>

                <input
                  value={
                    form.en
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      'en',
                      event.target
                        .value,
                    )
                  }
                  placeholder="例如：EVENT ARCHIVE"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">
                  Slug *
                </span>

                <input
                  value={
                    form.slug
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      'slug',
                      createSlug(
                        event.target
                          .value,
                      ),
                    )
                  }
                  placeholder="例如：events"
                  className="h-10 rounded-md border border-input bg-background px-3 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />

                <span className="text-[0.68rem] text-muted-foreground">
                  前台地址：/archive/
                  {form.slug ||
                    'your-slug'}
                </span>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">
                  Index
                </span>

                <input
                  value={
                    form.indexLabel
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      'indexLabel',
                      event.target
                        .value,
                    )
                  }
                  placeholder="例如：01"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
              </label>
            </div>

            <label className="mt-5 flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                分类简介
              </span>

              <textarea
                value={
                  form.summary
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'summary',
                    event.target
                      .value,
                  )
                }
                rows={4}
                placeholder="介绍这个合影分类..."
                className="resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </label>

            <div className="mt-5">
              <p className="mb-2 text-xs text-muted-foreground">
                分类封面
              </p>

              <div className="grid gap-4 md:grid-cols-[240px_1fr]">
                <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted">
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        coverPreview
                      }
                      alt="封面预览"
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
                      尚未选择封面
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center gap-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={
                      isSubmitting
                    }
                    onChange={
                      handleCoverChange
                    }
                    className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-xs file:text-foreground"
                  />

                  <p className="text-[0.68rem] leading-relaxed text-muted-foreground">
                    支持 JPG、PNG、WebP，最大 30MB。原图永久保留，并自动生成 Display 与 Thumbnail。
                  </p>

                  {coverFile ? (
                    <div className="flex items-center gap-3">
                      <span className="max-w-70 truncate text-xs text-foreground">
                        {
                          coverFile.name
                        }
                      </span>

                      <button
                        type="button"
                        disabled={
                          isSubmitting
                        }
                        onClick={
                          clearCover
                        }
                        className="text-xs text-destructive hover:underline disabled:opacity-50"
                      >
                        移除
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <label className="mt-5 flex items-center gap-3">
              <input
                type="checkbox"
                checked={
                  form.isPublished
                }
                disabled={
                  isSubmitting
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'isPublished',
                    event.target
                      .checked,
                  )
                }
                className="size-4"
              />

              <div>
                <p className="text-sm text-foreground">
                  立即发布
                </p>

                <p className="text-[0.68rem] text-muted-foreground">
                  关闭后会作为未发布分类保存在后台。
                </p>
              </div>
            </label>

            <div className="mt-6 flex items-center gap-4">
              <Button
                type="submit"
                disabled={
                  isSubmitting
                }
              >
                {isSubmitting
                  ? '处理中...'
                  : '创建分类'}
              </Button>

              {uploadStage ? (
                <span className="text-xs text-muted-foreground">
                  {
                    uploadStage
                  }
                </span>
              ) : null}
            </div>
          </form>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
              全部分类（
              {
                categories.length
              }
              ）
            </h2>
          </div>

          <div className="corner-cut border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">
                    封面
                  </TableHead>

                  <TableHead>
                    分类
                  </TableHead>

                  <TableHead>
                    Slug
                  </TableHead>

                  <TableHead>
                    Album
                  </TableHead>

                  <TableHead>
                    状态
                  </TableHead>

                  <TableHead className="text-right">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {categories.length ===
                0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      数据库中还没有合影分类
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map(
                    (
                      category,
                    ) => (
                      <TableRow
                        key={
                          category.id
                        }
                      >
                        <TableCell>
                          <div className="relative h-12 w-20 overflow-hidden rounded-sm border border-border bg-muted">
                            {category
                              .coverThumbnailUrl ||
                            category
                              .coverDisplayUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  category
                                    .coverThumbnailUrl ||
                                  category
                                    .coverDisplayUrl ||
                                  ''
                                }
                                alt={
                                  category.title
                                }
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[0.6rem] text-muted-foreground">
                                无封面
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">
                              {
                                category.index
                                  ? `${category.index} · `
                                  : ''
                              }
                              {
                                category.title
                              }
                            </p>

                            {category.en ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {
                                  category.en
                                }
                              </p>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell>
                          <code className="text-xs text-muted-foreground">
                            {
                              category.slug
                            }
                          </code>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {
                            category.albums
                              ?.length ??
                            0
                          }
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              category.isPublished
                                ? 'border-primary/30 text-primary'
                                : ''
                            }
                          >
                            {category.isPublished
                              ? '已发布'
                              : '未发布'}
                          </Badge>
                        </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                  isReordering ||
                                  categories[0]?.id ===
                                    category.id
                                }
                                onClick={() =>
                                  void moveCategory(
                                    category.id,
                                    'up',
                                  )
                                }
                              >
                                ↑
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                  isReordering ||
                                  categories[
                                    categories.length - 1
                                  ]?.id ===
                                    category.id
                                }
                                onClick={() =>
                                  void moveCategory(
                                    category.id,
                                    'down',
                                  )
                                }
                              >
                                ↓
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setEditingCategory(
                                    category,
                                  )
                                }
                              >
                                编辑
                              </Button>

                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  setDeletingCategory(
                                    category,
                                  )
                                }
                              >
                                删除
                              </Button>
                            </div>
                          </TableCell>
                      </TableRow>
                    ),
                  )
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-8 space-y-6">
            {categories.map(
              (category) => (
                <div
                  key={
                    `albums-${category.id}`
                  }
                  className="corner-cut border border-border bg-card"
                >
                  <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-foreground">
                          {category.index
                            ? `${category.index} · `
                            : ''}
                          {category.title}
                        </h3>

                        <Badge
                          variant="outline"
                        >
                          {
                            category.albums
                              .length
                          }{' '}
                          Albums
                        </Badge>
                      </div>

                      {category.en ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {category.en}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        setCreatingAlbumCategory(
                          category,
                        )
                      }
                    >
                      新建 Album
                    </Button>
                  </div>

                  {category.albums
                    .length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <p className="text-sm text-muted-foreground">
                        这个 Category
                        目前还没有 Album
                      </p>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() =>
                          setCreatingAlbumCategory(
                            category,
                          )
                        }
                      >
                        创建第一个 Album
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-28">
                            封面
                          </TableHead>

                          <TableHead>
                            Album
                          </TableHead>

                          <TableHead>
                            Slug
                          </TableHead>

                          <TableHead>
                            地点
                          </TableHead>

                          <TableHead>
                            Session
                          </TableHead>

                          <TableHead>
                            状态
                          </TableHead>

                          <TableHead className="text-right">
                            操作
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {category.albums.map(
                          (album) => (
                            <Fragment
                              key={
                                album.id
                              }
                            >
                              <TableRow>
                              <TableCell>
                                <div className="relative h-12 w-20 overflow-hidden rounded-sm border border-border bg-muted">
                                  {album
                                    .coverThumbnailUrl ||
                                  album
                                    .coverDisplayUrl ||
                                  album
                                    .coverOriginalUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={
                                        album
                                          .coverThumbnailUrl ||
                                        album
                                          .coverDisplayUrl ||
                                        album
                                          .coverOriginalUrl ||
                                        ''
                                      }
                                      alt={
                                        album.title
                                      }
                                      className="absolute inset-0 h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-[0.6rem] text-muted-foreground">
                                      无封面
                                    </div>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {
                                      album.title
                                    }
                                  </p>

                                  {album.en ? (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {
                                        album.en
                                      }
                                    </p>
                                  ) : null}
                                </div>
                              </TableCell>

                              <TableCell>
                                <code className="text-xs text-muted-foreground">
                                  {
                                    album.slug
                                  }
                                </code>
                              </TableCell>

                              <TableCell className="text-xs text-muted-foreground">
                                {album.place ||
                                  '—'}
                              </TableCell>

                              <TableCell className="text-muted-foreground">
                                {
                                  album.sessions
                                    .length
                                }
                              </TableCell>

                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    album.isPublished
                                      ? 'border-primary/30 text-primary'
                                      : ''
                                  }
                                >
                                  {album.isPublished
                                    ? '已发布'
                                    : '未发布'}
                                </Badge>
                              </TableCell>

                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          setCreatingSessionAlbum(
                                            album,
                                          )
                                        }
                                      >
                                        新建 Session
                                      </Button>

                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                          Boolean(
                                            reorderingCategoryId,
                                          ) ||
                                          category.albums[0]
                                            ?.id === album.id
                                        }
                                        onClick={() =>
                                          void moveAlbum(
                                            category.id,
                                            album.id,
                                            'up',
                                          )
                                        }
                                      >
                                        ↑
                                      </Button>

                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={
                                        Boolean(
                                          reorderingCategoryId,
                                        ) ||
                                        category.albums[
                                          category.albums
                                            .length - 1
                                        ]?.id === album.id
                                      }
                                      onClick={() =>
                                        void moveAlbum(
                                          category.id,
                                          album.id,
                                          'down',
                                        )
                                      }
                                    >
                                      ↓
                                    </Button>

                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setEditingAlbum(
                                          album,
                                        )
                                      }
                                    >
                                      编辑
                                    </Button>

                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        setDeletingAlbum(
                                          album,
                                        )
                                      }
                                    >
                                      删除
                                    </Button>
                                  </div>
                                </TableCell>
                            </TableRow>

                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="bg-muted/20 p-0"
                              >
                                <div className="border-t border-border px-5 py-4">
                                  <div className="flex items-center justify-between gap-4">
                                    <div>
                                      <p className="text-xs font-medium text-foreground">
                                        Sessions
                                      </p>

                                      <p className="mt-1 text-[0.68rem] text-muted-foreground">
                                        {album.sessions.length}{' '}
                                        个 Session
                                      </p>
                                    </div>

                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setCreatingSessionAlbum(
                                          album,
                                        )
                                      }
                                    >
                                      新建 Session
                                    </Button>
                                  </div>

                                  {album.sessions.length ===
                                  0 ? (
                                    <div className="mt-4 rounded-md border border-dashed border-border px-4 py-5 text-center">
                                      <p className="text-xs text-muted-foreground">
                                        这个 Album
                                        目前还没有 Session
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="mt-4 space-y-2">
                                      {album.sessions.map(
                                        (
                                          session,
                                          sessionIndex,
                                        ) => (
                                          <div
                                            key={
                                              session.id
                                            }
                                            className="rounded-md border border-border bg-background px-4 py-3"
                                          >
                                            <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                              <p className="text-sm font-medium text-foreground">
                                                {
                                                  session.label
                                                }
                                              </p>

                                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] text-muted-foreground">
                                                <code>
                                                  {
                                                    session.slug
                                                  }
                                                </code>

                                                {session.date ? (
                                                  <span>
                                                    {
                                                      session.date
                                                    }
                                                  </span>
                                                ) : null}

                                                <span>
                                                  {
                                                    session.photos
                                                      .length
                                                  }{' '}
                                                  张照片
                                                </span>

                                                <span>
                                                  {
                                                    session.videos
                                                      .length
                                                  }{' '}
                                                  个视频
                                                </span>
                                              </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                              <Badge
                                                variant="outline"
                                                className={
                                                  session.isPublished
                                                    ? 'border-primary/30 text-primary'
                                                    : ''
                                                }
                                              >
                                                {session.isPublished
                                                  ? '已发布'
                                                  : '未发布'}
                                              </Badge>
                                              
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                  sessionIndex === 0 ||
                                                  reorderingSessionAlbumId ===
                                                    album.id
                                                }
                                                onClick={() =>
                                                  void moveSession(
                                                    album.id,
                                                    session.id,
                                                    -1,
                                                  )
                                                }
                                              >
                                                ↑
                                              </Button>

                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                  sessionIndex ===
                                                    album.sessions.length -
                                                      1 ||
                                                  reorderingSessionAlbumId ===
                                                    album.id
                                                }
                                                onClick={() =>
                                                  void moveSession(
                                                    album.id,
                                                    session.id,
                                                    1,
                                                  )
                                                }
                                              >
                                                ↓
                                              </Button>
                                              
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  setUploadingPhotoSession(
                                                    session,
                                                  )
                                                }
                                              >
                                                上传照片
                                              </Button>

                                              <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                setCreatingVideoSession(
                                                  session,
                                                )
                                              }
                                            >
                                              添加视频
                                            </Button>

                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  setEditingSession(
                                                    session,
                                                  )
                                                }
                                              >
                                                编辑
                                              </Button>

                                              <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                  setDeletingSession(
                                                    session,
                                                  )
                                                }
                                              >
                                                删除
                                              </Button>

                                            </div>
                                            </div>

                                            {session.videos.length > 0 ? (
                                              <div className="mt-3 border-t border-border pt-3">
                                                <p className="mb-2 text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground">
                                                  Videos
                                                </p>

                                                <div className="space-y-2">
                                                  {session.videos.map(
                                                    (video) => (
                                                      <div
                                                        key={
                                                          video.id
                                                        }
                                                        className="flex items-center justify-between gap-4 rounded-md bg-muted/30 px-3 py-2"
                                                      >
                                                        <div className="min-w-0">
                                                          <p className="truncate text-xs font-medium text-foreground">
                                                            {
                                                              video.title
                                                            }
                                                          </p>

                                                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.68rem] text-muted-foreground">
                                                            <Badge
                                                              variant="outline"
                                                              className="h-5 px-1.5 text-[0.62rem]"
                                                            >
                                                              {video.platform ===
                                                              'youtube'
                                                                ? 'YouTube'
                                                                : 'Bilibili'}
                                                            </Badge>

                                                            {video.videoUrl ? (
                                                              <a
                                                                href={
                                                                  video.videoUrl
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="max-w-105 truncate underline underline-offset-2 hover:text-foreground"
                                                              >
                                                                {
                                                                  video.videoUrl
                                                                }
                                                              </a>
                                                            ) : video.embedUrl ? (
                                                              <span className="max-w-105 truncate">
                                                                {
                                                                  video.embedUrl
                                                                }
                                                              </span>
                                                            ) : null}
                                                          </div>
                                                        </div>

                                                          <div className="flex shrink-0 items-center gap-2">
                                                            <Button
                                                              type="button"
                                                              variant="outline"
                                                              size="sm"
                                                              onClick={() =>
                                                                setEditingVideo(
                                                                  video,
                                                                )
                                                              }
                                                            >
                                                              编辑
                                                            </Button>

                                                            <Button
                                                              type="button"
                                                              variant="destructive"
                                                              size="sm"
                                                              onClick={() =>
                                                                setDeletingVideo(
                                                                  video,
                                                                )
                                                              }
                                                            >
                                                              删除
                                                            </Button>
                                                          </div>

                                                      </div>
                                                    ),
                                                  )}
                                                </div>
                                              </div>
                                            ) : null}

                                            {session.photos.length > 0 ? (
                                              <div className="mt-3 border-t border-border pt-3">
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                  <p className="text-xs font-medium text-muted-foreground">
                                                    Photos
                                                  </p>

                                                  <span className="text-xs text-muted-foreground">
                                                    {session.photos.length} 张
                                                  </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                                  {session.photos.map(
                                                    (photo) => (
                                                      <div
                                                        key={photo.id}
                                                        className="overflow-hidden rounded-md border bg-muted/20"
                                                      >
                                                        <div className="relative aspect-4/3 overflow-hidden bg-muted">
                                                          <img
                                                            src={
                                                              photo.thumbnailUrl ||
                                                              photo.displayUrl
                                                            }
                                                            alt={
                                                              photo.alt ||
                                                              'Archive photo'
                                                            }
                                                            className="h-full w-full object-cover"
                                                            loading="lazy"
                                                          />
                                                        </div>

                                                        <div className="space-y-1 p-2">
                                                          <p className="truncate text-xs font-medium">
                                                            {photo.alt ||
                                                              '未命名照片'}
                                                          </p>

                                                          <p className="text-[11px] text-muted-foreground">
                                                            {photo.width &&
                                                            photo.height
                                                              ? `${photo.width} × ${photo.height}`
                                                              : '尺寸未知'}
                                                          </p>

                                                          {photo.caption ? (
                                                            <p className="line-clamp-2 text-[11px] text-muted-foreground">
                                                              {
                                                                photo.caption
                                                              }
                                                            </p>
                                                          ) : null}
                                                        </div>
                                                      </div>
                                                    ),
                                                  )}
                                                </div>
                                              </div>
                                            ) : null}

                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>

                           </Fragment>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ),
            )}
          </div>

        </section>
      </main>

      <ArchiveCategoryEditDialog
        category={
          editingCategory
        }
        open={
          Boolean(
            editingCategory,
          )
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setEditingCategory(
              null,
            )
          }
        }}
        onSaved={
          handleCategorySaved
        }
      />

        <ArchiveAlbumCreateDialog
        category={
          creatingAlbumCategory
        }
        open={
          Boolean(
            creatingAlbumCategory,
          )
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setCreatingAlbumCategory(
              null,
            )
          }
        }}
        onCreated={
          handleAlbumCreated
        }
      />

        <ArchiveAlbumEditDialog
        album={
          editingAlbum
        }
        categories={
          categories
        }
        open={
          Boolean(
            editingAlbum,
          )
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setEditingAlbum(
              null,
            )
          }
        }}
        onSaved={
          handleAlbumSaved
        }
      />
        
      <ArchiveSessionCreateDialog
        album={
          creatingSessionAlbum
        }
        open={
          Boolean(
            creatingSessionAlbum,
          )
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setCreatingSessionAlbum(
              null,
            )
          }
        }}
        onCreated={
          handleSessionCreated
        }
      />

      <ArchiveSessionEditDialog
        session={
          editingSession
        }
        open={
          Boolean(
            editingSession,
          )
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setEditingSession(
              null,
            )
          }
        }}
        onSaved={
          handleSessionSaved
        }
      />
      
      <ArchiveVideoCreateDialog
        session={
          creatingVideoSession
        }
        open={
          Boolean(
            creatingVideoSession,
          )
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setCreatingVideoSession(
              null,
            )
          }
        }}
        onCreated={
          handleVideoCreated
        }
      />

      <ArchiveVideoEditDialog
        video={
          editingVideo
        }
        open={
          Boolean(
            editingVideo,
          )
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setEditingVideo(
              null,
            )
          }
        }}
        onSaved={
          handleVideoSaved
        }
      />
      
      <ArchivePhotoUploadDialog
        session={
          uploadingPhotoSession
        }
        open={
          Boolean(
            uploadingPhotoSession,
          )
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setUploadingPhotoSession(
              null,
            )
          }
        }}
        onUploaded={
          handlePhotosUploaded
        }
      />

      <AlertDialog
  open={
    Boolean(
      deletingVideo,
    )
  }
  onOpenChange={(
    open,
  ) => {
    if (
      !open &&
      !isDeletingVideo
    ) {
      setDeletingVideo(
        null,
      )
    }
  }}
>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        删除这个视频？
      </AlertDialogTitle>

      <AlertDialogDescription>
        {deletingVideo ? (
          <>
            即将删除视频「
            {
              deletingVideo.title
            }
            」。此操作无法撤销。
          </>
        ) : null}
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel
        disabled={
          isDeletingVideo
        }
      >
        取消
      </AlertDialogCancel>

      <AlertDialogAction
        disabled={
          isDeletingVideo
        }
        onClick={(
          event,
        ) => {
          event.preventDefault()

          void handleDeleteVideo()
        }}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {isDeletingVideo
          ? '删除中...'
          : '确认删除'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

      <AlertDialog
  open={
    Boolean(
      deletingSession,
    )
  }
  onOpenChange={(
    open,
  ) => {
    if (
      !open &&
      !isDeletingSession
    ) {
      setDeletingSession(
        null,
      )
    }
  }}
>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        删除这个 Session？
      </AlertDialogTitle>

      <AlertDialogDescription>
        {deletingSession ? (
          <>
            即将删除「
            {
              deletingSession.label
            }
            」。

            {deletingSession.photos
              .length > 0 ||
            deletingSession.videos
              .length > 0 ? (
              <>
                {' '}
                其中包含
                {' '}
                {
                  deletingSession.photos
                    .length
                }
                {' '}
                张照片和
                {' '}
                {
                  deletingSession.videos
                    .length
                }
                {' '}
                个视频。相关数据库记录会一起删除，Archive
                Storage 中属于这个 Session
                的照片也会清理。
              </>
            ) : (
              <>
                {' '}
                此操作无法撤销。
              </>
            )}
          </>
        ) : null}
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel
        disabled={
          isDeletingSession
        }
      >
        取消
      </AlertDialogCancel>

      <AlertDialogAction
        disabled={
          isDeletingSession
        }
        onClick={(
          event,
        ) => {
          event.preventDefault()

          void handleDeleteSession()
        }}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {isDeletingSession
          ? '删除中...'
          : '确认删除'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

      <AlertDialog
        open={
          Boolean(
            deletingAlbum,
          )
        }
        onOpenChange={(
          open,
        ) => {
          if (
            !open &&
            !isDeletingAlbum
          ) {
            setDeletingAlbum(
              null,
            )
          }
        }}
      >
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        删除这个 Album？
      </AlertDialogTitle>

      <AlertDialogDescription>
        {deletingAlbum ? (
          <>
            即将删除「
            {
              deletingAlbum.title
            }
            」。

            {deletingAlbum
              .sessions
              .length > 0 ? (
              <>
                {' '}
                其中包含
                {' '}
                {
                  deletingAlbum
                    .sessions
                    .length
                }
                {' '}
                个 Session。Album、Session、照片和视频数据库记录都会一起删除，相关 Archive Storage 图片也会清理。
              </>
            ) : (
              <>
                {' '}
                Album 封面也会从 Archive Storage 中清理。
              </>
            )}
          </>
        ) : null}
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel
        disabled={
          isDeletingAlbum
        }
      >
        取消
      </AlertDialogCancel>

      <AlertDialogAction
        disabled={
          isDeletingAlbum
        }
        onClick={(
          event,
        ) => {
          event.preventDefault()

          void handleDeleteAlbum()
        }}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {isDeletingAlbum
          ? '删除中...'
          : '确认删除'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

      <AlertDialog
        open={
          Boolean(
            deletingCategory,
          )
        }
        onOpenChange={(
          open,
        ) => {
          if (
            !open &&
            !isDeleting
          ) {
            setDeletingCategory(
              null,
            )
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              删除这个合影分类？
            </AlertDialogTitle>

            <AlertDialogDescription>
              {deletingCategory ? (
                <>
                  即将删除「
                  {
                    deletingCategory.title
                  }
                  」。

                  {deletingCategory
                    .albums
                    .length > 0 ? (
                    <>
                      {' '}
                      当前分类中还有
                      {' '}
                      {
                        deletingCategory
                          .albums
                          .length
                      }
                      {' '}
                      个 Album，因此无法删除。请先移动或删除这些 Album。
                    </>
                  ) : (
                    <>
                      {' '}
                      删除后分类记录及其 Archive Storage 封面将被清理，此操作无法撤销。
                    </>
                  )}
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={
                isDeleting
              }
            >
              取消
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={
                isDeleting ||
                Boolean(
                  deletingCategory
                    ?.albums
                    .length,
                )
              }
              onClick={(
                event,
              ) => {
                event.preventDefault()

                void handleDeleteCategory()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting
                ? '删除中...'
                : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}