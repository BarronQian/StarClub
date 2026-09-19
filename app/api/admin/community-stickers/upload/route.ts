import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

import {
  requireAdminApi,
} from '@/lib/admin-auth'

const BUCKET =
  'community-stickers'

const MAX_ORIGINAL_FILE_SIZE =
  10 * 1024 * 1024

const MAX_OPTIMIZED_FILE_SIZE =
  2 * 1024 * 1024

const ALLOWED_ORIGINAL_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

type UploadKind =
  | 'original'
  | 'optimized'

function getAdminSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      'Missing Supabase server environment variables',
    )
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

function sanitizeFileName(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(
      /[^a-z0-9._-]/g,
      '',
    )
}

function getExtension(
  fileName: string,
  fileType: string,
) {
  const cleanName =
    sanitizeFileName(
      fileName,
    )

  const extension =
    cleanName.includes('.')
      ? cleanName
          .split('.')
          .pop()
          ?.toLowerCase()
      : null

  if (
    extension === 'jpg' ||
    extension === 'jpeg' ||
    extension === 'png' ||
    extension === 'webp'
  ) {
    return extension
  }

  switch (fileType) {
    case 'image/png':
      return 'png'

    case 'image/webp':
      return 'webp'

    case 'image/jpeg':
    default:
      return 'jpg'
  }
}

function getBaseName(
  fileName: string,
) {
  const cleanName =
    sanitizeFileName(
      fileName,
    )

  return (
    cleanName
      .replace(
        /\.[^.]+$/,
        '',
      )
      .slice(0, 50) ||
    'sticker'
  )
}

export async function POST(
  request: NextRequest,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  try {
    const body =
      await request.json()

    const kind: UploadKind | null =
      body.kind === 'original' ||
      body.kind === 'optimized'
        ? body.kind
        : null

    const fileName =
      typeof body.fileName ===
      'string'
        ? body.fileName
        : ''

    const fileType =
      typeof body.fileType ===
      'string'
        ? body.fileType
        : ''

    const fileSize =
      typeof body.fileSize ===
      'number'
        ? body.fileSize
        : 0

    const uploadId =
      typeof body.uploadId ===
        'string' &&
      body.uploadId.trim()
        ? body.uploadId.trim()
        : ''

    if (!kind) {
      return NextResponse.json(
        {
          error:
            '缺少上传类型',
        },
        {
          status: 400,
        },
      )
    }

    if (!fileName) {
      return NextResponse.json(
        {
          error:
            '缺少文件名称',
        },
        {
          status: 400,
        },
      )
    }

    if (!uploadId) {
      return NextResponse.json(
        {
          error:
            '缺少上传 ID',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !/^[a-zA-Z0-9-]+$/.test(
        uploadId,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '无效的上传 ID',
        },
        {
          status: 400,
        },
      )
    }

    if (kind === 'original') {
      if (
        !ALLOWED_ORIGINAL_TYPES.includes(
          fileType,
        )
      ) {
        return NextResponse.json(
          {
            error:
              '原图仅支持 JPG、PNG、WebP',
          },
          {
            status: 400,
          },
        )
      }

      if (
        fileSize <= 0 ||
        fileSize >
          MAX_ORIGINAL_FILE_SIZE
      ) {
        return NextResponse.json(
          {
            error:
              '表情包原图不能超过 10MB',
          },
          {
            status: 400,
          },
        )
      }
    }

    if (kind === 'optimized') {
      if (
        fileType !==
        'image/webp'
      ) {
        return NextResponse.json(
          {
            error:
              '网页优化版必须为 WebP',
          },
          {
            status: 400,
          },
        )
      }

      if (
        fileSize <= 0 ||
        fileSize >
          MAX_OPTIMIZED_FILE_SIZE
      ) {
        return NextResponse.json(
          {
            error:
              '优化后的表情包文件过大',
          },
          {
            status: 400,
          },
        )
      }
    }

    const extension =
      kind === 'optimized'
        ? 'webp'
        : getExtension(
            fileName,
            fileType,
          )

    const baseName =
      getBaseName(
        fileName,
      )

    const folder =
      kind === 'original'
        ? 'originals'
        : 'optimized'

    const filePath =
      `${folder}/${uploadId}-${baseName}.${extension}`

    const supabase =
      getAdminSupabase()

    const {
      data,
      error,
    } =
      await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(
          filePath,
        )

    if (error) {
      console.error(
        '[STICKER SIGNED UPLOAD] Failed:',
        error,
      )

      return NextResponse.json(
        {
          error:
            error.message ||
            '创建上传地址失败',
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
        .from(BUCKET)
        .getPublicUrl(
          filePath,
        )

    return NextResponse.json({
      ok: true,
      bucket: BUCKET,
      path: filePath,
      token: data.token,
      signedUrl:
        data.signedUrl,
      publicUrl:
        publicUrlData.publicUrl,
    })
  } catch (error) {
    console.error(
      '[STICKER SIGNED UPLOAD] POST failed:',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '创建上传地址失败',
      },
      {
        status: 500,
      },
    )
  }
}