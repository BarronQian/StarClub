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

function cleanDimension(
  value: unknown,
) {
  const number =
    Number(value)

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return null
  }

  return Math.round(number)
}

/*
 * GET
 *
 * 后台读取所有 Archive Photo。
 *
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
        'archive_photos',
      )
      .select('*')
      .order(
        'session_id',
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
      '[Archive photos GET]',
      error,
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

  return NextResponse.json({
    photos:
      data ?? [],
  })
}

/*
 * POST
 *
 * 把已经成功上传到 Archive Storage
 * 的照片记录写入数据库。
 *
 * 图片文件本身不经过这个接口上传。
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

  const sessionId =
    cleanText(
      body.session_id,
    )

  const originalUrl =
    cleanNullableText(
      body.original_url,
    )

  const displayUrl =
    cleanText(
      body.display_url,
    )

  const thumbnailUrl =
    cleanNullableText(
      body.thumbnail_url,
    )

  const alt =
    cleanText(
      body.alt,
    )

  const caption =
    cleanNullableText(
      body.caption,
    )

  const wide =
    typeof body.wide ===
    'boolean'
      ? body.wide
      : false

  const width =
    cleanDimension(
      body.width,
    )

  const height =
    cleanDimension(
      body.height,
    )

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

  if (!displayUrl) {
    return NextResponse.json(
      {
        error:
          '缺少 Display 图片地址',
      },
      {
        status: 400,
      },
    )
  }

  /*
   * 确认 Session 存在。
   * 同时取得 Album ID，
   * 后面用于 revalidate。
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
   * 新照片默认放在
   * 当前 Session 最后。
   */
  const {
    data: lastPhoto,
    error: orderError,
  } =
    await admin
      .from(
        'archive_photos',
      )
      .select(
        'sort_order',
      )
      .eq(
        'session_id',
        sessionId,
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
      '[Archive photo order]',
      orderError,
    )

    return NextResponse.json(
      {
        error:
          '读取照片排序失败',
      },
      {
        status: 500,
      },
    )
  }

  const nextSortOrder =
    typeof lastPhoto
      ?.sort_order ===
      'number'
      ? lastPhoto
          .sort_order + 1
      : 0

  const {
    data: photo,
    error: insertError,
  } =
    await admin
      .from(
        'archive_photos',
      )
      .insert({
        session_id:
          sessionId,

        original_url:
          originalUrl,

        display_url:
          displayUrl,

        thumbnail_url:
          thumbnailUrl,

        alt,

        caption,

        wide,

        width,

        height,

        sort_order:
          nextSortOrder,
      })
      .select('*')
      .single()

  if (insertError) {
    console.error(
      '[Archive photo POST]',
      insertError,
    )

    if (
      insertError.code ===
      '23503'
    ) {
      return NextResponse.json(
        {
          error:
            '所属 Session 不存在',
        },
        {
          status: 400,
        },
      )
    }

    return NextResponse.json(
      {
        error:
          '创建照片记录失败',
      },
      {
        status: 500,
      },
    )
  }

  /*
   * Session -> Album -> Category
   * 获取 Slug 用于刷新 Archive 页面。
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

  return NextResponse.json(
    {
      photo,
    },
    {
      status: 201,
    },
  )
}