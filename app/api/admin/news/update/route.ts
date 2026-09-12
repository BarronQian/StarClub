import { NextResponse, type NextRequest } from 'next/server'

import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

const VALID_SOURCES = [
  'RSI',
  'Spectrum',
  'CIG',
  'YouTube',
  'Other',
] as const

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  const body = await request.json().catch(() => null)

  const id = Number(body?.id)

  if (!body || !Number.isFinite(id)) {
    return NextResponse.json(
      { error: '缺少资讯 ID' },
      { status: 400 },
    )
  }

  const update: Record<string, unknown> = {}

  if (typeof body.title === 'string') {
    const title = body.title.trim()

    if (!title) {
      return NextResponse.json(
        { error: '标题不能为空' },
        { status: 400 },
      )
    }

    update.title_original = title
    update.title_zh = title
  }

  if (typeof body.summary === 'string') {
    const summary = body.summary.trim()

    if (!summary) {
      return NextResponse.json(
        { error: '资讯内容不能为空' },
        { status: 400 },
      )
    }

    update.summary_original = summary
    update.summary_zh = summary
  }

  if (typeof body.source === 'string') {
    const source = body.source.trim()

    if (
      !VALID_SOURCES.includes(
        source as (typeof VALID_SOURCES)[number],
      )
    ) {
      return NextResponse.json(
        { error: '资讯来源无效' },
        { status: 400 },
      )
    }

    update.source = source
  }

  if (typeof body.sourceUrl === 'string') {
    const sourceUrl = body.sourceUrl.trim()

    if (!sourceUrl) {
      return NextResponse.json(
        { error: '原文链接不能为空' },
        { status: 400 },
      )
    }

    update.source_url = sourceUrl
  }

  if (
    typeof body.publishedAt === 'string' &&
    body.publishedAt
  ) {
    update.published_at = body.publishedAt
  }

  if (body.imageUrl !== undefined) {
    if (
      body.imageUrl === null ||
      body.imageUrl === ''
    ) {
      update.image_url = null
    } else if (typeof body.imageUrl === 'string') {
      update.image_url = body.imageUrl.trim() || null
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: '没有需要保存的修改' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('sc_news')
    .update(update)
    .eq('id', id)
    .select(`
      id,
      source,
      title_original,
      title_zh,
      summary_original,
      summary_zh,
      source_url,
      image_url,
      published_at
    `)
    .single()

  if (error || !data) {
    console.error(
      '[v0] News update error:',
      error,
    )

    return NextResponse.json(
      { error: '保存失败，请重试' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    news: data,
  })
}