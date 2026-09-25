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

function cleanPlatform(
  value: unknown,
) {
  const cleaned =
    cleanText(value)
      .toLowerCase()

  if (
    cleaned === 'youtube' ||
    cleaned === 'bilibili'
  ) {
    return cleaned
  }

  return null
}

/*
 * GET
 *
 * 后台读取所有 Archive Video。
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
        'archive_session_videos',
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
      '[Archive videos GET]',
      error,
    )

    return NextResponse.json(
      {
        error:
          '读取视频失败',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json({
    videos:
      data ?? [],
  })
}

/*
 * POST
 *
 * 在指定 Session 下创建
 * 一个新的视频。
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

  const title =
    cleanText(
      body.title,
    )

  const platform =
    cleanPlatform(
      body.platform,
    )

  const videoUrl =
    cleanNullableText(
      body.video_url,
    )

  const embedUrl =
    cleanNullableText(
      body.embed_url,
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

  if (!title) {
    return NextResponse.json(
      {
        error:
          '请填写视频标题',
      },
      {
        status: 400,
      },
    )
  }

  if (!platform) {
    return NextResponse.json(
      {
        error:
          '视频平台必须是 YouTube 或 Bilibili',
      },
      {
        status: 400,
      },
    )
  }

  if (
    !videoUrl &&
    !embedUrl
  ) {
    return NextResponse.json(
      {
        error:
          '请至少填写视频链接或 Embed 链接',
      },
      {
        status: 400,
      },
    )
  }

  /*
   * 确认 Session 存在，
   * 同时取得 Album 信息。
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
        `
          id,
          album_id
        `,
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
   * 新视频默认放到
   * 当前 Session 的最后。
   */
  const {
    data: lastVideo,
    error: orderError,
  } =
    await admin
      .from(
        'archive_session_videos',
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
      '[Archive video order]',
      orderError,
    )

    return NextResponse.json(
      {
        error:
          '读取视频排序失败',
      },
      {
        status: 500,
      },
    )
  }

  const nextSortOrder =
    typeof lastVideo
      ?.sort_order ===
      'number'
      ? lastVideo
          .sort_order + 1
      : 0

  const {
    data: video,
    error: insertError,
  } =
    await admin
      .from(
        'archive_session_videos',
      )
      .insert({
        session_id:
          sessionId,

        title,

        platform,

        video_url:
          videoUrl,

        embed_url:
          embedUrl,

        sort_order:
          nextSortOrder,
      })
      .select('*')
      .single()

  if (insertError) {
    console.error(
      '[Archive video POST]',
      insertError,
    )

    /*
     * session_id FK
     */
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

    /*
     * CHECK constraint
     */
    if (
      insertError.code ===
      '23514'
    ) {
      return NextResponse.json(
        {
          error:
            '视频数据不符合要求',
        },
        {
          status: 400,
        },
      )
    }

    return NextResponse.json(
      {
        error:
          '创建视频失败',
      },
      {
        status: 500,
      },
    )
  }

  /*
   * Session -> Album -> Category
   *
   * 获取对应 Slug，
   * 用于刷新 Archive 页面缓存。
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
          id,
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
      video,
    },
    {
      status: 201,
    },
  )
}