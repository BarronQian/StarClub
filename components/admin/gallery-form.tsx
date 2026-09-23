'use client'

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { toast } from 'sonner'
import {
  createClient as createSupabaseBrowserClient,
} from '@supabase/supabase-js'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  GALLERY_CATEGORY_LABEL,
  type GalleryCategory,
} from '@/lib/gallery'

import type { AdminGalleryShot } from '@/lib/gallery-db'
import { readJsonResponse } from '@/lib/read-json-response'
import {
  createGalleryImageVariants,
} from '@/lib/gallery-image'
import { GalleryPreviewCard } from '@/components/admin/gallery-preview'

const CATEGORY_OPTIONS =
  Object.entries(
    GALLERY_CATEGORY_LABEL,
  ) as [
    GalleryCategory,
    string,
  ][]

function todayIso() {
  return new Date()
    .toISOString()
    .slice(0, 10)
}

function cleanAuthor(
  value: string,
) {
  return value
    .trim()
    .replace(/^@+/, '')
    .trim()
}

let browserSupabase:
  | ReturnType<
      typeof createSupabaseBrowserClient
    >
  | null = null

function getBrowserSupabase() {
  if (!browserSupabase) {
    browserSupabase =
      createSupabaseBrowserClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,
        process.env
          .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession:
              false,
            autoRefreshToken:
              false,
          },
        },
      )
  }

  return browserSupabase
}

