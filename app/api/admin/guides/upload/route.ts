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
  file: File,
) {
  const name =
    sanitizeFileName(
      file.name,
    )

  const extension =
    name.includes('.')
      ? name
          .split('.')
          .pop()
          ?.toLowerCase()
      : null

  if (extension) {
    return extension
  }

  switch (file.type) {
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
  file: File,
) {
  const name =
    sanitizeFileName(
      file.name,
    )

  return (
    name
      .replace(
        /\.[^.]+$/,
        '',
      )
      .slice(0, 80) ||
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
    const formData =
      await request.formData()

    const file =
      formData.get('file')

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            '请选择图片文件',
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
            '只能上传图片文件',
        },
        {
          status: 400,
        },
      )
    }

    if (
      file.size >
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

    const supabase =
      getAdminSupabase()

    const extension =
      getExtension(file)

    const baseName =
      getBaseName(file)

    const uniqueId =
      crypto.randomUUID()

    const filePath =
      `guides/${Date.now()}-${uniqueId}-${baseName}.${extension}`

    console.log(
      '[GUIDE UPLOAD] Starting:',
      {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeMB:
          (
            file.size /
            1024 /
            1024
          ).toFixed(2),
        path: filePath,
      },
    )

    const arrayBuffer =
      await file.arrayBuffer()

    const {
      data: uploadData,
      error: uploadError,
    } =
      await supabase.storage
        .from(BUCKET)
        .upload(
          filePath,
          arrayBuffer,
          {
            contentType:
              file.type ||
              'application/octet-stream',

            cacheControl:
              '31536000',

            upsert: false,
          },
        )

    if (uploadError) {
      console.error(
        '[GUIDE UPLOAD] Supabase upload failed:',
        uploadError,
      )

      return NextResponse.json(
        {
          error:
            uploadError.message
              ? `上传失败：${uploadError.message}`
              : '上传图片失败',

          details: {
            name:
              uploadError.name ??
              null,

            message:
              uploadError.message ??
              null,
          },
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

    console.log(
      '[GUIDE UPLOAD] Success:',
      {
        path:
          uploadData.path,

        sizeMB:
          (
            file.size /
            1024 /
            1024
          ).toFixed(2),
      },
    )

    return NextResponse.json({
      ok: true,

      path:
        uploadData.path,

      url:
        publicUrlData
          .publicUrl,

      file: {
        name:
          file.name,

        type:
          file.type,

        size:
          file.size,
      },
    })
  } catch (error) {
    console.error(
      '[GUIDE UPLOAD] POST failed:',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `上传失败：${error.message}`
            : '上传图片失败',
      },
      {
        status: 500,
      },
    )
  }
}