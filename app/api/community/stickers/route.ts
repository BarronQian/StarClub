import {
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

export const dynamic =
  'force-dynamic'

function getSupabase() {
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

export async function GET() {
  try {
    const supabase =
      getSupabase()

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'community_stickers',
        )
        .select(`
          id,
          name,
          optimized_url,
          optimized_width,
          optimized_height
        `)
        .eq(
          'is_active',
          true,
        )
        .order(
          'sort_order',
          {
            ascending: true,
          },
        )
        .order(
          'created_at',
          {
            ascending: true,
          },
        )

    if (error) {
      console.error(
        '[COMMUNITY STICKERS] Load failed:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '读取表情包失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      stickers:
        data ?? [],
    })
  } catch (error) {
    console.error(
      '[COMMUNITY STICKERS] GET failed:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '读取表情包失败',
      },
      {
        status: 500,
      },
    )
  }
}