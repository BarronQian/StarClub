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

  if (!supabaseUrl || !serviceRoleKey) {
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
    request.headers.get('authorization')

  if (
    !authorization?.startsWith('Bearer ')
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

  if (error || !user) {
    return null
  }

  return user
}

// GET /api/community/follows?profileId=xxx
// 查询当前用户是否关注了这个人
export async function GET(
  request: NextRequest,
) {
  try {
    const user =
      await getCurrentUser(request)

    const profileId =
      request.nextUrl.searchParams.get(
        'profileId',
      )

    if (!profileId) {
      return NextResponse.json(
        {
          error: '缺少 profileId',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    let following = false

    if (user) {
      const {
        data,
        error,
      } =
        await supabase
          .from('profile_follows')
          .select('id')
          .eq(
            'follower_id',
            user.id,
          )
          .eq(
            'following_id',
            profileId,
          )
          .maybeSingle()

      if (error) {
        console.error(
          'Failed to check follow:',
          error,
        )

        return NextResponse.json(
          {
            error: '读取关注状态失败',
          },
          {
            status: 500,
          },
        )
      }

      following = Boolean(data)
    }

    const {
  count: followingCount,
  error: followingCountError,
} =
  await supabase
    .from('profile_follows')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq(
      'follower_id',
      profileId,
    )

if (followingCountError) {
  console.error(
    'Failed to count following:',
    followingCountError,
  )

  return NextResponse.json(
    {
      error: '读取关注数量失败',
    },
    {
      status: 500,
    },
  )
}

const {
  count: followerCount,
  error: followerCountError,
} =
  await supabase
    .from('profile_follows')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq(
      'following_id',
      profileId,
    )

if (followerCountError) {
  console.error(
    'Failed to count followers:',
    followerCountError,
  )

  return NextResponse.json(
    {
      error: '读取粉丝数量失败',
    },
    {
      status: 500,
    },
  )
}

    return NextResponse.json(
      {
          following,
        followingCount:
          followingCount ?? 0,
        followerCount:
          followerCount ?? 0,
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
      'GET community follow error:',
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

// POST /api/community/follows
// 关注用户
export async function POST(
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

    const body =
      await request.json()

    const profileId =
      typeof body.profileId === 'string'
        ? body.profileId.trim()
        : ''

    if (!profileId) {
      return NextResponse.json(
        {
          error: '缺少 profileId',
        },
        {
          status: 400,
        },
      )
    }

    if (profileId === user.id) {
      return NextResponse.json(
        {
          error: '不能关注自己',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    const {
      data: currentProfile,
      error: currentProfileError,
    } =
      await supabase
        .from('profiles')
        .select(`
          id,
          community_banned_at,
          banned_at
        `)
        .eq(
          'id',
          user.id,
        )
        .maybeSingle()

    if (
      currentProfileError ||
      !currentProfile
    ) {
      return NextResponse.json(
        {
          error:
            '找不到个人资料',
        },
        {
          status: 404,
        },
      )
    }

    if (
      currentProfile.banned_at ||
      currentProfile.community_banned_at
    ) {
      return NextResponse.json(
        {
          error:
            currentProfile.banned_at
              ? '该账号已被全站封禁，无法关注用户'
              : '该账号已被社区封禁，无法关注用户',
        },
        {
          status: 403,
        },
      )
    }

    // 确认目标用户存在
    const {
      data: targetProfile,
      error: profileError,
    } =
      await supabase
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .maybeSingle()

    if (
      profileError ||
      !targetProfile
    ) {
      return NextResponse.json(
        {
          error: '用户不存在',
        },
        {
          status: 404,
        },
      )
    }

    const {
      error: insertError,
    } =
      await supabase
        .from('profile_follows')
        .upsert(
          {
            follower_id: user.id,
            following_id: profileId,
          },
          {
            onConflict:
              'follower_id,following_id',
            ignoreDuplicates: true,
          },
        )

    if (insertError) {
      console.error(
        'Failed to follow profile:',
        insertError,
      )

      return NextResponse.json(
        {
          error: '关注失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      following: true,
    })
  } catch (error) {
    console.error(
      'POST community follow error:',
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

// DELETE /api/community/follows?profileId=xxx
// 取消关注
export async function DELETE(
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

    const profileId =
      request.nextUrl.searchParams.get(
        'profileId',
      )

    if (!profileId) {
      return NextResponse.json(
        {
          error: '缺少 profileId',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    const {
      error,
    } =
      await supabase
        .from('profile_follows')
        .delete()
        .eq(
          'follower_id',
          user.id,
        )
        .eq(
          'following_id',
          profileId,
        )

    if (error) {
      console.error(
        'Failed to unfollow profile:',
        error,
      )

      return NextResponse.json(
        {
          error: '取消关注失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      following: false,
    })
  } catch (error) {
    console.error(
      'DELETE community follow error:',
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