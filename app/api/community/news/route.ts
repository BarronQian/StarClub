import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

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

export async function GET() {
  try {
    const supabase =
      getAdminSupabase()

    const {
      data,
      error,
    } = await supabase
      .from('sc_news')
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
      .order(
        'published_at',
        {
          ascending: false,
        }
      )
      .limit(10)

    if (error) {
      throw error
    }

    const news =
      (data ?? []).map(
        (item) => ({
          id:
            item.id,

          source:
            item.source,

          title:
            item.title_zh ||
            item.title_original,

          summary:
            item.summary_zh ||
            item.summary_original,

          titleOriginal:
            item.title_original,

          sourceUrl:
            item.source_url,

          imageUrl:
            item.image_url,

          publishedAt:
            item.published_at,
        })
      )

    return NextResponse.json({
      success: true,
      news,
    })
  } catch (error) {
    console.error(
      'Community news error:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        news: [],
        error:
          'Failed to load community news',
      },
      {
        status: 500,
      }
    )
  }
}