'use client'

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'

import {
  createClient,
} from '@supabase/supabase-js'

import {
  toast,
} from 'sonner'

import {
  Button,
} from '@/components/ui/button'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  uploadArchiveImage,
} from '@/lib/archive-upload'

import type {
  ArchiveDbAlbum,
  ArchiveDbCategory,
} from '@/lib/archive-db'

type Props = {
  album:
    | ArchiveDbAlbum
    | null

  categories:
    ArchiveDbCategory[]

  open: boolean

  onOpenChange: (
    open: boolean,
  ) => void

  onSaved: (
    album: ArchiveDbAlbum,
    previousCategoryId: string,
  ) => void
}

type FormState = {
  categoryId: string
  title: string
  en: string
  slug: string
  place: string
  summary: string
  isPublished: boolean
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

export function ArchiveAlbumEditDialog({
  album,
  categories,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [
    form,
    setForm,
  ] =
    useState<FormState>({
      categoryId: '',
      title: '',
      en: '',
      slug: '',
      place: '',
      summary: '',
      isPublished: true,
    })

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
    isSaving,
    setIsSaving,
  ] =
    useState(false)

  const [
    uploadStage,
    setUploadStage,
  ] =
    useState('')

  /*
   * 每次打开不同 Album 时，
   * 用数据库里的当前资料
   * 重置整个表单。
   */
  useEffect(() => {
    if (
      !open ||
      !album
    ) {
      return
    }

    setForm({
      categoryId:
        album.categoryId,

      title:
        album.title,

      en:
        album.en,

      slug:
        album.slug,

      place:
        album.place ?? '',

      summary:
        album.summary,

      isPublished:
        album.isPublished,
    })

    setCoverFile(null)
    setUploadStage('')

    setCoverPreview(
      (previous) => {
        if (
          previous?.startsWith(
            'blob:',
          )
        ) {
          URL.revokeObjectURL(
            previous,
          )
        }

        return (
          album
            .coverThumbnailUrl ||
          album
            .coverDisplayUrl ||
          album
            .coverOriginalUrl ||
          null
        )
      },
    )
  }, [
    album,
    open,
  ])

  function updateForm<
    K extends keyof FormState,
  >(
    key: K,
    value: FormState[K],
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [key]: value,
      }),
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
      URL.createObjectURL(
        file,
      )

    setCoverFile(file)
    setCoverPreview(preview)
  }

  function cancelNewCover() {
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

    setCoverPreview(
      album
        ?.coverThumbnailUrl ||
      album
        ?.coverDisplayUrl ||
      album
        ?.coverOriginalUrl ||
      null,
    )
  }

  async function getUploadContext() {
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

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault()

    if (!album) {
      return
    }

    if (
      !form.categoryId
    ) {
      toast.error(
        '请选择所属 Category',
      )

      return
    }

    if (
      !form.title.trim()
    ) {
      toast.error(
        '请填写 Album 名称',
      )

      return
    }

    if (
      !form.slug.trim()
    ) {
      toast.error(
        '请填写 Album Slug',
      )

      return
    }

    setIsSaving(true)
    setUploadStage('')

    try {
      const previousCategoryId =
        album.categoryId

      /*
       * 默认继续使用原来的封面。
       * 只有选择新文件时，
       * 才上传新的三层图片。
       */
      let coverOriginalUrl =
        album.coverOriginalUrl

      let coverDisplayUrl =
        album.coverDisplayUrl

      let coverThumbnailUrl =
        album.coverThumbnailUrl

      if (coverFile) {
        const {
          supabase,
          accessToken,
        } =
          await getUploadContext()

        const uploaded =
          await uploadArchiveImage({
            supabase,
            accessToken,
            file:
              coverFile,
            kind:
              'cover',
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
        '正在保存 Album...',
      )

      const response =
        await fetch(
          `/api/admin/archive/albums/${encodeURIComponent(
            album.id,
          )}`,
          {
            method:
              'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                category_id:
                  form.categoryId,

                slug:
                  createSlug(
                    form.slug,
                  ),

                title:
                  form.title,

                en:
                  form.en,

                summary:
                  form.summary,

                place:
                  form.place,

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
            '保存 Album 失败',
          ),
        )
      }

      if (!result?.album) {
        throw new Error(
          '服务器没有返回 Album 数据',
        )
      }

      /*
       * PATCH API 返回数据库
       * snake_case。
       *
       * 转回后台统一使用的
       * ArchiveDbAlbum。
       *
       * 编辑 Album 本身不会修改
       * Session，所以继续保留
       * 当前 sessions。
       */
      const updated:
        ArchiveDbAlbum = {
        id:
          result.album.id,

        categoryId:
          result.album
            .category_id,

        slug:
          result.album.slug,

        title:
          result.album.title,

        en:
          result.album.en,

        summary:
          result.album.summary,

        place:
          result.album.place,

        coverOriginalUrl:
          result.album
            .cover_original_url,

        coverDisplayUrl:
          result.album
            .cover_display_url,

        coverThumbnailUrl:
          result.album
            .cover_thumbnail_url,

        sortOrder:
          result.album
            .sort_order,

        isPublished:
          result.album
            .is_published,

        sessions:
          album.sessions,
      }

      onSaved(
        updated,
        previousCategoryId,
      )

      toast.success(
        previousCategoryId ===
          updated.categoryId
          ? 'Album 已保存'
          : 'Album 已移动并保存',
      )

      onOpenChange(false)
    } catch (error) {
      console.error(
        '[Archive album edit]',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '保存 Album 失败，请重试',
      )
    } finally {
      setIsSaving(false)
      setUploadStage('')
    }
  }

  const selectedCategory =
    categories.find(
      (category) =>
        category.id ===
        form.categoryId,
    )

  return (
    <Dialog
      open={open}
      onOpenChange={(
        nextOpen,
      ) => {
        if (isSaving) {
          return
        }

        onOpenChange(
          nextOpen,
        )
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            编辑 Album
          </DialogTitle>

          <DialogDescription>
            修改 Album 资料、所属分类、封面与发布状态。
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-2 space-y-5"
        >
          <label className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              所属 Category *
            </span>

            <select
              value={
                form.categoryId
              }
              disabled={
                isSaving
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  'categoryId',
                  event.target
                    .value,
                )
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
            >
              {categories.map(
                (category) => (
                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {category.index
                      ? `${category.index} · `
                      : ''}
                    {
                      category.title
                    }
                  </option>
                ),
              )}
            </select>

            {album &&
            form.categoryId !==
              album.categoryId ? (
              <p className="text-[0.68rem] text-amber-500">
                保存后 Album 将移动到「
                {selectedCategory
                  ?.title ||
                  '目标 Category'}
                」并自动排在该 Category 最后。
              </p>
            ) : null}
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                Album 名称 *
              </span>

              <input
                value={
                  form.title
                }
                disabled={
                  isSaving
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'title',
                    event.target
                      .value,
                  )
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
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
                disabled={
                  isSaving
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
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
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
                disabled={
                  isSaving
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
                className="h-10 rounded-md border border-input bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
              />

              <span className="text-[0.68rem] text-muted-foreground">
                /archive/
                {selectedCategory
                  ?.slug ||
                  'category'}
                /
                {form.slug ||
                  'album-slug'}
              </span>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                地点
              </span>

              <input
                value={
                  form.place
                }
                disabled={
                  isSaving
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'place',
                    event.target
                      .value,
                  )
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              Album 简介
            </span>

            <textarea
              value={
                form.summary
              }
              disabled={
                isSaving
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
              className="resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:border-primary disabled:opacity-50"
            />
          </label>

          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Album 封面
            </p>

            <div className="grid gap-4 md:grid-cols-[240px_1fr]">
              <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted">
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      coverPreview
                    }
                    alt="Album 封面"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    无封面
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center gap-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={
                    isSaving
                  }
                  onChange={
                    handleCoverChange
                  }
                  className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-xs file:text-foreground"
                />

                <p className="text-[0.68rem] leading-relaxed text-muted-foreground">
                  不选择新图片则保留当前封面。选择后会重新生成 Original、Display 与 Thumbnail。
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
                        isSaving
                      }
                      onClick={
                        cancelNewCover
                      }
                      className="text-xs text-destructive hover:underline disabled:opacity-50"
                    >
                      取消替换
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={
                form.isPublished
              }
              disabled={
                isSaving
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
                已发布
              </p>

              <p className="text-[0.68rem] text-muted-foreground">
                关闭后 Album 仍保留在后台，但正式 Archive 前台不会显示。
              </p>
            </div>
          </label>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
            {uploadStage ? (
              <span className="mr-auto text-xs text-muted-foreground">
                {
                  uploadStage
                }
              </span>
            ) : null}

            <Button
              type="button"
              variant="outline"
              disabled={
                isSaving
              }
              onClick={() =>
                onOpenChange(
                  false,
                )
              }
            >
              取消
            </Button>

            <Button
              type="submit"
              disabled={
                isSaving
              }
            >
              {isSaving
                ? '保存中...'
                : '保存修改'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}