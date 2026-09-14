import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

import {
  getAdminSession,
} from '@/lib/admin-auth'

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

export async function GET(
  request: NextRequest,
) {
  const adminSession =
    await getAdminSession()

  if (!adminSession) {
    return NextResponse.json(
      {
        error:
          '未登录或无管理员权限',
      },
      {
        status: 401,
      },
    )
  }

  const supabase =
    getAdminSupabase()

  const searchParams =
    request.nextUrl.searchParams

  const status =
    searchParams
      .get('status')
      ?.trim()

  let query =
    supabase
      .from(
        'market_reports',
      )
      .select(`
        id,
        listing_id,
        reporter_id,
        reported_user_id,
        reason,
        details,
        status,
        resolution_note,
        handled_by,
        handled_at,
        created_at,
        updated_at,

        listing:market_listings (
          id,
          title,
          listing_type,
          status,
          closed_at,
          deleted_at
        ),

        reporter:profiles!market_reports_reporter_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          star_citizen_handle,
          profile_slug
        ),

        reported_user:profiles!market_reports_reported_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          star_citizen_handle,
          profile_slug,
          market_banned_at,
          market_ban_reason,
          banned_at
        )
      `)
      .order(
        'created_at',
        {
          ascending: false,
        },
      )

  if (
    status &&
    [
      'pending',
      'resolved',
      'dismissed',
    ].includes(status)
  ) {
    query =
      query.eq(
        'status',
        status,
      )
  }

  const {
    data,
    error,
  } = await query

  if (error) {
    console.error(
      '[ADMIN MARKET REPORTS] Failed to load reports:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '读取市场举报失败',
      },
      {
        status: 500,
      },
    )
  }

  const reports =
    data ?? []

  const pendingCount =
    reports.filter(
      (report) =>
        report.status ===
        'pending',
    ).length

  return NextResponse.json({
    reports,
    pendingCount,
  })
}