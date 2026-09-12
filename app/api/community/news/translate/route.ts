import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { translateScNews } from '@/lib/sc-news-translation'

function getAdminSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      'Missing Supabase server environment variables'
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
    }
  )
}

export async function POST() {
  try {
    const supabase =
      getAdminSupabase()

    /*
      只找还没翻译好的资讯。

      title_zh 为空
      或 summary_original 有内容
      但 summary_zh 为空。
    */
    const {
      data: news,
      error:
        newsError,
    } = await supabase
      .from('sc_news')
      .select(`
        id,
        title_original,
        title_zh,
        summary_original,
        summary_zh,
        published_at
      `)
      .order(
        'published_at',
        {
          ascending: false,
        }
      )
      .limit(20)

    if (newsError) {
      throw newsError
    }

    const pending =
      (news ?? []).filter(
        (item) => {
          const missingTitle =
            !item.title_zh

          const missingSummary =
            Boolean(
              item.summary_original
            ) &&
            !item.summary_zh

          return (
            missingTitle ||
            missingSummary
          )
        }
      )

    if (
      pending.length === 0
    ) {
      return NextResponse.json({
        success: true,
        found: 0,
        translated: 0,
        failed: 0,
        message:
          '没有需要翻译的资讯',
      })
    }

    let translated = 0
    let failed = 0

    const results:
      Array<{
        title: string
        success: boolean
      }> = []

    /*
      顺序翻译。
      当前只有十几篇，
      不需要并发轰 OpenAI。
    */
    for (
      const item of pending
    ) {
      try {
        const translation =
          await translateScNews(
            item.title_original,
            item.summary_original
          )

        const {
          error:
            updateError,
        } = await supabase
          .from('sc_news')
          .update({
            title_zh:
              translation.title_zh,

            summary_zh:
              translation.summary_zh,
          })
          .eq(
            'id',
            item.id
          )

        if (updateError) {
          throw updateError
        }

        translated += 1

        results.push({
          title:
            item.title_original,

          success: true,
        })
      } catch (error) {
        console.error(
          `Failed translating "${item.title_original}":`,
          error
        )

        failed += 1

        results.push({
          title:
            item.title_original,

          success: false,
        })
      }
    }

    return NextResponse.json({
      success: true,

      found:
        pending.length,

      translated,

      failed,

      results,
    })
  } catch (error) {
    console.error(
      'News translation error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '翻译资讯失败',
      },
      {
        status: 500,
      }
    )
  }
}