import {
  NextRequest,
  NextResponse,
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
}

function cleanText(
  value: unknown,
) {
  return typeof value ===
    'string'
    ? value.trim()
    : ''
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

  const categoryId =
    cleanText(
      body?.category_id,
    )

  const rawItems =
    Array.isArray(
      body?.items,
    )
      ? body.items
      : []

  if (!categoryId) {
    return NextResponse.json(
      {
        error:
          '缺少 Category ID',
      },
      {
        status: 400,
      },
    )
  }

  if (
    rawItems.length === 0
  ) {
    return NextResponse.json(
      {
        error:
          '没有需要排序的 Album',
      },
      {
        status: 400,
      },
    )
  }

const items:
  ReorderItem[] =
  rawItems
    .map(
      (
        item: unknown,
      ): ReorderItem => ({
        id:
          typeof item ===
            'object' &&
          item !== null &&
          'id' in item
            ? cleanText(
                (
                  item as {
                    id?: unknown
                  }
                ).id,
              )
            : '',
      }),
    )
    .filter(
      (
        item:
          ReorderItem,
      ) =>
        Boolean(item.id),
    )

  if (
    items.length !==
    rawItems.length
  ) {
    return NextResponse.json(
      {
        error:
          'Album 排序数据无效',
      },
      {
        status: 400,
      },
    )
  }

  const ids =
    items.map(
      (item) =>
        item.id,
    )

  /*
   * 防止同一个 Album ID
   * 在请求中出现两次。
   */
  if (
    new Set(ids).size !==
    ids.length
  ) {
    return NextResponse.json(
      {
        error:
          'Album 排序数据存在重复 ID',
      },
      {
        status: 400,
      },
    )
  }

  const admin =
    createAdminClient()

  /*
   * 确认 Category 存在，
   * 同时拿 slug 给 revalidate 用。
   */
  const {
    data: category,
    error: categoryError,
  } =
    await admin
      .from(
        'archive_categories',
      )
      .select(
        'id, slug',
      )
      .eq(
        'id',
        categoryId,
      )
      .maybeSingle()

  if (categoryError) {
    console.error(
      '[Archive albums reorder category]',
      categoryError,
    )

    return NextResponse.json(
      {
        error:
          '读取 Category 失败',
      },
      {
        status: 500,
      },
    )
  }

  if (!category) {
    return NextResponse.json(
      {
        error:
          'Category 不存在',
      },
      {
        status: 404,
      },
    )
  }

  /*
   * 读取这个 Category 当前
   * 实际拥有的所有 Album。
   *
   * 这里不是只验证传进来的 ID，
   * 而是要求客户端提交完整排序。
   */
  const {
    data: existingAlbums,
    error: albumsError,
  } =
    await admin
      .from(
        'archive_albums',
      )
      .select(
        'id',
      )
      .eq(
        'category_id',
        categoryId,
      )

  if (albumsError) {
    console.error(
      '[Archive albums reorder read]',
      albumsError,
    )

    return NextResponse.json(
      {
        error:
          '读取 Album 失败',
      },
      {
        status: 500,
      },
    )
  }

  const existingIds =
    (
      existingAlbums ?? []
    ).map(
      (album) =>
        album.id,
    )

  /*
   * 必须：
   *
   * 1. 数量完全一致
   * 2. 所有 ID 都属于这个 Category
   *
   * 防止把其他 Category 的 Album
   * 意外写入当前排序。
   */
  if (
    existingIds.length !==
    ids.length
  ) {
    return NextResponse.json(
      {
        error:
          'Album 列表已经发生变化，请刷新后台后重试',
      },
      {
        status: 409,
      },
    )
  }

  const existingIdSet =
    new Set(
      existingIds,
    )

  if (
    ids.some(
      (id) =>
        !existingIdSet.has(
          id,
        ),
    )
  ) {
    return NextResponse.json(
      {
        error:
          '排序中包含不属于当前 Category 的 Album',
      },
      {
        status: 400,
      },
    )
  }

  /*
   * 按客户端传来的顺序
   * 重新写成 0 / 1 / 2 / 3...
   */
  const results =
    await Promise.all(
      items.map(
        (
          item,
          index,
        ) =>
          admin
            .from(
              'archive_albums',
            )
            .update({
              sort_order:
                index,
            })
            .eq(
              'id',
              item.id,
            )
            .eq(
              'category_id',
              categoryId,
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
      '[Archive albums reorder update]',
      failed.error,
    )

    return NextResponse.json(
      {
        error:
          '保存 Album 排序失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  revalidatePath(
    '/archive',
  )

  revalidatePath(
    `/archive/${category.slug}`,
  )

  return NextResponse.json({
    success: true,

    items:
      items.map(
        (
          item,
          index,
        ) => ({
          id:
            item.id,

          sort_order:
            index,
        }),
      ),
  })
}