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

function getAdminSupabase() {
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

type ReportAction =
  | 'dismiss'
  | 'resolve'
  | 'close_listing'
  | 'market_ban'

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string
    }>
  },
) {
  const adminSession =
    await getAdminSession()

  if (!adminSession) {
    return NextResponse.json(
      {
        error:
          '未登录或无管理员权限',
      },
      {
        status: 401,
      },
    )
  }

  const {
    id,
  } = await params

  const reportId =
    id?.trim()

  if (!reportId) {
    return NextResponse.json(
      {
        error:
          '缺少举报 ID',
      },
      {
        status: 400,
      },
    )
  }

  let body: {
    action?: unknown
    note?: unknown
    marketBanReason?: unknown
  }

  try {
    body =
      await request.json()
  } catch {
    return NextResponse.json(
      {
        error:
          '请求内容格式错误',
      },
      {
        status: 400,
      },
    )
  }

  const action =
    typeof body.action ===
    'string'
      ? body.action.trim()
      : ''

  const note =
    typeof body.note ===
    'string'
      ? body.note.trim()
      : ''

  const marketBanReason =
    typeof body.marketBanReason ===
    'string'
      ? body.marketBanReason.trim()
      : ''

  const allowedActions:
    ReportAction[] = [
      'dismiss',
      'resolve',
      'close_listing',
      'market_ban',
    ]

  if (
    !allowedActions.includes(
      action as ReportAction,
    )
  ) {
    return NextResponse.json(
      {
        error:
          '无效的举报处理操作',
      },
      {
        status: 400,
      },
    )
  }

  if (
    note.length >
    2000
  ) {
    return NextResponse.json(
      {
        error:
          '处理备注不能超过 2000 个字符',
      },
      {
        status: 400,
      },
    )
  }

  if (
    marketBanReason.length >
    1000
  ) {
    return NextResponse.json(
      {
        error:
          '市场封禁原因不能超过 1000 个字符',
      },
      {
        status: 400,
      },
    )
  }

  const supabase =
    getAdminSupabase()

  const {
    data: report,
    error: reportError,
  } =
    await supabase
      .from(
        'market_reports',
      )
      .select(`
        id,
        listing_id,
        reported_user_id,
        status
      `)
      .eq(
        'id',
        reportId,
      )
      .maybeSingle()

  if (
    reportError ||
    !report
  ) {
    return NextResponse.json(
      {
        error:
          '举报不存在',
      },
      {
        status: 404,
      },
    )
  }

  const handledAt =
    new Date().toISOString()

  if (
    action ===
    'dismiss'
  ) {
    const {
      error,
    } =
      await supabase
        .from(
          'market_reports',
        )
        .update({
          status:
            'dismissed',

          resolution_note:
            note || null,

          handled_at:
            handledAt,

          updated_at:
            handledAt,
        })
        .eq(
          'id',
          reportId,
        )

    if (error) {
      console.error(
        '[ADMIN MARKET REPORT] Dismiss failed:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '驳回举报失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
    })
  }

  if (
    action ===
    'resolve'
  ) {
    const {
      error,
    } =
      await supabase
        .from(
          'market_reports',
        )
        .update({
          status:
            'resolved',

          resolution_note:
            note || null,

          handled_at:
            handledAt,

          updated_at:
            handledAt,
        })
        .eq(
          'id',
          reportId,
        )

    if (error) {
      console.error(
        '[ADMIN MARKET REPORT] Resolve failed:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '标记举报已处理失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
    })
  }

  if (
    action ===
    'close_listing'
  ) {
    if (
      !report.listing_id
    ) {
      return NextResponse.json(
        {
          error:
            '该举报没有关联交易',
        },
        {
          status: 400,
        },
      )
    }

    const {
      error: listingError,
    } =
      await supabase
        .from(
          'market_listings',
        )
        .update({
          closed_at:
            handledAt,

          updated_at:
            handledAt,
        })
        .eq(
          'id',
          report.listing_id,
        )

    if (listingError) {
      console.error(
        '[ADMIN MARKET REPORT] Close listing failed:',
        listingError,
      )

      return NextResponse.json(
        {
          error:
            '强制下架交易失败',
        },
        {
          status: 500,
        },
      )
    }

    const {
      error: reportUpdateError,
    } =
      await supabase
        .from(
          'market_reports',
        )
        .update({
          status:
            'resolved',

          resolution_note:
            note ||
            '管理员已强制下架该交易',

          handled_at:
            handledAt,

          updated_at:
            handledAt,
        })
        .eq(
          'id',
          reportId,
        )

    if (
      reportUpdateError
    ) {
      console.error(
        '[ADMIN MARKET REPORT] Update report after closing listing failed:',
        reportUpdateError,
      )

      return NextResponse.json(
        {
          error:
            '交易已下架，但举报状态更新失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
    })
  }

  if (
    action ===
    'market_ban'
  ) {
    if (
      !report.reported_user_id
    ) {
      return NextResponse.json(
        {
          error:
            '该举报没有关联用户',
        },
        {
          status: 400,
        },
      )
    }

    const banReason =
      marketBanReason ||
      note ||
      '因市场举报被管理员限制市场功能'

    const {
      error: banError,
    } =
      await supabase
        .from('profiles')
        .update({
          market_banned_at:
            handledAt,

          market_ban_reason:
            banReason,
        })
        .eq(
          'id',
          report.reported_user_id,
        )

    if (banError) {
      console.error(
        '[ADMIN MARKET REPORT] Market ban failed:',
        banError,
      )

      return NextResponse.json(
        {
          error:
            '市场封禁失败',
        },
        {
          status: 500,
        },
      )
    }

      const {
        error:
          listingsError,
      } =
        await supabase
          .from(
            'market_listings',
          )
          .update({
            closed_at:
              handledAt,

            updated_at:
              handledAt,
          })
          .eq(
            'seller_id',
            report.reported_user_id,
          )
          .is(
            'closed_at',
            null,
          )
          .is(
            'deleted_at',
            null,
          )

      if (listingsError) {
        console.error(
          '[ADMIN MARKET REPORT] Close all listings after market ban failed:',
          listingsError,
        )
      }

    const {
      error:
        reportUpdateError,
    } =
      await supabase
        .from(
          'market_reports',
        )
        .update({
          status:
            'resolved',

          resolution_note:
            note ||
            '管理员已对被举报用户执行市场封禁',

          handled_at:
            handledAt,

          updated_at:
            handledAt,
        })
        .eq(
          'id',
          reportId,
        )

    if (
      reportUpdateError
    ) {
      console.error(
        '[ADMIN MARKET REPORT] Update report after market ban failed:',
        reportUpdateError,
      )

      return NextResponse.json(
        {
          error:
            '市场封禁成功，但举报状态更新失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
    })
  }

  return NextResponse.json(
    {
      error:
        '无法处理该操作',
    },
    {
      status: 400,
    },
  )
}