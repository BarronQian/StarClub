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

async function revalidateVideoPaths(
  admin: ReturnType<
    typeof createAdminClient
  >,
  sessionId: string,
) {
  const {
    data: session,
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

  revalidatePath(
    '/archive',
  )

  if (!session) {
    return
  }

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

  if (!album) {
    return
  }

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

  if (!category?.slug) {
    return
  }

  revalidatePath(
    `/archive/${category.slug}`,
  )

  revalidatePath(
    `/archive/${category.slug}/${album.slug}`,
  )
}

/*
 * PATCH
 *
 * 修改单个 Archive Video。
 *
 * 不允许通过这里移动到
 * 另一个 Session。
 */
export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  },
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  const admin =
    createAdminClient()

  const {
    id,
  } =
    await context.params

  if (!id) {
    return NextResponse.json(
      {
        error:
          '缺少 Video ID',
      },
      {
        status: 400,
      },
    )
  }

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

  /*
   * 先读取原 Video。
   */
  const {
    data: existing,
    error: existingError,
  } =
    await admin
      .from(
        'archive_session_videos',
      )
      .select('*')
      .eq(
        'id',
        id,
      )
      .maybeSingle()

  if (
    existingError ||
    !existing
  ) {
    return NextResponse.json(
      {
        error:
          'Video 不存在',
      },
      {
        status: 404,
      },
    )
  }

  /*
   * 没传的字段继续保留旧值。
   */
  const title =
    Object.prototype.hasOwnProperty.call(
      body,
      'title',
    )
      ? cleanText(
          body.title,
        )
      : existing.title

  const platform =
    Object.prototype.hasOwnProperty.call(
      body,
      'platform',
    )
      ? cleanPlatform(
          body.platform,
        )
      : existing.platform

  const videoUrl =
    Object.prototype.hasOwnProperty.call(
      body,
      'video_url',
    )
      ? cleanNullableText(
          body.video_url,
        )
      : existing.video_url

  const embedUrl =
    Object.prototype.hasOwnProperty.call(
      body,
      'embed_url',
    )
      ? cleanNullableText(
          body.embed_url,
        )
      : existing.embed_url

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

  if (
    platform !==
      'youtube' &&
    platform !==
      'bilibili'
  ) {
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

  const {
    data: video,
    error: updateError,
  } =
    await admin
      .from(
        'archive_session_videos',
      )
      .update({
        title,
        platform,
        video_url:
          videoUrl,
        embed_url:
          embedUrl,
      })
      .eq(
        'id',
        id,
      )
      .select('*')
      .single()

  if (updateError) {
    console.error(
      '[Archive video PATCH]',
      updateError,
    )

    if (
      updateError.code ===
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
          '保存视频失败',
      },
      {
        status: 500,
      },
    )
  }

  await revalidateVideoPaths(
    admin,
    existing.session_id,
  )

  return NextResponse.json({
    video,
  })
}

/*
 * DELETE
 *
 * 删除单个 Archive Video。
 *
 * Video 没有 Storage 文件，
 * 所以只需要删除数据库记录。
 */
export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  },
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  const admin =
    createAdminClient()

  const {
    id,
  } =
    await context.params

  if (!id) {
    return NextResponse.json(
      {
        error:
          '缺少 Video ID',
      },
      {
        status: 400,
      },
    )
  }

  /*
   * 删除前先取得 Session ID，
   * 后面 revalidate 会用到。
   */
  const {
    data: existing,
    error: existingError,
  } =
    await admin
      .from(
        'archive_session_videos',
      )
      .select(
        `
          id,
          session_id
        `,
      )
      .eq(
        'id',
        id,
      )
      .maybeSingle()

  if (
    existingError ||
    !existing
  ) {
    return NextResponse.json(
      {
        error:
          'Video 不存在',
      },
      {
        status: 404,
      },
    )
  }

  const {
    error: deleteError,
  } =
    await admin
      .from(
        'archive_session_videos',
      )
      .delete()
      .eq(
        'id',
        id,
      )

  if (deleteError) {
    console.error(
      '[Archive video DELETE]',
      deleteError,
    )

    return NextResponse.json(
      {
        error:
          '删除视频失败',
      },
      {
        status: 500,
      },
    )
  }

  await revalidateVideoPaths(
    admin,
    existing.session_id,
  )

  return NextResponse.json({
    success: true,
  })
}