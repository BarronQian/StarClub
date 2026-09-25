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
  return typeof value === 'string'
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

  const admin =
    createAdminClient()

  let body: Record<
    string,
    unknown
  >

  try {
    body =
      await request.json()
  } catch {
    return NextResponse.json(
      {
        error:
          '请求内容不是有效的 JSON',
      },
      {
        status: 400,
      },
    )
  }

  const albumId =
    cleanText(
      body.album_id,
    )

  if (!albumId) {
    return NextResponse.json(
      {
        error:
          '缺少 Album ID',
      },
      {
        status: 400,
      },
    )
  }

  const rawItems =
    Array.isArray(
      body.items,
    )
      ? body.items
      : []

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
    items.length === 0
  ) {
    return NextResponse.json(
      {
        error:
          '没有可排序的 Session',
      },
      {
        status: 400,
      },
    )
  }

  /*
   * 防止客户端提交重复 ID。
   */
  const submittedIds =
    items.map(
      (item) =>
        item.id,
    )

  const uniqueIds =
    new Set(
      submittedIds,
    )

  if (
    uniqueIds.size !==
    submittedIds.length
  ) {
    return NextResponse.json(
      {
        error:
          'Session 排序数据中存在重复 ID',
      },
      {
        status: 400,
      },
    )
  }

  /*
   * 读取 Album，同时取得
   * Category ID。
   */
  const {
    data: album,
    error: albumError,
  } =
    await admin
      .from(
        'archive_albums',
      )
      .select(
        `
          id,
          slug,
          category_id
        `,
      )
      .eq(
        'id',
        albumId,
      )
      .maybeSingle()

  if (
    albumError ||
    !album
  ) {
    return NextResponse.json(
      {
        error:
          '所属 Album 不存在',
      },
      {
        status: 404,
      },
    )
  }

  /*
   * 读取这个 Album 当前
   * 所有 Session。
   *
   * 排序请求必须包含完整列表，
   * 防止漏掉 Session 后产生
   * 重复 sort_order。
   */
  const {
    data: existingSessions,
    error:
      sessionsError,
  } =
    await admin
      .from(
        'archive_sessions',
      )
      .select(
        'id',
      )
      .eq(
        'album_id',
        albumId,
      )

  if (sessionsError) {
    console.error(
      '[Archive session reorder read]',
      sessionsError,
    )

    return NextResponse.json(
      {
        error:
          '读取 Session 列表失败',
      },
      {
        status: 500,
      },
    )
  }

  const existingIds =
    (
      existingSessions ??
      []
    ).map(
      (session) =>
        session.id,
    )

  if (
    existingIds.length !==
    submittedIds.length
  ) {
    return NextResponse.json(
      {
        error:
          'Session 排序数据与当前 Album 不一致，请刷新后台后重试',
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

  const containsInvalidId =
    submittedIds.some(
      (id) =>
        !existingIdSet.has(
          id,
        ),
    )

  if (containsInvalidId) {
    return NextResponse.json(
      {
        error:
          '排序数据包含不属于当前 Album 的 Session',
      },
      {
        status: 400,
      },
    )
  }

  /*
   * 按客户端提交的顺序
   * 重新写入：
   *
   * 0, 1, 2, 3...
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
              'archive_sessions',
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
              'album_id',
              albumId,
            ),
      ),
    )

  const updateError =
    results.find(
      (result) =>
        result.error,
    )?.error

  if (updateError) {
    console.error(
      '[Archive session reorder update]',
      updateError,
    )

    return NextResponse.json(
      {
        error:
          '保存 Session 排序失败',
      },
      {
        status: 500,
      },
    )
  }

  /*
   * 找 Category slug，
   * 用于刷新 Archive 页面。
   */
  const {
    data: category,
  } =
    await admin
      .from(
        'archive_categories',
      )
      .select(
        'slug',
      )
      .eq(
        'id',
        album.category_id,
      )
      .maybeSingle()

  revalidatePath(
    '/archive',
  )

  if (category?.slug) {
    revalidatePath(
      `/archive/${category.slug}`,
    )

    revalidatePath(
      `/archive/${category.slug}/${album.slug}`,
    )
  }

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