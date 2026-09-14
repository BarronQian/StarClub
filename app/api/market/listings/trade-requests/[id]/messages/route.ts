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

  const token =
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
      token,
    )

  if (
    error ||
    !user
  ) {
    return null
  }

  return user
}

async function getTradeForUser(
  tradeRequestId: string,
  userId: string,
) {
  const supabase =
    getAdminSupabase()

  const {
    data: tradeRequest,
    error,
  } = await supabase
    .from(
      'market_trade_requests',
    )
    .select(`
      id,
      listing_id,
      buyer_id,
      seller_id,
      quantity,
      offered_price_uec,
      preferred_location,
      preferred_time,
      message,
      status,
      created_at,
      updated_at,
      accepted_at,
      declined_at,
      cancelled_at,
      completed_at,

      cancelled_by,
      cancel_reason,
      buyer_completed_at,
      seller_completed_at,

      buyer_last_read_at,
      seller_last_read_at,

      market_listings!market_trade_requests_listing_fk (
        id,
        listing_type,
        title,
        price_uec,
        quantity,
        image_urls,
        location,
        status,
        closed_at
      ),

      buyer:profiles!market_trade_requests_buyer_fk (
        id,
        username,
        display_name,
        avatar_url,
        star_citizen_handle,
        rsi_verified,
        member_number,
        profile_slug
      ),

      seller:profiles!market_trade_requests_seller_fk (
        id,
        username,
        display_name,
        avatar_url,
        star_citizen_handle,
        rsi_verified,
        member_number,
        profile_slug
      )
    `)
    .eq(
      'id',
      tradeRequestId,
    )
    .maybeSingle()

  if (
    error ||
    !tradeRequest
  ) {
    console.error(
      'Failed to load trade request:',
      error,
    )

    return {
      tradeRequest: null,
      error:
        '交易不存在',
      status: 404,
    }
  }

  const isParticipant =
    tradeRequest.buyer_id ===
      userId ||
    tradeRequest.seller_id ===
      userId

  if (!isParticipant) {
    return {
      tradeRequest: null,
      error:
        '你无权查看这笔交易',
      status: 403,
    }
  }

  return {
    tradeRequest,
    error: null,
    status: 200,
  }
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  },
) {
  try {
    const user =
      await getCurrentUser(
        request,
      )

    if (!user) {
      return NextResponse.json(
        {
          error:
            '请先登录后查看交易会话',
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

    const access =
      await getTradeForUser(
        id,
        user.id,
      )

    if (
      !access.tradeRequest
    ) {
      return NextResponse.json(
        {
          error:
            access.error,
        },
        {
          status:
            access.status,
        },
      )
    }

    /*
     * pending / declined 没有正式进入交易会话。
     *
     * accepted:
     *   正常聊天。
     *
     * cancelled / completed:
     *   仍允许查看历史聊天，
     *   但 POST 会阻止发送新消息。
     */
    if (
      ![
        'accepted',
        'cancelled',
        'completed',
      ].includes(
        access.tradeRequest
          .status,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '交易被接受后才会建立交易会话',
        },
        {
          status: 403,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    const {
      data: messages,
      error,
    } = await supabase
      .from(
        'market_trade_messages',
      )
      .select(`
        id,
        trade_request_id,
        sender_id,
        content,
        created_at,
        edited_at,
        deleted_at,

        sender:profiles!market_trade_messages_sender_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          star_citizen_handle,
          rsi_verified,
          member_number,
          profile_slug
        )
      `)
      .eq(
        'trade_request_id',
        id,
      )
      .is(
        'deleted_at',
        null,
      )
      .order(
        'created_at',
        {
          ascending: true,
        },
      )

    if (error) {
      console.error(
        'Failed to load trade messages:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '读取交易消息失败',
        },
        {
          status: 500,
        },
      )
    }

    const readField =
      access.tradeRequest
        .buyer_id ===
      user.id
        ? 'buyer_last_read_at'
        : 'seller_last_read_at'

    const readAt =
      new Date().toISOString()

    const {
      error: readError,
    } = await supabase
      .from(
        'market_trade_requests',
      )
      .update({
        [readField]:
          readAt,
      })
      .eq(
        'id',
        access.tradeRequest.id,
      )

    if (readError) {
      console.error(
        'Failed to mark trade messages as read:',
        readError,
      )
    }

    /*
     * 把当前刚刚更新的已读时间
     * 一起返回给前端。
     */
    const tradeRequest = {
      ...access.tradeRequest,

      [readField]:
        readAt,
    }

    return NextResponse.json(
      {
        tradeRequest,

        messages:
          messages ?? [],
      },
      {
        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      },
    )
  } catch (error) {
    console.error(
      'Trade messages GET error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '读取交易消息失败',
      },
      {
        status: 500,
      },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  },
) {
  try {
    const user =
      await getCurrentUser(
        request,
      )

    if (!user) {
      return NextResponse.json(
        {
          error:
            '请先登录后操作交易会话',
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

    const access =
      await getTradeForUser(
        id,
        user.id,
      )

    if (
      !access.tradeRequest
    ) {
      return NextResponse.json(
        {
          error:
            access.error,
        },
        {
          status:
            access.status,
        },
      )
    }

    if (
      ![
        'accepted',
        'cancelled',
        'completed',
      ].includes(
        access.tradeRequest
          .status,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '当前交易没有可读取的交易会话',
        },
        {
          status: 403,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    const isBuyer =
      access.tradeRequest
        .buyer_id ===
      user.id

    const readAt =
      new Date().toISOString()

    const updateData =
      isBuyer
        ? {
            buyer_last_read_at:
              readAt,
          }
        : {
            seller_last_read_at:
              readAt,
          }

    const {
      data:
        updatedTradeRequest,
      error: updateError,
    } = await supabase
      .from(
        'market_trade_requests',
      )
      .update(
        updateData,
      )
      .eq(
        'id',
        id,
      )
      .select(`
        id,
        buyer_last_read_at,
        seller_last_read_at
      `)
      .single()

    if (
      updateError ||
      !updatedTradeRequest
    ) {
      console.error(
        'Failed to mark trade messages as read:',
        updateError,
      )

      return NextResponse.json(
        {
          error:
            '更新已读状态失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        success: true,

        read_at:
          readAt,

        tradeRequest:
          updatedTradeRequest,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      },
    )
  } catch (error) {
    console.error(
      'Trade messages PATCH error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '更新已读状态失败',
      },
      {
        status: 500,
      },
    )
  }
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  },
) {
  try {
    const user =
      await getCurrentUser(
        request,
      )

    if (!user) {
      return NextResponse.json(
        {
          error:
            '请先登录后发送消息',
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

    const access =
      await getTradeForUser(
        id,
        user.id,
      )

    if (
      !access.tradeRequest
    ) {
      return NextResponse.json(
        {
          error:
            access.error,
        },
        {
          status:
            access.status,
        },
      )
    }

    /*
     * 只有 accepted 状态可以继续发送消息。
     */
    if (
      access.tradeRequest
        .status !==
      'accepted'
    ) {
      const errorMessage =
        access.tradeRequest
          .status ===
        'cancelled'
          ? '这笔交易已经取消，交易会话已关闭'
          : access.tradeRequest
                .status ===
              'completed'
            ? '这笔交易已经完成，交易会话已关闭'
            : '交易申请被接受后才可以发送交易消息'

      return NextResponse.json(
        {
          error:
            errorMessage,
        },
        {
          status: 403,
        },
      )
    }

    let body: any

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

    const content =
      typeof body.content ===
      'string'
        ? body.content.trim()
        : ''

    if (!content) {
      return NextResponse.json(
        {
          error:
            '消息不能为空',
        },
        {
          status: 400,
        },
      )
    }

    if (
      content.length >
      2000
    ) {
      return NextResponse.json(
        {
          error:
            '消息最多 2000 个字符',
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
    } = await supabase
      .from('profiles')
      .select(`
        id,
        banned_at,
        rsi_verified,
        star_citizen_handle
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
            '无法读取社区资料',
        },
        {
          status: 403,
        },
      )
    }

    if (
      profile.banned_at
    ) {
      return NextResponse.json(
        {
          error:
            '当前账号无法使用交易会话',
        },
        {
          status: 403,
        },
      )
    }

    if (
      !profile.rsi_verified ||
      !profile.star_citizen_handle
    ) {
      return NextResponse.json(
        {
          error:
            '完成 RSI Handle 认证后才可以发送交易消息',
        },
        {
          status: 403,
        },
      )
    }

    const {
      data: message,
      error: insertError,
    } = await supabase
      .from(
        'market_trade_messages',
      )
      .insert({
        trade_request_id:
          id,

        sender_id:
          profile.id,

        content,
      })
      .select(`
        id,
        trade_request_id,
        sender_id,
        content,
        created_at,
        edited_at,
        deleted_at,

        sender:profiles!market_trade_messages_sender_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          star_citizen_handle,
          rsi_verified,
          member_number,
          profile_slug
        )
      `)
      .single()

    if (
      insertError ||
      !message
    ) {
      console.error(
        'Failed to send trade message:',
        insertError,
      )

      return NextResponse.json(
        {
          error:
            '发送消息失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        message,
      },
      {
        status: 201,
      },
    )
  } catch (error) {
    console.error(
      'Trade messages POST error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '发送消息失败',
      },
      {
        status: 500,
      },
    )
  }
}