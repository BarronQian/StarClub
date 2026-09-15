import {
  NextResponse,
  type NextRequest,
} from 'next/server'

import {
  requireAdminApi,
  isAdminIdentity,
  isOwnerIdentity,
} from '@/lib/admin-auth'

import {
  createAdminClient,
} from '@/lib/supabase-admin'

type BanAction =
  | 'ban'
  | 'unban'

type BanScope =
  | 'community'
  | 'market'
  | 'global'

export async function POST(
  request: NextRequest,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
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

  const action =
    typeof body?.action ===
    'string'
      ? body.action.trim()
      : ''

  const scope =
    typeof body?.scope ===
    'string'
      ? body.scope.trim()
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
    scope !== 'community' &&
    scope !== 'market' &&
    scope !== 'global'
  ) {
    return NextResponse.json(
      {
        error:
          '封禁类型无效',
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

  if (
    reason.length >
    1000
  ) {
    return NextResponse.json(
      {
        error:
          '封禁原因不能超过 1000 个字符',
      },
      {
        status: 400,
      },
    )
  }

  const banAction =
    action as BanAction

  const banScope =
    scope as BanScope

  const admin =
    createAdminClient()

  /*
   * 社区身份保护
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
        auth.session.id,
        auth.session.email,
      )

  /*
   * Owner 保护
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

    if (
      banAction === 'ban'
    ) {
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
   * 普通 Admin 之间不可互相处罚。
   * 只有 Owner 可以操作其他 Admin。
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

  const {
    data: profile,
    error: profileError,
  } =
    await admin
      .from('profiles')
      .select(`
        id,
        muted_until,

        community_banned_at,
        community_ban_reason,

        market_banned_at,
        market_ban_reason,

        banned_at,
        ban_reason
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
      '[ADMIN USERS BAN] Target profile lookup error:',
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
   * ==========================
   * 社区封禁
   * ==========================
   */
  if (
    banScope ===
    'community'
  ) {
    if (
      banAction === 'ban'
    ) {
      if (
        profile.community_banned_at
      ) {
        return NextResponse.json(
          {
            error:
              '该用户已经处于社区封禁状态',
          },
          {
            status: 409,
          },
        )
      }

      const now =
        new Date().toISOString()

      const {
        error: updateError,
      } =
        await admin
          .from('profiles')
          .update({
            community_banned_at:
              now,

            community_ban_reason:
              reason,

            /*
             * 社区封禁优先于社区禁言。
             */
            muted_until:
              null,

            moderated_by:
              auth.session.id,
          })
          .eq(
            'id',
            userId,
          )

      if (updateError) {
        console.error(
          '[ADMIN USERS BAN] Community ban failed:',
          updateError,
        )

        return NextResponse.json(
          {
            error:
              '社区封禁失败，请重试',
          },
          {
            status: 500,
          },
        )
      }

      return NextResponse.json({
        ok: true,
        scope:
          'community',
        banned: true,
      })
    }

    if (
      !profile.community_banned_at
    ) {
      return NextResponse.json(
        {
          error:
            '该用户当前没有被社区封禁',
        },
        {
          status: 409,
        },
      )
    }

    const {
      error: updateError,
    } =
      await admin
        .from('profiles')
        .update({
          community_banned_at:
            null,

          community_ban_reason:
            null,

          moderated_by:
            auth.session.id,
        })
        .eq(
          'id',
          userId,
        )

    if (updateError) {
      console.error(
        '[ADMIN USERS BAN] Community unban failed:',
        updateError,
      )

      return NextResponse.json(
        {
          error:
            '解除社区封禁失败，请重试',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      scope:
        'community',
      banned: false,
    })
  }

  /*
   * ==========================
   * 市场封禁
   * ==========================
   */
  if (
    banScope ===
    'market'
  ) {
    if (
      banAction === 'ban'
    ) {
      if (
        profile.market_banned_at
      ) {
        return NextResponse.json(
          {
            error:
              '该用户已经处于市场封禁状态',
          },
          {
            status: 409,
          },
        )
      }

      const now =
        new Date().toISOString()

      const {
        error: updateError,
      } =
        await admin
          .from('profiles')
          .update({
            market_banned_at:
              now,

            market_ban_reason:
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
          '[ADMIN USERS BAN] Market ban failed:',
          updateError,
        )

        return NextResponse.json(
          {
            error:
              '市场封禁失败，请重试',
          },
          {
            status: 500,
          },
        )
      }

      const {
        error:
          notificationsError,
      } =
        await admin
          .from(
            'community_notifications',
          )
          .delete()
          .eq(
            'actor_id',
            userId,
          )

      if (notificationsError) {
        console.error(
          '[ADMIN USERS BAN] Delete notifications after global ban failed:',
          notificationsError,
        )
      }

      const {
        error:
          listingsError,
      } =
        await admin
          .from(
            'market_listings',
          )
          .update({
            closed_at:
              now,

            updated_at:
              now,
          })
          .eq(
            'seller_id',
            userId,
          )
          .is(
            'closed_at',
            null,
          )
          .is(
            'deleted_at',
            null,
          )

      if (listingsError) {
        console.error(
          '[ADMIN USERS BAN] Close all listings after market ban failed:',
          listingsError,
        )
      }

      return NextResponse.json({
        ok: true,
        scope:
          'market',
        banned: true,
      })
    }

    if (
      !profile.market_banned_at
    ) {
      return NextResponse.json(
        {
          error:
            '该用户当前没有被市场封禁',
        },
        {
          status: 409,
        },
      )
    }

    const {
      error: updateError,
    } =
      await admin
        .from('profiles')
        .update({
          market_banned_at:
            null,

          market_ban_reason:
            null,

          moderated_by:
            auth.session.id,
        })
        .eq(
          'id',
          userId,
        )

    if (updateError) {
      console.error(
        '[ADMIN USERS BAN] Market unban failed:',
        updateError,
      )

      return NextResponse.json(
        {
          error:
            '解除市场封禁失败，请重试',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      scope:
        'market',
      banned: false,
    })
  }

  /*
   * ==========================
   * 全站封禁
   * ==========================
   */
  if (
    banScope ===
    'global'
  ) {
    if (
      banAction === 'ban'
    ) {
      if (
        profile.banned_at
      ) {
        return NextResponse.json(
          {
            error:
              '该用户已经处于全站封禁状态',
          },
          {
            status: 409,
          },
        )
      }

      const now =
        new Date().toISOString()

      const {
        error: updateError,
      } =
        await admin
          .from('profiles')
          .update({
            banned_at:
              now,

            ban_reason:
              reason,

            /*
             * 全站封禁后无需保留临时禁言。
             *
             * 社区封禁 / 市场封禁状态不清除，
             * 这样未来解除全站封禁后，
             * 原有专项处罚仍然有效。
             */
            muted_until:
              null,

            moderated_by:
              auth.session.id,
          })
          .eq(
            'id',
            userId,
          )

      if (updateError) {
        console.error(
          '[ADMIN USERS BAN] Global ban failed:',
          updateError,
        )

        return NextResponse.json(
          {
            error:
              '全站封禁失败，请重试',
          },
          {
            status: 500,
          },
        )
      }
      
      /*
        * 全站封禁后隐藏该用户全部社区内容
        * 并下架全部仍在架的市场商单。
        */

        const {
          error: postsError,
        } =
          await admin
            .from('posts')
            .update({
              deleted_at: now,
              updated_at: now,
            })
            .eq(
              'author_id',
              userId,
            )
            .is(
              'deleted_at',
              null,
            )

        if (postsError) {
          console.error(
            '[ADMIN USERS BAN] Hide posts after global ban failed:',
            postsError,
          )
        }

        const {
          error: commentsError,
        } =
          await admin
            .from(
              'post_comments',
            )
            .update({
              deleted_at: now,
              updated_at: now,
            })
            .eq(
              'author_id',
              userId,
            )
            .is(
              'deleted_at',
              null,
            )

        if (commentsError) {
          console.error(
            '[ADMIN USERS BAN] Hide comments after global ban failed:',
            commentsError,
          )
        }

        const {
          error: guestbookError,
        } =
          await admin
            .from(
              'profile_guestbook',
            )
            .update({
              deleted_at: now,
            })
            .eq(
              'author_id',
              userId,
            )
            .is(
              'deleted_at',
              null,
            )

        if (guestbookError) {
          console.error(
            '[ADMIN USERS BAN] Hide guestbook messages after global ban failed:',
            guestbookError,
          )
        }

        const {
          error: listingsError,
        } =
          await admin
            .from(
              'market_listings',
            )
            .update({
              closed_at: now,
              updated_at: now,
            })
            .eq(
              'seller_id',
              userId,
            )
            .is(
              'closed_at',
              null,
            )
            .is(
              'deleted_at',
              null,
            )

        if (listingsError) {
          console.error(
            '[ADMIN USERS BAN] Close listings after global ban failed:',
            listingsError,
          )
        }

      return NextResponse.json({
        ok: true,
        scope:
          'global',
        banned: true,
      })
    }

    if (
      !profile.banned_at
    ) {
      return NextResponse.json(
        {
          error:
            '该用户当前没有被全站封禁',
        },
        {
          status: 409,
        },
      )
    }

    const {
      error: updateError,
    } =
      await admin
        .from('profiles')
        .update({
          banned_at:
            null,

          ban_reason:
            null,

          moderated_by:
            auth.session.id,
        })
        .eq(
          'id',
          userId,
        )

    if (updateError) {
      console.error(
        '[ADMIN USERS BAN] Global unban failed:',
        updateError,
      )

      return NextResponse.json(
        {
          error:
            '解除全站封禁失败，请重试',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      scope:
        'global',
      banned: false,
    })
  }

  return NextResponse.json(
    {
      error:
        '无法处理该封禁操作',
    },
    {
      status: 400,
    },
  )
}