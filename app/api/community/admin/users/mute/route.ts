import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  isAdminIdentity,
  isOwnerIdentity,
} from '@/lib/admin-auth'

import {
  createAdminClient,
} from '@/lib/supabase-admin'

type MuteDuration =
  | '1h'
  | '24h'
  | '7d'
  | 'permanent'

function getMutedUntil(
  duration: MuteDuration,
): string {
  const now =
    new Date()

  if (duration === '1h') {
    now.setHours(
      now.getHours() + 1,
    )

    return now.toISOString()
  }

  if (duration === '24h') {
    now.setHours(
      now.getHours() + 24,
    )

    return now.toISOString()
  }

  if (duration === '7d') {
    now.setDate(
      now.getDate() + 7,
    )

    return now.toISOString()
  }

  // 用一个很远的日期代表永久禁言
  now.setFullYear(
    now.getFullYear() + 100,
  )

  return now.toISOString()
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
          error:
            '请先登录',
        },
        {
          status: 401,
        },
      )
    }

    const accessToken =
      authorization.slice(7)

    const admin =
      createAdminClient()

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await admin.auth.getUser(
        accessToken,
      )

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            '登录状态无效',
        },
        {
          status: 401,
        },
      )
    }

    /*
     * 社区内联管理权限：
     * 同时支持 Email 和 User ID。
     */
    if (
      !isAdminIdentity(
        user.id,
        user.email,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '无社区管理权限',
        },
        {
          status: 403,
        },
      )
    }

    const body =
      await request
        .json()
        .catch(() => null)

    const userId =
      typeof body?.userId ===
      'string'
        ? body.userId.trim()
        : ''

    const duration =
      typeof body?.duration ===
      'string'
        ? body.duration
        : ''

    const reason =
      typeof body?.reason ===
      'string'
        ? body.reason.trim()
        : ''

    if (!userId) {
      return NextResponse.json(
        {
          error:
            '缺少用户 ID',
        },
        {
          status: 400,
        },
      )
    }

    const validDurations: MuteDuration[] =
      [
        '1h',
        '24h',
        '7d',
        'permanent',
      ]

    if (
      !validDurations.includes(
        duration as MuteDuration,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '禁言时长无效',
        },
        {
          status: 400,
        },
      )
    }

    if (!reason) {
      return NextResponse.json(
        {
          error:
            '请填写处罚原因',
        },
        {
          status: 400,
        },
      )
    }

    /*
     * 不允许自己禁言自己。
     */
    if (
      userId === user.id
    ) {
      return NextResponse.json(
        {
          error:
            '不能禁言自己',
        },
        {
          status: 403,
        },
      )
    }

    /*
     * 目标用户的 User ID 权限保护。
     */
    const {
      data: {
        user: targetUser,
      },
      error:
        targetUserError,
    } =
      await admin.auth.admin.getUserById(
        userId,
      )

    if (
      targetUserError ||
      !targetUser
    ) {
      return NextResponse.json(
        {
          error:
            '找不到该用户账号',
        },
        {
          status: 404,
        },
      )
    }

    const targetIsOwner =
      isOwnerIdentity(
        targetUser.id,
        targetUser.email,
      )

    const targetIsAdmin =
      !targetIsOwner &&
      isAdminIdentity(
        targetUser.id,
        targetUser.email,
      )

    const callerIsOwner =
      isOwnerIdentity(
        user.id,
        user.email,
      )

    /*
     * Owner 不可被禁言。
     */
    if (targetIsOwner) {
      return NextResponse.json(
        {
          error:
            '最高权限账号不可被禁言',
        },
        {
          status: 403,
        },
      )
    }

    /*
     * 普通 Admin 不允许处罚其他 Admin。
     * Owner 可以处罚普通 Admin。
     */
    if (
      targetIsAdmin &&
      !callerIsOwner
    ) {
      return NextResponse.json(
        {
          error:
            '管理员之间不可互相禁言',
        },
        {
          status: 403,
        },
      )
    }

    const {
      data: profile,
      error:
        profileError,
    } =
      await admin
        .from('profiles')
        .select(`
          id,
          muted_until,
          community_banned_at,
          banned_at
        `)
        .eq(
          'id',
          userId,
        )
        .maybeSingle()

    if (
      profileError ||
      !profile
    ) {
      console.error(
        'Community mute target lookup error:',
        profileError,
      )

      return NextResponse.json(
        {
          error:
            '找不到该用户资料',
        },
        {
          status: 404,
        },
      )
    }

    /*
     * 已经被社区封禁或全站封禁，
     * 不再重复设置禁言。
     */
    if (
      profile.banned_at ||
      profile.community_banned_at
    ) {
      return NextResponse.json(
        {
          error:
            profile.banned_at
              ? '该用户当前已被全站封禁'
              : '该用户当前已被社区封禁',
        },
        {
          status: 409,
        },
      )
    }

    const mutedUntil =
      getMutedUntil(
        duration as MuteDuration,
      )

    const {
      error:
        updateError,
    } =
      await admin
        .from('profiles')
        .update({
          muted_until:
            mutedUntil,

          moderation_reason:
            reason,

          moderated_by:
            user.id,
        })
        .eq(
          'id',
          userId,
        )

    if (updateError) {
      console.error(
        'Community mute update error:',
        updateError,
      )

      return NextResponse.json(
        {
          error:
            '更新禁言状态失败，请重试',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      mutedUntil,
    })
  } catch (error) {
    console.error(
      'Community mute error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '禁言用户失败',
      },
      {
        status: 500,
      },
    )
  }
}