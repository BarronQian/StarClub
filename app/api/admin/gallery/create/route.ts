import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

import type { GalleryCategory } from '@/lib/gallery'

const VALID_CATEGORIES: GalleryCategory[] = [
  'landscape',
  'ship',
  'portrait',
  'event',
  'combat',
  'racing',
  'fun',
  'art',
  'other',
]

function cleanAuthor(value: string) {
  return value
    .trim()
    .replace(/^@+/, '')
    .trim()
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
          '请求格式错误',
      },
      {
        status: 400,
      },
    )
  }

  const src =
    typeof body.src ===
    'string'
      ? body.src.trim()
      : ''

  const caption =
    typeof body.caption ===
    'string'
      ? body.caption.trim()
      : ''

  const rawAuthor =
    typeof body.author ===
    'string'
      ? body.author
      : ''

  const author =
    cleanAuthor(
      rawAuthor,
    )

  const authorUrl =
    typeof body.author_url ===
      'string' &&
    body.author_url.trim()
      ? body.author_url.trim()
      : null

  const category =
    body.category as GalleryCategory

  const width =
    Number(body.width)

  const height =
    Number(body.height)

  const alt =
    typeof body.alt ===
      'string' &&
    body.alt.trim()
      ? body.alt.trim()
      : caption

  const publishedAt =
    typeof body.published_at ===
      'string' &&
    body.published_at
      ? body.published_at
      : new Date()
          .toISOString()
          .slice(
            0,
            10,
          )

  const wide =
    Boolean(body.wide)

  if (!src) {
    return NextResponse.json(
      {
        error:
          '缺少图片地址',
      },
      {
        status: 400,
      },
    )
  }

  if (!caption) {
    return NextResponse.json(
      {
        error:
          '请填写作品标题',
      },
      {
        status: 400,
      },
    )
  }

  if (
    !VALID_CATEGORIES.includes(
      category,
    )
  ) {
    return NextResponse.json(
      {
        error:
          '分类无效',
      },
      {
        status: 400,
      },
    )
  }

  if (
    !Number.isFinite(
      width,
    ) ||
    !Number.isFinite(
      height,
    ) ||
    width <= 0 ||
    height <= 0
  ) {
    return NextResponse.json(
      {
        error:
          '图片尺寸无效',
      },
      {
        status: 400,
      },
    )
  }

  const admin =
    createAdminClient()

  const {
    data,
    error,
  } = await admin
    .from('gallery')
    .insert({
      src,
      alt,
      caption,

      author:
        author || null,

      author_url:
        authorUrl,

      category,

      width,

      height,

      aspect_ratio:
        width /
        height,

      published_at:
        publishedAt,

      // 旧字段保留为 0，
      // 真实点赞来自 gallery_likes
      likes: 0,

      wide,
    })
    .select(
      `
        id,
        src,
        alt,
        caption,
        author,
        author_url,
        profile_id,
        category,
        width,
        height,
        aspect_ratio,
        published_at,
        wide
      `,
    )
    .single()

if (
  error ||
  !data
) {
  console.error(
    '[v0] Gallery create error:',
    error,
  )

  return NextResponse.json(
    {
      error:
        '发布失败，请重试',
    },
    {
      status: 500,
    },
  )
}

revalidatePath('/gallery')
revalidatePath('/')

return NextResponse.json({
    shot: {
      id:
        data.id,

      src:
        data.src,

      alt:
        data.alt ??
        data.caption,

      caption:
        data.caption,

      author:
        data.author ??
        '未知作者',

      authorUrl:
        data.author_url ??
        undefined,

      profileId:
        data.profile_id ??
        undefined,

      category:
        data.category,

      width:
        data.width,

      height:
        data.height,

      aspectRatio:
        data.aspect_ratio ??
        data.width /
          data.height,

      publishedAt:
        data.published_at,

      likes: 0,

      wide:
        data.wide ??
        false,
    },
  })
}