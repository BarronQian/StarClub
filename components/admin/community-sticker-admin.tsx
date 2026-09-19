'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useRouter,
} from 'next/navigation'

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  Pencil,
  X,
  Check,
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

type CommunitySticker = {
  id: string
  name: string

  original_url: string
  optimized_url: string

  original_width:
    number | null
  original_height:
    number | null
  original_file_size:
    number | null

  optimized_width:
    number | null
  optimized_height:
    number | null
  optimized_file_size:
    number | null

  sort_order: number
  is_active: boolean

  created_at: string
  updated_at: string
}

type CommunityStickerAdminProps = {
  initialStickers:
    CommunitySticker[]
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

export function CommunityStickerAdmin({
  initialStickers,
}: CommunityStickerAdminProps) {
  const router =
    useRouter()

  const [
    stickers,
    setStickers,
  ] =
    useState<CommunitySticker[]>(
      initialStickers,
    )
  
    useEffect(() => {
    setStickers(
      initialStickers,
    )
  }, [
    initialStickers,
  ])

  const [
    actionId,
    setActionId,
  ] = useState<
    string | null
  >(null)

    const [
    editingId,
    setEditingId,
  ] = useState<
    string | null
  >(null)

  const [
    editingName,
    setEditingName,
  ] = useState('')

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
      const saveResponse =
        await fetch(
          '/api/admin/community-stickers',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              name:
                name.trim(),

              originalUrl:
                originalSigned.publicUrl,

              optimizedUrl:
                optimizedSigned.publicUrl,

              originalWidth:
                originalInfo.width,

              originalHeight:
                originalInfo.height,

              originalFileSize:
                originalInfo.fileSize,

              optimizedWidth:
                optimized.width,

              optimizedHeight:
                optimized.height,

              optimizedFileSize:
                optimized.fileSize,
            }),
          },
        )

      const saveResult =
        await saveResponse.json()

      if (
        !saveResponse.ok ||
        !saveResult.ok
      ) {
        throw new Error(
          saveResult.error ||
            '保存表情包失败',
        )
      }

      setSuccess(
        '表情包上传并保存成功。',
      )

      setName('')
      setFile(null)
      setOriginalInfo(null)
      setOptimized(null)

      if (originalPreview) {
        URL.revokeObjectURL(
          originalPreview,
        )
      }

      if (optimizedPreview) {
        URL.revokeObjectURL(
          optimizedPreview,
        )
      }

      setOriginalPreview(null)
      setOptimizedPreview(null)

      router.refresh()

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
  
    const updateSticker =
    async (
      id: string,
      values: {
        name?: string
        isActive?: boolean
        sortOrder?: number
      },
    ) => {
      const response =
        await fetch(
          '/api/admin/community-stickers',
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
            },
            body:
              JSON.stringify({
                id,
                ...values,
              }),
          },
        )

      const result =
        await response.json()

      if (
        !response.ok ||
        !result.ok
      ) {
        throw new Error(
          result.error ||
            '更新表情包失败',
        )
      }

      return result.sticker as
        CommunitySticker
    }

  const handleToggleActive =
    async (
      sticker:
        CommunitySticker,
    ) => {
      setActionId(
        sticker.id,
      )
      setError(null)

      try {
        const updated =
          await updateSticker(
            sticker.id,
            {
              isActive:
                !sticker.is_active,
            },
          )

        setStickers(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                sticker.id
                  ? updated
                  : item,
            ),
        )

        router.refresh()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : '更新表情包失败',
        )
      } finally {
        setActionId(null)
      }
    }

  const handleMove =
    async (
      index: number,
      direction:
        | 'up'
        | 'down',
    ) => {
      const targetIndex =
        direction === 'up'
          ? index - 1
          : index + 1

      if (
        targetIndex < 0 ||
        targetIndex >=
          stickers.length
      ) {
        return
      }

      const current =
        stickers[index]

      const target =
        stickers[targetIndex]

      setActionId(
        current.id,
      )
      setError(null)

      try {
        /*
         * 交换两条记录的
         * sort_order。
         */
        const currentOrder =
          current.sort_order

        const targetOrder =
          target.sort_order

        await updateSticker(
          current.id,
          {
            sortOrder:
              targetOrder,
          },
        )

        await updateSticker(
          target.id,
          {
            sortOrder:
              currentOrder,
          },
        )

        const next =
          [...stickers]

        next[index] =
          target

        next[targetIndex] =
          current

        setStickers(next)

        router.refresh()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : '调整排序失败',
        )

        /*
         * 如果第一条已经成功，
         * 第二条失败，
         * refresh 会重新读取
         * 数据库真实状态。
         */
        router.refresh()
      } finally {
        setActionId(null)
      }
    }

  const handleDelete =
    async (
      sticker:
        CommunitySticker,
    ) => {
      const confirmed =
        window.confirm(
          `确定永久删除「${sticker.name}」吗？\n\n原图、网站优化版和数据库记录都会永久删除，此操作无法撤销。`,
        )

      if (!confirmed) {
        return
      }

      setActionId(
        sticker.id,
      )
      setError(null)

      try {
        const response =
          await fetch(
            '/api/admin/community-stickers',
            {
              method:
                'DELETE',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body:
                JSON.stringify({
                  id:
                    sticker.id,
                }),
            },
          )

        const result =
          await response.json()

        if (
          !response.ok ||
          !result.ok
        ) {
          throw new Error(
            result.error ||
              '删除表情包失败',
          )
        }

        setStickers(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                sticker.id,
            ),
        )

        setSuccess(
          `已永久删除「${sticker.name}」。`,
        )

        router.refresh()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : '删除表情包失败',
        )
      } finally {
        setActionId(null)
      }
    }

  const handleRegenerate =
    async (
      sticker:
        CommunitySticker,
    ) => {
      setActionId(
        sticker.id,
      )
      setError(null)
      setSuccess(null)

      try {
        /*
         * 第一步：
         * 向服务器取得原图地址
         * 和 optimized 覆盖上传 Token。
         */
        const prepareResponse =
          await fetch(
            '/api/admin/community-stickers/regenerate',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body:
                JSON.stringify({
                  id:
                    sticker.id,
                }),
            },
          )

        const prepareResult =
          await prepareResponse.json()

        if (
          !prepareResponse.ok ||
          !prepareResult.ok
        ) {
          throw new Error(
            prepareResult.error ||
              '准备重新优化失败',
          )
        }

        /*
         * 第二步：
         * 从保留的原图下载 Blob。
         */
        const originalResponse =
          await fetch(
            prepareResult.sticker
              .originalUrl,
            {
              cache: 'no-store',
            },
          )

        if (
          !originalResponse.ok
        ) {
          throw new Error(
            '读取原图失败',
          )
        }

        const originalBlob =
          await originalResponse.blob()

        /*
         * optimizeStickerImage 接收 File，
         * 所以把 Blob 包装成 File。
         */
        const originalFile =
          new File(
            [
              originalBlob,
            ],
            `${sticker.name}-original`,
            {
              type:
                originalBlob.type ||
                'image/jpeg',
            },
          )

        /*
         * 第三步：
         * 使用现有统一规则重新生成。
         *
         * 当前：
         * 最长边 800px
         * WebP 0.85
         */
        const regenerated =
          await optimizeStickerImage(
            originalFile,
          )

        /*
         * 第四步：
         * 覆盖原来的 optimized 文件。
         */
        await uploadWithToken(
          prepareResult.upload
            .bucket,
          prepareResult.upload
            .path,
          prepareResult.upload
            .token,
          regenerated.blob,
          'image/webp',
        )

        /*
         * 第五步：
         * 更新数据库里的优化版
         * 尺寸和文件容量。
         */
        const updateResponse =
          await fetch(
            '/api/admin/community-stickers/regenerate',
            {
              method:
                'PATCH',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body:
                JSON.stringify({
                  id:
                    sticker.id,

                  optimizedWidth:
                    regenerated.width,

                  optimizedHeight:
                    regenerated.height,

                  optimizedFileSize:
                    regenerated.fileSize,
                }),
            },
          )

        const updateResult =
          await updateResponse.json()

        if (
          !updateResponse.ok ||
          !updateResult.ok
        ) {
          throw new Error(
            updateResult.error ||
              '更新优化版信息失败',
          )
        }

        /*
         * 更新当前页面数据。
         */
        setStickers(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                sticker.id
                  ? {
                      ...item,
                      ...updateResult.sticker,
                    }
                  : item,
            ),
        )

        setSuccess(
          `「${sticker.name}」已重新生成网站优化版。`,
        )

        router.refresh()
      } catch (err) {
        console.error(
          '[STICKER REGENERATE] Failed:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : '重新优化失败',
        )
      } finally {
        setActionId(null)
      }
    }
  
    const handleStartRename =
    (
      sticker:
        CommunitySticker,
    ) => {
      setEditingId(
        sticker.id,
      )

      setEditingName(
        sticker.name,
      )

      setError(null)
      setSuccess(null)
    }

  const handleCancelRename =
    () => {
      setEditingId(null)
      setEditingName('')
    }

  const handleSaveRename =
    async (
      sticker:
        CommunitySticker,
    ) => {
      const nextName =
        editingName.trim()

      if (!nextName) {
        setError(
          '表情包名称不能为空',
        )
        return
      }

      if (
        nextName.length > 80
      ) {
        setError(
          '表情包名称不能超过 80 个字符',
        )
        return
      }

      if (
        nextName ===
        sticker.name
      ) {
        handleCancelRename()
        return
      }

      setActionId(
        sticker.id,
      )
      setError(null)
      setSuccess(null)

      try {
        const updated =
          await updateSticker(
            sticker.id,
            {
              name:
                nextName,
            },
          )

        setStickers(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                sticker.id
                  ? updated
                  : item,
            ),
        )

        setEditingId(null)
        setEditingName('')

        setSuccess(
          `已将表情包名称修改为「${nextName}」。`,
        )

        router.refresh()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : '修改名称失败',
        )
      } finally {
        setActionId(null)
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

              <div className="border-t border-border pt-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              已有表情包
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              共 {stickers.length} 个，可调整显示顺序、上下架或永久删除。
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              已上架{' '}
              {
                stickers.filter(
                  (item) =>
                    item.is_active,
                ).length
              }
            </span>

            <span>
              已下架{' '}
              {
                stickers.filter(
                  (item) =>
                    !item.is_active,
                ).length
              }
            </span>
          </div>
        </div>

        {stickers.length ===
        0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <ImagePlus className="mx-auto size-7 text-muted-foreground" />

            <p className="mt-3 text-sm font-medium text-foreground">
              暂无社区表情包
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              上传第一张表情包后会显示在这里。
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stickers.map(
              (
                sticker,
                index,
              ) => {
                const busy =
                  actionId ===
                  sticker.id

                const originalSize =
                  sticker.original_file_size ??
                  0

                const optimizedSize =
                  sticker.optimized_file_size ??
                  0

                const savedPercent =
                  originalSize >
                  0
                    ? Math.max(
                        0,
                        Math.round(
                          (1 -
                            optimizedSize /
                              originalSize) *
                            100,
                        ),
                      )
                    : null

                return (
                  <div
                    key={
                      sticker.id
                    }
                    className="overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <div className="relative flex h-56 items-center justify-center overflow-hidden bg-muted/30 p-4">
                      <img
                        src={
                          sticker.optimized_url
                        }
                        alt={
                          sticker.name
                        }
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />

                      <div className="absolute left-3 top-3">
                        <span
                          className={
                            sticker.is_active
                              ? 'rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400'
                              : 'rounded-full border border-border bg-background/90 px-2 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur'
                          }
                        >
                          {sticker.is_active
                            ? '已上架'
                            : '已下架'}
                        </span>
                      </div>

                      <div className="absolute right-3 top-3 rounded-full bg-background/90 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">
                        #{index + 1}
                      </div>
                    </div>

                    <div className="space-y-4 p-4">
                      <div>
                        {editingId ===
                        sticker.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                value={
                                  editingName
                                }
                                maxLength={
                                  80
                                }
                                autoFocus
                                disabled={
                                  busy
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setEditingName(
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                onKeyDown={(
                                  event,
                                ) => {
                                  if (
                                    event.key ===
                                    'Enter'
                                  ) {
                                    event.preventDefault()

                                    void handleSaveRename(
                                      sticker,
                                    )
                                  }

                                  if (
                                    event.key ===
                                    'Escape'
                                  ) {
                                    handleCancelRename()
                                  }
                                }}
                              />

                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  void handleSaveRename(
                                    sticker,
                                  )
                                }
                              >
                                {busy ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Check className="size-4" />
                                )}

                                <span className="sr-only">
                                  保存名称
                                </span>
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={
                                  busy
                                }
                                onClick={
                                  handleCancelRename
                                }
                              >
                                <X className="size-4" />

                                <span className="sr-only">
                                  取消编辑
                                </span>
                              </Button>
                            </div>

                            <p className="text-[11px] text-muted-foreground">
                              Enter 保存 · Esc 取消
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                                {
                                  sticker.name
                                }
                              </p>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  handleStartRename(
                                    sticker,
                                  )
                                }
                              >
                                <Pencil className="size-3.5" />

                                <span className="sr-only">
                                  编辑名称
                                </span>
                              </Button>
                            </div>

                            <p className="mt-1 text-[11px] text-muted-foreground">
                              网站显示使用优化版
                            </p>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/30 p-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            原图
                          </p>

                          <p className="mt-1 text-xs text-foreground">
                            {sticker.original_width ??
                              '?'}
                            {' × '}
                            {sticker.original_height ??
                              '?'}
                          </p>

                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {formatBytes(
                              originalSize,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            优化版
                          </p>

                          <p className="mt-1 text-xs text-foreground">
                            {sticker.optimized_width ??
                              '?'}
                            {' × '}
                            {sticker.optimized_height ??
                              '?'}
                          </p>

                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {formatBytes(
                              optimizedSize,
                            )}

                            {savedPercent !==
                              null && (
                              <>
                                {' · '}
                                减少{' '}
                                {
                                  savedPercent
                                }
                                %
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={
                            busy ||
                            index === 0
                          }
                          onClick={() =>
                            void handleMove(
                              index,
                              'up',
                            )
                          }
                        >
                          <ArrowUp className="mr-1.5 size-3.5" />
                          上移
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={
                            busy ||
                            index ===
                              stickers.length -
                                1
                          }
                          onClick={() =>
                            void handleMove(
                              index,
                              'down',
                            )
                          }
                        >
                          <ArrowDown className="mr-1.5 size-3.5" />
                          下移
                        </Button>
                      </div>
                      
                         <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={
                          busy
                        }
                        onClick={() =>
                          void handleRegenerate(
                            sticker,
                          )
                        }
                      >
                        {busy ? (
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-1.5 size-3.5" />
                        )}

                        重新优化
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            void handleToggleActive(
                              sticker,
                            )
                          }
                        >
                          {busy ? (
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                          ) : sticker.is_active ? (
                            <EyeOff className="mr-1.5 size-3.5" />
                          ) : (
                            <Eye className="mr-1.5 size-3.5" />
                          )}

                          {sticker.is_active
                            ? '下架'
                            : '上架'}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            busy
                          }
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            void handleDelete(
                              sticker,
                            )
                          }
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">
                            删除
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              },
            )}
          </div>
        )}
      </div>

    </div>
  )
}