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

async function getCurrentUser(
  request: NextRequest,
) {
  const authorization =
    request.headers.get(
      'authorization',
    )

  if (
    !authorization?.startsWith(
      'Bearer ',
    )
  ) {
    return null
  }

  const accessToken =
    authorization.slice(7)

  const supabase =
    getAdminSupabase()

  const {
    data: { user },
    error,
  } =
    await supabase.auth.getUser(
      accessToken,
    )

  if (
    error ||
    !user
  ) {
    return null
  }

  return user
}

export async function GET(
  request: NextRequest,
) {
  try {
    const user =
      await getCurrentUser(request)

    if (!user) {
      return NextResponse.json(
        {
          error: '请先登录',
        },
        {
          status: 401,
        },
      )
    }

    const type =
      request.nextUrl.searchParams.get(
        'type',
      )

    if (
      type !== 'following' &&
      type !== 'followers'
    ) {
      return NextResponse.json(
        {
          error:
            '无效的名单类型',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      getAdminSupabase()

const {
  data: followRows,
  error: followError,
} = await supabase
  .from('profile_follows')
  .select(`
    follower_id,
    following_id,
    created_at
  `)
  .eq(
    type === 'following'
      ? 'follower_id'
      : 'following_id',
    user.id,
  )
  .order(
    'created_at',
    {
      ascending: false,
    },
  )

if (followError) {
  console.error(
    'Failed to load follow list:',
    followError,
  )

  return NextResponse.json(
    {
      error: '读取名单失败',
    },
    {
      status: 500,
    },
  )
}

const rows =
  followRows ?? []

    const profileIds =
      rows
        .map((row) =>
          type === 'following'
            ? row.following_id
            : row.follower_id,
        )
        .filter(
          (
            id,
          ): id is string =>
            typeof id === 'string',
        )

    if (
      profileIds.length === 0
    ) {
      return NextResponse.json({
        users: [],
      })
    }

    const {
      data: profiles,
      error: profilesError,
    } =
      await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          avatar_url,
          star_citizen_handle,
          profile_slug,
          member_number
        `)
        .in(
          'id',
          profileIds,
        )

    if (profilesError) {
      console.error(
        'Failed to load follow profiles:',
        profilesError,
      )

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

    const profileMap =
      new Map(
        (profiles ?? []).map(
          (profile) => [
            profile.id,
            profile,
          ],
        ),
      )

    // 按关注记录的时间顺序返回
    const users =
      rows
        .map((row) => {
          const id =
            type === 'following'
              ? row.following_id
              : row.follower_id

          const profile =
            typeof id === 'string'
              ? profileMap.get(id)
              : null

          if (!profile) {
            return null
          }

          return {
            id: profile.id,
            username:
              profile.username,
            displayName:
              profile.display_name,
            avatarUrl:
              profile.avatar_url,
            starCitizenHandle:
              profile.star_citizen_handle,
            profileSlug:
              profile.profile_slug,
            memberNumber:
              profile.member_number,
            followedAt:
              row.created_at,
          }
        })
        .filter(Boolean)

    return NextResponse.json(
      {
        users,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      },
    )
  } catch (error) {
    console.error(
      'GET follow list error:',
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