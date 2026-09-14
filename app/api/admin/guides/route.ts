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

const ALLOWED_CATEGORIES = new Set([
  '萌新入门',
  'FPS单兵战斗',
  '飞船空战',
  '舰船武器组件',
  '单兵武器装备',
  '经济 / 赚钱',
  '探索 / 旅游',
  '沙盒活动',
  '限时活动',
  '维克洛商店',
  '舰船升级CCU',
  '其他',
])

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

  const rawSlug =
    typeof body.slug ===
    'string'
      ? body.slug
      : ''

  const slug =
    normalizeSlug(rawSlug)

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
          .filter(Boolean)
      : []

  const original =
    body.original === true

  const published = true

  const featured =
    body.featured === true

  const publishedAt =
    new Date().toISOString()

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
        error: '请填写有效的 slug',
      },
      {
        status: 400,
      },
    )
  }

  if (
    !category ||
    !ALLOWED_CATEGORIES.has(
      category,
    )
  ) {
    return NextResponse.json(
      {
        error: '攻略分类无效',
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
        error: '攻略类型无效',
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
    data: existing,
    error:
      existingError,
  } = await supabase
    .from('guides')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existingError) {
    console.error(
      '[ADMIN GUIDES] Failed to check slug:',
      existingError,
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

  if (existing) {
    return NextResponse.json(
      {
        error:
          '这个 slug 已经存在，请换一个',
      },
      {
        status: 409,
      },
    )
  }

  const {
    data: firstGuide,
    error: sortError,
  } = await supabase
    .from('guides')
    .select('sort_order')
    .order(
      'sort_order',
      {
        ascending: true,
      },
    )
    .limit(1)
    .maybeSingle()

  if (sortError) {
    console.error(
      '[ADMIN GUIDES] Failed to get guide order:',
      sortError,
    )

    return NextResponse.json(
      {
        error:
          '读取攻略排序时发生错误',
      },
      {
        status: 500,
      },
    )
  }

  const sortOrder =
    typeof firstGuide?.sort_order ===
    'number'
      ? firstGuide.sort_order - 10
      : 0

  const {
    data,
    error,
  } = await supabase
    .from('guides')
    .insert({
      slug,
      title,
      description:
        description ||
        null,
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
        videoUrl ||
        null,
      external_url:
        externalUrl ||
        null,
      original,
      published,
      featured,
      sort_order:
        sortOrder,
      published_at:
        publishedAt,
      seo_title:
        seoTitle ||
        null,
      seo_description:
        seoDescription ||
        null,
    })
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
      '[ADMIN GUIDES] Failed to create guide:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '创建攻略失败',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json(
    {
      ok: true,
      guide: data,
    },
    {
      status: 201,
    },
  )
}