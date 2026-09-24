import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  requireAdminApi,
} from '@/lib/admin-auth'

import {
  createAdminClient,
} from '@/lib/supabase-admin'

export const runtime = 'nodejs'

type UploadKind =
  | 'cover'
  | 'photo'

type UploadVariant =
  | 'original'
  | 'display'
  | 'thumbnail'

function sanitizeFilename(
  filename: string,
) {
  const cleaned = filename
    .trim()
    .replace(/\s+/g, '-')
    .replace(
      /[^a-zA-Z0-9._-]/g,
      '',
    )

  return (
    cleaned ||
    `archive-${Date.now()}`
  )
}

function getExtension(
  filename: string,
) {
  const parts =
    filename.split('.')

  if (parts.length < 2) {
    return ''
  }

  return (
    parts.pop()?.toLowerCase() ??
    ''
  )
}

function createSafeBaseName(
  filename: string,
) {
  const safe =
    sanitizeFilename(filename)

  const extension =
    getExtension(safe)

  const base = extension
    ? safe.slice(
        0,
        -(extension.length + 1),
      )
    : safe

  return (
    base ||
    `archive-${Date.now()}`
  )
}

export async function POST(
  request: NextRequest,
) {
  try {
    await requireAdminApi()

    const body =
      await request.json()

    const filename =
      typeof body?.filename ===
      'string'
        ? body.filename
        : ''

    const kind =
      body?.kind as UploadKind

    const variant =
      body?.variant as UploadVariant

    if (!filename) {
      return NextResponse.json(
        {
          error:
            '缺少文件名',
        },
        {
          status: 400,
        },
      )
    }

    if (
      kind !== 'cover' &&
      kind !== 'photo'
    ) {
      return NextResponse.json(
        {
          error:
            '无效的 Archive 图片类型',
        },
        {
          status: 400,
        },
      )
    }

    if (
      variant !== 'original' &&
      variant !== 'display' &&
      variant !== 'thumbnail'
    ) {
      return NextResponse.json(
        {
          error:
            '无效的图片版本',
        },
        {
          status: 400,
        },
      )
    }

    const originalExtension =
      getExtension(filename)

    const allowedExtensions =
      ['jpg', 'jpeg', 'png', 'webp']

    if (
      variant === 'original' &&
      !allowedExtensions.includes(
        originalExtension,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '仅支持 JPG、PNG、WebP 图片',
        },
        {
          status: 400,
        },
      )
    }

    const now = new Date()

    const year =
      now.getUTCFullYear()

    const month = String(
      now.getUTCMonth() + 1,
    ).padStart(2, '0')

    const baseName =
      createSafeBaseName(
        filename,
      )

    const uniqueId =
      crypto.randomUUID()

    const folder =
      kind === 'cover'
        ? 'covers'
        : 'photos'

    let finalFilename: string

    if (
      variant === 'original'
    ) {
      finalFilename =
        `${baseName}-${uniqueId}.${originalExtension}`
    } else {
      finalFilename =
        `${baseName}-${uniqueId}.webp`
    }

    const path =
      `${folder}/${variant}/${year}/${month}/${finalFilename}`

    const supabase =
      createAdminClient()

    const {
      data,
      error,
    } =
      await supabase.storage
        .from('archive')
        .createSignedUploadUrl(
          path,
        )

    if (
      error ||
      !data?.token
    ) {
      console.error(
        '[ARCHIVE UPLOAD URL]',
        error,
      )

      return NextResponse.json(
        {
          error:
            '无法创建上传地址',
        },
        {
          status: 500,
        },
      )
    }

    const {
      data: publicUrlData,
    } =
      supabase.storage
        .from('archive')
        .getPublicUrl(path)

    return NextResponse.json({
      bucket: 'archive',
      path,
      token: data.token,
      url:
        publicUrlData.publicUrl,
      kind,
      variant,
    })
  } catch (error) {
    console.error(
      '[ARCHIVE UPLOAD URL]',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '上传初始化失败',
      },
      {
        status: 500,
      },
    )
  }
}