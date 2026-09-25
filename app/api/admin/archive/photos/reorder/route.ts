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

  let body: {
    session_id?: unknown
    items?: unknown
  }

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

  const sessionId =
    typeof body.session_id ===
    'string'
      ? body.session_id.trim()
      : ''

  const rawItems =
    Array.isArray(
      body.items,
    )
      ? body.items
      : []

  const ids =
    rawItems
      .map(
        (item) =>
          item &&
          typeof item ===
            'object' &&
          'id' in item &&
          typeof item.id ===
            'string'
            ? item.id.trim()
            : '',
      )
      .filter(Boolean)

  if (!sessionId) {
    return NextResponse.json(
      {
        error:
          '缺少 Session ID',
      },
      {
        status: 400,
      },
    )
  }

  if (
    ids.length !==
    rawItems.length
  ) {
    return NextResponse.json(
      {
        error:
          '照片排序数据无效',
      },
      {
        status: 400,
      },
    )
  }

  if (
    new Set(ids).size !==
    ids.length
  ) {
    return NextResponse.json(
      {
        error:
          '照片排序中存在重复 ID',
      },
      {
        status: 400,
      },
    )
  }

  /*
   * 确认 Session 存在。
   */
  const {
    data: session,
    error: sessionError,
  } =
    await admin
      .from(
        'archive_sessions',
      )
      .select(
        'album_id',
      )
      .eq(
        'id',
        sessionId,
      )
      .maybeSingle()

  if (
    sessionError ||
    !session
  ) {
    return NextResponse.json(
      {
        error:
          '所属 Session 不存在',
      },
      {
        status: 404,
      },
    )
  }

  /*
   * 读取该 Session 当前全部照片。
   * 前端必须提交完整列表，
   * 不能只提交其中几张。
   */
  const {
    data: existingPhotos,
    error: photosError,
  } =
    await admin
      .from(
        'archive_photos',
      )
      .select(
        'id',
      )
      .eq(
        'session_id',
        sessionId,
      )

  if (photosError) {
    console.error(
      '[Archive photo reorder read]',
      photosError,
    )

    return NextResponse.json(
      {
        error:
          '读取照片失败',
      },
      {
        status: 500,
      },
    )
  }

  const existingIds =
    (
      existingPhotos ??
      []
    )
      .map(
        (photo) =>
          photo.id,
      )
      .sort()

  const submittedIds =
    [...ids].sort()

  if (
    existingIds.length !==
      submittedIds.length ||
    existingIds.some(
      (id, index) =>
        id !==
        submittedIds[index],
    )
  ) {
    return NextResponse.json(
      {
        error:
          '照片排序列表与当前 Session 不一致',
      },
      {
        status: 400,
      },
    )
  }

  /*
   * 根据前端数组顺序，
   * 重新生成连续 sort_order。
   */
  for (
    let index = 0;
    index < ids.length;
    index += 1
  ) {
    const {
      error,
    } =
      await admin
        .from(
          'archive_photos',
        )
        .update({
          sort_order:
            index,
        })
        .eq(
          'id',
          ids[index],
        )
        .eq(
          'session_id',
          sessionId,
        )

    if (error) {
      console.error(
        '[Archive photo reorder update]',
        error,
      )

      return NextResponse.json(
        {
          error:
            '保存照片排序失败',
        },
        {
          status: 500,
        },
      )
    }
  }

  /*
   * 找 Album / Category，
   * 刷新对应 Archive 页面。
   */
  const {
    data: album,
  } =
    await admin
      .from(
        'archive_albums',
      )
      .select(
        `
          slug,
          category_id
        `,
      )
      .eq(
        'id',
        session.album_id,
      )
      .maybeSingle()

  let categorySlug:
    string | null =
      null

  if (album) {
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

    categorySlug =
      category?.slug ??
      null
  }

  revalidatePath(
    '/archive',
  )

  if (
    categorySlug &&
    album?.slug
  ) {
    revalidatePath(
      `/archive/${categorySlug}`,
    )

    revalidatePath(
      `/archive/${categorySlug}/${album.slug}`,
    )
  }

  return NextResponse.json({
    success: true,
  })
}