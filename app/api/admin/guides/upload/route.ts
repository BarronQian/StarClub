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

const BUCKET = 'guide-images'

const MAX_FILE_SIZE =
  30 * 1024 * 1024

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

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

  if (extension) {
    return extension
  }

  switch (fileType) {
    case 'image/png':
      return 'png'

    case 'image/webp':
      return 'webp'

    case 'image/gif':
      return 'gif'

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
      .slice(0, 60) ||
    'guide-image'
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

    if (
      !ALLOWED_TYPES.includes(
        fileType,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '不支持这种图片格式',
        },
        {
          status: 400,
        },
      )
    }

    if (
      fileSize <= 0 ||
      fileSize >
        MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            '攻略图片单张不能超过 30MB',
        },
        {
          status: 400,
        },
      )
    }

    const extension =
      getExtension(
        fileName,
        fileType,
      )

    const baseName =
      getBaseName(
        fileName,
      )

    const filePath =
      `guides/${Date.now()}-${crypto.randomUUID()}-${baseName}.${extension}`

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
        '[GUIDE SIGNED UPLOAD] Failed:',
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
      '[GUIDE SIGNED UPLOAD] POST failed:',
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