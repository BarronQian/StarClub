'use client'

import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'

import {
  toast,
} from 'sonner'

import {
  createClient,
  type SupabaseClient,
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
  prepareArchiveImage,
} from '@/lib/archive-image'

import type {
  ArchiveDbCategory,
} from '@/lib/archive-db'

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

type UploadVariant =
  | 'original'
  | 'display'
  | 'thumbnail'

type UploadResult = {
  bucket: string
  path: string
  token: string
  url: string
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

    if (coverPreview) {
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
    if (coverPreview) {
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

  async function createUploadUrl({
    accessToken,
    fileName,
    fileType,
    variant,
  }: {
    accessToken: string
    fileName: string
    fileType: string
    variant: UploadVariant
  }) {
    const response =
      await fetch(
        '/api/admin/archive/upload-url',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${accessToken}`,
          },

          body:
            JSON.stringify({
              kind: 'cover',
              variant,
              name: fileName,
              type: fileType,
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
          `${variant} 上传地址创建失败`,
        ),
      )
    }

    return result as UploadResult
  }

  async function uploadBlob({
    supabase,
    accessToken,
    blob,
    fileName,
    fileType,
    variant,
  }: {
    supabase: SupabaseClient

    accessToken: string

    blob: Blob

    fileName: string

    fileType: string

    variant: UploadVariant
  }) {
    const uploadData =
      await createUploadUrl({
        accessToken,
        fileName,
        fileType,
        variant,
      })

    const {
      error,
    } =
      await supabase.storage
        .from(
          uploadData.bucket,
        )
        .uploadToSignedUrl(
          uploadData.path,
          uploadData.token,
          blob,
          {
            contentType:
              fileType,
          },
        )

    if (error) {
      throw error
    }

    return uploadData.url
  }

  async function uploadCover(
    file: File,
  ) {
    setUploadStage(
      '正在处理封面...',
    )

    const prepared =
      await prepareArchiveImage(
        file,
      )

    const {
      supabase,
      accessToken,
    } =
      await getAccessToken()

    setUploadStage(
      '正在上传原图...',
    )

    const originalUrl =
      await uploadBlob({
        supabase,
        accessToken,

        blob: file,

        fileName:
          file.name,

        fileType:
          file.type,

        variant:
          'original',
      })

    let displayUrl =
      originalUrl

    if (
      !prepared
        .useOriginalAsDisplay &&
      prepared.display
    ) {
      setUploadStage(
        '正在上传展示图...',
      )

      displayUrl =
        await uploadBlob({
          supabase,
          accessToken,

          blob:
            prepared
              .display
              .blob,

          fileName:
            'display.webp',

          fileType:
            'image/webp',

          variant:
            'display',
        })
    }

    setUploadStage(
      '正在上传缩略图...',
    )

    const thumbnailUrl =
      await uploadBlob({
        supabase,
        accessToken,

        blob:
          prepared
            .thumbnail
            .blob,

        fileName:
          'thumbnail.webp',

        fileType:
          'image/webp',

        variant:
          'thumbnail',
      })

    return {
      originalUrl,
      displayUrl,
      thumbnailUrl,
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
        const uploaded =
          await uploadCover(
            coverFile,
          )

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

      setCategories(
        (previous) => [
          ...previous,
          result.category,
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
                          <span className="text-xs text-muted-foreground">
                            下一步接入编辑
                          </span>
                        </TableCell>
                      </TableRow>
                    ),
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>
    </div>
  )
}