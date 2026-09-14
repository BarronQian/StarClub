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
  'guide-images'

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

    const maxSize =
      10 * 1024 * 1024

    if (
      file.size >
      maxSize
    ) {
      return NextResponse.json(
        {
          error:
            '图片不能超过 10MB',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    const originalName =
      sanitizeFileName(
        file.name,
      )

    const extension =
      originalName.includes('.')
        ? originalName
            .split('.')
            .pop()
        : 'jpg'

    const baseName =
      originalName
        .replace(
          /\.[^.]+$/,
          '',
        )
        .slice(0, 80) ||
      'guide-image'

    const filePath =
      `guides/${Date.now()}-${baseName}.${extension}`

    const arrayBuffer =
      await file.arrayBuffer()

    const {
      error: uploadError,
    } = await supabase.storage
      .from(BUCKET)
      .upload(
        filePath,
        arrayBuffer,
        {
          contentType:
            file.type,
          upsert: false,
        },
      )

    if (uploadError) {
      console.error(
        '[GUIDE UPLOAD] Upload failed:',
        uploadError,
      )

      return NextResponse.json(
        {
          error:
            '上传图片失败',
        },
        {
          status: 500,
        },
      )
    }

    const {
      data:
        publicUrlData,
    } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(
        filePath,
      )

    return NextResponse.json({
      ok: true,
      path:
        filePath,
      url:
        publicUrlData
          .publicUrl,
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
            ? error.message
            : '上传图片失败',
      },
      {
        status: 500,
      },
    )
  }
}