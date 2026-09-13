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

    const orderedIds =
      Array.isArray(
        body.orderedIds,
      )
        ? body.orderedIds.filter(
            (
              id: unknown,
            ) =>
              typeof id ===
                'string' &&
              id.length > 0,
          )
        : []

    if (
      orderedIds.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            '排序数据为空',
        },
        {
          status: 400,
        },
      )
    }

    const uniqueIds =
      [
        ...new Set(
          orderedIds,
        ),
      ]

    if (
      uniqueIds.length !==
      orderedIds.length
    ) {
      return NextResponse.json(
        {
          error:
            '排序数据存在重复项目',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      createAdminClient()

    const {
      data:
        existingSponsors,
      error:
        loadError,
    } =
      await supabase
        .from(
          'sponsors',
        )
        .select(
          'id',
        )
        .in(
          'id',
          uniqueIds,
        )

    if (
      loadError
    ) {
      console.error(
        'Failed to load sponsors for reorder:',
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

    if (
      (
        existingSponsors ??
        []
      ).length !==
      uniqueIds.length
    ) {
      return NextResponse.json(
        {
          error:
            '排序列表中存在无效赞助者',
        },
        {
          status: 400,
        },
      )
    }

    const total =
      uniqueIds.length

    const updates =
      uniqueIds.map(
        (
          id,
          index,
        ) => ({
          id,
          sortOrder:
            total -
            index,
        }),
      )

    for (
      const item of
      updates
    ) {
      const {
        error:
          updateError,
      } =
        await supabase
          .from(
            'sponsors',
          )
          .update({
            sort_order:
              item.sortOrder,
            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            'id',
            item.id,
          )

      if (
        updateError
      ) {
        console.error(
          'Failed to reorder sponsor:',
          updateError,
        )

        return NextResponse.json(
          {
            error:
              '保存排序失败',
          },
          {
            status: 500,
          },
        )
      }
    }

    return NextResponse.json({
      ok: true,
    })
  } catch (error) {
    console.error(
      'POST sponsor reorder error:',
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