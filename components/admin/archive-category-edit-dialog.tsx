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

  onSaved: (
    category:
      ArchiveDbCategory,
  ) => void
}

type FormState = {
  index: string
  title: string
  en: string
  slug: string
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

export function ArchiveCategoryEditDialog({
  category,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [
    form,
    setForm,
  ] =
    useState<FormState>({
      index: '',
      title: '',
      en: '',
      slug: '',
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

  useEffect(() => {
    if (!category) {
      return
    }

    setForm({
      index:
        category.index,
      title:
        category.title,
      en:
        category.en,
      slug:
        category.slug,
      summary:
        category.summary,
      isPublished:
        category.isPublished,
    })

    setCoverFile(null)

    setCoverPreview(
      category
        .coverThumbnailUrl ||
        category
          .coverDisplayUrl ||
        category
          .coverOriginalUrl ||
        null,
    )
  }, [
    category,
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

    /*
     * 只有本地 blob URL
     * 才需要 revoke。
     *
     * 数据库里的 HTTPS URL
     * 不需要处理。
     */
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
      return
    }

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

    setIsSaving(true)
    setUploadStage('')

    try {
      /*
       * 默认继续使用旧封面。
       *
       * 只有管理员选择了新文件，
       * 才上传新的三层图片。
       */
      let coverOriginalUrl =
        category
          .coverOriginalUrl

      let coverDisplayUrl =
        category
          .coverDisplayUrl

      let coverThumbnailUrl =
        category
          .coverThumbnailUrl

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
        '正在保存修改...',
      )

      const response =
        await fetch(
          `/api/admin/archive/categories/${encodeURIComponent(
            category.id,
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
                slug:
                  createSlug(
                    form.slug,
                  ),

                index_label:
                  form.index,

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
            '保存分类失败',
          ),
        )
      }

      if (
        !result?.category
      ) {
        throw new Error(
          '服务器没有返回分类数据',
        )
      }

      /*
       * API 返回的是数据库 snake_case。
       *
       * 转成 ArchiveDbCategory
       * 使用的 camelCase。
       *
       * Album 没有在 PATCH 中改变，
       * 所以继续沿用当前 category.albums。
       */
      const updated:
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

        albums:
          category.albums,
      }

      onSaved(updated)

      toast.success(
        '合影分类已保存',
      )

      onOpenChange(false)
    } catch (error) {
      console.error(
        '[Archive category edit]',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '保存分类失败，请重试',
      )
    } finally {
      setIsSaving(false)
      setUploadStage('')
    }
  }

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
            编辑合影分类
          </DialogTitle>

          <DialogDescription>
            修改分类资料、封面与发布状态。
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-2 space-y-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                分类名称 *
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
                {form.slug}
              </span>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                Index
              </span>

              <input
                value={
                  form.index
                }
                disabled={
                  isSaving
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'index',
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
              分类简介
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
                    alt="分类封面"
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
                  不选择新图片则保留当前封面。选择新图片后会重新生成 Original、Display 与 Thumbnail。
                </p>
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
                关闭后分类仍保留在后台，但不会显示在正式 Archive 前台。
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