'use client'

import {
  useEffect,
  useState,
} from 'react'

import {
  createClient,
} from '@supabase/supabase-js'

import {
  Loader2,
  Upload,
} from 'lucide-react'

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
  uploadArchiveImage,
} from '@/lib/archive-upload'

import type {
  ArchiveDbCategory,
  ArchiveDbPhoto,
} from '@/lib/archive-db'

type ArchiveSession =
  ArchiveDbCategory['albums'][number]['sessions'][number]

type Props = {
  session:
    ArchiveSession | null

  open: boolean

  onOpenChange: (
    open: boolean,
  ) => void

  onUploaded: (
    photos: ArchiveDbPhoto[],
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

export function ArchivePhotoUploadDialog({
  session,
  open,
  onOpenChange,
  onUploaded,
}: Props) {
  const [
    files,
    setFiles,
  ] =
    useState<File[]>([])

  const [
    isUploading,
    setIsUploading,
  ] =
    useState(false)

  const [
    progress,
    setProgress,
  ] =
    useState('')

  useEffect(
    () => {
      if (!open) {
        setFiles([])
        setProgress('')
        setIsUploading(false)
      }
    },
    [open],
  )

  function handleFiles(
    event:
      React.ChangeEvent<HTMLInputElement>,
  ) {
    const selected =
      Array.from(
        event.target.files ??
          [],
      )

    const valid =
      selected.filter(
        (file) =>
          file.type ===
            'image/jpeg' ||
          file.type ===
            'image/png' ||
          file.type ===
            'image/webp',
      )

    if (
      valid.length !==
      selected.length
    ) {
      toast.error(
        '仅支持 JPG、PNG、WebP 图片',
      )
    }

    setFiles(valid)
  }

  async function handleUpload() {
    if (
      !session ||
      files.length === 0 ||
      isUploading
    ) {
      return
    }

    setIsUploading(true)

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
      toast.error(
        '缺少 Supabase 浏览器环境变量',
      )

      setIsUploading(false)
      return
    }

    const supabase =
      createClient(
        supabaseUrl,
        supabaseAnonKey,
      )

    try {
      const {
        data: {
          session:
            authSession,
        },
      } =
        await supabase.auth
          .getSession()

      const accessToken =
        authSession
          ?.access_token

      if (!accessToken) {
        throw new Error(
          '登录状态已失效，请重新登录',
        )
      }

      const createdPhotos:
        ArchiveDbPhoto[] =
          []

      for (
        let index = 0;
        index < files.length;
        index += 1
      ) {
        const file =
          files[index]

        const current =
          index + 1

        setProgress(
          `正在处理第 ${current} / ${files.length} 张：${file.name}`,
        )

        const uploaded =
          await uploadArchiveImage({
            supabase,
            accessToken,
            file,
            kind: 'photo',

            onStage: (
              stage,
            ) => {
              setProgress(
                `第 ${current} / ${files.length} 张 · ${stage}`,
              )
            },
          })

        setProgress(
          `第 ${current} / ${files.length} 张 · 正在写入数据库...`,
        )

        const response =
          await fetch(
            '/api/admin/archive/photos',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${accessToken}`,
              },

              body:
                JSON.stringify({
                  session_id:
                    session.id,

                  original_url:
                    uploaded.originalUrl,

                  display_url:
                    uploaded.displayUrl,

                  thumbnail_url:
                    uploaded.thumbnailUrl,

                  alt:
                    file.name
                      .replace(
                        /\.[^.]+$/,
                        '',
                      )
                      .trim(),

                  caption:
                    null,

                  wide:
                    false,

                  width:
                    uploaded.width,

                  height:
                    uploaded.height,
                }),
            },
          )

        const result =
          await response
            .json()
            .catch(
              () => null,
            )

        if (
          !response.ok
        ) {
          throw new Error(
            getErrorMessage(
              result,
              `第 ${current} 张照片写入数据库失败`,
            ),
          )
        }

        const row =
          result?.photo

        if (
          !row?.id
        ) {
          throw new Error(
            `第 ${current} 张照片返回数据不完整`,
          )
        }

        createdPhotos.push({
          id:
            row.id,

          originalUrl:
            row.original_url ??
            uploaded.originalUrl,

          displayUrl:
            row.display_url ??
            uploaded.displayUrl,

          thumbnailUrl:
            row.thumbnail_url ??
            uploaded.thumbnailUrl,

          alt:
            row.alt ??
            '',

          caption:
            row.caption ??
            null,

          wide:
            Boolean(
              row.wide,
            ),

          width:
            row.width ??
            uploaded.width,

          height:
            row.height ??
            uploaded.height,

          sortOrder:
            typeof row.sort_order ===
            'number'
              ? row.sort_order
              : createdPhotos.length,
        })
      }

      onUploaded(
        createdPhotos,
      )

      toast.success(
        `成功上传 ${createdPhotos.length} 张照片`,
      )

      setFiles([])
      setProgress('')

      onOpenChange(
        false,
      )
    } catch (error) {
      console.error(
        '[Archive photo upload]',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '照片上传失败，请重试',
      )
    } finally {
      setIsUploading(
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
          isUploading
        ) {
          return
        }

        onOpenChange(
          nextOpen,
        )
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            批量上传照片
          </DialogTitle>

          <DialogDescription>
            {session
              ? `上传到「${session.label}」`
              : '请选择 Session'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="archive-photo-files">
              选择照片
            </Label>

            <Input
              id="archive-photo-files"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={
                isUploading
              }
              onChange={
                handleFiles
              }
            />

            <p className="text-xs text-muted-foreground">
              支持 JPG、PNG、WebP，可一次选择多张照片。
            </p>
          </div>

          {files.length >
          0 ? (
            <div className="rounded-md border bg-muted/20 p-3">
              <p className="text-sm font-medium">
                已选择{' '}
                {
                  files.length
                }{' '}
                张照片
              </p>

              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                {files.map(
                  (
                    file,
                    index,
                  ) => (
                    <p
                      key={`${file.name}-${file.size}-${index}`}
                      className="truncate text-xs text-muted-foreground"
                    >
                      {index +
                        1}
                      .{' '}
                      {
                        file.name
                      }
                    </p>
                  ),
                )}
              </div>
            </div>
          ) : null}

          {progress ? (
            <div className="rounded-md border bg-muted/30 px-3 py-3">
              <div className="flex items-center gap-2">
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}

                <p className="text-sm">
                  {progress}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={
              isUploading
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
              !session ||
              files.length ===
                0 ||
              isUploading
            }
            onClick={() => {
              void handleUpload()
            }}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                上传中
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                上传{' '}
                {
                  files.length
                }{' '}
                张
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}