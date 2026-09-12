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

  const action =
    typeof body?.action ===
    'string'
      ? body.action
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

  if (
    action !== 'ban' &&
    action !== 'unban'
  ) {
    return NextResponse.json(
      {
        error:
          '封禁操作无效',
      },
      {
        status: 400,
      },
    )
  }

  if (
    action === 'ban' &&
    !reason
  ) {
    return NextResponse.json(
      {
        error:
          '请填写封禁原因',
      },
      {
        status: 400,
      },
    )
  }

  const admin =
    createAdminClient()

  /*
   * 社区身份判断。
   *
   * Owner / Admin 的社区身份
   * 都按照 Profile UUID 判断，
   * 不再按照 Auth 邮箱判断。
   */
  const targetIsOwner =
    isOwnerUserId(
      userId,
    )

  const targetIsAdmin =
    !targetIsOwner &&
    isAdminUserId(
      userId,
    )

  /*
   * 当前后台操作者是否为最高权限 Owner。
   *
   * 后台权限仍然按照
   * STARCLUB_OWNER_EMAIL 判断。
   */
  const callerIsOwner =
    isOwnerEmail(
      auth.session.email,
    )

  /*
   * 社区 Owner 永远不可被封禁。
   *
   * 普通 Admin：
   * - 不能封禁 Owner
   * - 不能解除 Owner 的封禁状态
   *
   * 后台 Owner：
   * - 不能封禁社区 Owner
   * - 如果数据库历史上错误留下封禁，
   *   可以执行 unban 清理。
   */
  if (targetIsOwner) {
    if (!callerIsOwner) {
      return NextResponse.json(
        {
          error:
            '最高权限账号不可由普通管理员修改封禁状态',
        },
        {
          status: 403,
        },
      )
    }

    if (action === 'ban') {
      return NextResponse.json(
        {
          error:
            '最高权限账号不可被封禁',
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
   * 只有后台 Owner
   * 可以封禁 / 解封社区 Admin。
   */
  if (
    targetIsAdmin &&
    !callerIsOwner
  ) {
    return NextResponse.json(
      {
        error:
          '管理员之间不可互相修改封禁状态',
      },
      {
        status: 403,
      },
    )
  }

  /*
   * 确认社区 Profile 存在，
   * 并读取当前处罚状态。
   */
  const {
    data: profile,
    error: profileError,
  } = await admin
    .from('profiles')
    .select(`
      id,
      muted_until,
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

  if (action === 'ban') {
    /*
     * 防止重复封禁。
     */
    if (profile.banned_at) {
      return NextResponse.json(
        {
          error:
            '该用户已经处于封禁状态',
        },
        {
          status: 409,
        },
      )
    }

    const {
      error: updateError,
    } = await admin
      .from('profiles')
      .update({
        banned_at:
          new Date().toISOString(),

        /*
         * 封禁优先于禁言。
         * 一旦封禁，同时清除禁言时间。
         */
        muted_until:
          null,

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
        '[v0] User ban error:',
        updateError,
      )

      return NextResponse.json(
        {
          error:
            '封禁用户失败，请重试',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      banned: true,
    })
  }

  /*
   * action === 'unban'
   */

  if (!profile.banned_at) {
    return NextResponse.json(
      {
        error:
          '该用户当前没有被封禁',
      },
      {
        status: 409,
      },
    )
  }

  const {
    error: unbanError,
  } = await admin
    .from('profiles')
    .update({
      banned_at:
        null,

      moderation_reason:
        null,

      moderated_by:
        null,
    })
    .eq(
      'id',
      userId,
    )

  if (unbanError) {
    console.error(
      '[v0] User unban error:',
      unbanError,
    )

    return NextResponse.json(
      {
        error:
          '解除封禁失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json({
    ok: true,
    banned: false,
  })
}