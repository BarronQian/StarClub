import {
  NextResponse,
  type NextRequest,
} from 'next/server'

import {
  requireAdminApi,
} from '@/lib/admin-auth'

import {
  createAdminClient,
} from '@/lib/supabase-admin'

import {
  MAX_UPLOAD_BYTES,
  formatFileSize,
} from '@/lib/upload-limits'

const BUCKET =
  'gallery'

const MIME_EXTENSIONS: Record<
  string,
  string
> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
}

function getSafeExtension(
  name: string,
  mimeType: string,
): string {
  const lastDot =
    name.lastIndexOf('.')

  const rawExt =
    lastDot > 0
      ? name
          .slice(
            lastDot + 1,
          )
          .toLowerCase()
      : ''

  const safeExt =
    /^[a-z0-9]{1,5}$/.test(
      rawExt,
    )
      ? rawExt
      : ''

  return (
    safeExt ||
    MIME_EXTENSIONS[
      mimeType
    ] ||
    'jpg'
  )
}

function generateStorageFilename(
  name: string,
  mimeType: string,
): string {
  const ext =
    getSafeExtension(
      name,
      mimeType,
    )

  const uniqueId =
    typeof crypto.randomUUID ===
    'function'
      ? crypto.randomUUID()
      : Math.random()
          .toString(36)
          .slice(2)

  return `${Date.now()}-${uniqueId}.${ext}`
}

export async function POST(
  request: NextRequest,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  const formData =
    await request
      .formData()
      .catch(() => null)

  const file =
    formData?.get('file')

  if (
    !file ||
    !(file instanceof File)
  ) {
    return NextResponse.json(
      {
        error:
          '未提供图片文件',
      },
      {
        status: 400,
      },
    )
  }

  if (
    !file.type.startsWith(
      'image/',
    )
  ) {
    return NextResponse.json(
      {
        error:
          '仅支持上传图片文件',
      },
      {
        status: 400,
      },
    )
  }

  if (
    file.size >
    MAX_UPLOAD_BYTES
  ) {
    return NextResponse.json(
      {
        error:
          `图片文件过大：原始大小 ${formatFileSize(
            file.size,
          )}，超过服务器支持的最大上传大小 ${formatFileSize(
            MAX_UPLOAD_BYTES,
          )}。请压缩图片或裁剪尺寸后重新上传。`,

        originalSize:
          file.size,

        maxSize:
          MAX_UPLOAD_BYTES,
      },
      {
        status: 413,
      },
    )
  }

  const now =
    new Date()

  const year =
    String(
      now.getFullYear(),
    )

  const month =
    String(
      now.getMonth() + 1,
    ).padStart(
      2,
      '0',
    )

  const uniqueName =
    generateStorageFilename(
      file.name,
      file.type,
    )

  const path =
    `events/${year}/${month}/${uniqueName}`

  const admin =
    createAdminClient()

  const buffer =
    await file.arrayBuffer()

  const {
    error: uploadError,
  } =
    await admin.storage
      .from(
        BUCKET,
      )
      .upload(
        path,
        buffer,
        {
          contentType:
            file.type,

          cacheControl:
            '31536000',

          upsert:
            false,
        },
      )

  if (uploadError) {
    console.error(
      '[v0] Event cover upload error:',
      uploadError,
    )

    return NextResponse.json(
      {
        error:
          '活动封面上传失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  const {
    data,
  } =
    admin.storage
      .from(
        BUCKET,
      )
      .getPublicUrl(
        path,
      )

  return NextResponse.json({
    url:
      data.publicUrl,

    path,
  })
}