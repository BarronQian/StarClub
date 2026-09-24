import {
  NextResponse,
  type NextRequest,
} from 'next/server'

import {
  revalidatePath,
} from 'next/cache'

import {
  requireAdminApi,
} from '@/lib/admin-auth'

import {
  createAdminClient,
} from '@/lib/supabase-admin'

type ReorderItem = {
  id: string
  sort_order: number
}

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

  if (
    !body ||
    !Array.isArray(
      body.items,
    )
  ) {
    return NextResponse.json(
      {
        error:
          '排序数据格式错误',
      },
      {
        status: 400,
      },
    )
  }

  const items: ReorderItem[] =
    body.items
      .map(
        (
          item: unknown,
          index: number,
        ) => {
          if (
            !item ||
            typeof item !==
              'object'
          ) {
            return null
          }

          const record =
            item as Record<
              string,
              unknown
            >

          const id =
            typeof record.id ===
            'string'
              ? record.id.trim()
              : ''

          if (!id) {
            return null
          }

          /*
           * 后台传来的数组顺序
           * 就是真正的排序顺序。
           *
           * 不信任前端自己传的
           * sort_order 数字。
           */
          return {
            id,
            sort_order:
              index,
          }
        },
      )
      .filter(
        (
          item,
        ): item is ReorderItem =>
          item !== null,
      )

  if (
    items.length !==
    body.items.length
  ) {
    return NextResponse.json(
      {
        error:
          '排序数据包含无效分类',
      },
      {
        status: 400,
      },
    )
  }

  /*
   * 防止同一个 Category ID
   * 在请求里出现两次。
   */
  const uniqueIds =
    new Set(
      items.map(
        (item) =>
          item.id,
      ),
    )

  if (
    uniqueIds.size !==
    items.length
  ) {
    return NextResponse.json(
      {
        error:
          '排序数据包含重复分类',
      },
      {
        status: 400,
      },
    )
  }

  if (
    items.length === 0
  ) {
    return NextResponse.json({
      ok: true,
    })
  }

  const admin =
    createAdminClient()

  /*
   * 先确认这些 Category
   * 全部真实存在。
   */
  const {
    data: existing,
    error: readError,
  } = await admin
    .from(
      'archive_categories',
    )
    .select('id')
    .in(
      'id',
      items.map(
        (item) =>
          item.id,
      ),
    )

  if (readError) {
    console.error(
      '[Archive categories reorder] Read failed:',
      readError,
    )

    return NextResponse.json(
      {
        error:
          '读取分类失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  if (
    (existing?.length ?? 0) !==
    items.length
  ) {
    return NextResponse.json(
      {
        error:
          '部分分类不存在，请刷新后台后重试',
      },
      {
        status: 409,
      },
    )
  }

  /*
   * 分类数量通常很少，
   * 这里逐项更新即可。
   *
   * 后面 Admin UI 拖动完成后
   * 只请求一次这个 API，
   * 不会在拖动过程中反复写数据库。
   */
  const results =
    await Promise.all(
      items.map(
        (item) =>
          admin
            .from(
              'archive_categories',
            )
            .update({
              sort_order:
                item.sort_order,
            })
            .eq(
              'id',
              item.id,
            ),
      ),
    )

  const failed =
    results.find(
      (result) =>
        result.error,
    )

  if (failed?.error) {
    console.error(
      '[Archive categories reorder] Update failed:',
      failed.error,
    )

    return NextResponse.json(
      {
        error:
          '保存分类排序失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  revalidatePath(
    '/archive',
  )

  return NextResponse.json({
    ok: true,
  })
}