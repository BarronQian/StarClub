import {
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  prepareArchiveImage,
} from '@/lib/archive-image'

export type ArchiveUploadKind =
  | 'cover'
  | 'photo'

export type ArchiveUploadVariant =
  | 'original'
  | 'display'
  | 'thumbnail'

export type ArchiveUploadedImage = {
  originalUrl: string
  displayUrl: string
  thumbnailUrl: string
  width: number
  height: number
  useOriginalAsDisplay: boolean
}

type SignedUploadResult = {
  bucket: string
  path: string
  token: string
  url: string
}

type UploadArchiveImageOptions = {
  supabase: SupabaseClient
  accessToken: string
  file: File
  kind: ArchiveUploadKind

  onStage?: (
    message: string,
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

function getExtension(
  file: File,
) {
  const fromName =
    file.name
      .split('.')
      .pop()
      ?.trim()
      .toLowerCase()

  if (
    fromName === 'jpg' ||
    fromName === 'jpeg' ||
    fromName === 'png' ||
    fromName === 'webp'
  ) {
    return fromName ===
      'jpeg'
      ? 'jpg'
      : fromName
  }

  switch (file.type) {
    case 'image/png':
      return 'png'

    case 'image/webp':
      return 'webp'

    default:
      return 'jpg'
  }
}

async function createSignedUpload({
  accessToken,
  kind,
  variant,
  name,
  type,
}: {
  accessToken: string
  kind: ArchiveUploadKind
  variant: ArchiveUploadVariant
  name: string
  type: string
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
              kind,
              variant,
              filename: name,
              type,
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

  if (
    !result?.bucket ||
    !result?.path ||
    !result?.token ||
    !result?.url
  ) {
    throw new Error(
      `${variant} 上传地址返回数据不完整`,
    )
  }

  return result as SignedUploadResult
}

async function uploadVariant({
  supabase,
  accessToken,
  kind,
  variant,
  blob,
  name,
  contentType,
}: {
  supabase: SupabaseClient
  accessToken: string
  kind: ArchiveUploadKind
  variant: ArchiveUploadVariant
  blob: Blob
  name: string
  contentType: string
}) {
  const signed =
    await createSignedUpload({
      accessToken,
      kind,
      variant,
      name,
      type: contentType,
    })

  const {
    error,
  } =
    await supabase.storage
      .from(
        signed.bucket,
      )
      .uploadToSignedUrl(
        signed.path,
        signed.token,
        blob,
        {
          contentType,
        },
      )

  if (error) {
    throw error
  }

  return signed.url
}

export async function uploadArchiveImage({
  supabase,
  accessToken,
  file,
  kind,
  onStage,
}: UploadArchiveImageOptions): Promise<ArchiveUploadedImage> {
  onStage?.(
    '正在处理图片...',
  )

  const prepared =
    await prepareArchiveImage(
      file,
    )

  /*
   * Original
   *
   * 永远保存用户上传的原始文件，
   * 不重新编码、不缩放。
   */
  onStage?.(
    '正在上传原图...',
  )

  const extension =
    getExtension(file)

  const originalUrl =
    await uploadVariant({
      supabase,
      accessToken,
      kind,
      variant:
        'original',

      blob: file,

      name:
        `original.${extension}`,

      contentType:
        file.type ||
        'image/jpeg',
    })

  /*
   * Display
   *
   * < 1200px：
   * 不进行第二次有损压缩，
   * 直接使用 Original。
   *
   * >= 1200px：
   * 使用 prepareArchiveImage()
   * 生成的 WebP Display。
   */
  let displayUrl =
    originalUrl

  if (
    !prepared
      .useOriginalAsDisplay &&
    prepared.display
  ) {
    onStage?.(
      '正在上传展示图...',
    )

    displayUrl =
      await uploadVariant({
        supabase,
        accessToken,
        kind,
        variant:
          'display',

        blob:
          prepared
            .display
            .blob,

        name:
          'display.webp',

        contentType:
          'image/webp',
      })
  }

  /*
   * Thumbnail
   *
   * 永远生成。
   * 用于列表、卡片、Archive Grid。
   */
  onStage?.(
    '正在上传缩略图...',
  )

  const thumbnailUrl =
    await uploadVariant({
      supabase,
      accessToken,
      kind,
      variant:
        'thumbnail',

      blob:
        prepared
          .thumbnail
          .blob,

      name:
        'thumbnail.webp',

      contentType:
        'image/webp',
    })

  return {
    originalUrl,
    displayUrl,
    thumbnailUrl,

    width:
      prepared
        .originalWidth,

    height:
      prepared
        .originalHeight,

    useOriginalAsDisplay:
      prepared
        .useOriginalAsDisplay,
  }
}