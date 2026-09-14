import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

import {
  getAdminSession,
} from '@/lib/admin-auth'

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
    return null
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

type OrderItem = {
  id: string
  sort_order: number
}

export async function PUT(
  request: NextRequest,
) {
  const session =
    await getAdminSession()

  if (!session) {
    return NextResponse.json(
      {
        error: '未登录或登录已失效',
      },
      {
        status: 401,
      },
    )
  }

  const supabase =
    getSupabase()

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          'Supabase 环境变量未配置',
      },
      {
        status: 500,
      },
    )
  }

  let body: {
    guides?: OrderItem[]
  }

  try {
    body =
      await request.json()
  } catch {
    return NextResponse.json(
      {
        error: '请求数据格式错误',
      },
      {
        status: 400,
      },
    )
  }

  const guides =
    body.guides

  if (
    !Array.isArray(guides) ||
    guides.length === 0
  ) {
    return NextResponse.json(
      {
        error:
          '没有可保存的攻略排序',
      },
      {
        status: 400,
      },
    )
  }

  for (const guide of guides) {
    if (
      !guide ||
      typeof guide.id !==
        'string' ||
      !guide.id ||
      typeof guide.sort_order !==
        'number' ||
      !Number.isFinite(
        guide.sort_order,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '攻略排序数据无效',
        },
        {
          status: 400,
        },
      )
    }
  }

  try {
    for (const guide of guides) {
      const {
        error,
      } = await supabase
        .from('guides')
        .update({
          sort_order:
            guide.sort_order,
        })
        .eq(
          'id',
          guide.id,
        )

      if (error) {
        console.error(
          '[ADMIN GUIDE ORDER] Update failed:',
          guide.id,
          error,
        )

        return NextResponse.json(
          {
            error:
              '保存攻略排序失败',
          },
          {
            status: 500,
          },
        )
      }
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(
      '[ADMIN GUIDE ORDER] Unexpected error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '保存攻略排序失败',
      },
      {
        status: 500,
      },
    )
  }
}