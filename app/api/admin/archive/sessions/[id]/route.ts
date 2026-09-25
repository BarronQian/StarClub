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

function getArchiveStoragePath(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return null
  }

  try {
    const url =
      new URL(value)

    const marker =
      '/storage/v1/object/public/archive/'

    const index =
      url.pathname.indexOf(
        marker,
      )

    if (index === -1) {
      return null
    }

    return decodeURIComponent(
      url.pathname.slice(
        index +
          marker.length,
      ),
    )
  } catch {
    return null
  }
}

async function cleanupArchiveUrls(
  admin:
    ReturnType<
      typeof createAdminClient
    >,
  urls: Array<
    | string
    | null
    | undefined
  >,
) {
  const paths =
    Array.from(
      new Set(
        urls
          .map(
            getArchiveStoragePath,
          )
          .filter(
            (
              path,
            ): path is string =>
              Boolean(path),
          ),
      ),
    )

  if (
    paths.length === 0
  ) {
    return
  }

  const {
    error,
  } =
    await admin.storage
      .from('archive')
      .remove(paths)

  if (error) {
    /*
     * 数据库操作已经完成，
     * 所以 Storage 清理失败
     * 不应该让整个请求失败。
     */
    console.error(
      '[Archive session storage cleanup]',
      error,
    )
  }
}

async function getArchiveLocation(
  admin:
    ReturnType<
      typeof createAdminClient
    >,
  albumId: string,
) {
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
        albumId,
      )
      .maybeSingle()

  if (!album) {
    return {
      album: null,
      category: null,
    }
  }

  const {
    data: category,
  } =
    await admin
      .from(
        'archive_categories',
      )
      .select(
        `
          id,
          slug
        `,
      )
      .eq(
        'id',
        album.category_id,
      )
      .maybeSingle()

  return {
    album,
    category:
      category ?? null,
  }
}

function revalidateArchiveLocation(
  categorySlug:
    | string
    | null
    | undefined,
  albumSlug:
    | string
    | null
    | undefined,
) {
  revalidatePath(
    '/archive',
  )

  if (!categorySlug) {
    return
  }

  revalidatePath(
    `/archive/${categorySlug}`,
  )

  if (albumSlug) {
    revalidatePath(
      `/archive/${categorySlug}/${albumSlug}`,
    )
  }
}

/*
 * PATCH
 *
 * 修改 Session。
 *
 * 目前不允许 Session
 * 直接移动到另一个 Album。
 * 如果以后确实需要，
 * 再单独增加移动逻辑。
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

  const {
    id,
  } =
    await context.params

  const sessionId =
    cleanText(id)

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

  const admin =
    createAdminClient()

  /*
   * 先读取当前 Session，
   * 确认存在，并获取 album_id。
   */
  const {
    data: existing,
    error: existingError,
  } =
    await admin
      .from(
        'archive_sessions',
      )
      .select('*')
      .eq(
        'id',
        sessionId,
      )
      .maybeSingle()

  if (
    existingError ||
    !existing
  ) {
    return NextResponse.json(
      {
        error:
          'Session 不存在',
      },
      {
        status: 404,
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

  const slug =
    cleanText(
      body.slug,
    )

  const label =
    cleanText(
      body.label,
    )

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
      : existing.is_published

  const {
    data: updated,
    error: updateError,
  } =
    await admin
      .from(
        'archive_sessions',
      )
      .update({
        slug,

        label,

        event_date:
          eventDate,

        title,

        note,

        captains,

        reserved_slots:
          reservedSlots,

        is_published:
          isPublished,
      })
      .eq(
        'id',
        sessionId,
      )
      .select('*')
      .single()

  if (updateError) {
    console.error(
      '[Archive session PATCH]',
      updateError,
    )

    /*
     * unique(album_id, slug)
     */
    if (
      updateError.code ===
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

    return NextResponse.json(
      {
        error:
          '保存 Session 失败',
      },
      {
        status: 500,
      },
    )
  }

  const location =
    await getArchiveLocation(
      admin,
      existing.album_id,
    )

  revalidateArchiveLocation(
    location.category?.slug,
    location.album?.slug,
  )

  return NextResponse.json({
    session:
      updated,
  })
}

/*
 * DELETE
 *
 * 删除 Session。
 *
 * archive_session_videos
 * archive_photos
 *
 * 都会因为 FK ON DELETE CASCADE
 * 自动删除数据库记录。
 *
 * 但是 Storage 中的照片文件
 * 不会自动删除，所以这里需要
 * 在删除数据库之前先收集 URL。
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

  const {
    id,
  } =
    await context.params

  const sessionId =
    cleanText(id)

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

  const admin =
    createAdminClient()

  /*
   * 读取 Session，
   * 获取 Album 信息。
   */
  const {
    data: existing,
    error: existingError,
  } =
    await admin
      .from(
        'archive_sessions',
      )
      .select(
        `
          id,
          album_id,
          label
        `,
      )
      .eq(
        'id',
        sessionId,
      )
      .maybeSingle()

  if (
    existingError ||
    !existing
  ) {
    return NextResponse.json(
      {
        error:
          'Session 不存在',
      },
      {
        status: 404,
      },
    )
  }

  /*
   * 删除数据库前，
   * 收集该 Session 下所有照片。
   */
  const {
    data: photos,
    error: photosError,
  } =
    await admin
      .from(
        'archive_photos',
      )
      .select(
        `
          original_url,
          display_url,
          thumbnail_url
        `,
      )
      .eq(
        'session_id',
        sessionId,
      )

  if (photosError) {
    console.error(
      '[Archive session photos]',
      photosError,
    )

    /*
     * 如果照片列表都读取失败，
     * 暂停删除。
     *
     * 否则可能造成 Storage
     * 永久留下孤儿文件。
     */
    return NextResponse.json(
      {
        error:
          '读取 Session 照片失败，已取消删除',
      },
      {
        status: 500,
      },
    )
  }

  const photoUrls =
    (photos ?? [])
      .flatMap(
        (photo) => [
          photo.original_url,
          photo.display_url,
          photo.thumbnail_url,
        ],
      )

  const location =
    await getArchiveLocation(
      admin,
      existing.album_id,
    )

  /*
   * 先删数据库。
   *
   * Sessions → Videos / Photos
   * 会通过 CASCADE 删除。
   */
  const {
    error: deleteError,
  } =
    await admin
      .from(
        'archive_sessions',
      )
      .delete()
      .eq(
        'id',
        sessionId,
      )

  if (deleteError) {
    console.error(
      '[Archive session DELETE]',
      deleteError,
    )

    return NextResponse.json(
      {
        error:
          '删除 Session 失败',
      },
      {
        status: 500,
      },
    )
  }

  /*
   * 数据库成功后，
   * 再删除 Storage 图片。
   *
   * Set 会自动去重，
   * 所以 Display === Original
   * 的小图情况不会重复删除。
   */
  await cleanupArchiveUrls(
    admin,
    photoUrls,
  )

  revalidateArchiveLocation(
    location.category?.slug,
    location.album?.slug,
  )

  return NextResponse.json({
    success: true,
  })
}