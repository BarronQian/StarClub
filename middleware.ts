import {
  NextRequest,
  NextResponse,
} from 'next/server'

const ADMIN_COOKIE =
  'admin_token'

export async function middleware(
  request: NextRequest,
) {
  const pathname =
    request.nextUrl.pathname

  // 登录页必须允许访问，否则会死循环
  if (
    pathname ===
    '/admin/login'
  ) {
    return NextResponse.next()
  }

  const token =
    request.cookies.get(
      ADMIN_COOKIE,
    )?.value

  if (!token) {
    const loginUrl =
      new URL(
        '/admin/login',
        request.url,
      )

    return NextResponse.redirect(
      loginUrl,
    )
  }

  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL

  const anonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !supabaseUrl ||
    !anonKey
  ) {
    console.error(
      '[ADMIN MIDDLEWARE] Missing Supabase environment variables',
    )

    return NextResponse.redirect(
      new URL(
        '/admin/login',
        request.url,
      ),
    )
  }

  try {
    const response =
      await fetch(
        `${supabaseUrl}/auth/v1/user`,
        {
          headers: {
            apikey:
              anonKey,

            Authorization:
              `Bearer ${token}`,
          },
          cache:
            'no-store',
        },
      )

    if (
      !response.ok
    ) {
      const redirect =
        NextResponse.redirect(
          new URL(
            '/admin/login',
            request.url,
          ),
        )

      redirect.cookies.delete(
        ADMIN_COOKIE,
      )

      return redirect
    }

    return NextResponse.next()
  } catch (error) {
    console.error(
      '[ADMIN MIDDLEWARE] Auth check failed:',
      error,
    )

    return NextResponse.redirect(
      new URL(
        '/admin/login',
        request.url,
      ),
    )
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}