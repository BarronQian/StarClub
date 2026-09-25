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

function cleanText(
  value: unknown,
) {
  return typeof value === 'string'
    ? value.trim()
    : ''
}

function cleanNullableText(
  value: unknown,
) {
  const cleaned =
    cleanText(value)

  return cleaned || null
}

function cleanCaptains(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) =>
      cleanText(item),
    )
    .filter(Boolean)
}

function cleanReservedSlots(
  value: unknown,
) {
  const number =
    Number(value)

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return 0
  }

  return Math.floor(number)
}

/*
 * GET
 *
 * 后台读取所有 Session。
 *
 * 目前主要用于后台管理和调试。
 * 正式 Archive 前台仍然通过
 * lib/archive-db.ts 获取完整树状数据。
 */
export async function GET() {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  const admin =
    createAdminClient()

  const {
    data,
    error,
  } =
    await admin
      .from(
        'archive_sessions',
      )
      .select('*')
      .order(
        'album_id',
        {
          ascending: true,
        },
      )
      .order(
        'sort_order',
        {
          ascending: true,
        },
      )
      .order(
        'created_at',
        {
          ascending: true,
        },
      )

  if (error) {
    console.error(
      '[Archive sessions GET]',
      error,
    )

    return NextResponse.json(
      {
        error:
          '读取 Session 失败',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json({
    sessions:
      data ?? [],
  })
}

/*
 * POST
 *
 * 在指定 Album 下创建
 * 一个新的 Session。
 */
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

  const slug =
    cleanText(
      body.slug,
    )

  const label =
    cleanText(
      body.label,
    )

  const eventDate =
    cleanNullableText(
      body.event_date,
    )

  const title =
    cleanNullableText(
      body.title,
    )

  const note =
    cleanNullableText(
      body.note,
    )

  const captains =
    cleanCaptains(
      body.captains,
    )

  const reservedSlots =
    cleanReservedSlots(
      body.reserved_slots,
    )

  const isPublished =
    typeof body.is_published ===
    'boolean'
      ? body.is_published
      : true

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

  if (!slug) {
    return NextResponse.json(
      {
        error:
          '请填写 Session Slug',
      },
      {
        status: 400,
      },
    )
  }

  if (!label) {
    return NextResponse.json(
      {
        error:
          '请填写 Session Label',
      },
      {
        status: 400,
      },
    )
  }

  /*
   * 确认 Album 存在，
   * 同时取得 Category 信息，
   * 后面用于 revalidate。
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
   * 新 Session 默认排在
   * 当前 Album 的最后。
   */
  const {
    data: lastSession,
    error: orderError,
  } =
    await admin
      .from(
        'archive_sessions',
      )
      .select(
        'sort_order',
      )
      .eq(
        'album_id',
        albumId,
      )
      .order(
        'sort_order',
        {
          ascending: false,
        },
      )
      .limit(1)
      .maybeSingle()

  if (orderError) {
    console.error(
      '[Archive session order]',
      orderError,
    )

    return NextResponse.json(
      {
        error:
          '读取 Session 排序失败',
      },
      {
        status: 500,
      },
    )
  }

  const nextSortOrder =
    typeof lastSession
      ?.sort_order ===
      'number'
      ? lastSession
          .sort_order + 1
      : 0

  const {
    data: session,
    error: insertError,
  } =
    await admin
      .from(
        'archive_sessions',
      )
      .insert({
        album_id:
          albumId,

        slug,

        label,

        event_date:
          eventDate,

        title,

        note,

        captains,

        reserved_slots:
          reservedSlots,

        sort_order:
          nextSortOrder,

        is_published:
          isPublished,
      })
      .select('*')
      .single()

  if (insertError) {
    console.error(
      '[Archive session POST]',
      insertError,
    )

    /*
     * unique(album_id, slug)
     */
    if (
      insertError.code ===
      '23505'
    ) {
      return NextResponse.json(
        {
          error:
            '这个 Album 中已经存在相同 Slug 的 Session',
        },
        {
          status: 409,
        },
      )
    }

    /*
     * album_id FK
     */
    if (
      insertError.code ===
      '23503'
    ) {
      return NextResponse.json(
        {
          error:
            '所属 Album 不存在',
        },
        {
          status: 400,
        },
      )
    }

    return NextResponse.json(
      {
        error:
          '创建 Session 失败',
      },
      {
        status: 500,
      },
    )
  }

  /*
   * 获取 Category Slug，
   * 让未来切换 DB 前台以后
   * 页面缓存能正确刷新。
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

  return NextResponse.json(
    {
      session,
    },
    {
      status: 201,
    },
  )
}