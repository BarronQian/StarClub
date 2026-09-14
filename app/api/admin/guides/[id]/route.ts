import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

import {
  requireAdminApi,
} from '@/lib/admin-auth'

function getAdminSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      'Missing Supabase server environment variables',
    )
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

function normalizeSlug(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(
      /[^a-z0-9-_]/g,
      '',
    )
    .replace(/-+/g, '-')
    .replace(
      /^-+|-+$/g,
      '',
    )
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
  } = await context.params

  if (!id) {
    return NextResponse.json(
      {
        error: '攻略 ID 无效',
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
        error: '请求格式无效',
      },
      {
        status: 400,
      },
    )
  }

  const title =
    typeof body.title ===
    'string'
      ? body.title.trim()
      : ''

  const slug =
    normalizeSlug(
      typeof body.slug ===
        'string'
        ? body.slug
        : '',
    )

  const description =
    typeof body.description ===
    'string'
      ? body.description.trim()
      : ''

  const category =
    typeof body.category ===
    'string'
      ? body.category.trim()
      : ''

  const type =
    typeof body.type ===
    'string'
      ? body.type.trim()
      : 'article'

  const image =
    typeof body.image ===
    'string'
      ? body.image.trim()
      : ''

  const author =
    typeof body.author ===
    'string'
      ? body.author.trim()
      : ''

  const creator =
    typeof body.creator ===
    'string'
      ? body.creator.trim()
      : ''

  const videoUrl =
    typeof body.video_url ===
    'string'
      ? body.video_url.trim()
      : ''
  const externalUrl =
  typeof body.external_url ===
  'string'
    ? body.external_url.trim()
    : ''

  const seoTitle =
    typeof body.seo_title ===
    'string'
      ? body.seo_title.trim()
      : ''

  const seoDescription =
    typeof body.seo_description ===
    'string'
      ? body.seo_description.trim()
      : ''

  const tags: string[] =
    Array.isArray(body.tags)
      ? body.tags
          .filter(
            (
              tag: unknown,
            ): tag is string =>
              typeof tag ===
              'string',
          )
          .map(
            (tag: string) =>
              tag.trim(),
          )
          .filter(
            (tag: string) =>
              tag.length > 0,
          )
      : []

  const original =
    body.original === true

  const featured =
    body.featured === true

  if (!title) {
    return NextResponse.json(
      {
        error: '请填写攻略标题',
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
          '请填写有效的 slug',
      },
      {
        status: 400,
      },
    )
  }

  if (!category) {
    return NextResponse.json(
      {
        error:
          '请选择攻略分类',
      },
      {
        status: 400,
      },
    )
  }

  const allowedTypes = [
    'article',
    'video',
    'external',
  ]

  if (
    !allowedTypes.includes(
      type,
    )
  ) {
    return NextResponse.json(
      {
        error:
          '攻略类型无效',
      },
      {
        status: 400,
      },
    )
  }

  if (
    type === 'video' &&
    !videoUrl
  ) {
    return NextResponse.json(
      {
        error:
          '视频攻略需要填写视频链接',
      },
      {
        status: 400,
      },
    )
  }

  if (
  type === 'external' &&
  !externalUrl
) {
  return NextResponse.json(
    {
      error:
        '外部攻略需要填写外部链接',
    },
    {
      status: 400,
    },
  )
}

  const supabase =
    getAdminSupabase()

  const {
    data: currentGuide,
    error: currentError,
  } = await supabase
    .from('guides')
    .select(
      'id, published_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (
    currentError ||
    !currentGuide
  ) {
    return NextResponse.json(
      {
        error:
          '没有找到这篇攻略',
      },
      {
        status: 404,
      },
    )
  }

  const publishedAt =
    currentGuide.published_at ??
    new Date().toISOString()

  const {
    data: duplicateSlug,
    error:
      duplicateSlugError,
  } = await supabase
    .from('guides')
    .select('id')
    .eq('slug', slug)
    .neq('id', id)
    .maybeSingle()

  if (duplicateSlugError) {
    console.error(
      '[ADMIN GUIDES] Slug check failed:',
      duplicateSlugError,
    )

    return NextResponse.json(
      {
        error:
          '检查 slug 时发生错误',
      },
      {
        status: 500,
      },
    )
  }

  if (duplicateSlug) {
    return NextResponse.json(
      {
        error:
          '这个 slug 已经被其他攻略使用',
      },
      {
        status: 409,
      },
    )
  }

  const {
    data,
    error,
  } = await supabase
    .from('guides')
    .update({
      slug,
      title,
      description:
        description || null,
      category,
      tags,
      type,
      image:
        image || null,
      author:
        author || null,
      creator:
        creator || null,
      video_url:
        videoUrl || null,
      external_url:
        externalUrl || null,
      original,
      published: true,
      featured,
      published_at:
        publishedAt,
      seo_title:
        seoTitle || null,
      seo_description:
        seoDescription ||
        null,
    })
    .eq('id', id)
    .select(`
      id,
      slug,
      title
    `)
    .single()

  if (
    error ||
    !data
  ) {
    console.error(
      '[ADMIN GUIDES] Update failed:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '保存攻略失败',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json({
    ok: true,
    guide: data,
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

  try {
    const {
      id,
    } = await context.params

    const supabase =
      getAdminSupabase()

    const {
      data: guide,
      error: guideError,
    } = await supabase
      .from('guides')
      .select(`
        id,
        title,
        slug
      `)
      .eq(
        'id',
        id,
      )
      .single()

    if (
      guideError ||
      !guide
    ) {
      return NextResponse.json(
        {
          error:
            '攻略不存在',
        },
        {
          status: 404,
        },
      )
    }

    const {
      error: deleteError,
    } = await supabase
      .from('guides')
      .delete()
      .eq(
        'id',
        id,
      )

    if (deleteError) {
      console.error(
        '[ADMIN GUIDES] Delete failed:',
        deleteError,
      )

      return NextResponse.json(
        {
          error:
            '删除攻略失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,

      deleted: {
        id:
          guide.id,

        title:
          guide.title,

        slug:
          guide.slug,
      },
    })
  } catch (error) {
    console.error(
      '[ADMIN GUIDES] DELETE failed:',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '删除攻略失败',
      },
      {
        status: 500,
      },
    )
  }
}