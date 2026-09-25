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

import {
  createClient,
} from '@supabase/supabase-js'

import {
  uploadArchiveImage,
} from '@/lib/archive-upload'

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

function getBrowserSupabase() {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    throw new Error(
      '缺少 Supabase 浏览器环境变量',
    )
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
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

  const [
    replacementFile,
    setReplacementFile,
  ] =
    useState<File | null>(
      null,
    )
  
  const [
    uploadStage,
    setUploadStage,
  ] =
    useState('')

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

      setReplacementFile(
        null,
      )
      setUploadStage(
        '',
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
  setUploadStage('')

  try {
    let replacement:
      Awaited<
        ReturnType<
          typeof uploadArchiveImage
        >
      > | null = null

    if (replacementFile) {
      const supabase =
        getBrowserSupabase()

      const {
        data: {
          session,
        },
        error:
          sessionError,
      } =
        await supabase.auth
          .getSession()

      if (
        sessionError ||
        !session
          ?.access_token
      ) {
        throw new Error(
          '管理员登录状态已失效，请重新登录',
        )
      }

      replacement =
        await uploadArchiveImage({
          supabase,

          accessToken:
            session
              .access_token,

          file:
            replacementFile,

          kind:
            'photo',

          onStage:
            setUploadStage,
        })
    }

    setUploadStage(
      '正在保存照片信息...',
    )

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

              ...(replacement
                ? {
                    originalUrl:
                      replacement
                        .originalUrl,

                    displayUrl:
                      replacement
                        .displayUrl,

                    thumbnailUrl:
                      replacement
                        .thumbnailUrl,

                    width:
                      replacement
                        .width,

                    height:
                      replacement
                        .height,
                  }
                : {}),
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
          replacement
            ?.originalUrl ??
          photo.originalUrl,

        displayUrl:
          row.display_url ??
          replacement
            ?.displayUrl ??
          photo.displayUrl,

        thumbnailUrl:
          row.thumbnail_url ??
          replacement
            ?.thumbnailUrl ??
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
          replacement
            ?.width ??
          photo.width,

        height:
          row.height ??
          replacement
            ?.height ??
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
      replacement
        ? '照片已替换并保存'
        : '照片信息已保存',
    )

    setReplacementFile(
      null,
    )

    setUploadStage(
      '',
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

    setUploadStage(
      '',
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
            修改照片说明和合影展示设置。
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
                  '合影照片'
                }
                className="max-h-56 w-full object-contain"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="archive-photo-replacement">
                替换图片
              </Label>

              <Input
                id="archive-photo-replacement"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={
                  isSaving
                }
                onChange={(
                  event,
                ) => {
                  const file =
                    event.target
                      .files?.[0] ??
                    null

                  setReplacementFile(
                    file,
                  )
                }}
              />

              <p className="text-xs text-muted-foreground">
                可选。选择新图片后，将替换当前照片；不选择则只修改照片信息。
              </p>

              {replacementFile ? (
                <p className="text-xs font-medium">
                  已选择：
                  {' '}
                  {replacementFile.name}
                </p>
              ) : null}

              {uploadStage ? (
                <p className="text-xs text-muted-foreground">
                  {uploadStage}
                </p>
              ) : null}

            </div>

            <div className="space-y-2">
              <Label htmlFor="archive-photo-alt">
                替代文字（Alt）
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
                照片说明
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
                    宽幅显示
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