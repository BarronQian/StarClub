import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

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

const ALLOWED_REASONS = [
  'fraud',
  'misleading',
  'rmt',
  'prohibited',
  'spam',
  'other',
] as const

export async function POST(
  request: NextRequest,
) {
  const supabase =
    getAdminSupabase()

  const authorization =
    request.headers.get(
      'authorization',
    )

  if (
    !authorization?.startsWith(
      'Bearer ',
    )
  ) {
    return NextResponse.json(
      {
        error:
          '请先登录后举报交易',
      },
      {
        status: 401,
      },
    )
  }

  const accessToken =
    authorization.slice(7)

  const {
    data: {
      user,
    },
    error: userError,
  } =
    await supabase.auth.getUser(
      accessToken,
    )

  if (
    userError ||
    !user
  ) {
    return NextResponse.json(
      {
        error:
          '登录状态已失效',
      },
      {
        status: 401,
      },
    )
  }

  let body: {
    listingId?: unknown
    reason?: unknown
    details?: unknown
    evidenceUrl?: unknown
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

  const listingId =
    typeof body.listingId ===
    'string'
      ? body.listingId.trim()
      : ''

  const reason =
    typeof body.reason ===
    'string'
      ? body.reason.trim()
      : ''

  const details =
    typeof body.details ===
    'string'
      ? body.details.trim()
      : ''

  const evidenceUrl =
    typeof body.evidenceUrl ===
    'string'
      ? body.evidenceUrl.trim()
      : ''

  if (!listingId) {
    return NextResponse.json(
      {
        error:
          '缺少交易 ID',
      },
      {
        status: 400,
      },
    )
  }

  if (
    !ALLOWED_REASONS.includes(
      reason as
        (typeof ALLOWED_REASONS)[number],
    )
  ) {
    return NextResponse.json(
      {
        error:
          '请选择有效的举报原因',
      },
      {
        status: 400,
      },
    )
  }

  if (
    details.length >
    1500
  ) {
    return NextResponse.json(
      {
        error:
          '补充说明不能超过 1500 个字符',
      },
      {
        status: 400,
      },
    )
  }

  if (
    evidenceUrl.length >
    2000
  ) {
    return NextResponse.json(
      {
        error:
          '证据图片地址无效',
      },
      {
        status: 400,
      },
    )
  }

  if (evidenceUrl) {
    try {
      const url =
        new URL(
          evidenceUrl,
        )

      if (
        url.protocol !==
        'https:'
      ) {
        throw new Error()
      }
    } catch {
      return NextResponse.json(
        {
          error:
            '证据图片地址无效',
        },
        {
          status: 400,
        },
      )
    }
  }

  const {
    data: listing,
    error: listingError,
  } =
    await supabase
      .from(
        'market_listings',
      )
      .select(`
        id,
        seller_id,
        deleted_at
      `)
      .eq(
        'id',
        listingId,
      )
      .maybeSingle()

  if (
    listingError ||
    !listing ||
    listing.deleted_at
  ) {
    return NextResponse.json(
      {
        error:
          '交易不存在或已被删除',
      },
      {
        status: 404,
      },
    )
  }

  if (
    listing.seller_id ===
    user.id
  ) {
    return NextResponse.json(
      {
        error:
          '不能举报自己发布的交易',
      },
      {
        status: 400,
      },
    )
  }

  const {
    data: reporterProfile,
    error: reporterError,
  } =
    await supabase
      .from('profiles')
      .select(`
        id,
        banned_at
      `)
      .eq(
        'id',
        user.id,
      )
      .maybeSingle()

  if (
    reporterError ||
    !reporterProfile
  ) {
    return NextResponse.json(
      {
        error:
          '读取用户资料失败',
      },
      {
        status: 500,
      },
    )
  }

  if (
    reporterProfile.banned_at
  ) {
    return NextResponse.json(
      {
        error:
          '当前账号无法提交举报',
      },
      {
        status: 403,
      },
    )
  }

  const {
    data: existingReport,
    error: existingError,
  } =
    await supabase
      .from(
        'market_reports',
      )
      .select('id')
      .eq(
        'listing_id',
        listingId,
      )
      .eq(
        'reporter_id',
        user.id,
      )
      .maybeSingle()

  if (existingError) {
    console.error(
      '[MARKET REPORT] Duplicate check failed:',
      existingError,
    )

    return NextResponse.json(
      {
        error:
          '检查举报记录失败',
      },
      {
        status: 500,
      },
    )
  }

  if (existingReport) {
    return NextResponse.json(
      {
        error:
          '你已经举报过这条交易',
      },
      {
        status: 409,
      },
    )
  }

  const {
    data: report,
    error: insertError,
  } =
    await supabase
      .from(
        'market_reports',
      )
      .insert({
        listing_id:
          listing.id,

        reporter_id:
          user.id,

        reported_user_id:
          listing.seller_id,

        reason,

        details:
          details || null,

        evidence_url:
          evidenceUrl || null,

        status:
          'pending',
      })
      .select(`
        id,
        status,
        evidence_url,
        created_at
      `)
      .single()

  if (insertError) {
    if (
      insertError.code ===
      '23505'
    ) {
      return NextResponse.json(
        {
          error:
            '你已经举报过这条交易',
        },
        {
          status: 409,
        },
      )
    }

    console.error(
      '[MARKET REPORT] Failed to create report:',
      insertError,
    )

    return NextResponse.json(
      {
        error:
          '提交举报失败',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json(
    {
      ok: true,
      report,
    },
    {
      status: 201,
    },
  )
}