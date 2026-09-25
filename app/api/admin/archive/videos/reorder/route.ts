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

type ReorderItem = {
  id: string
  sort_order: number
}

/*
 * POST
 *
 * 调整同一个 Session 内
 * Video 的显示顺序。
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

  const items:
    ReorderItem[] =
      body.items
        .map(
          (
            item,
            index,
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
              cleanText(
                record.id,
              )

            if (!id) {
              return null
            }

            /*
             * 后端重新生成连续的
             * sort_order。
             *
             * 不直接信任客户端传来的
             * sort_order。
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
          '排序数据中存在无效 Video',
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
   * 读取数据库中这个 Session
   * 当前拥有的所有 Video。
   */
  const {
    data: existingVideos,
    error: videosError,
  } =
    await admin
      .from(
        'archive_session_videos',
      )
      .select(
        'id',
      )
      .eq(
        'session_id',
        sessionId,
      )

  if (videosError) {
    console.error(
      '[Archive video reorder read]',
      videosError,
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

  const existingIds =
    new Set(
      (
        existingVideos ??
        []
      ).map(
        (video) =>
          video.id,
      ),
    )

  const requestedIds =
    new Set(
      items.map(
        (item) =>
          item.id,
      ),
    )

  /*
   * 必须提交这个 Session
   * 完整的视频列表。
   *
   * 防止：
   * - 漏掉某个 Video
   * - 混入其他 Session 的 Video
   * - 重复 Video ID
   */
  if (
    existingIds.size !==
      items.length ||
    requestedIds.size !==
      items.length ||
    [...existingIds].some(
      (id) =>
        !requestedIds.has(
          id,
        ),
    )
  ) {
    return NextResponse.json(
      {
        error:
          'Video 排序列表与当前 Session 不一致',
      },
      {
        status: 400,
      },
    )
  }

  /*
   * 逐条保存新的 sort_order。
   */
  for (
    const item of items
  ) {
    const {
      error,
    } =
      await admin
        .from(
          'archive_session_videos',
        )
        .update({
          sort_order:
            item.sort_order,
        })
        .eq(
          'id',
          item.id,
        )
        .eq(
          'session_id',
          sessionId,
        )

    if (error) {
      console.error(
        '[Archive video reorder update]',
        error,
      )

      return NextResponse.json(
        {
          error:
            '保存视频排序失败',
        },
        {
          status: 500,
        },
      )
    }
  }

  /*
   * 获取 Album + Category，
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