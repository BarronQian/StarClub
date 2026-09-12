'use client'

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  MAX_UPLOAD_BYTES,
  formatFileSize,
} from '@/lib/upload-limits'

const CATEGORY_OPTIONS =
  Object.entries(
    GALLERY_CATEGORY_LABEL,
  ) as [
    GalleryCategory,
    string,
  ][]

function cleanAuthor(
  value: string,
) {
  return value
    .trim()
    .replace(/^@+/, '')
    .trim()
}

export function GalleryEditDialog({
  shot,
  open,
  onOpenChange,
  onSaved,
}: {
  shot:
    | AdminGalleryShot
    | null

  open: boolean

  onOpenChange: (
    open: boolean,
  ) => void

  onSaved: (
    shot: AdminGalleryShot,
  ) => void
}) {
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
  ] = useState('')

  const [
    alt,
    setAlt,
  ] = useState('')

  const [
    wide,
    setWide,
  ] = useState(false)

  const [
    replaceFile,
    setReplaceFile,
  ] =
    useState<File | null>(
      null,
    )

  const [
    replacePreview,
    setReplacePreview,
  ] =
    useState<
      string | null
    >(null)

  const [
    replaceDimensions,
    setReplaceDimensions,
  ] =
    useState<{
      width: number
      height: number
    } | null>(null)

  const [
    isSaving,
    setIsSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null)

  useEffect(() => {
    if (!shot) {
      return
    }

    setCaption(
      shot.caption,
    )

    setAuthor(
      cleanAuthor(
        shot.author,
      ),
    )

    setAuthorUrl(
      shot.authorUrl ??
        '',
    )

    setCategory(
      shot.category,
    )

    setPublishedAt(
      shot.publishedAt,
    )

    setAlt(
      shot.alt,
    )

    setWide(
      Boolean(
        shot.wide,
      ),
    )

    setReplaceFile(
      null,
    )

    setReplacePreview(
      null,
    )

    setReplaceDimensions(
      null,
    )

    setError(null)
  }, [shot])

  useEffect(() => {
    return () => {
      if (
        replacePreview
      ) {
        URL.revokeObjectURL(
          replacePreview,
        )
      }
    }
  }, [replacePreview])

  const handleAuthorBlur =
    () => {
      setAuthor(
        cleanAuthor(
          author,
        ),
      )
    }

  const handleReplaceFile = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const selected =
      e.target.files?.[0]

    if (!selected) {
      return
    }

    if (
      selected.size >
      MAX_UPLOAD_BYTES
    ) {
      setError(
        `图片文件过大：原始大小 ${formatFileSize(
          selected.size,
        )}，超过服务器支持的最大上传大小 ${formatFileSize(
          MAX_UPLOAD_BYTES,
        )}。请压缩图片或裁剪尺寸后重新上传。`,
      )

      setReplaceFile(
        null,
      )

      setReplaceDimensions(
        null,
      )

      if (
        replacePreview
      ) {
        URL.revokeObjectURL(
          replacePreview,
        )
      }

      setReplacePreview(
        null,
      )

      e.target.value =
        ''

      return
    }

    setError(null)

    if (
      replacePreview
    ) {
      URL.revokeObjectURL(
        replacePreview,
      )
    }

    const url =
      URL.createObjectURL(
        selected,
      )

    setReplaceFile(
      selected,
    )

    setReplacePreview(
      url,
    )

    setReplaceDimensions(
      null,
    )

    const img =
      new Image()

    img.crossOrigin =
      'anonymous'

    img.onload =
      () => {
        setReplaceDimensions({
          width:
            img.naturalWidth,

          height:
            img.naturalHeight,
        })
      }

    img.src = url
  }

  const handleSubmit =
    async (
      e: FormEvent,
    ) => {
      e.preventDefault()

      if (!shot) {
        return
      }

      setError(null)

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

      setIsSaving(
        true,
      )

      try {
        const payload:
          Record<
            string,
            unknown
          > = {
          id:
            shot.id,

          caption:
            caption.trim(),

          author:
            cleanedAuthor,

          author_url:
            authorUrl.trim() ||
            null,

          alt:
            alt.trim() ||
            caption.trim(),

          category,

          published_at:
            publishedAt,

          wide,
        }

        /*
         * 注意：
         * 不再发送 likes。
         * 真实点赞只来自 gallery_likes。
         */

        if (
          replaceFile &&
          replaceDimensions
        ) {
          const uploadBody =
            new FormData()

          uploadBody.append(
            'file',
            replaceFile,
          )

          const uploadRes =
            await fetch(
              '/api/admin/gallery/upload',
              {
                method:
                  'POST',

                body:
                  uploadBody,
              },
            )

          const upload =
            await readJsonResponse(
              uploadRes,
            )

          if (
            !upload.ok
          ) {
            throw new Error(
              upload.message ||
                '图片上传失败',
            )
          }

          payload.src =
            upload.data.url

          payload.width =
            replaceDimensions.width

          payload.height =
            replaceDimensions.height
        }

        const res =
          await fetch(
            '/api/admin/gallery/update',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify(
                  payload,
                ),
            },
          )

        const update =
          await readJsonResponse(
            res,
          )

        if (
          !update.ok
        ) {
          throw new Error(
            update.message ||
              '保存失败',
          )
        }

        /*
         * Update API 不再负责统计点赞，
         * 所以这里保留编辑前已有的真实点赞数。
         */
        const savedShot = {
          ...(
            update.data
              .shot as AdminGalleryShot
          ),

          likes:
            shot.likes,
        }

        toast.success(
          '已保存修改',
        )

        onSaved(
          savedShot,
        )

        onOpenChange(
          false,
        )
      } catch (err) {
        console.error(
          '[v0] Gallery update error:',
          err,
        )

        const message =
          err instanceof Error
            ? err.message
            : '保存失败，请重试'

        setError(
          message,
        )

        toast.error(
          message,
        )
      } finally {
        setIsSaving(
          false,
        )
      }
    }

  return (
    <Dialog
      open={open}
      onOpenChange={
        onOpenChange
      }
    >
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            编辑作品
          </DialogTitle>
        </DialogHeader>

        {shot && (
          <form
            onSubmit={
              handleSubmit
            }
            className="flex flex-col gap-4"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  replacePreview ??
                  shot.src
                }
                alt={
                  shot.alt
                }
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="edit-file"
                className="text-xs text-muted-foreground"
              >
                替换图片（可选）
              </Label>

              <Input
                id="edit-file"
                type="file"
                accept="image/*"
                onChange={
                  handleReplaceFile
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="edit-caption"
                  className="text-xs text-muted-foreground"
                >
                  作品标题 *
                </Label>

                <Input
                  id="edit-caption"
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
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="edit-author"
                  className="text-xs text-muted-foreground"
                >
                  作者
                </Label>

                <Input
                  id="edit-author"
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
                htmlFor="edit-author-url"
                className="text-xs text-muted-foreground"
              >
                作者主页
              </Label>

              <Input
                id="edit-author-url"
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
                  htmlFor="edit-category"
                  className="text-xs text-muted-foreground"
                >
                  分类
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
                    id="edit-category"
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
                  htmlFor="edit-date"
                  className="text-xs text-muted-foreground"
                >
                  发布日期
                </Label>

                <Input
                  id="edit-date"
                  type="date"
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
                htmlFor="edit-alt"
                className="text-xs text-muted-foreground"
              >
                Alt 描述
              </Label>

              <Textarea
                id="edit-alt"
                rows={2}
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
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-3">
              <div>
                <Label
                  htmlFor="edit-wide"
                  className="text-xs text-muted-foreground"
                >
                  宽幅展示 wide
                </Label>

                <p className="mt-1 text-[0.68rem] text-muted-foreground/70">
                  让作品在影廊布局中优先使用更宽的展示区域
                </p>
              </div>

              <Switch
                id="edit-wide"
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
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
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}