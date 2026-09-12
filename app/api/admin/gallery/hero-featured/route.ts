import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

type HeroFeaturedBody = {
  galleryId?: number
  heroFeatured?: boolean
}

export async function POST(
  request: NextRequest,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  let body: HeroFeaturedBody

  try {
    body =
      await request.json()
  } catch {
    return NextResponse.json(
      {
        error:
          '请求数据无效',
      },
      {
        status: 400,
      },
    )
  }

  const galleryId =
    Number(body.galleryId)

  if (
    !Number.isInteger(
      galleryId,
    ) ||
    galleryId <= 0
  ) {
    return NextResponse.json(
      {
        error:
          '作品 ID 无效',
      },
      {
        status: 400,
      },
    )
  }

  if (
    typeof body.heroFeatured !==
    'boolean'
  ) {
    return NextResponse.json(
      {
        error:
          'Hero 精选状态无效',
      },
      {
        status: 400,
      },
    )
  }

  const supabase =
    createAdminClient()

  const {
    data: existingShot,
    error: findError,
  } = await supabase
    .from('gallery')
    .select('id')
    .eq('id', galleryId)
    .maybeSingle()

  if (findError) {
    console.error(
      'Gallery hero featured lookup error:',
      findError,
    )

    return NextResponse.json(
      {
        error:
          '读取作品失败',
      },
      {
        status: 500,
      },
    )
  }

  if (!existingShot) {
    return NextResponse.json(
      {
        error:
          '作品不存在',
      },
      {
        status: 404,
      },
    )
  }

  const {
    data: updatedShot,
    error: updateError,
  } = await supabase
    .from('gallery')
    .update({
      hero_featured:
        body.heroFeatured,
    })
    .eq('id', galleryId)
    .select(
      'id, hero_featured',
    )
    .single()

  if (updateError) {
    console.error(
      'Gallery hero featured update error:',
      updateError,
    )

    return NextResponse.json(
      {
        error:
          '更新 Hero 精选状态失败',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json({
    ok: true,

    galleryId:
      updatedShot.id,

    heroFeatured:
      updatedShot.hero_featured,
  })
}