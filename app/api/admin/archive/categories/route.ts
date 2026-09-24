import {
  revalidatePath,
} from 'next/cache'

import {
  NextResponse,
  type NextRequest,
} from 'next/server'

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

/*
 * GET
 *
 * Archive 后台读取全部分类，
 * 包括未发布分类。
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
  } = await admin
    .from(
      'archive_categories',
    )
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
      '[Archive categories GET]',
      error,
    )

    return NextResponse.json(
      {
        error:
          '读取合影分类失败',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json({
    categories:
      data ?? [],
  })
}

/*
 * POST
 *
 * 新建 Archive Category
 */
export async function POST(
  request: NextRequest,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
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

  /*
   * 新分类默认排到最后。
   */
  const admin =
    createAdminClient()

  const {
    data: lastCategory,
  } = await admin
    .from(
      'archive_categories',
    )
    .select('sort_order')
    .order(
      'sort_order',
      {
        ascending: false,
      },
    )
    .limit(1)
    .maybeSingle()

  const nextSortOrder =
    (
      lastCategory
        ?.sort_order ?? -1
    ) + 1

  const {
    data,
    error,
  } = await admin
    .from(
      'archive_categories',
    )
    .insert({
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

      sort_order:
        nextSortOrder,

      is_published:
        isPublished,
    })
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
      '[Archive category create]',
      error,
    )

    /*
     * PostgreSQL unique violation：
     * slug 已经存在。
     */
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
          '创建合影分类失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  revalidatePath(
    '/archive',
  )

  return NextResponse.json({
    category: data,
  })
}