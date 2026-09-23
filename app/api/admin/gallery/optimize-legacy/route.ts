import {
  NextResponse,
  type NextRequest,
} from 'next/server'
import { revalidatePath } from 'next/cache'

import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

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

  const originalUrl =
    typeof body?.original_url === 'string'
      ? body.original_url.trim()
      : ''

  const displayUrl =
    typeof body?.display_url === 'string'
      ? body.display_url.trim()
      : ''

  const thumbnailUrl =
    typeof body?.thumbnail_url === 'string'
      ? body.thumbnail_url.trim()
      : ''

  if (
    !Number.isFinite(id) ||
    !originalUrl ||
    !displayUrl ||
    !thumbnailUrl
  ) {
    return NextResponse.json(
      {
        error:
          '历史图片优化参数不完整',
      },
      {
        status: 400,
      },
    )
  }

  const admin =
    createAdminClient()

  /*
   * 先确认作品存在。
   */
  const {
    data: current,
    error: readError,
  } = await admin
    .from('gallery')
    .select(
      `
        id,
        src,
        original_url,
        display_url,
        thumbnail_url
      `,
    )
    .eq('id', id)
    .maybeSingle()

  if (readError) {
    console.error(
      '[Gallery legacy optimize] Read failed:',
      readError,
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

  if (!current) {
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

  /*
   * 如果已经是真正的新结构，
   * 不允许重复迁移。
   */
  const alreadyOptimized =
    current.thumbnail_url?.includes(
      '/thumbnail/',
    ) &&
    current.display_url?.includes(
      '/display/',
    )

  if (alreadyOptimized) {
    return NextResponse.json({
      ok: true,
      skipped: true,
    })
  }

  /*
   * 注意：
   * 不修改标题、作者、分类、日期、
   * 点赞、profile_id、wide、Hero 等资料。
   *
   * 只替换图片三层 URL。
   */
  const {
    error: updateError,
  } = await admin
    .from('gallery')
    .update({
      src: displayUrl,
      original_url:
        originalUrl,
      display_url:
        displayUrl,
      thumbnail_url:
        thumbnailUrl,
    })
    .eq('id', id)

  if (updateError) {
    console.error(
      '[Gallery legacy optimize] Update failed:',
      updateError,
    )

    return NextResponse.json(
      {
        error:
          '历史图片优化保存失败',
      },
      {
        status: 500,
      },
    )
  }

  revalidatePath('/gallery')
  revalidatePath('/')

  return NextResponse.json({
    ok: true,
    skipped: false,
  })
}