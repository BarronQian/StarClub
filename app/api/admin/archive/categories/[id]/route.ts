import {
  NextResponse,
  type NextRequest,
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

const ARCHIVE_BUCKET =
  'archive'

function cleanText(
  value: unknown,
) {
  return typeof value ===
    'string'
    ? value.trim()
    : ''
}

function cleanOptionalUrl(
  value: unknown,
) {
  const cleaned =
    cleanText(value)

  return cleaned || null
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

function getStoragePath(
  url: string | null,
) {
  if (!url) {
    return null
  }

  try {
    const parsed =
      new URL(url)

    const markers = [
      `/storage/v1/object/public/${ARCHIVE_BUCKET}/`,
      `/storage/v1/object/sign/${ARCHIVE_BUCKET}/`,
    ]

    for (
      const marker of markers
    ) {
      const index =
        parsed.pathname.indexOf(
          marker,
        )

      if (index === -1) {
        continue
      }

      const path =
        parsed.pathname.slice(
          index +
            marker.length,
        )

      return decodeURIComponent(
        path,
      )
    }
  } catch {
    return null
  }

  return null
}

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/*
 * PATCH
 *
 * 编辑 Category：
 * - 名称
 * - Slug
 * - 英文名
 * - 简介
 * - Index
 * - 封面
 * - 发布 / 隐藏
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  const { id } =
    await context.params

  if (!id) {
    return NextResponse.json(
      {
        error:
          '缺少分类 ID',
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
          '请求格式错误',
      },
      {
        status: 400,
      },
    )
  }

  const slug =
    cleanSlug(body.slug)

  const indexLabel =
    cleanText(
      body.index_label,
    )

  const title =
    cleanText(body.title)

  const en =
    cleanText(body.en)

  const summary =
    cleanText(body.summary)

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
    body.is_published !== false

  if (!slug) {
    return NextResponse.json(
      {
        error:
          '请填写分类 Slug',
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
          '请填写分类名称',
      },
      {
        status: 400,
      },
    )
  }

  const admin =
    createAdminClient()

  /*
   * 先读取旧封面。
   *
   * 如果这次换了封面，
   * 更新数据库成功后再清理旧 Storage 文件。
   */
  const {
    data: existing,
    error: readError,
  } = await admin
    .from(
      'archive_categories',
    )
    .select(
      `
        id,
        slug,
        cover_original_url,
        cover_display_url,
        cover_thumbnail_url
      `,
    )
    .eq('id', id)
    .maybeSingle()

  if (readError) {
    console.error(
      '[Archive category PATCH] Read failed:',
      readError,
    )

    return NextResponse.json(
      {
        error:
          '读取分类失败，请重试',
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
          '分类不存在',
      },
      {
        status: 404,
      },
    )
  }

  const {
    data,
    error,
  } = await admin
    .from(
      'archive_categories',
    )
    .update({
      slug,
      index_label:
        indexLabel,
      title,
      en,
      summary,

      cover_original_url:
        coverOriginalUrl,

      cover_display_url:
        coverDisplayUrl,

      cover_thumbnail_url:
        coverThumbnailUrl,

      is_published:
        isPublished,
    })
    .eq('id', id)
    .select(
      `
        id,
        slug,
        index_label,
        title,
        en,
        summary,
        cover_original_url,
        cover_display_url,
        cover_thumbnail_url,
        sort_order,
        is_published,
        created_at,
        updated_at
      `,
    )
    .single()

  if (
    error ||
    !data
  ) {
    console.error(
      '[Archive category PATCH] Update failed:',
      error,
    )

    if (
      error?.code ===
      '23505'
    ) {
      return NextResponse.json(
        {
          error:
            '这个分类 Slug 已经存在',
        },
        {
          status: 409,
        },
      )
    }

    return NextResponse.json(
      {
        error:
          '保存分类失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  /*
   * 检查是否替换了封面。
   *
   * 只清理：
   * - 属于 archive bucket 的旧文件
   * - 并且已经不再被新 Category 使用
   *
   * 如果旧封面还是 /images/... 这种
   * 本地历史资源，
   * getStoragePath 会返回 null，
   * 不会误删。
   */
  const oldUrls = [
    existing
      .cover_original_url,
    existing
      .cover_display_url,
    existing
      .cover_thumbnail_url,
  ]

  const newUrls = new Set([
    coverOriginalUrl,
    coverDisplayUrl,
    coverThumbnailUrl,
  ])

  const oldStoragePaths =
    Array.from(
      new Set(
        oldUrls
          .filter(
            (
              url,
            ): url is string =>
              Boolean(url) &&
              !newUrls.has(url),
          )
          .map((url) =>
            getStoragePath(
              url,
            ),
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
    oldStoragePaths.length >
    0
  ) {
    const {
      error:
        storageError,
    } =
      await admin.storage
        .from(
          ARCHIVE_BUCKET,
        )
        .remove(
          oldStoragePaths,
        )

    if (storageError) {
      console.error(
        '[Archive category PATCH] Old cover cleanup failed:',
        storageError,
      )
    }
  }

  revalidatePath(
    '/archive',
  )

  revalidatePath(
    `/archive/${existing.slug}`,
  )

  revalidatePath(
    `/archive/${data.slug}`,
  )

  return NextResponse.json({
    category: data,
  })
}

/*
 * DELETE
 *
 * 删除 Category。
 *
 * 如果下面还有 Album，
 * 数据库的 ON DELETE RESTRICT
 * 会阻止删除。
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  const { id } =
    await context.params

  if (!id) {
    return NextResponse.json(
      {
        error:
          '缺少分类 ID',
      },
      {
        status: 400,
      },
    )
  }

  const admin =
    createAdminClient()

  const {
    data: category,
    error: readError,
  } = await admin
    .from(
      'archive_categories',
    )
    .select(
      `
        id,
        slug,
        cover_original_url,
        cover_display_url,
        cover_thumbnail_url
      `,
    )
    .eq('id', id)
    .maybeSingle()

  if (readError) {
    console.error(
      '[Archive category DELETE] Read failed:',
      readError,
    )

    return NextResponse.json(
      {
        error:
          '读取分类失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  if (!category) {
    return NextResponse.json(
      {
        error:
          '分类不存在',
      },
      {
        status: 404,
      },
    )
  }

  /*
   * 主动检查 Album。
   *
   * 虽然数据库本身已经有
   * ON DELETE RESTRICT，
   * 这里提前检查可以给后台
   * 更友好的中文提示。
   */
  const {
    count: albumCount,
    error: albumError,
  } = await admin
    .from(
      'archive_albums',
    )
    .select(
      'id',
      {
        count: 'exact',
        head: true,
      },
    )
    .eq(
      'category_id',
      id,
    )

  if (albumError) {
    console.error(
      '[Archive category DELETE] Album check failed:',
      albumError,
    )

    return NextResponse.json(
      {
        error:
          '检查分类内容失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  if (
    (albumCount ?? 0) >
    0
  ) {
    return NextResponse.json(
      {
        error:
          `该分类下还有 ${albumCount} 个合影 Album，请先移动或删除这些 Album。`,
      },
      {
        status: 409,
      },
    )
  }

  /*
   * 和 Gallery 一样：
   *
   * 先删除数据库。
   * 成功以后才清理 Storage。
   */
  const {
    error: deleteError,
  } = await admin
    .from(
      'archive_categories',
    )
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error(
      '[Archive category DELETE] Database delete failed:',
      deleteError,
    )

    return NextResponse.json(
      {
        error:
          '删除分类失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  const storagePaths =
    Array.from(
      new Set(
        [
          category
            .cover_original_url,
          category
            .cover_display_url,
          category
            .cover_thumbnail_url,
        ]
          .map((url) =>
            getStoragePath(
              url,
            ),
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
    storagePaths.length >
    0
  ) {
    const {
      error:
        storageError,
    } =
      await admin.storage
        .from(
          ARCHIVE_BUCKET,
        )
        .remove(
          storagePaths,
        )

    if (storageError) {
      console.error(
        '[Archive category DELETE] Storage cleanup failed:',
        storageError,
      )
    }
  }

  revalidatePath(
    '/archive',
  )

  revalidatePath(
    `/archive/${category.slug}`,
  )

  return NextResponse.json({
    ok: true,
  })
}