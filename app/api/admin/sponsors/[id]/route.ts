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

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  },
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

    const {
      id,
    } =
      await context.params

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

    const supabase =
      createAdminClient()

    // 只允许修改传进来的字段
    const updates: Record<
      string,
      unknown
    > = {
      updated_at:
        new Date()
          .toISOString(),
    }

    if (
      body.name !==
      undefined
    ) {
      const name =
        cleanString(
          body.name,
        )

      if (!name) {
        return NextResponse.json(
          {
            error:
              '赞助者名称不能为空',
          },
          {
            status: 400,
          },
        )
      }

      updates.name =
        name
    }

    if (
      body.nickname !==
      undefined
    ) {
      updates.nickname =
        cleanOptionalString(
          body.nickname,
        )
    }

    if (
      body.badge !==
      undefined
    ) {
      updates.badge =
        cleanOptionalString(
          body.badge,
        )
    }

    if (
      body.amount !==
      undefined
    ) {
      const amount =
        cleanAmount(
          body.amount,
        )

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

      updates.amount =
        amount
    }

    if (
      body.sortOrder !==
      undefined
    ) {
      const sortOrder =
        Number(
          body.sortOrder,
        )

      if (
        !Number.isSafeInteger(
          sortOrder,
        )
      ) {
        return NextResponse.json(
          {
            error:
              '排序值无效',
          },
          {
            status: 400,
          },
        )
      }

      updates.sort_order =
        sortOrder
    }

    if (
      body.isVisible !==
      undefined
    ) {
      updates.is_visible =
        body.isVisible ===
        true
    }

    const {
      data: sponsor,
      error,
    } =
      await supabase
        .from(
          'sponsors',
        )
        .update(
          updates,
        )
        .eq(
          'id',
          id,
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
        .maybeSingle()

    if (error) {
      console.error(
        'Failed to update sponsor:',
        error,
      )

      if (
        error.code ===
        '23505'
      ) {
        return NextResponse.json(
          {
            error:
              '该赞助者名称已经存在',
          },
          {
            status: 409,
          },
        )
      }

      return NextResponse.json(
        {
          error:
            '保存赞助者失败',
        },
        {
          status: 500,
        },
      )
    }

    if (!sponsor) {
      return NextResponse.json(
        {
          error:
            '赞助者不存在',
        },
        {
          status: 404,
        },
      )
    }

    return NextResponse.json({
      sponsor,
    })
  } catch (error) {
    console.error(
      'PATCH admin sponsor error:',
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

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  },
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

    const {
      id,
    } =
      await context.params

    const supabase =
      createAdminClient()

    const {
      data: sponsor,
      error:
        loadError,
    } =
      await supabase
        .from(
          'sponsors',
        )
        .select(
          'id, name',
        )
        .eq(
          'id',
          id,
        )
        .maybeSingle()

    if (
      loadError
    ) {
      console.error(
        'Failed to load sponsor before delete:',
        loadError,
      )

      return NextResponse.json(
        {
          error:
            '读取赞助者失败',
        },
        {
          status: 500,
        },
      )
    }

    if (!sponsor) {
      return NextResponse.json(
        {
          error:
            '赞助者不存在',
        },
        {
          status: 404,
        },
      )
    }

    const {
      error:
        deleteError,
    } =
      await supabase
        .from(
          'sponsors',
        )
        .delete()
        .eq(
          'id',
          id,
        )

    if (
      deleteError
    ) {
      console.error(
        'Failed to delete sponsor:',
        deleteError,
      )

      return NextResponse.json(
        {
          error:
            '删除赞助者失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      id,
    })
  } catch (error) {
    console.error(
      'DELETE admin sponsor error:',
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