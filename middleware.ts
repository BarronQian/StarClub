import {
  NextRequest,
  NextResponse,
} from 'next/server'

const ADMIN_COOKIE =
  'admin_token'

function normalizeEmail(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
}

function getAllowedAdminEmails() {
  const emails =
    new Set<string>()

  const ownerEmail =
    process.env
      .STARCLUB_OWNER_EMAIL

  if (ownerEmail) {
    emails.add(
      normalizeEmail(
        ownerEmail,
      ),
    )
  }

  const adminEmails =
    process.env
      .STARCLUB_ADMIN_EMAILS

  if (adminEmails) {
    adminEmails
      .split(',')
      .map(
        normalizeEmail,
      )
      .filter(Boolean)
      .forEach(
        (email) =>
          emails.add(
            email,
          ),
      )
  }

  return emails
}

function redirectToLogin(
  request: NextRequest,
  clearCookie = false,
) {
  const response =
    NextResponse.redirect(
      new URL(
        '/admin/login',
        request.url,
      ),
    )

  if (clearCookie) {
    response.cookies.delete(
      ADMIN_COOKIE,
    )
  }

  return response
}

export async function middleware(
  request: NextRequest,
) {
  const pathname =
    request.nextUrl.pathname

  // 登录页必须公开，否则会无限重定向
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
    return redirectToLogin(
      request,
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

    return redirectToLogin(
      request,
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

    if (!response.ok) {
      return redirectToLogin(
        request,
        true,
      )
    }

    const user =
      (await response.json()) as {
        id?: string
        email?: string
      }

    if (!user.email) {
      return redirectToLogin(
        request,
        true,
      )
    }

    const allowedEmails =
      getAllowedAdminEmails()

    const email =
      normalizeEmail(
        user.email,
      )

    if (
      !allowedEmails.has(
        email,
      )
    ) {
      console.warn(
        '[ADMIN MIDDLEWARE] Non-admin account blocked:',
        email,
      )

      return redirectToLogin(
        request,
        true,
      )
    }

    return NextResponse.next()
  } catch (error) {
    console.error(
      '[ADMIN MIDDLEWARE] Auth check failed:',
      error,
    )

    return redirectToLogin(
      request,
    )
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}