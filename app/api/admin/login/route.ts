import { cookies } from 'next/headers'
import {
  NextResponse,
  type NextRequest,
} from 'next/server'

import {
  ADMIN_TOKEN_COOKIE,
  getAnonClient,
  isAdminEmail,
} from '@/lib/admin-auth'

export async function POST(
  request: NextRequest,
) {
  const body = await request
    .json()
    .catch(() => null)

  const email =
    typeof body?.email === 'string'
      ? body.email.trim()
      : ''

  const password =
    typeof body?.password === 'string'
      ? body.password
      : ''

  if (!email || !password) {
    return NextResponse.json(
      {
        error: '请填写邮箱和密码',
      },
      {
        status: 400,
      },
    )
  }

  /*
   * 不向前端暴露：
   * - 管理员邮箱名单
   * - 环境变量名称
   * - 某个邮箱是否具有后台权限
   */
  if (!isAdminEmail(email)) {
    return NextResponse.json(
      {
        error:
          '邮箱、密码或管理权限无效',
      },
      {
        status: 401,
      },
    )
  }

  const supabase =
    getAnonClient()

  if (!supabase) {
    console.error(
      '[v0] Admin login: Supabase anon client is not configured',
    )

    return NextResponse.json(
      {
        error:
          '服务暂不可用，请稍后重试',
      },
      {
        status: 500,
      },
    )
  }

  const {
    data,
    error,
  } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (
    error ||
    !data.session ||
    !data.user.email ||
    !isAdminEmail(data.user.email)
  ) {
    return NextResponse.json(
      {
        error:
          '邮箱、密码或管理权限无效',
      },
      {
        status: 401,
      },
    )
  }

  const cookieStore =
    await cookies()

  cookieStore.set(
    ADMIN_TOKEN_COOKIE,
    data.session.access_token,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        'production',
      sameSite: 'lax',
      path: '/',
      maxAge:
        data.session.expires_in ??
        3600,
    },
  )

  return NextResponse.json({
    ok: true,
  })
}