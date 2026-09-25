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

function cleanText(
  value: unknown,
) {
  return typeof value === 'string'
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
        is_published,
        created_at,
        updated_at
      `)
      .order(
        'category_id',
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

  if (error) {
    console.error(
      '[Archive albums GET]',
      error,
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

  return NextResponse.json({
    albums:
      data ?? [],
  })
}

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
   * 先确认目标 Category 存在。
   */
  const {
    data: category,
    error: categoryError,
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

  if (categoryError) {
    console.error(
      '[Archive album create] Category read failed:',
      categoryError,
    )

    return NextResponse.json(
      {
        error:
          '读取所属 Category 失败',
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
          '所属 Category 不存在',
      },
      {
        status: 404,
      },
    )
  }

  /*
   * Album 的排序只在自己的
   * Category 内计算。
   */
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
          ascending: false,
        },
      )
      .limit(1)
      .maybeSingle()

  if (orderError) {
    console.error(
      '[Archive album create] Sort order read failed:',
      orderError,
    )

    return NextResponse.json(
      {
        error:
          '读取 Album 排序失败',
      },
      {
        status: 500,
      },
    )
  }

  const nextSortOrder =
    typeof lastAlbum
      ?.sort_order ===
      'number'
      ? lastAlbum.sort_order +
        1
      : 0

  const {
    data: album,
    error: insertError,
  } =
    await admin
      .from(
        'archive_albums',
      )
      .insert({
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

  if (insertError) {
    console.error(
      '[Archive album create]',
      insertError,
    )

    if (
      insertError.code ===
      '23505'
    ) {
      return NextResponse.json(
        {
          error:
            '这个 Category 中已经存在相同 Slug 的 Album',
        },
        {
          status: 409,
        },
      )
    }

    if (
      insertError.code ===
      '23503'
    ) {
      return NextResponse.json(
        {
          error:
            '所属 Category 不存在',
        },
        {
          status: 400,
        },
      )
    }

    return NextResponse.json(
      {
        error:
          '创建 Album 失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  /*
   * 当前线上 Archive 还没有切到 DB，
   * 但现在先把未来会用到的路径一起刷新。
   */
  revalidatePath(
    '/archive',
  )

  revalidatePath(
    `/archive/${category.slug}`,
  )

  return NextResponse.json({
    album,
  })
}