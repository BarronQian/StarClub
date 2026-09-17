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

export async function POST(
  request: NextRequest,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  try {
    const body =
      await request.json()

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

    const addToSponsorTotal =
      body.addToSponsorTotal ===
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

    const supabase =
      createAdminClient()

    const {
      data: gift,
      error: insertError,
    } =
      await supabase
        .from(
          'sponsor_gifts',
        )
        .insert({
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
            new Date()
              .toISOString()
              .slice(0, 10),

          text_color:
            textColor,

          font_size:
            fontSize,

          speed,

          depth,

          is_visible:
            isVisible,

          counts_toward_total:
            addToSponsorTotal,
        })
        .select()
        .single()

    if (
      insertError ||
      !gift
    ) {
      console.error(
        'Failed to create sponsor gift:',
        insertError,
      )

      return NextResponse.json(
        {
          error:
            '新增赞助记录失败',
        },
        {
          status: 500,
        },
      )
    }

    /*
     * 可选：
     * 同时增加现有 sponsors.amount。
     *
     * 注意这里使用当前数据库金额 +
     * 本次 giftValue，而不是让客户端
     * 直接决定新的累计金额。
     */
    if (
      addToSponsorTotal &&
      sponsorId &&
      giftValue > 0
    ) {
      const {
        data: sponsor,
        error: sponsorError,
      } =
        await supabase
          .from(
            'sponsors',
          )
          .select(
            'id, amount',
          )
          .eq(
            'id',
            sponsorId,
          )
          .single()

      if (
        sponsorError ||
        !sponsor
      ) {
        // 礼物已经创建，
        // 不假装累计金额更新成功。
        return NextResponse.json(
          {
            gift,
            warning:
              '赞助记录已创建，但累计礼物参考价值更新失败，请手动检查赞助者数据。',
          },
          {
            status: 201,
          },
        )
      }

      const newAmount =
        Number(
          sponsor.amount,
        ) +
        giftValue

      const {
        error:
          amountUpdateError,
      } =
        await supabase
          .from(
            'sponsors',
          )
          .update({
            amount:
              newAmount,
          })
          .eq(
            'id',
            sponsorId,
          )

      if (
        amountUpdateError
      ) {
        console.error(
          'Failed to update sponsor total:',
          amountUpdateError,
        )

        return NextResponse.json(
          {
            gift,
            warning:
              '赞助记录已创建，但累计礼物参考价值更新失败，请手动检查赞助者数据。',
          },
          {
            status: 201,
          },
        )
      }
    }

    return NextResponse.json(
      {
        gift,
      },
      {
        status: 201,
      },
    )
  } catch (error) {
    console.error(
      'Sponsor gift POST error:',
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