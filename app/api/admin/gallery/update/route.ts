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

  const id =
    Number(body?.id)

  if (
    !body ||
    !Number.isFinite(id)
  ) {
    return NextResponse.json(
      {
        error:
          '缺少作品 ID',
      },
      {
        status: 400,
      },
    )
  }

  const update:
    Record<string, unknown> =
    {}

  if (
    typeof body.caption ===
    'string'
  ) {
    const caption =
      body.caption.trim()

    if (!caption) {
      return NextResponse.json(
        {
          error:
            '标题不能为空',
        },
        {
          status: 400,
        },
      )
    }

    update.caption =
      caption
  }

  if (
    typeof body.author ===
    'string'
  ) {
    const author =
      cleanAuthor(
        body.author,
      )

    update.author =
      author || null
  }

  if (
    typeof body.author_url ===
    'string'
  ) {
    update.author_url =
      body.author_url
        .trim() || null
  }

  if (
    typeof body.alt ===
    'string'
  ) {
    update.alt =
      body.alt.trim() ||
      null
  }

  if (
    typeof body.category ===
    'string'
  ) {
    if (
      !VALID_CATEGORIES.includes(
        body.category as GalleryCategory,
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

    update.category =
      body.category
  }

  if (
    typeof body.published_at ===
      'string' &&
    body.published_at
  ) {
    update.published_at =
      body.published_at
  }

  if (
    body.wide !==
    undefined
  ) {
    update.wide =
      Boolean(
        body.wide,
      )
  }

  /*
   * 替换图片时，
   * src / width / height 一起提交，
   * 并重新计算 aspect_ratio。
   */
  if (
    typeof body.src ===
      'string' &&
    body.src
  ) {
    const width =
      Number(body.width)

    const height =
      Number(body.height)

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
            '新图片尺寸无效',
        },
        {
          status: 400,
        },
      )
    }

    update.src =
      body.src

    update.width =
      width

    update.height =
      height

    update.aspect_ratio =
      width / height
  }

  if (
    Object.keys(
      update,
    ).length === 0
  ) {
    return NextResponse.json(
      {
        error:
          '没有需要保存的修改',
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
    .update(update)
    .eq(
      'id',
      id,
    )
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
      '[v0] Gallery update error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '保存失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

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