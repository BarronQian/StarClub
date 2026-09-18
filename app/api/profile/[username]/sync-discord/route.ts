import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getAdminSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

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

export async function POST(
  request: NextRequest,
) {
  try {
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
          error: '未登录',
        },
        {
          status: 401,
        },
      )
    }

    const accessToken =
      authorization.slice(7)

    const supabase =
      getAdminSupabase()

    // 必须从 access token 确认当前用户，
    // 不接受前端传 userId
    const {
      data: { user },
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
          error: '登录状态无效',
        },
        {
          status: 401,
        },
      )
    }

    const discordAvatar =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null

    const discordUsername =
      user.user_metadata
        ?.preferred_username ||
      user.user_metadata?.user_name ||
      user.user_metadata?.name ||
      null

    const discordDisplayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      discordUsername ||
      null

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from('profiles')
        .select(`
          id,
          avatar_url,
          username,
          display_name
        `)
        .eq(
          'id',
          user.id,
        )
        .maybeSingle()

    if (profileError) {
      console.error(
        'Failed to load profile:',
        profileError,
      )

      return NextResponse.json(
        {
          error: '读取个人资料失败',
        },
        {
          status: 500,
        },
      )
    }

    if (!profile) {
      return NextResponse.json(
        {
          error: '找不到个人资料',
        },
        {
          status: 404,
        },
      )
    }

    const updates: {
      avatar_url?: string
      username?: string
      display_name?: string
      updated_at?: string
    } = {}

    if (
      discordAvatar &&
      profile.avatar_url !==
        discordAvatar
    ) {
      updates.avatar_url =
        discordAvatar
    }

    if (
      discordUsername &&
      profile.username !==
        discordUsername
    ) {
      updates.username =
        discordUsername
    }

    if (
      discordDisplayName &&
      profile.display_name !==
        discordDisplayName
    ) {
      updates.display_name =
        discordDisplayName
    }

    if (
      Object.keys(updates)
        .length === 0
    ) {
      return NextResponse.json({
        ok: true,
        updated: false,
      })
    }

    updates.updated_at =
      new Date().toISOString()

    const {
      error: updateError,
    } =
      await supabase
        .from('profiles')
        .update(updates)
        .eq(
          'id',
          user.id,
        )

    if (updateError) {
      console.error(
        'Failed to sync Discord profile:',
        updateError,
      )

      return NextResponse.json(
        {
          error:
            '同步 Discord 资料失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      updated: true,
      avatarUrl:
        updates.avatar_url ??
        profile.avatar_url,
    })
  } catch (error) {
    console.error(
      'POST sync Discord profile error:',
      error,
    )

    return NextResponse.json(
      {
        error: '服务器错误',
      },
      {
        status: 500,
      },
    )
  }
}