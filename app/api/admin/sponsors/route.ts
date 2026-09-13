import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  getAdminSession,
} from '@/lib/admin-auth'

import {
  createAdminClient,
} from '@/lib/supabase-admin'

export const dynamic =
  'force-dynamic'

function cleanString(
  value: unknown,
) {
  return String(
    value ?? '',
  ).trim()
}

function cleanOptionalString(
  value: unknown,
) {
  const result =
    cleanString(value)

  return result || null
}

function cleanAmount(
  value: unknown,
) {
  const amount =
    Number(value)

  if (
    !Number.isFinite(
      amount,
    ) ||
    amount < 0
  ) {
    return null
  }

  return Math.round(
    amount * 100,
  ) / 100
}

export async function GET() {
  try {
    const session =
      await getAdminSession()

    if (!session) {
      return NextResponse.json(
        {
          error:
            '没有管理员权限',
        },
        {
          status: 401,
        },
      )
    }

    const supabase =
      createAdminClient()

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'sponsors',
        )
        .select(`
          id,
          name,
          nickname,
          badge,
          amount,
          sort_order,
          is_visible,
          created_at,
          updated_at
        `)
        .order(
          'amount',
          {
            ascending: false,
          },
        )
        .order(
          'sort_order',
          {
            ascending: false,
          },
        )

    if (error) {
      console.error(
        'Failed to load sponsors:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '读取赞助榜失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      sponsors:
        data ?? [],
    })
  } catch (error) {
    console.error(
      'GET admin sponsors error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '服务器错误',
      },
      {
        status: 500,
      },
    )
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const session =
      await getAdminSession()

    if (!session) {
      return NextResponse.json(
        {
          error:
            '没有管理员权限',
        },
        {
          status: 401,
        },
      )
    }

    let body: any = {}

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

    const name =
      cleanString(
        body.name,
      )

    const nickname =
      cleanOptionalString(
        body.nickname,
      )

    const badge =
      cleanOptionalString(
        body.badge,
      )

    const amount =
      cleanAmount(
        body.amount,
      )

    const isVisible =
      body.isVisible !==
      false

    if (!name) {
      return NextResponse.json(
        {
          error:
            '请填写赞助者名称',
        },
        {
          status: 400,
        },
      )
    }

    if (
      amount === null
    ) {
      return NextResponse.json(
        {
          error:
            '赞助金额无效',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      createAdminClient()

    // 新增赞助者排在同金额其他人的最前面
    const {
      data:
        highestSortRow,
    } =
      await supabase
        .from(
          'sponsors',
        )
        .select(
          'sort_order',
        )
        .order(
          'sort_order',
          {
            ascending: false,
          },
        )
        .limit(1)
        .maybeSingle()

    const nextSortOrder =
      (
        highestSortRow
          ?.sort_order ??
        0
      ) + 1

    const {
      data: sponsor,
      error:
        insertError,
    } =
      await supabase
        .from(
          'sponsors',
        )
        .insert({
          name,
          nickname,
          badge,
          amount,
          sort_order:
            nextSortOrder,
          is_visible:
            isVisible,
          updated_at:
            new Date()
              .toISOString(),
        })
        .select(`
          id,
          name,
          nickname,
          badge,
          amount,
          sort_order,
          is_visible,
          created_at,
          updated_at
        `)
        .single()

    if (
      insertError
    ) {
      console.error(
        'Failed to create sponsor:',
        insertError,
      )

      if (
        insertError.code ===
        '23505'
      ) {
        return NextResponse.json(
          {
            error:
              '该赞助者已经存在',
          },
          {
            status: 409,
          },
        )
      }

      return NextResponse.json(
        {
          error:
            '新增赞助者失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        sponsor,
      },
      {
        status: 201,
      },
    )
  } catch (error) {
    console.error(
      'POST admin sponsors error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '服务器错误',
      },
      {
        status: 500,
      },
    )
  }
}