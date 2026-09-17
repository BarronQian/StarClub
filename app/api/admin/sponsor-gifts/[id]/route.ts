import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createAdminClient,
} from '@/lib/supabase-admin'

import {
  requireAdminApi,
} from '@/lib/admin-auth'

const FONT_SIZES = [
  'small',
  'medium',
  'large',
  'xlarge',
] as const

const SPEEDS = [
  'slow',
  'normal',
  'fast',
] as const

const DEPTHS = [
  'back',
  'middle',
  'front',
] as const

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  try {
    const { id } =
      await context.params

    const body =
      await request.json()

    const supabase =
      createAdminClient()

    /*
     * 先读取修改前的数据。
     * 后面需要根据旧金额和新金额
     * 计算 sponsors.amount 应该变化多少。
     */
    const {
      data: oldGift,
      error: oldGiftError,
    } =
      await supabase
        .from('sponsor_gifts')
        .select(`
          id,
          sponsor_id,
          sponsor_name,
          recipient_name,
          event_name,
          gift_name,
          quantity,
          gift_value,
          gifted_at,
          text_color,
          font_size,
          speed,
          depth,
          is_visible,
          sort_order,
          counts_toward_total
        `)
        .eq(
          'id',
          id,
        )
        .single()

    if (
      oldGiftError ||
      !oldGift
    ) {
      return NextResponse.json(
        {
          error:
            '找不到该赞助记录',
        },
        {
          status: 404,
        },
      )
    }

    const sponsorId =
      typeof body.sponsorId ===
      'string'
        ? body.sponsorId.trim()
        : ''

    const sponsorName =
      typeof body.sponsorName ===
      'string'
        ? body.sponsorName.trim()
        : ''

    const recipientName =
      typeof body.recipientName ===
      'string'
        ? body.recipientName.trim()
        : ''

    const eventName =
      typeof body.eventName ===
      'string'
        ? body.eventName.trim()
        : ''

    const giftName =
      typeof body.giftName ===
      'string'
        ? body.giftName.trim()
        : ''

    const quantity =
      Number(body.quantity)

    const giftValue =
      Number(body.giftValue)

    const giftedAt =
      typeof body.giftedAt ===
      'string'
        ? body.giftedAt
        : ''

    const textColor =
      typeof body.textColor ===
      'string'
        ? body.textColor.trim()
        : '#B87922'

    const fontSize =
      body.fontSize

    const speed =
      body.speed

    const depth =
      body.depth

    const isVisible =
      body.isVisible !== false

    const countsTowardTotal =
      body.countsTowardTotal ===
      true

    if (!sponsorName) {
      return NextResponse.json(
        {
          error:
            '请选择或填写赞助者',
        },
        {
          status: 400,
        },
      )
    }

    if (!recipientName) {
      return NextResponse.json(
        {
          error:
            '请填写礼物接收者',
        },
        {
          status: 400,
        },
      )
    }

    if (!giftName) {
      return NextResponse.json(
        {
          error:
            '请填写赞助礼物',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity < 1
    ) {
      return NextResponse.json(
        {
          error:
            '礼物数量无效',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !Number.isFinite(
        giftValue,
      ) ||
      giftValue < 0
    ) {
      return NextResponse.json(
        {
          error:
            '礼物参考价值无效',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !FONT_SIZES.includes(
        fontSize,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '弹幕字号无效',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !SPEEDS.includes(
        speed,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '弹幕速度无效',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !DEPTHS.includes(
        depth,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '弹幕景深无效',
        },
        {
          status: 400,
        },
      )
    }

    /*
     * 先处理累计金额变化。
     *
     * 这里支持：
     * 1. 已计入 → 修改金额
     * 2. 未计入 → 改为计入
     * 3. 已计入 → 取消计入
     * 4. 更换赞助者
     */
    const oldSponsorId =
      oldGift.sponsor_id

    const oldValue =
      Number(
        oldGift.gift_value,
      )

    const oldCounts =
      oldGift
        .counts_toward_total ===
      true

    async function adjustSponsorAmount(
      targetSponsorId:
        string,
      difference:
        number,
    ) {
      if (
        !targetSponsorId ||
        difference === 0
      ) {
        return
      }

      const {
        data: sponsor,
        error: sponsorError,
      } =
        await supabase
          .from('sponsors')
          .select(
            'id, amount',
          )
          .eq(
            'id',
            targetSponsorId,
          )
          .single()

      if (
        sponsorError ||
        !sponsor
      ) {
        throw new Error(
          'Failed to load sponsor total',
        )
      }

      const currentAmount =
        Number(
          sponsor.amount,
        )

      const nextAmount =
        Math.max(
          0,
          currentAmount +
            difference,
        )

      const {
        error: updateError,
      } =
        await supabase
          .from('sponsors')
          .update({
            amount:
              nextAmount,
          })
          .eq(
            'id',
            targetSponsorId,
          )

      if (updateError) {
        throw new Error(
          'Failed to update sponsor total',
        )
      }
    }

    /*
     * 如果赞助者发生变化，
     * 旧赞助者先减掉旧记录，
     * 新赞助者再增加新记录。
     */
    if (
      oldSponsorId !==
      (sponsorId || null)
    ) {
      if (
        oldCounts &&
        oldSponsorId &&
        oldValue > 0
      ) {
        await adjustSponsorAmount(
          oldSponsorId,
          -oldValue,
        )
      }

      if (
        countsTowardTotal &&
        sponsorId &&
        giftValue > 0
      ) {
        await adjustSponsorAmount(
          sponsorId,
          giftValue,
        )
      }
    } else if (
      sponsorId
    ) {
      /*
       * 同一个赞助者。
       */
      let difference = 0

      if (
        oldCounts &&
        countsTowardTotal
      ) {
        difference =
          giftValue -
          oldValue
      } else if (
        !oldCounts &&
        countsTowardTotal
      ) {
        difference =
          giftValue
      } else if (
        oldCounts &&
        !countsTowardTotal
      ) {
        difference =
          -oldValue
      }

      if (difference !== 0) {
        await adjustSponsorAmount(
          sponsorId,
          difference,
        )
      }
    }

    const {
      data: gift,
      error: updateGiftError,
    } =
      await supabase
        .from('sponsor_gifts')
        .update({
          sponsor_id:
            sponsorId ||
            null,

          sponsor_name:
            sponsorName,

          recipient_name:
            recipientName,

          event_name:
            eventName ||
            null,

          gift_name:
            giftName,

          quantity,

          gift_value:
            giftValue,

          gifted_at:
            giftedAt ||
            oldGift.gifted_at,

          text_color:
            textColor,

          font_size:
            fontSize,

          speed,

          depth,

          is_visible:
            isVisible,

          counts_toward_total:
            countsTowardTotal,
        })
        .eq(
          'id',
          id,
        )
        .select()
        .single()

    if (
      updateGiftError ||
      !gift
    ) {
      console.error(
        'Failed to update sponsor gift:',
        updateGiftError,
      )

      return NextResponse.json(
        {
          error:
            '更新赞助记录失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      gift,
    })
  } catch (error) {
    console.error(
      'Sponsor gift PATCH error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '服务器处理赞助记录时发生错误',
      },
      {
        status: 500,
      },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  try {
    const { id } =
      await context.params

    const supabase =
      createAdminClient()

    const {
      data: gift,
      error: giftError,
    } =
      await supabase
        .from('sponsor_gifts')
        .select(`
          id,
          sponsor_id,
          gift_value,
          counts_toward_total
        `)
        .eq(
          'id',
          id,
        )
        .single()

    if (
      giftError ||
      !gift
    ) {
      return NextResponse.json(
        {
          error:
            '找不到该赞助记录',
        },
        {
          status: 404,
        },
      )
    }

    /*
     * 如果这条记录曾经计入累计金额，
     * 删除时把对应价值减回去。
     */
    if (
      gift
        .counts_toward_total ===
        true &&
      gift.sponsor_id &&
      Number(
        gift.gift_value,
      ) > 0
    ) {
      const {
        data: sponsor,
        error: sponsorError,
      } =
        await supabase
          .from('sponsors')
          .select(
            'id, amount',
          )
          .eq(
            'id',
            gift.sponsor_id,
          )
          .single()

      if (
        sponsorError ||
        !sponsor
      ) {
        return NextResponse.json(
          {
            error:
              '无法读取赞助者累计数据，已取消删除',
          },
          {
            status: 500,
          },
        )
      }

      const nextAmount =
        Math.max(
          0,
          Number(
            sponsor.amount,
          ) -
            Number(
              gift.gift_value,
            ),
        )

      const {
        error: amountError,
      } =
        await supabase
          .from('sponsors')
          .update({
            amount:
              nextAmount,
          })
          .eq(
            'id',
            gift.sponsor_id,
          )

      if (amountError) {
        return NextResponse.json(
          {
            error:
              '累计礼物参考价值更新失败，已取消删除',
          },
          {
            status: 500,
          },
        )
      }
    }

    const {
      error: deleteError,
    } =
      await supabase
        .from('sponsor_gifts')
        .delete()
        .eq(
          'id',
          id,
        )

    if (deleteError) {
      console.error(
        'Failed to delete sponsor gift:',
        deleteError,
      )

      return NextResponse.json(
        {
          error:
            '删除赞助记录失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(
      'Sponsor gift DELETE error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '服务器删除赞助记录时发生错误',
      },
      {
        status: 500,
      },
    )
  }
}