export function GalleryForm({
  onCreated,
}: {
  onCreated: (
    shot: AdminGalleryShot,
  ) => void
}) {
  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null,
    )

  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState<
      string | null
    >(null)

  const [
    dimensions,
    setDimensions,
  ] =
    useState<{
      width: number
      height: number
    } | null>(null)

  const [
    caption,
    setCaption,
  ] = useState('')

  const [
    author,
    setAuthor,
  ] = useState('')

  const [
    authorUrl,
    setAuthorUrl,
  ] = useState('')

  const [
    category,
    setCategory,
  ] =
    useState<GalleryCategory>(
      'other',
    )

  const [
    publishedAt,
    setPublishedAt,
  ] =
    useState(
      todayIso(),
    )

  const [
    alt,
    setAlt,
  ] = useState('')

  const [
    wide,
    setWide,
  ] = useState(false)

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null)

  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    )

  useEffect(() => {
    return () => {
      if (
        previewUrl
      ) {
        URL.revokeObjectURL(
          previewUrl,
        )
      }
    }
  }, [previewUrl])

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const selected =
      e.target.files?.[0]

    if (!selected) {
      return
    }

    setError(null)

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl,
      )
    }

    const url =
      URL.createObjectURL(
        selected,
      )

    setFile(selected)
    setPreviewUrl(url)
    setDimensions(null)

    const img =
      new Image()

    img.crossOrigin =
      'anonymous'

    img.onload = () => {
      setDimensions({
        width:
          img.naturalWidth,
        height:
          img.naturalHeight,
      })
    }

    img.src = url
  }

  const resetForm = () => {
    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl,
      )
    }

    setFile(null)
    setPreviewUrl(null)
    setDimensions(null)
    setCaption('')
    setAuthor('')
    setAuthorUrl('')
    setCategory('other')
    setPublishedAt(
      todayIso(),
    )
    setAlt('')
    setWide(false)

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        ''
    }
  }

  const handleAuthorBlur =
    async () => {
      const name =
        cleanAuthor(
          author,
        )

      /*
       * 输入框本身也同步清理，
       * 后端仍会再次清理一次。
       */
      if (
        name !== author
      ) {
        setAuthor(name)
      }

      if (
        !name ||
        authorUrl.trim()
      ) {
        return
      }

      try {
        const res =
          await fetch(
            `/api/admin/gallery/author-url?author=${encodeURIComponent(
              name,
            )}`,
          )

        if (!res.ok) {
          return
        }

        const data =
          await res.json()

        if (
          data.author_url
        ) {
          setAuthorUrl(
            data.author_url,
          )
        }
      } catch {
        // 查询失败不影响正常发布
      }
    }

  const handleSubmit =
    async (
      e: FormEvent,
    ) => {
      e.preventDefault()

      setError(null)

      if (
        !file ||
        !dimensions
      ) {
        setError(
          '请上传图片并等待尺寸检测完成',
        )

        return
      }

      if (
        !caption.trim()
      ) {
        setError(
          '请填写作品标题',
        )

        return
      }

      const cleanedAuthor =
        cleanAuthor(
          author,
        )

      if (
        !cleanedAuthor
      ) {
        setError(
          '请填写作者',
        )

        return
      }

      setIsSubmitting(true)

      try {
        /*
         * 1. 浏览器生成三层图片：
         *
         * original:
         *   原始上传文件
         *
         * display:
         *   最长边 2200px WebP
         *
         * thumbnail:
         *   最长边 800px WebP
         */
        const variants =
          await createGalleryImageVariants(
            file,
          )

        type UploadVariant =
          | 'original'
          | 'display'
          | 'thumbnail'

        /*
         * 获取 signed upload token，
         * 然后浏览器直接上传到 Supabase。
         */
        const uploadVariant =
          async (
            variant: UploadVariant,
            uploadFile:
              | File
              | Blob,
            name: string,
            contentType: string,
          ) => {
            const urlRes =
              await fetch(
                '/api/admin/gallery/upload-url',
                {
                  method:
                    'POST',

                  headers: {
                    'Content-Type':
                      'application/json',
                  },

                  body:
                    JSON.stringify({
                      name,
                      type:
                        contentType,
                      variant,
                    }),
                },
              )

            const signed =
              await readJsonResponse(
                urlRes,
              )

            if (!signed.ok) {
              throw new Error(
                signed.message ||
                  `获取 ${variant} 上传授权失败`,
              )
            }

            const {
              bucket,
              path,
              token,
              url,
            } =
              signed.data as {
                bucket: string
                path: string
                token: string
                url: string
              }

            const {
              error:
                uploadError,
            } =
              await getBrowserSupabase()
                .storage.from(
                  bucket,
                )
                .uploadToSignedUrl(
                  path,
                  token,
                  uploadFile,
                  {
                    contentType,
                  },
                )

            if (uploadError) {
              console.error(
                `[v0] Gallery ${variant} upload error:`,
                uploadError,
              )

              throw new Error(
                `${variant} 图片上传失败，请重试`,
              )
            }

            return url
          }

        /*
         * 2. 上传原始高清文件。
         */
        const originalUrl =
          await uploadVariant(
            'original',
            variants.original,
            file.name,
            file.type,
          )

        /*
         * 3. 上传 2200px Display。
         */
        const displayUrl =
          await uploadVariant(
            'display',
            variants.display.blob,
            'display.webp',
            'image/webp',
          )

        /*
         * 4. 上传 800px Thumbnail。
         */
        const thumbnailUrl =
          await uploadVariant(
            'thumbnail',
            variants.thumbnail.blob,
            'thumbnail.webp',
            'image/webp',
          )

        /*
         * 5. 创建 Gallery 数据库记录。
         *
         * src 暂时继续保留，
         * 并指向 display 图，
         * 兼容网站现有代码。
         */
        const createRes =
          await fetch(
            '/api/admin/gallery/create',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  src:
                    displayUrl,

                  original_url:
                    originalUrl,

                  display_url:
                    displayUrl,

                  thumbnail_url:
                    thumbnailUrl,

                  width:
                    variants.originalWidth,

                  height:
                    variants.originalHeight,

                  caption:
                    caption.trim(),

                  author:
                    cleanedAuthor,

                  author_url:
                    authorUrl.trim() ||
                    null,

                  category,

                  alt:
                    alt.trim() ||
                    caption.trim(),

                  published_at:
                    publishedAt,

                  wide,
                }),
            },
          )

        const create =
          await readJsonResponse(
            createRes,
          )

        if (!create.ok) {
          throw new Error(
            create.message ||
              '发布失败',
          )
        }

        toast.success(
          '作品发布成功',
        )

        onCreated(
          create.data
            .shot as AdminGalleryShot,
        )

        resetForm()
      } catch (err) {
        console.error(
          '[v0] Gallery create error:',
          err,
        )

        const message =
          err instanceof Error
            ? err.message
            : '发布失败，请重试'

        setError(
          message,
        )

        toast.error(
          message,
        )
      } finally {
        setIsSubmitting(
          false,
        )
      }
    }

  const aspectRatio =
    dimensions
      ? dimensions.width /
        dimensions.height
      : 16 / 9

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form
        onSubmit={
          handleSubmit
        }
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="gallery-file"
            className="text-xs text-muted-foreground"
          >
            图片上传 *
          </Label>

          <Input
            id="gallery-file"
            ref={
              fileInputRef
            }
            type="file"
            accept="image/*"
            required
            onChange={
              handleFileChange
            }
          />

          {dimensions && (
            <p className="mt-1 font-display text-[0.62rem] tracking-widest text-muted-foreground">
              原始尺寸:{' '}
              {
                dimensions.width
              }{' '}
              ×{' '}
              {
                dimensions.height
              }
              　画面比例:{' '}
              {aspectRatio.toFixed(
                3,
              )}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="gallery-caption"
              className="text-xs text-muted-foreground"
            >
              作品标题 *
            </Label>

            <Input
              id="gallery-caption"
              required
              value={
                caption
              }
              onChange={(
                e,
              ) =>
                setCaption(
                  e.target
                    .value,
                )
              }
              placeholder="例如：晨昏线"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="gallery-author"
              className="text-xs text-muted-foreground"
            >
              作者 *
            </Label>

            <Input
              id="gallery-author"
              required
              value={
                author
              }
              onChange={(
                e,
              ) =>
                setAuthor(
                  e.target
                    .value,
                )
              }
              onBlur={
                handleAuthorBlur
              }
              placeholder="例如：Walkertian"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="gallery-author-url"
            className="text-xs text-muted-foreground"
          >
            作者主页
          </Label>

          <Input
            id="gallery-author-url"
            type="url"
            value={
              authorUrl
            }
            onChange={(
              e,
            ) =>
              setAuthorUrl(
                e.target
                  .value,
              )
            }
            placeholder="例如：https://lapernum.site/"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="gallery-category"
              className="text-xs text-muted-foreground"
            >
              分类 *
            </Label>

            <Select
              value={
                category
              }
              onValueChange={(
                v,
              ) =>
                setCategory(
                  v as GalleryCategory,
                )
              }
            >
              <SelectTrigger
                id="gallery-category"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {CATEGORY_OPTIONS.map(
                    ([
                      value,
                      label,
                    ]) => (
                      <SelectItem
                        key={
                          value
                        }
                        value={
                          value
                        }
                      >
                        {
                          label
                        }
                      </SelectItem>
                    ),
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="gallery-date"
              className="text-xs text-muted-foreground"
            >
              发布日期 *
            </Label>

            <Input
              id="gallery-date"
              type="date"
              required
              value={
                publishedAt
              }
              onChange={(
                e,
              ) =>
                setPublishedAt(
                  e.target
                    .value,
                )
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="gallery-alt"
            className="text-xs text-muted-foreground"
          >
            Alt 描述
          </Label>

          <Textarea
            id="gallery-alt"
            value={
              alt
            }
            onChange={(
              e,
            ) =>
              setAlt(
                e.target
                  .value,
              )
            }
            placeholder="留空则使用作品标题"
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-3">
          <div>
            <Label
              htmlFor="gallery-wide"
              className="text-xs text-muted-foreground"
            >
              宽幅展示 wide
            </Label>

            <p className="mt-1 text-[0.68rem] text-muted-foreground/70">
              让作品在影廊布局中优先使用更宽的展示区域
            </p>
          </div>

          <Switch
            id="gallery-wide"
            checked={
              wide
            }
            onCheckedChange={
              setWide
            }
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={
            isSubmitting
          }
          className="w-full sm:w-auto"
        >
          {isSubmitting
            ? '发布中...'
            : '发布新作品'}
        </Button>
      </form>

      <div>
        <p className="mb-3 font-display text-[0.62rem] tracking-[0.2em] text-muted-foreground">
          实时预览
        </p>

        <GalleryPreviewCard
          src={
            previewUrl
          }
          caption={
            caption
          }
          author={
            cleanAuthor(
              author,
            )
          }
          category={
            category
          }
          publishedAt={
            publishedAt
          }
          alt={
            alt
          }
          aspectRatio={
            aspectRatio
          }
        />
      </div>
    </div>
  )
}
