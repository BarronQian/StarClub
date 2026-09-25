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
 * 从 archive bucket 的 Public URL
 * 提取 Storage path。
 *
 * 只允许清理属于 archive bucket
 * 的文件，避免误删其他 Storage 文件。
 */
function getArchiveStoragePath(
  url: string | null,
) {
  if (!url) {
    return null
  }

  try {
    const parsed =
      new URL(url)

    const marker =
      '/storage/v1/object/public/archive/'

    const markerIndex =
      parsed.pathname.indexOf(
        marker,
      )

    if (markerIndex < 0) {
      return null
    }

    const path =
      parsed.pathname.slice(
        markerIndex +
          marker.length,
      )

    return path
      ? decodeURIComponent(
          path,
        )
      : null
  } catch {
    return null
  }
}

function getUniqueArchivePaths(
  urls: Array<
    string | null
  >,
) {
  return Array.from(
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
}

async function removeArchiveFiles(
  admin: ReturnType<
    typeof createAdminClient
  >,
  urls: Array<
    string | null
  >,
) {
  const paths =
    getUniqueArchivePaths(
      urls,
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

  /*
   * DB 操作已经成功，
   * 所以 Storage 清理失败时
   * 只记录错误，不回滚数据库。
   */
  if (error) {
    console.error(
      '[Archive photo storage cleanup]',
      error,
    )
  }
}

async function revalidatePhotoPaths(
  admin: ReturnType<
    typeof createAdminClient
  >,
  sessionId: string,
) {
  revalidatePath(
    '/archive',
  )

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
 * 修改单张照片。
 *
 * 支持：
 * - Original URL
 * - Display URL
 * - Thumbnail URL
 * - Alt
 * - Caption
 * - Wide
 * - Width / Height
 *
 * 不允许通过这里移动到其他 Session。
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
          '缺少 Photo ID',
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

  const {
    data: existing,
    error: existingError,
  } =
    await admin
      .from(
        'archive_photos',
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
          'Photo 不存在',
      },
      {
        status: 404,
      },
    )
  }

  const originalUrl =
    Object.prototype.hasOwnProperty.call(
      body,
      'original_url',
    )
      ? cleanNullableText(
          body.original_url,
        )
      : existing.original_url

  const displayUrl =
    Object.prototype.hasOwnProperty.call(
      body,
      'display_url',
    )
      ? cleanText(
          body.display_url,
        )
      : existing.display_url

  const thumbnailUrl =
    Object.prototype.hasOwnProperty.call(
      body,
      'thumbnail_url',
    )
      ? cleanNullableText(
          body.thumbnail_url,
        )
      : existing.thumbnail_url

  const alt =
    Object.prototype.hasOwnProperty.call(
      body,
      'alt',
    )
      ? cleanText(
          body.alt,
        )
      : existing.alt

  const caption =
    Object.prototype.hasOwnProperty.call(
      body,
      'caption',
    )
      ? cleanNullableText(
          body.caption,
        )
      : existing.caption

  const wide =
    Object.prototype.hasOwnProperty.call(
      body,
      'wide',
    )
      ? Boolean(
          body.wide,
        )
      : existing.wide

  const width =
    Object.prototype.hasOwnProperty.call(
      body,
      'width',
    )
      ? cleanDimension(
          body.width,
        )
      : existing.width

  const height =
    Object.prototype.hasOwnProperty.call(
      body,
      'height',
    )
      ? cleanDimension(
          body.height,
        )
      : existing.height

  if (!displayUrl) {
    return NextResponse.json(
      {
        error:
          'Display 图片地址不能为空',
      },
      {
        status: 400,
      },
    )
  }

  const {
    data: photo,
    error: updateError,
  } =
    await admin
      .from(
        'archive_photos',
      )
      .update({
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
      })
      .eq(
        'id',
        id,
      )
      .select('*')
      .single()

  if (updateError) {
    console.error(
      '[Archive photo PATCH]',
      updateError,
    )

    return NextResponse.json(
      {
        error:
          '保存照片失败',
      },
      {
        status: 500,
      },
    )
  }

  /*
   * 如果图片文件被替换，
   * 删除旧版本中已经不再被
   * 新 Photo 使用的文件。
   *
   * 特别注意：
   * Display 可能与 Original
   * 指向同一个文件，所以需要去重。
   */
  const newUrls =
    new Set(
      [
        originalUrl,
        displayUrl,
        thumbnailUrl,
      ].filter(
        (
          url,
        ): url is string =>
          Boolean(url),
      ),
    )

  const obsoleteUrls =
    [
      existing.original_url,
      existing.display_url,
      existing.thumbnail_url,
    ].filter(
      (
        url,
      ): url is string =>
        Boolean(url) &&
        !newUrls.has(url),
    )

  await removeArchiveFiles(
    admin,
    obsoleteUrls,
  )

  await revalidatePhotoPaths(
    admin,
    existing.session_id,
  )

  return NextResponse.json({
    photo,
  })
}

/*
 * DELETE
 *
 * 删除单张 Photo：
 *
 * 1. 先读取记录
 * 2. 删除数据库记录
 * 3. DB 成功后清理 Storage
 * 4. revalidate Archive
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
          '缺少 Photo ID',
      },
      {
        status: 400,
      },
    )
  }

  const {
    data: existing,
    error: existingError,
  } =
    await admin
      .from(
        'archive_photos',
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
          'Photo 不存在',
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
        'archive_photos',
      )
      .delete()
      .eq(
        'id',
        id,
      )

  if (deleteError) {
    console.error(
      '[Archive photo DELETE]',
      deleteError,
    )

    return NextResponse.json(
      {
        error:
          '删除照片失败',
      },
      {
        status: 500,
      },
    )
  }

  /*
   * 数据库删除成功以后，
   * 才清理 Storage。
   */
  await removeArchiveFiles(
    admin,
    [
      existing.original_url,
      existing.display_url,
      existing.thumbnail_url,
    ],
  )

  await revalidatePhotoPaths(
    admin,
    existing.session_id,
  )

  return NextResponse.json({
    success: true,
  })
}