import {
  NextRequest,
  NextResponse,
} from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  const token =
    authorization.slice(7)

  const supabase =
    getAdminSupabase()

  const {
    data: {
      user,
    },
    error,
  } =
    await supabase.auth.getUser(
      token,
    )

  if (
    error ||
    !user
  ) {
    return null
  }

  return user
}

type Action =
  | 'accept'
  | 'decline'
  | 'cancel'
  | 'complete'

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  },
) {
  try {
    const user =
      await getCurrentUser(
        request,
      )

    if (!user) {
      return NextResponse.json(
        {
          error:
            '请先登录后操作交易',
        },
        {
          status: 401,
        },
      )
    }

    const {
      id,
    } =
      await context.params

    let body: any

    try {
      body =
        await request.json()
    } catch {
      return NextResponse.json(
        {
          error:
            '请求内容格式错误',
        },
        {
          status: 400,
        },
      )
    }

    const action =
      body?.action as Action

    if (
      ![
        'accept',
        'decline',
        'cancel',
        'complete',
      ].includes(action)
    ) {
      return NextResponse.json(
        {
          error:
            '无效的交易操作',
        },
        {
          status: 400,
        },
      )
    }

    const cancelReason =
      typeof body?.reason ===
      'string'
        ? body.reason
            .trim()
            .slice(
              0,
              500,
            )
        : ''

    const supabase =
      getAdminSupabase()

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        banned_at,
        muted_until,
        rsi_verified,
        star_citizen_handle
      `)
      .eq(
        'id',
        user.id,
      )
      .maybeSingle()

    if (
      profileError ||
      !profile
    ) {
      return NextResponse.json(
        {
          error:
            '无法读取社区资料',
        },
        {
          status: 403,
        },
      )
    }

    if (
      profile.banned_at
    ) {
      return NextResponse.json(
        {
          error:
            '当前账号无法使用市场功能',
        },
        {
          status: 403,
        },
      )
    }

    if (
      profile.muted_until &&
      new Date(
        profile.muted_until,
      ).getTime() >
        Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            '当前账号暂时无法使用市场功能',
        },
        {
          status: 403,
        },
      )
    }

    if (
      !profile.rsi_verified ||
      !profile.star_citizen_handle
    ) {
      return NextResponse.json(
        {
          error:
            '完成 RSI Handle 认证后才可以操作交易',
        },
        {
          status: 403,
        },
      )
    }

    const {
      data: tradeRequest,
      error: tradeError,
    } = await supabase
      .from(
        'market_trade_requests',
      )
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        quantity,
        offered_price_uec,
        status,
        accepted_at,
        declined_at,
        cancelled_at,
        completed_at,
        cancelled_by,
        cancel_reason,
        buyer_completed_at,
        seller_completed_at
      `)
      .eq(
        'id',
        id,
      )
      .maybeSingle()

    if (
      tradeError ||
      !tradeRequest
    ) {
      console.error(
        'Failed to load trade request:',
        tradeError,
      )

      return NextResponse.json(
        {
          error:
            '交易申请不存在',
        },
        {
          status: 404,
        },
      )
    }

    const isBuyer =
      tradeRequest.buyer_id ===
      profile.id

    const isSeller =
      tradeRequest.seller_id ===
      profile.id

    if (
      !isBuyer &&
      !isSeller
    ) {
      return NextResponse.json(
        {
          error:
            '你无权操作这笔交易',
        },
        {
          status: 403,
        },
      )
    }

    const now =
      new Date().toISOString()

    /*
     * 接受申请
     *
     * 仅卖家可以操作。
     */
    if (
      action === 'accept'
    ) {
      if (!isSeller) {
        return NextResponse.json(
          {
            error:
              '只有交易发布者可以接受申请',
          },
          {
            status: 403,
          },
        )
      }

      if (
        tradeRequest.status !==
        'pending'
      ) {
        return NextResponse.json(
          {
            error:
              '当前交易申请无法接受',
          },
          {
            status: 409,
          },
        )
      }

      const {
        data: updated,
        error: updateError,
      } = await supabase
        .from(
          'market_trade_requests',
        )
        .update({
          status:
            'accepted',
          accepted_at:
            now,
          updated_at:
            now,
        })
        .eq(
          'id',
          tradeRequest.id,
        )
        .eq(
          'status',
          'pending',
        )
        .select()
        .single()

      if (
        updateError ||
        !updated
      ) {
        console.error(
          'Failed to accept trade request:',
          updateError,
        )

        return NextResponse.json(
          {
            error:
              '接受交易申请失败',
          },
          {
            status: 500,
          },
        )
      }

      return NextResponse.json({
        tradeRequest:
          updated,
      })
    }

    /*
     * 拒绝申请
     *
     * 仅卖家可以拒绝 pending 申请。
     */
    if (
      action === 'decline'
    ) {
      if (!isSeller) {
        return NextResponse.json(
          {
            error:
              '只有交易发布者可以拒绝申请',
          },
          {
            status: 403,
          },
        )
      }

      if (
        tradeRequest.status !==
        'pending'
      ) {
        return NextResponse.json(
          {
            error:
              '当前交易申请无法拒绝',
          },
          {
            status: 409,
          },
        )
      }

      const {
        data: updated,
        error: updateError,
      } = await supabase
        .from(
          'market_trade_requests',
        )
        .update({
          status:
            'declined',
          declined_at:
            now,
          updated_at:
            now,
        })
        .eq(
          'id',
          tradeRequest.id,
        )
        .eq(
          'status',
          'pending',
        )
        .select()
        .single()

      if (
        updateError ||
        !updated
      ) {
        console.error(
          'Failed to decline trade request:',
          updateError,
        )

        return NextResponse.json(
          {
            error:
              '拒绝交易申请失败',
          },
          {
            status: 500,
          },
        )
      }

      return NextResponse.json({
        tradeRequest:
          updated,
      })
    }

    /*
     * 取消交易 / 取消申请
     *
     * pending:
     *   只有买家可以主动撤回申请。
     *
     * accepted:
     *   买家或卖家均可取消这笔订单。
     *
     * 所有主动取消都必须填写原因。
     */
    if (
      action === 'cancel'
    ) {
      if (
        tradeRequest.status ===
        'pending' &&
        !isBuyer
      ) {
        return NextResponse.json(
          {
            error:
              '等待中的申请请由交易发布者使用拒绝功能',
          },
          {
            status: 403,
          },
        )
      }

      if (
        ![
          'pending',
          'accepted',
        ].includes(
          tradeRequest.status,
        )
      ) {
        return NextResponse.json(
          {
            error:
              '当前交易无法取消',
          },
          {
            status: 409,
          },
        )
      }

      if (
        !cancelReason
      ) {
        return NextResponse.json(
          {
            error:
              '请填写取消原因',
          },
          {
            status: 400,
          },
        )
      }

      const {
        data: updated,
        error: updateError,
      } = await supabase
        .from(
          'market_trade_requests',
        )
        .update({
          status:
            'cancelled',
          cancelled_at:
            now,
          cancelled_by:
            profile.id,
          cancel_reason:
            cancelReason,
          updated_at:
            now,
        })
        .eq(
          'id',
          tradeRequest.id,
        )
        .in(
          'status',
          [
            'pending',
            'accepted',
          ],
        )
        .select()
        .single()

      if (
        updateError ||
        !updated
      ) {
        console.error(
          'Failed to cancel trade request:',
          updateError,
        )

        return NextResponse.json(
          {
            error:
              '取消交易失败',
          },
          {
            status: 500,
          },
        )
      }

      return NextResponse.json({
        tradeRequest:
          updated,
      })
    }

    /*
     * 双方确认完成。
     *
     * 第一方点击：
     * → 只记录自己的 completed_at
     * → status 继续保持 accepted
     *
     * 第二方点击：
     * → 记录自己的 completed_at
     * → 检测双方都确认
     * → status 才改为 completed
     */
    if (
      action === 'complete'
    ) {
      if (
        tradeRequest.status !==
        'accepted'
      ) {
        return NextResponse.json(
          {
            error:
              '只有进行中的交易可以确认完成',
          },
          {
            status: 409,
          },
        )
      }

      /*
       * 如果当前用户已经确认过，
       * 不重复写入，直接返回当前状态。
       */
      if (
        isBuyer &&
        tradeRequest.buyer_completed_at
      ) {
        return NextResponse.json({
          tradeRequest,
          waitingForOtherParty:
            !tradeRequest.seller_completed_at,
        })
      }

      if (
        isSeller &&
        tradeRequest.seller_completed_at
      ) {
        return NextResponse.json({
          tradeRequest,
          waitingForOtherParty:
            !tradeRequest.buyer_completed_at,
        })
      }

      const completionUpdate =
        isBuyer
          ? {
              buyer_completed_at:
                now,
              updated_at:
                now,
            }
          : {
              seller_completed_at:
                now,
              updated_at:
                now,
            }

      const {
        data:
          confirmationUpdated,
        error:
          confirmationError,
      } = await supabase
        .from(
          'market_trade_requests',
        )
        .update(
          completionUpdate,
        )
        .eq(
          'id',
          tradeRequest.id,
        )
        .eq(
          'status',
          'accepted',
        )
        .select(`
          id,
          listing_id,
          buyer_id,
          seller_id,
          quantity,
          offered_price_uec,
          status,
          accepted_at,
          declined_at,
          cancelled_at,
          completed_at,
          cancelled_by,
          cancel_reason,
          buyer_completed_at,
          seller_completed_at,
          updated_at
        `)
        .single()

      if (
        confirmationError ||
        !confirmationUpdated
      ) {
        console.error(
          'Failed to confirm trade completion:',
          confirmationError,
        )

        return NextResponse.json(
          {
            error:
              '确认交易完成失败',
          },
          {
            status: 500,
          },
        )
      }

      const bothCompleted =
        Boolean(
          confirmationUpdated
            .buyer_completed_at,
        ) &&
        Boolean(
          confirmationUpdated
            .seller_completed_at,
        )

      /*
       * 只有一方确认。
       */
      if (!bothCompleted) {
        return NextResponse.json({
          tradeRequest:
            confirmationUpdated,
          waitingForOtherParty:
            true,
        })
      }

      /*
       * 双方均确认，正式完成交易。
       */
      const {
        data:
          fullyCompleted,
        error:
          completeError,
      } = await supabase
        .from(
          'market_trade_requests',
        )
        .update({
          status:
            'completed',
          completed_at:
            now,
          updated_at:
            now,
        })
        .eq(
          'id',
          tradeRequest.id,
        )
        .eq(
          'status',
          'accepted',
        )
        .select()
        .single()

      if (
        completeError ||
        !fullyCompleted
      ) {
        console.error(
          'Failed to finalize completed trade:',
          completeError,
        )

        return NextResponse.json(
          {
            error:
              '完成交易失败',
          },
          {
            status: 500,
          },
        )
      }

      return NextResponse.json({
        tradeRequest:
          fullyCompleted,
        waitingForOtherParty:
          false,
      })
    }

    return NextResponse.json(
      {
        error:
          '无法处理该交易操作',
      },
      {
        status: 400,
      },
    )
  } catch (error) {
    console.error(
      'Trade request PATCH error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '更新交易状态失败',
      },
      {
        status: 500,
      },
    )
  }
}