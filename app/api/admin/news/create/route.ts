import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  
const auth = await requireAdminApi()

if (auth.response) {
  return auth.response
}

  try {
    const body = await request.json()

    const title =
      typeof body.title === 'string'
        ? body.title.trim()
        : ''

    const summary =
      typeof body.summary === 'string'
        ? body.summary.trim()
        : ''

    const source =
      typeof body.source === 'string'
        ? body.source.trim()
        : 'RSI'

    const sourceUrl =
      typeof body.sourceUrl === 'string'
        ? body.sourceUrl.trim()
        : ''

    const imageUrl =
      typeof body.imageUrl === 'string'
        ? body.imageUrl.trim()
        : ''

    const publishedAt =
      typeof body.publishedAt === 'string'
        ? body.publishedAt.trim()
        : ''

    if (
      !title ||
      !summary ||
      !source ||
      !sourceUrl ||
      !publishedAt
    ) {
      return NextResponse.json(
        {
          error: '请填写所有必填项目',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      createAdminClient()

    const { data, error } =
      await supabase
        .from('sc_news')
        .insert({
          source,

          // 手动发布的资讯直接以中文版为主。
          // 原文字段同步保存相同内容，
          // 保持与现有 Community News 数据结构兼容。
          title_original: title,
          title_zh: title,

          summary_original: summary,
          summary_zh: summary,

          source_url: sourceUrl,

          image_url:
            imageUrl || null,

          published_at:
            publishedAt,
        })
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

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      news: data,
    })
  } catch (error) {
    console.error(
      '[v0] News create error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '发布资讯失败',
      },
      {
        status: 500,
      },
    )
  }
}