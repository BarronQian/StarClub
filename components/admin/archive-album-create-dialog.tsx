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
  category:
    | ArchiveDbCategory
    | null

  open: boolean

  onOpenChange: (
    open: boolean,
  ) => void

  onCreated: (
    album: ArchiveDbAlbum,
  ) => void
}

type FormState = {
  title: string
  en: string
  slug: string
  place: string
  summary: string
  isPublished: boolean
}

const EMPTY_FORM:
  FormState = {
  title: '',
  en: '',
  slug: '',
  place: '',
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
    typeof value ===
      'object' &&
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

export function ArchiveAlbumCreateDialog({
  category,
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [
    form,
    setForm,
  ] =
    useState<FormState>(
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

  /*
   * 每次打开新的
   * Create Album Dialog，
   * 都从空白表单开始。
   */
  useEffect(() => {
    if (!open) {
      return
    }

    setForm(
      EMPTY_FORM,
    )

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

        return null
      },
    )
  }, [
    open,
    category?.id,
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

          title:
            value,

          slug:
            shouldGenerateSlug
              ? createSlug(
                  value,
                )
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
      URL.createObjectURL(
        file,
      )

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

    if (!category) {
      toast.error(
        '没有选择所属 Category',
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

    setIsSubmitting(true)
    setUploadStage('')

    try {
      let coverOriginalUrl:
        string | null = null

      let coverDisplayUrl:
        string | null = null

      let coverThumbnailUrl:
        string | null = null

      /*
       * Album 可以没有封面。
       * 有选择图片时才上传。
       */
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
        '正在创建 Album...',
      )

      const response =
        await fetch(
          '/api/admin/archive/albums',
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
                  category.id,

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
            '创建 Album 失败',
          ),
        )
      }

      if (
        !result?.album
      ) {
        throw new Error(
          '服务器没有返回新 Album',
        )
      }

      /*
       * Album API 返回数据库
       * snake_case。
       *
       * 后台状态统一使用
       * ArchiveDbAlbum camelCase。
       */
      const created:
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

        sessions: [],
      }

      onCreated(created)

      toast.success(
        'Album 创建成功',
      )

      onOpenChange(false)
    } catch (error) {
      console.error(
        '[Archive album create]',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '创建 Album 失败，请重试',
      )
    } finally {
      setIsSubmitting(false)
      setUploadStage('')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(
        nextOpen,
      ) => {
        if (
          isSubmitting
        ) {
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
            新建 Album
          </DialogTitle>

          <DialogDescription>
            {category ? (
              <>
                将在「
                {
                  category.title
                }
                」中创建新的合影 Album。
              </>
            ) : (
              '创建新的合影 Album。'
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-2 space-y-5"
        >
          <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="text-[0.68rem] text-muted-foreground">
              所属 Category
            </p>

            <p className="mt-1 text-sm font-medium text-foreground">
              {category
                ? `${
                    category.index
                      ? `${category.index} · `
                      : ''
                  }${category.title}`
                : '未选择'}
            </p>
          </div>

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
                  isSubmitting
                }
                onChange={(
                  event,
                ) =>
                  handleTitleChange(
                    event.target
                      .value,
                  )
                }
                placeholder="例如：英仙座舰队合影"
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
                  isSubmitting
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
                placeholder="例如：PERSEUS FLEET"
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
                  isSubmitting
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
                placeholder="例如：perseus-fleet"
                className="h-10 rounded-md border border-input bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
              />

              <span className="text-[0.68rem] text-muted-foreground">
                /archive/
                {category?.slug ||
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
                  isSubmitting
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
                placeholder="例如：Orison"
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
                isSubmitting
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
              placeholder="介绍这个 Album..."
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
                    alt="Album 封面预览"
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

          <label className="flex items-center gap-3">
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
                关闭后 Album 会保存在后台，但正式 Archive 前台不会显示。
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
                isSubmitting
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
                isSubmitting ||
                !category
              }
            >
              {isSubmitting
                ? '创建中...'
                : '创建 Album'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}