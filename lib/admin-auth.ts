import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type AdminSession = { id: string; email: string }

export type AdminRole = 'owner' | 'admin'

export function isOwnerEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false

  const ownerEmail =
    process.env.STARCLUB_OWNER_EMAIL
      ?.trim()
      .toLowerCase()

  if (!ownerEmail) return false

  return email.toLowerCase() === ownerEmail
}

export function getAdminRole(
  email: string | null | undefined,
): AdminRole {
  return isOwnerEmail(email)
    ? 'owner'
    : 'admin'
}

/**
 * 判断某个“社区 Profile / Auth User ID”是否为 Owner。
 *
 * 注意：
 * STARCLUB_OWNER_EMAIL 用于后台 Admin 身份；
 * STARCLUB_OWNER_USER_ID 用于社区里的 Owner 身份。
 */
export function isOwnerUserId(
  userId: string | null | undefined,
): boolean {
  if (!userId) return false

  const ownerUserId =
    process.env.STARCLUB_OWNER_USER_ID
      ?.trim()

  if (!ownerUserId) return false

  return userId === ownerUserId
}

/**
 * 获取社区管理组用户 ID 白名单。
 *
 * 多个 UUID 使用英文逗号分隔：
 * STARCLUB_ADMIN_USER_IDS=id1,id2,id3
 */
function getAllowedAdminUserIds(): string[] {
  return (
    process.env.STARCLUB_ADMIN_USER_IDS ??
    ''
  )
    .split(',')
    .map((userId) => userId.trim())
    .filter(Boolean)
}

/**
 * 判断某个社区用户是否属于管理组。
 *
 * Owner 自动视为管理组成员，
 * 所以不需要在 STARCLUB_ADMIN_USER_IDS
 * 中重复填写 Owner ID。
 */
export function isAdminUserId(
  userId: string | null | undefined,
): boolean {
  if (!userId) return false

  if (isOwnerUserId(userId)) {
    return true
  }

  return getAllowedAdminUserIds().includes(
    userId,
  )
}

export function isOwnerIdentity(
  userId: string | null | undefined,
  email: string | null | undefined,
): boolean {
  return (
    isOwnerUserId(userId) ||
    isOwnerEmail(email)
  )
}

export function isAdminIdentity(
  userId: string | null | undefined,
  email: string | null | undefined,
): boolean {
  if (
    isOwnerIdentity(
      userId,
      email,
    )
  ) {
    return true
  }

  if (
    isAdminUserId(
      userId,
    )
  ) {
    return true
  }

  return isAdminEmail(
    email,
  )
}

/** Cookie that stores the caller's Supabase Auth access token once they've
 * been verified against STARCLUB_ADMIN_EMAILS at login time. This is a
 * minimal, stateless gate — no middleware, no SSR cookie-sync client. */
export const ADMIN_TOKEN_COOKIE = 'admin_token'

function getAllowedAdminEmails(): string[] {
  return (
    process.env.STARCLUB_ADMIN_EMAILS ??
    ''
  )
    .split(',')
    .map((email) =>
      email.trim().toLowerCase(),
    )
    .filter(Boolean)
}

/** Whether an email is on the STARCLUB_ADMIN_EMAILS allowlist. */
export function isAdminEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false

  return getAllowedAdminEmails().includes(
    email.toLowerCase(),
  )
}

/** Plain (non-SSR) Supabase client using the anon key, only ever used
 * server-side and statelessly (no session persistence) to verify a caller's
 * access token or to run `signInWithPassword` during login. */
function getAnonClient(): SupabaseClient | null {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL

  const anonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY

  if (
    !supabaseUrl ||
    !anonKey
  ) {
    return null
  }

  return createClient(
    supabaseUrl,
    anonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

export { getAnonClient }

async function verifyAdminToken(
  token: string | undefined,
): Promise<AdminSession | null> {
  if (!token) return null

  const supabase =
    getAnonClient()

  if (!supabase) {
    return null
  }

  const {
    data,
    error,
  } =
    await supabase.auth.getUser(
      token,
    )

  if (
    error ||
    !data.user?.email ||
    !isAdminEmail(
      data.user.email,
    )
  ) {
    return null
  }

  return {
    id: data.user.id,
    email: data.user.email,
  }
}

/**
 * For Server Components / pages. Returns the current admin session, or null
 * if there's no valid `admin_token` cookie. Because the login route only
 * ever sets this cookie for allow-listed emails, a valid token always
 * implies admin access — no separate "logged in but not admin" state.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore =
    await cookies()

  return verifyAdminToken(
    cookieStore.get(
      ADMIN_TOKEN_COOKIE,
    )?.value,
  )
}

/**
 * For Route Handlers. Verifies the caller holds a valid admin token before
 * any privileged operation runs. Returns a ready-to-return NextResponse on
 * failure so callers can `return result.response`.
 */
export async function requireAdminApi(): Promise<
  | {
      session: AdminSession
      response?: undefined
    }
  | {
      session?: undefined
      response: NextResponse
    }
> {
  const cookieStore =
    await cookies()

  const session =
    await verifyAdminToken(
      cookieStore.get(
        ADMIN_TOKEN_COOKIE,
      )?.value,
    )

  if (!session) {
    return {
      response:
        NextResponse.json(
          {
            error:
              '未登录或无管理权限',
          },
          {
            status: 401,
          },
        ),
    }
  }

  return {
    session,
  }
}