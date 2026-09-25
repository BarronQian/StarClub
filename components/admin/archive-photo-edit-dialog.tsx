'use client'

import {
  useEffect,
  useState,
} from 'react'

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  Input,
} from '@/components/ui/input'

import {
  Label,
} from '@/components/ui/label'

import {
  Textarea,
} from '@/components/ui/textarea'

import type {
  ArchiveDbPhoto,
} from '@/lib/archive-db'

type Props = {
  photo:
    ArchiveDbPhoto | null

  open: boolean

  onOpenChange: (
    open: boolean,
  ) => void

  onSaved: (
    photo: ArchiveDbPhoto,
  ) => void
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

export function ArchivePhotoEditDialog({
  photo,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [
    alt,
    setAlt,
  ] =
    useState('')

  const [
    caption,
    setCaption,
  ] =
    useState('')

  const [
    wide,
    setWide,
  ] =
    useState(false)

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false)

  useEffect(
    () => {
      if (!photo) {
        return
      }

      setAlt(
        photo.alt ?? '',
      )

      setCaption(
        photo.caption ?? '',
      )

      setWide(
        photo.wide,
      )
    },
    [photo],
  )

  async function handleSave() {
    if (
      !photo ||
      isSaving
    ) {
      return
    }

    setIsSaving(true)

    try {
      const response =
        await fetch(
          `/api/admin/archive/photos/${encodeURIComponent(
            photo.id,
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
                alt:
                  alt.trim(),

                caption:
                  caption.trim() ||
                  null,

                wide,
              }),
          },
        )

      const result =
        await response
          .json()
          .catch(
            () => null,
          )

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            '保存照片失败',
          ),
        )
      }

      const row =
        result?.photo

      if (!row?.id) {
        throw new Error(
          '照片返回数据不完整',
        )
      }

      const updatedPhoto:
        ArchiveDbPhoto = {
          id:
            row.id,

          originalUrl:
            row.original_url ??
            photo.originalUrl,

          displayUrl:
            row.display_url ??
            photo.displayUrl,

          thumbnailUrl:
            row.thumbnail_url ??
            photo.thumbnailUrl,

          alt:
            row.alt ?? '',

          caption:
            row.caption ??
            null,

          wide:
            Boolean(
              row.wide,
            ),

          width:
            row.width ??
            photo.width,

          height:
            row.height ??
            photo.height,

          sortOrder:
            typeof row.sort_order ===
            'number'
              ? row.sort_order
              : photo.sortOrder,
        }

      onSaved(
        updatedPhoto,
      )

      toast.success(
        '照片信息已保存',
      )

      onOpenChange(
        false,
      )
    } catch (error) {
      console.error(
        '[Archive photo edit]',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '保存照片失败，请重试',
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
      onOpenChange={(
        nextOpen,
      ) => {
        if (
          isSaving
        ) {
          return
        }

        onOpenChange(
          nextOpen,
        )
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            编辑照片
          </DialogTitle>

          <DialogDescription>
            修改照片说明和 Archive 展示设置。
          </DialogDescription>
        </DialogHeader>

        {photo ? (
          <div className="space-y-5 py-2">
            <div className="overflow-hidden rounded-md border bg-muted">
              <img
                src={
                  photo.thumbnailUrl ||
                  photo.displayUrl
                }
                alt={
                  photo.alt ||
                  'Archive photo'
                }
                className="max-h-56 w-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="archive-photo-alt">
                Alt
              </Label>

              <Input
                id="archive-photo-alt"
                value={alt}
                disabled={
                  isSaving
                }
                onChange={(
                  event,
                ) =>
                  setAlt(
                    event.target
                      .value,
                  )
                }
                placeholder="照片描述"
              />

              <p className="text-xs text-muted-foreground">
                用于图片无法显示时的替代文字，也有助于可访问性。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="archive-photo-caption">
                Caption
              </Label>

              <Textarea
                id="archive-photo-caption"
                value={
                  caption
                }
                disabled={
                  isSaving
                }
                onChange={(
                  event,
                ) =>
                  setCaption(
                    event.target
                      .value,
                  )
                }
                placeholder="可选的照片说明"
                rows={3}
              />
            </div>

              <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Wide
                  </p>

                  <p className="text-xs text-muted-foreground">
                    将这张照片标记为宽幅展示照片。
                  </p>
                </div>

                <Button
                  type="button"
                  variant={
                    wide
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  disabled={
                    isSaving
                  }
                  onClick={() =>
                    setWide(
                      !wide,
                    )
                  }
                >
                  {wide
                    ? '已开启'
                    : '未开启'}
                </Button>
              </div>
          </div>
        ) : null}

        <DialogFooter>
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
            type="button"
            disabled={
              !photo ||
              isSaving
            }
            onClick={() => {
              void handleSave()
            }}
          >
            {isSaving
              ? '保存中...'
              : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}