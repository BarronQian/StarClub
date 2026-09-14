import {
  NextResponse,
  type NextRequest,
} from 'next/server'

import {
  requireAdminApi,
  isOwnerEmail,
  isOwnerUserId,
  isAdminUserId,
} from '@/lib/admin-auth'

import { createAdminClient } from '@/lib/supabase-admin'

type MuteDuration =
  | '1h'
  | '24h'
  | '7d'
  | 'permanent'
  | 'remove'

function getMutedUntil(
  duration: MuteDuration,
): string | null {
  if (duration === 'remove') {
    return null
  }

  const now = new Date()

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
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  const body = await request
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
      'remove',
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

  if (
    duration !== 'remove' &&
    !reason
  ) {
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

  const admin =
    createAdminClient()

  const targetIsOwner =
    isOwnerUserId(
      userId,
    )

  const targetIsAdmin =
    !targetIsOwner &&
    isAdminUserId(
      userId,
    )

  const callerIsOwner =
    isOwnerEmail(
      auth.session.email,
    )

  /*
   * 社区 Owner 永远不能被禁言。
   *
   * 普通 Admin 连解除 Owner 处罚都不能操作，
   * 防止普通 Admin 修改 Owner 的处罚状态。
   *
   * 如果数据库里历史上错误留下了 Owner 禁言，
   * 后台 Owner 可以执行 remove 来清理。
   */
  if (targetIsOwner) {
    if (!callerIsOwner) {
      return NextResponse.json(
        {
          error:
            '最高权限账号不可由普通管理员修改禁言状态',
        },
        {
          status: 403,
        },
      )
    }

    if (
      duration !== 'remove'
    ) {
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
  }

  /*
   * 普通 Admin 之间不能互相处罚。
   *
   * 只有后台 Owner 可以对社区 Admin
   * 执行禁言或解除禁言。
   */
  if (
    targetIsAdmin &&
    !callerIsOwner
  ) {
    return NextResponse.json(
      {
        error:
          '管理员之间不可互相修改禁言状态',
      },
      {
        status: 403,
      },
    )
  }

  /*
   * 确认目标社区资料存在。
   */
  const {
    data: profile,
    error: profileError,
  } = await admin
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
      '[v0] Target profile lookup error:',
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
   * 封禁优先级高于禁言。
   *
   * 已封禁用户不能再通过禁言 API
   * 修改处罚信息，防止清除封禁原因。
   */
    if (
      duration !== 'remove' &&
      (
        profile.banned_at ||
        profile.community_banned_at
      )
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

  if (
    duration === 'remove'
  ) {
    const {
      error: updateError,
    } = await admin
      .from('profiles')
      .update({
        muted_until: null,
        moderation_reason:
          null,
        moderated_by:
          null,
      })
      .eq(
        'id',
        userId,
      )

    if (updateError) {
      console.error(
        '[v0] User unmute update error:',
        updateError,
      )

      return NextResponse.json(
        {
          error:
            '解除禁言失败，请重试',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      mutedUntil: null,
    })
  }

  const {
    error: updateError,
  } = await admin
    .from('profiles')
    .update({
      muted_until:
        mutedUntil,

      moderation_reason:
        reason,

      moderated_by:
        auth.session.id,
    })
    .eq(
      'id',
      userId,
    )

  if (updateError) {
    console.error(
      '[v0] User mute update error:',
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
}