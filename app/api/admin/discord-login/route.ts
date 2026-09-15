import {
  NextResponse,
  type NextRequest,
} from 'next/server'

import { cookies } from 'next/headers'

import {
  ADMIN_TOKEN_COOKIE,
  getAnonClient,
  isAdminIdentity,
} from '@/lib/admin-auth'

export async function POST(
  request: NextRequest,
) {
  try {
    const authorization =
      request.headers.get('authorization')

    if (
      !authorization?.startsWith('Bearer ')
    ) {
      return NextResponse.json(
        { error: 'Discord 登录状态无效' },
        { status: 401 },
      )
    }

    const accessToken =
      authorization.slice(7).trim()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Discord 登录状态无效' },
        { status: 401 },
      )
    }

    const supabase = getAnonClient()

    if (!supabase) {
      return NextResponse.json(
        { error: '服务暂不可用' },
        { status: 500 },
      )
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(
      accessToken,
    )

    if (
      error ||
      !user
    ) {
      return NextResponse.json(
        { error: 'Discord 登录状态无效' },
        { status: 401 },
      )
    }

    if (
      !isAdminIdentity(
        user.id,
        user.email,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '该 Discord 账号没有后台管理权限',
        },
        { status: 403 },
      )
    }

    const cookieStore =
      await cookies()

    cookieStore.set(
      ADMIN_TOKEN_COOKIE,
      accessToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 3600,
      },
    )

    return NextResponse.json({
      ok: true,
    })
  } catch (error) {
    console.error(
      '[v0] Admin Discord login error:',
      error,
    )

    return NextResponse.json(
      { error: '后台登录失败，请重试' },
      { status: 500 },
    )
  }
}