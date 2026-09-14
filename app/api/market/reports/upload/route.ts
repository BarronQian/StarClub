import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

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

const MAX_FILE_SIZE =
  5 * 1024 * 1024

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

function getExtension(
  type: string,
) {
  if (
    type === 'image/png'
  ) {
    return 'png'
  }

  if (
    type === 'image/webp'
  ) {
    return 'webp'
  }

  return 'jpg'
}

export async function POST(
  request: NextRequest,
) {
  const supabase =
    getAdminSupabase()

  const authorization =
    request.headers.get(
      'authorization',
    )

  if (
    !authorization?.startsWith(
      'Bearer ',
    )
  ) {
    return NextResponse.json(
      {
        error:
          '请先登录后上传证据',
      },
      {
        status: 401,
      },
    )
  }

  const accessToken =
    authorization.slice(7)

  const {
    data: {
      user,
    },
    error: userError,
  } =
    await supabase.auth.getUser(
      accessToken,
    )

  if (
    userError ||
    !user
  ) {
    return NextResponse.json(
      {
        error:
          '登录状态已失效',
      },
      {
        status: 401,
      },
    )
  }

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from('profiles')
      .select(`
        id,
        banned_at
      `)
      .eq(
        'id',
        user.id,
      )
      .maybeSingle()

  if (
    profileError ||
    !profile
  ) {
    return NextResponse.json(
      {
        error:
          '读取用户资料失败',
      },
      {
        status: 500,
      },
    )
  }

  if (
    profile.banned_at
  ) {
    return NextResponse.json(
      {
        error:
          '当前账号无法上传举报证据',
      },
      {
        status: 403,
      },
    )
  }

  let formData: FormData

  try {
    formData =
      await request.formData()
  } catch {
    return NextResponse.json(
      {
        error:
          '上传内容格式错误',
      },
      {
        status: 400,
      },
    )
  }

  const file =
    formData.get('file')

  if (
    !(file instanceof File)
  ) {
    return NextResponse.json(
      {
        error:
          '请选择要上传的图片',
      },
      {
        status: 400,
      },
    )
  }

  if (
    !ALLOWED_TYPES.includes(
      file.type,
    )
  ) {
    return NextResponse.json(
      {
        error:
          '仅支持 JPG、PNG 或 WEBP 图片',
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
          '图片不能超过 5MB',
      },
      {
        status: 400,
      },
    )
  }

  const extension =
    getExtension(
      file.type,
    )

  const fileName =
    `${user.id}/${crypto.randomUUID()}.${extension}`

  const {
    error: uploadError,
  } =
    await supabase.storage
      .from(
        'market-report-evidence',
      )
      .upload(
        fileName,
        file,
        {
          contentType:
            file.type,
          cacheControl:
            '3600',
          upsert:
            false,
        },
      )

  if (uploadError) {
    console.error(
      '[MARKET REPORT EVIDENCE] Upload failed:',
      uploadError,
    )

    return NextResponse.json(
      {
        error:
          '证据图片上传失败',
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
      .from(
        'market-report-evidence',
      )
      .getPublicUrl(
        fileName,
      )

  const url =
    publicUrlData.publicUrl

  if (!url) {
    return NextResponse.json(
      {
        error:
          '图片上传成功，但无法生成访问地址',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json(
    {
      url,
    },
    {
      status: 201,
    },
  )
}