'use client'

import {
  useMemo,
  useState,
} from 'react'

import {
  ImagePlus,
  Loader2,
  Upload,
} from 'lucide-react'

import {
  getSupabaseBrowser,
} from '@/lib/supabase-browser'

import {
  getStickerImageInfo,
  optimizeStickerImage,
  type OptimizedSticker,
  type StickerImageInfo,
} from '@/lib/community-sticker-image'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type SignedUploadResult = {
  ok: boolean
  bucket: string
  path: string
  token: string
  signedUrl: string
  publicUrl: string
  error?: string
}

function formatBytes(
  bytes: number,
) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(2)} MB`
}

async function createSignedUpload(
  values: {
    kind:
      | 'original'
      | 'optimized'
    fileName: string
    fileType: string
    fileSize: number
    uploadId: string
  },
) {
  const response =
    await fetch(
      '/api/admin/community-stickers/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(
          values,
        ),
      },
    )

  const result =
    (await response.json()) as
      SignedUploadResult

  if (
    !response.ok ||
    !result.ok
  ) {
    throw new Error(
      result.error ||
        '创建上传地址失败',
    )
  }

  return result
}

async function uploadWithToken(
  bucket: string,
  path: string,
  token: string,
  file: File | Blob,
  contentType: string,
) {
  const supabase =
    getSupabaseBrowser()

  const {
    error,
  } =
    await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(
        path,
        token,
        file,
        {
          contentType,
        },
      )

  if (error) {
    throw error
  }
}

export function CommunityStickerAdmin() {
  const [
    name,
    setName,
  ] = useState('')

  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null,
    )

  const [
    originalInfo,
    setOriginalInfo,
  ] =
    useState<StickerImageInfo | null>(
      null,
    )

  const [
    optimized,
    setOptimized,
  ] =
    useState<OptimizedSticker | null>(
      null,
    )

  const [
    originalPreview,
    setOriginalPreview,
  ] = useState<
    string | null
  >(null)

  const [
    optimizedPreview,
    setOptimizedPreview,
  ] = useState<
    string | null
  >(null)

  const [
    preparing,
    setPreparing,
  ] = useState(false)

  const [
    uploading,
    setUploading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    success,
    setSuccess,
  ] = useState<
    string | null
  >(null)

  const reduction =
    useMemo(() => {
      if (
        !originalInfo ||
        !optimized ||
        originalInfo.fileSize <= 0
      ) {
        return null
      }

      return Math.max(
        0,
        Math.round(
          (1 -
            optimized.fileSize /
              originalInfo.fileSize) *
            100,
        ),
      )
    }, [
      originalInfo,
      optimized,
    ])

  const handleFile =
    async (
      selectedFile: File,
    ) => {
      setPreparing(true)
      setError(null)
      setSuccess(null)

      if (
        originalPreview
      ) {
        URL.revokeObjectURL(
          originalPreview,
        )
      }

      if (
        optimizedPreview
      ) {
        URL.revokeObjectURL(
          optimizedPreview,
        )
      }

      try {
        if (
          ![
            'image/jpeg',
            'image/png',
            'image/webp',
          ].includes(
            selectedFile.type,
          )
        ) {
          throw new Error(
            '请选择 JPG、PNG 或 WebP 图片',
          )
        }

        if (
          selectedFile.size >
          10 *
            1024 *
            1024
        ) {
          throw new Error(
            '原图不能超过 10MB',
          )
        }

        const info =
          await getStickerImageInfo(
            selectedFile,
          )

        const optimizedResult =
          await optimizeStickerImage(
            selectedFile,
          )

        setFile(
          selectedFile,
        )

        setOriginalInfo(
          info,
        )

        setOptimized(
          optimizedResult,
        )

        setOriginalPreview(
          URL.createObjectURL(
            selectedFile,
          ),
        )

        setOptimizedPreview(
          URL.createObjectURL(
            optimizedResult.blob,
          ),
        )

        if (!name.trim()) {
          setName(
            selectedFile.name.replace(
              /\.[^.]+$/,
              '',
            ),
          )
        }
      } catch (err) {
        setFile(null)
        setOriginalInfo(null)
        setOptimized(null)
        setOriginalPreview(null)
        setOptimizedPreview(null)

        setError(
          err instanceof Error
            ? err.message
            : '处理图片失败',
        )
      } finally {
        setPreparing(false)
      }
    }

  const handleUpload =
    async () => {
      if (
        !file ||
        !originalInfo ||
        !optimized
      ) {
        setError(
          '请先选择表情包图片',
        )
        return
      }

      if (!name.trim()) {
        setError(
          '请输入表情包名称',
        )
        return
      }

      setUploading(true)
      setError(null)
      setSuccess(null)

      try {
        const uploadId =
          crypto.randomUUID()

        /*
         * 先申请两份 signed upload。
         */
        const originalSigned =
          await createSignedUpload(
            {
              kind: 'original',
              fileName:
                file.name,
              fileType:
                file.type,
              fileSize:
                file.size,
              uploadId,
            },
          )

        const optimizedSigned =
          await createSignedUpload(
            {
              kind: 'optimized',
              fileName:
                file.name,
              fileType:
                'image/webp',
              fileSize:
                optimized.fileSize,
              uploadId,
            },
          )

        /*
         * 原图和网页优化版直接从
         * 浏览器上传 Supabase。
         */
        await uploadWithToken(
          originalSigned.bucket,
          originalSigned.path,
          originalSigned.token,
          file,
          file.type,
        )

        await uploadWithToken(
          optimizedSigned.bucket,
          optimizedSigned.path,
          optimizedSigned.token,
          optimized.blob,
          'image/webp',
        )

        /*
         * 目前先验证 Storage 上传。
         * 下一步再把这些信息写入
         * community_stickers。
         */
        console.log(
          '[STICKER UPLOAD]',
          {
            name:
              name.trim(),
            original: {
              url:
                originalSigned.publicUrl,
              width:
                originalInfo.width,
              height:
                originalInfo.height,
              size:
                originalInfo.fileSize,
            },
            optimized: {
              url:
                optimizedSigned.publicUrl,
              width:
                optimized.width,
              height:
                optimized.height,
              size:
                optimized.fileSize,
            },
          },
        )

        setSuccess(
          '原图和网站优化版上传成功。',
        )
      } catch (err) {
        console.error(
          '[STICKER UPLOAD] Failed:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : '上传失败',
        )
      } finally {
        setUploading(false)
      }
    }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              表情包名称
            </label>

            <Input
              value={name}
              onChange={(
                event,
              ) =>
                setName(
                  event.target
                    .value,
                )
              }
              placeholder="例如：热血体育馆"
              maxLength={80}
            />
          </div>

          <label className="block">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={
                preparing ||
                uploading
              }
              onChange={(
                event,
              ) => {
                const selected =
                  event.target
                    .files?.[0]

                if (selected) {
                  void handleFile(
                    selected,
                  )
                }

                event.target.value =
                  ''
              }}
            />

            <span className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              {preparing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}

              {preparing
                ? '正在处理'
                : '选择图片'}
            </span>
          </label>
        </div>

        {error && (
          <p className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
            {success}
          </p>
        )}
      </div>

      {file &&
        originalInfo &&
        optimized &&
        originalPreview &&
        optimizedPreview && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  原图
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {
                    originalInfo.width
                  }{' '}
                  ×{' '}
                  {
                    originalInfo.height
                  }{' '}
                  ·{' '}
                  {formatBytes(
                    originalInfo.fileSize,
                  )}
                </p>
              </div>

              <div className="flex min-h-64 items-center justify-center bg-muted/30 p-5">
                <img
                  src={
                    originalPreview
                  }
                  alt="原图预览"
                  className="max-h-90 max-w-full object-contain"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  网站优化版
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {
                    optimized.width
                  }{' '}
                  ×{' '}
                  {
                    optimized.height
                  }{' '}
                  ·{' '}
                  {formatBytes(
                    optimized.fileSize,
                  )}

                  {reduction !==
                    null && (
                    <>
                      {' '}
                      · 减少{' '}
                      {reduction}%
                    </>
                  )}
                </p>
              </div>

              <div className="flex min-h-64 items-center justify-center bg-muted/30 p-5">
                <img
                  src={
                    optimizedPreview
                  }
                  alt="网站优化版预览"
                  className="max-h-90 max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        )}

      {file &&
        optimized && (
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={
                uploading ||
                preparing
              }
              onClick={() =>
                void handleUpload()
              }
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  正在上传
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  上传表情包
                </>
              )}
            </Button>
          </div>
        )}
    </div>
  )
}