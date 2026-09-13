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

  const path =
    typeof body?.path ===
    'string'
      ? body.path.trim()
      : ''

  // 安全限制：
  // 只允许删除活动后台上传的文件
  if (
    !path ||
    !path.startsWith(
      'events/',
    )
  ) {
    return NextResponse.json(
      {
        error:
          '无效的活动图片路径',
      },
      {
        status: 400,
      },
    )
  }

  const admin =
    createAdminClient()

  const {
    error,
  } =
    await admin.storage
      .from(BUCKET)
      .remove([path])

  if (error) {
    console.error(
      '[v0] Event cover cleanup error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '旧活动封面清理失败',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json({
    success: true,
  })
}