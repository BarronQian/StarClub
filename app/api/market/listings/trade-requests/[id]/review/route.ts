import {
  NextRequest,
  NextResponse,
} from 'next/server'
import {
  createClient,
} from '@supabase/supabase-js'

export const dynamic =
  'force-dynamic'

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

async function getCurrentUser(
  request: NextRequest,
) {
  const authorization =
    request.headers.get(
      'authorization',
    )

  if (
    !authorization?.startsWith(
      'Bearer ',
    )
  ) {
    return null
  }

  const accessToken =
    authorization.slice(7)

  const supabase =
    getAdminSupabase()

  const {
    data: {
      user,
    },
    error,
  } =
    await supabase.auth.getUser(
      accessToken,
    )

  if (
    error ||
    !user
  ) {
    return null
  }

  return user
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  },
) {
  const user =
    await getCurrentUser(
      request,
    )

  if (!user) {
    return NextResponse.json(
      {
        error:
          '请先登录后查看评分',
      },
      {
        status: 401,
      },
    )
  }

  const {
    id,
  } =
    await context.params

  const supabase =
    getAdminSupabase()

  const {
    data: trade,
    error: tradeError,
  } =
    await supabase
      .from(
        'market_trade_requests',
      )
      .select(`
        id,
        buyer_id,
        seller_id,
        status
      `)
      .eq(
        'id',
        id,
      )
      .maybeSingle()

  if (
    tradeError ||
    !trade
  ) {
    return NextResponse.json(
      {
        error:
          '该交易不存在',
      },
      {
        status: 404,
      },
    )
  }

  const isParticipant =
    user.id ===
      trade.buyer_id ||
    user.id ===
      trade.seller_id

  if (!isParticipant) {
    return NextResponse.json(
      {
        error:
          '你无权查看该交易评分',
      },
      {
        status: 403,
      },
    )
  }

  const {
    data: review,
    error: reviewError,
  } =
    await supabase
      .from(
        'market_trade_reviews',
      )
      .select(`
        id,
        rating,
        reviewer_id,
        reviewee_id,
        created_at
      `)
      .eq(
        'trade_request_id',
        id,
      )
      .eq(
        'reviewer_id',
        user.id,
      )
      .maybeSingle()

  if (reviewError) {
    console.error(
      'Failed to load market review:',
      reviewError,
    )

    return NextResponse.json(
      {
        error:
          '读取评分失败',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json(
    {
      review:
        review ?? null,
      canReview:
        trade.status ===
          'completed' &&
        !review,
    },
    {
      headers: {
        'Cache-Control':
          'no-store, max-age=0',
      },
    },
  )
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  },
) {
  const user =
    await getCurrentUser(
      request,
    )

  if (!user) {
    return NextResponse.json(
      {
        error:
          '请先登录后提交评分',
      },
      {
        status: 401,
      },
    )
  }

  const {
    id,
  } =
    await context.params

  let body: any = {}

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

  const rating =
    Number(
      body.rating,
    )

  if (
    !Number.isInteger(
      rating,
    ) ||
    rating < 1 ||
    rating > 5
  ) {
    return NextResponse.json(
      {
        error:
          '评分必须为 1–5 星',
      },
      {
        status: 400,
      },
    )
  }

    const supabase =
      getAdminSupabase()

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from('profiles')
        .select(`
          id,
          banned_at,
          market_banned_at
        `)
        .eq(
          'id',
          user.id,
        )
        .maybeSingle()

    if (
      profileError ||
      !profile
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
      profile.banned_at ||
      profile.market_banned_at
    ) {
      return NextResponse.json(
        {
          error:
            '当前账号已被限制使用市场功能',
        },
        {
          status: 403,
        },
      )
    }

    const {
      data: trade,
      error: tradeError,
    } =
    
    await supabase
      .from(
        'market_trade_requests',
      )
      .select(`
        id,
        buyer_id,
        seller_id,
        status
      `)
      .eq(
        'id',
        id,
      )
      .maybeSingle()

  if (
    tradeError
  ) {
    console.error(
      'Failed to load market trade for review:',
      tradeError,
    )

    return NextResponse.json(
      {
        error:
          '读取交易失败',
      },
      {
        status: 500,
      },
    )
  }

  if (!trade) {
    return NextResponse.json(
      {
        error:
          '该交易不存在',
      },
      {
        status: 404,
      },
    )
  }

  if (
    trade.status !==
    'completed'
  ) {
    return NextResponse.json(
      {
        error:
          '只有已完成的交易可以评分',
      },
      {
        status: 400,
      },
    )
  }

  const isBuyer =
    user.id ===
    trade.buyer_id

  const isSeller =
    user.id ===
    trade.seller_id

  if (
    !isBuyer &&
    !isSeller
  ) {
    return NextResponse.json(
      {
        error:
          '你无权评价该交易',
      },
      {
        status: 403,
      },
    )
  }

  const revieweeId =
    isBuyer
      ? trade.seller_id
      : trade.buyer_id

  if (
    revieweeId ===
    user.id
  ) {
    return NextResponse.json(
      {
        error:
          '不能评价自己',
      },
      {
        status: 400,
      },
    )
  }

  const {
    data:
      existingReview,
    error:
      existingReviewError,
  } =
    await supabase
      .from(
        'market_trade_reviews',
      )
      .select(
        'id, rating',
      )
      .eq(
        'trade_request_id',
        id,
      )
      .eq(
        'reviewer_id',
        user.id,
      )
      .maybeSingle()

  if (
    existingReviewError
  ) {
    console.error(
      'Failed to check existing market review:',
      existingReviewError,
    )

    return NextResponse.json(
      {
        error:
          '检查评分状态失败',
      },
      {
        status: 500,
      },
    )
  }

  if (
    existingReview
  ) {
    return NextResponse.json(
      {
        error:
          '你已经评价过这笔交易',
      },
      {
        status: 409,
      },
    )
  }

  const {
    data: review,
    error:
      insertError,
  } =
    await supabase
      .from(
        'market_trade_reviews',
      )
      .insert({
        trade_request_id:
          id,
        reviewer_id:
          user.id,
        reviewee_id:
          revieweeId,
        rating,
      })
      .select(`
        id,
        trade_request_id,
        reviewer_id,
        reviewee_id,
        rating,
        created_at
      `)
      .single()

  if (
    insertError ||
    !review
  ) {
    console.error(
      'Failed to create market review:',
      insertError,
    )

    const duplicate =
      insertError?.code ===
      '23505'

    return NextResponse.json(
      {
        error:
          duplicate
            ? '你已经评价过这笔交易'
            : '提交评分失败',
      },
      {
        status:
          duplicate
            ? 409
            : 500,
      },
    )
  }

  return NextResponse.json(
    {
      success: true,
      review,
    },
    {
      status: 201,
      headers: {
        'Cache-Control':
          'no-store, max-age=0',
      },
    },
  )
}