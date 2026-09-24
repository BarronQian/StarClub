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
  return typeof value ===
    'string'
    ? value.trim()
    : ''
}

function cleanOptionalText(
  value: unknown,
) {
  const text =
    cleanText(value)

  return text || null
}

function cleanOptionalUrl(
  value: unknown,
) {
  const text =
    cleanText(value)

  return text || null
}

function cleanSlug(
  value: unknown,
) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(
      /[^a-z0-9-_]/g,
      '',
    )
    .replace(/-+/g, '-')
    .replace(
      /^[-_]+|[-_]+$/g,
      '',
    )
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

  const marker =
    '/storage/v1/object/public/archive/'

  const markerIndex =
    value.indexOf(marker)

  if (markerIndex === -1) {
    return null
  }

  const encodedPath =
    value.slice(
      markerIndex +
        marker.length,
    )

  if (!encodedPath) {
    return null
  }

  try {
    return decodeURIComponent(
      encodedPath,
    )
  } catch {
    return encodedPath
  }
}

async function cleanupArchiveUrls(
  admin:
    ReturnType<
      typeof createAdminClient
    >,
  urls: Array<
    string | null | undefined
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

  if (paths.length === 0) {
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
     * DB 已经成功更新/删除时，
     * Storage 清理失败不能把
     * 整个请求重新判定为失败。
     */
    console.error(
      '[Archive album storage cleanup]',
      error,
    )
  }
}

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
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

  if (!id) {
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

  const body =
    await request
      .json()
      .catch(() => null)

  if (!body) {
    return NextResponse.json(
      {
        error:
          '请求内容无效',
      },
      {
        status: 400,
      },
    )
  }

  const categoryId =
    cleanText(
      body.category_id,
    )

  const slug =
    cleanSlug(
      body.slug,
    )

  const title =
    cleanText(
      body.title,
    )

  const en =
    cleanText(
      body.en,
    )

  const summary =
    cleanText(
      body.summary,
    )

  const place =
    cleanOptionalText(
      body.place,
    )

  const coverOriginalUrl =
    cleanOptionalUrl(
      body.cover_original_url,
    )

  const coverDisplayUrl =
    cleanOptionalUrl(
      body.cover_display_url,
    )

  const coverThumbnailUrl =
    cleanOptionalUrl(
      body.cover_thumbnail_url,
    )

  const isPublished =
    body.is_published !==
    false

  if (!categoryId) {
    return NextResponse.json(
      {
        error:
          '请选择所属 Category',
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
          '请填写 Album Slug',
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
          '请填写 Album 名称',
      },
      {
        status: 400,
      },
    )
  }

  const admin =
    createAdminClient()

  /*
   * 读取修改前的数据。
   * 后面需要：
   *
   * 1. 判断 Category 是否移动
   * 2. 清理被替换的旧封面
   * 3. revalidate 旧 URL
   */
  const {
    data: existing,
    error: existingError,
  } =
    await admin
      .from(
        'archive_albums',
      )
      .select(`
        id,
        category_id,
        slug,
        title,
        en,
        summary,
        place,
        cover_original_url,
        cover_display_url,
        cover_thumbnail_url,
        sort_order,
        is_published
      `)
      .eq(
        'id',
        id,
      )
      .maybeSingle()

  if (existingError) {
    console.error(
      '[Archive album PATCH read]',
      existingError,
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

  if (!existing) {
    return NextResponse.json(
      {
        error:
          'Album 不存在',
      },
      {
        status: 404,
      },
    )
  }

  /*
   * 读取旧 Category，
   * 用于刷新旧页面。
   */
  const {
    data: oldCategory,
    error: oldCategoryError,
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
        existing.category_id,
      )
      .maybeSingle()

  if (oldCategoryError) {
    console.error(
      '[Archive album PATCH old category]',
      oldCategoryError,
    )

    return NextResponse.json(
      {
        error:
          '读取原 Category 失败',
      },
      {
        status: 500,
      },
    )
  }

  /*
   * 确认新的目标 Category 存在。
   */
  const {
    data: newCategory,
    error: newCategoryError,
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

  if (newCategoryError) {
    console.error(
      '[Archive album PATCH new category]',
      newCategoryError,
    )

    return NextResponse.json(
      {
        error:
          '读取目标 Category 失败',
      },
      {
        status: 500,
      },
    )
  }

  if (!newCategory) {
    return NextResponse.json(
      {
        error:
          '目标 Category 不存在',
      },
      {
        status: 404,
      },
    )
  }

  let nextSortOrder =
    existing.sort_order

  /*
   * 如果 Album 被移动到另一个
   * Category，把它放到新 Category
   * 的最后面。
   */
  if (
    categoryId !==
    existing.category_id
  ) {
    const {
      data: lastAlbum,
      error: orderError,
    } =
      await admin
        .from(
          'archive_albums',
        )
        .select(
          'sort_order',
        )
        .eq(
          'category_id',
          categoryId,
        )
        .order(
          'sort_order',
          {
            ascending:
              false,
          },
        )
        .limit(1)
        .maybeSingle()

    if (orderError) {
      console.error(
        '[Archive album PATCH sort]',
        orderError,
      )

      return NextResponse.json(
        {
          error:
            '读取目标 Category 排序失败',
        },
        {
          status: 500,
        },
      )
    }

    nextSortOrder =
      typeof lastAlbum
        ?.sort_order ===
        'number'
        ? lastAlbum
            .sort_order + 1
        : 0
  }

  const {
    data: album,
    error: updateError,
  } =
    await admin
      .from(
        'archive_albums',
      )
      .update({
        category_id:
          categoryId,

        slug,

        title,

        en,

        summary,

        place,

        cover_original_url:
          coverOriginalUrl,

        cover_display_url:
          coverDisplayUrl,

        cover_thumbnail_url:
          coverThumbnailUrl,

        sort_order:
          nextSortOrder,

        is_published:
          isPublished,
      })
      .eq(
        'id',
        id,
      )
      .select(`
        id,
        category_id,
        slug,
        title,
        en,
        summary,
        place,
        cover_original_url,
        cover_display_url,
        cover_thumbnail_url,
        sort_order,
        is_published,
        created_at,
        updated_at
      `)
      .single()

  if (updateError) {
    console.error(
      '[Archive album PATCH]',
      updateError,
    )

    if (
      updateError.code ===
      '23505'
    ) {
      return NextResponse.json(
        {
          error:
            '目标 Category 中已经存在相同 Slug 的 Album',
        },
        {
          status: 409,
        },
      )
    }

    if (
      updateError.code ===
      '23503'
    ) {
      return NextResponse.json(
        {
          error:
            '目标 Category 不存在',
        },
        {
          status: 400,
        },
      )
    }

    return NextResponse.json(
      {
        error:
          '保存 Album 失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  /*
   * 数据库已经成功指向新封面以后，
   * 才清理真正被替换掉的旧文件。
   *
   * 如果某个 URL 没变，就绝对不删。
   */
  const replacedUrls: Array<
    string | null
  > = []

  if (
    existing
      .cover_original_url &&
    existing
      .cover_original_url !==
      coverOriginalUrl
  ) {
    replacedUrls.push(
      existing
        .cover_original_url,
    )
  }

  if (
    existing
      .cover_display_url &&
    existing
      .cover_display_url !==
      coverDisplayUrl
  ) {
    replacedUrls.push(
      existing
        .cover_display_url,
    )
  }

  if (
    existing
      .cover_thumbnail_url &&
    existing
      .cover_thumbnail_url !==
      coverThumbnailUrl
  ) {
    replacedUrls.push(
      existing
        .cover_thumbnail_url,
    )
  }

  await cleanupArchiveUrls(
    admin,
    replacedUrls,
  )

  revalidatePath(
    '/archive',
  )

  if (oldCategory?.slug) {
    revalidatePath(
      `/archive/${oldCategory.slug}`,
    )

    revalidatePath(
      `/archive/${oldCategory.slug}/${existing.slug}`,
    )
  }

  revalidatePath(
    `/archive/${newCategory.slug}`,
  )

  revalidatePath(
    `/archive/${newCategory.slug}/${album.slug}`,
  )

  return NextResponse.json({
    album,
  })
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
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

  if (!id) {
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

  const admin =
    createAdminClient()

  /*
   * 先读取 Album。
   * 同时需要知道 Category slug
   * 和封面 URL。
   */
  const {
    data: existing,
    error: existingError,
  } =
    await admin
      .from(
        'archive_albums',
      )
      .select(`
        id,
        category_id,
        slug,
        cover_original_url,
        cover_display_url,
        cover_thumbnail_url
      `)
      .eq(
        'id',
        id,
      )
      .maybeSingle()

  if (existingError) {
    console.error(
      '[Archive album DELETE read]',
      existingError,
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

  if (!existing) {
    return NextResponse.json(
      {
        error:
          'Album 不存在',
      },
      {
        status: 404,
      },
    )
  }

  /*
   * Album 删除会级联删除 Session，
   * Session 又会级联删除 photo/video
   * 的数据库记录。
   *
   * 但 Storage 文件不会自动删除，
   * 所以删除前先把 Session Photo
   * 的 URL 收集起来。
   */
  const {
    data: sessions,
    error: sessionsError,
  } =
    await admin
      .from(
        'archive_sessions',
      )
      .select('id')
      .eq(
        'album_id',
        id,
      )

  if (sessionsError) {
    console.error(
      '[Archive album DELETE sessions]',
      sessionsError,
    )

    return NextResponse.json(
      {
        error:
          '读取 Album Session 失败',
      },
      {
        status: 500,
      },
    )
  }

  const sessionIds =
    (sessions ?? []).map(
      (session) =>
        session.id,
    )

  let photoUrls: Array<
    string | null
  > = []

  if (
    sessionIds.length > 0
  ) {
    const {
      data: photos,
      error: photosError,
    } =
      await admin
        .from(
          'archive_photos',
        )
        .select(`
          original_url,
          display_url,
          thumbnail_url
        `)
        .in(
          'session_id',
          sessionIds,
        )

    if (photosError) {
      console.error(
        '[Archive album DELETE photos]',
        photosError,
      )

      return NextResponse.json(
        {
          error:
            '读取 Album 图片失败',
        },
        {
          status: 500,
        },
      )
    }

    photoUrls =
      (photos ?? [])
        .flatMap(
          (photo) => [
            photo.original_url,
            photo.display_url,
            photo.thumbnail_url,
          ],
        )
  }

  const {
    data: category,
    error: categoryError,
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
        existing.category_id,
      )
      .maybeSingle()

  if (categoryError) {
    console.error(
      '[Archive album DELETE category]',
      categoryError,
    )

    return NextResponse.json(
      {
        error:
          '读取 Album Category 失败',
      },
      {
        status: 500,
      },
    )
  }

  /*
   * DB 先删。
   *
   * archive_sessions /
   * archive_session_videos /
   * archive_photos
   * 会按照我们之前设置的
   * ON DELETE CASCADE 清理。
   */
  const {
    error: deleteError,
  } =
    await admin
      .from(
        'archive_albums',
      )
      .delete()
      .eq(
        'id',
        id,
      )

  if (deleteError) {
    console.error(
      '[Archive album DELETE]',
      deleteError,
    )

    return NextResponse.json(
      {
        error:
          '删除 Album 失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  /*
   * DB 删除成功后，
   * 再清理 Album 封面 +
   * Album 内所有 Session 图片。
   */
  await cleanupArchiveUrls(
    admin,
    [
      existing
        .cover_original_url,

      existing
        .cover_display_url,

      existing
        .cover_thumbnail_url,

      ...photoUrls,
    ],
  )

  revalidatePath(
    '/archive',
  )

  if (category?.slug) {
    revalidatePath(
      `/archive/${category.slug}`,
    )

    revalidatePath(
      `/archive/${category.slug}/${existing.slug}`,
    )
  }

  return NextResponse.json({
    success: true,
  })
}