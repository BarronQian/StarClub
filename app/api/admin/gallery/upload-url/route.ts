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

const BUCKET = 'gallery'

type GalleryImageVariant =
  | 'original'
  | 'display'
  | 'thumbnail'

const VALID_VARIANTS =
  new Set<GalleryImageVariant>([
    'original',
    'display',
    'thumbnail',
  ])

const MIME_EXTENSIONS:
  Record<string, string> = {
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
          .slice(lastDot + 1)
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
    MIME_EXTENSIONS[mimeType] ||
    'jpg'
  )
}

function generateStorageFilename(
  name: string,
  mimeType: string,
  variant: GalleryImageVariant,
): string {
  const ext =
    variant === 'original'
      ? getSafeExtension(
          name,
          mimeType,
        )
      : 'webp'

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

  const body =
    await request
      .json()
      .catch(() => null)

  const name =
    typeof body?.name === 'string'
      ? body.name
      : ''

  const mimeType =
    typeof body?.type === 'string'
      ? body.type
      : ''

  const rawVariant =
    typeof body?.variant === 'string'
      ? body.variant
      : 'original'

  if (
    !VALID_VARIANTS.has(
      rawVariant as GalleryImageVariant,
    )
  ) {
    return NextResponse.json(
      {
        error:
          '图片版本无效',
      },
      {
        status: 400,
      },
    )
  }

  const variant =
    rawVariant as GalleryImageVariant

  if (
    !mimeType.startsWith(
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
      name,
      mimeType,
      variant,
    )

  const path =
    `${variant}/${year}/${month}/${uniqueName}`

  const admin =
    createAdminClient()

  const {
    data,
    error,
  } =
    await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(
        path,
      )

  if (
    error ||
    !data
  ) {
    console.error(
      '[v0] Gallery signed upload URL error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '获取上传授权失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  const {
    data: publicData,
  } =
    admin.storage
      .from(BUCKET)
      .getPublicUrl(path)

  return NextResponse.json({
    bucket: BUCKET,
    path,
    token:
      data.token,
    url:
      publicData.publicUrl,
    variant,
  })
}