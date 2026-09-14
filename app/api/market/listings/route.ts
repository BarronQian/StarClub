import {
  NextRequest,
  NextResponse,
} from 'next/server'
import {
  createClient,
} from '@supabase/supabase-js'
import {
  getMarketCategory,
  getMarketSubcategory,
} from '@/lib/market-categories'

export const dynamic =
  'force-dynamic'

const PAGE_SIZE = 72

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

export async function GET(
  request: NextRequest,
) {
  const supabase =
    getAdminSupabase()

  const searchParams =
    request.nextUrl.searchParams

  const listingType =
    searchParams.get(
      'listingType',
    )

  const category =
    searchParams.get(
      'category',
    )

  const subcategory =
    searchParams
      .get(
        'subcategory',
      )
      ?.trim()
      .toLowerCase()

  const armorPart =
    searchParams
      .get(
        'armorPart',
      )
      ?.trim()
      .toLowerCase()

  const armorWeight =
    searchParams
      .get(
        'armorWeight',
      )
      ?.trim()
      .toLowerCase()

  const search =
    searchParams
      .get('search')
      ?.trim()

  const mine =
    searchParams.get(
      'mine',
    ) === '1'

  const requestedPage =
    Number(
      searchParams.get(
        'page',
      ) ?? 1,
    )

  const page =
    Number.isSafeInteger(
      requestedPage,
    ) &&
    requestedPage > 0
      ? requestedPage
      : 1

  const from =
    (page - 1) *
    PAGE_SIZE

  const to =
    from +
    PAGE_SIZE -
    1

  const closedCutoff =
    new Date(
      Date.now() -
        7 *
          24 *
          60 *
          60 *
          1000,
    ).toISOString()

  let query =
    supabase
      .from(
        'market_listings',
      )
      .select(
        `
          id,
          seller_id,
          listing_type,
          category,
          subcategory,
          title,
          description,
          price_uec,
          quantity,
          quality,
          star_system,
          planetary_system,
          location_code,
          location,
          negotiable,
          offered_item,
          wanted_item,
          image_urls,
          status,
          created_at,
          updated_at,
          closed_at,
          profiles!market_listings_seller_fk (
            id,
            username,
            display_name,
            avatar_url,
            rsi_handle:star_citizen_handle,
            rsi_verified
          )
        `,
        {
          count: 'exact',
        },
      )
      .is(
        'deleted_at',
        null,
      )
    .order(
      'closed_at',
      {
        ascending: true,
        nullsFirst: true,
      },
    )
    .order(
      'created_at',
      {
        ascending: false,
      },
    )

  if (mine) {
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
            '请先登录后查看我的交易',
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

    query =
      query.eq(
        'seller_id',
        user.id,
      )
  } else {
    query =
      query.or(
        `closed_at.is.null,closed_at.gte.${closedCutoff}`,
      )
  }

  if (
    listingType &&
    [
      'wts',
      'wtb',
      'wtt',
    ].includes(
      listingType,
    )
  ) {
    query =
      query.eq(
        'listing_type',
        listingType,
      )
  }

  if (
    category &&
    category !== 'all'
  ) {
    query =
      query.eq(
        'category',
        category,
      )
  }

  const validArmorParts = [
    'undersuit',
    'helmet',
    'arms',
    'torso',
    'legs',
    'backpack',
    'other',
  ]

  const validArmorWeights = [
    'light',
    'medium',
    'heavy',
    'super-heavy',
  ]

  const safeArmorPart =
    armorPart &&
    validArmorParts.includes(
      armorPart,
    )
      ? armorPart
      : null

  const safeArmorWeight =
    armorWeight &&
    validArmorWeights.includes(
      armorWeight,
    )
      ? armorWeight
      : null

  if (
    category === 'armor'
  ) {
    if (
      subcategory &&
      subcategory !== 'all'
    ) {
      query =
        query.eq(
          'subcategory',
          subcategory,
        )
    } else if (
      safeArmorPart &&
      safeArmorWeight
    ) {
      query =
        query.eq(
          'subcategory',
          `${safeArmorPart}-${safeArmorWeight}`,
        )
    } else if (
      safeArmorPart
    ) {
      if (
        safeArmorPart ===
          'undersuit' ||
        safeArmorPart ===
          'other'
      ) {
        query =
          query.eq(
            'subcategory',
            safeArmorPart,
          )
      } else {
        query =
          query.like(
            'subcategory',
            `${safeArmorPart}-%`,
          )
      }
    } else if (
      safeArmorWeight
    ) {
      query =
        query.like(
          'subcategory',
          `%-${safeArmorWeight}`,
        )
    }
  } else if (
    subcategory &&
    subcategory !== 'all'
  ) {
    query =
      query.eq(
        'subcategory',
        subcategory,
      )
  }

  if (search) {
    query =
      query.ilike(
        'title',
        `%${search}%`,
      )
  }

  query =
    query.range(
      from,
      to,
    )

  const {
    data,
    error,
    count,
  } = await query

  if (error) {
    console.error(
      'Failed to load market listings:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '读取市场交易失败',
      },
      {
        status: 500,
      },
    )
  }

  const listings =
    data ?? []

  const total =
    count ?? 0

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total /
          PAGE_SIZE,
      ),
    )

  return NextResponse.json(
    {
      listings,
      page,
      pageSize:
        PAGE_SIZE,
      total,
      totalPages,
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
          '请先登录后发布交易',
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

  const userId =
    user.id

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from('profiles')
        .select(`
          id,
          banned_at,
          market_banned_at,
          rsi_handle:star_citizen_handle,
          rsi_verified
        `)
      .eq(
        'id',
        userId,
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

  if (
    !profile.rsi_verified ||
    !profile.rsi_handle
  ) {
    return NextResponse.json(
      {
        error:
          '请先完成 RSI Handle 认证后再发布交易',
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

  const listingType =
    String(
      body.listingType ??
        '',
    )
      .trim()
      .toLowerCase()

  const category =
    String(
      body.category ??
        '',
    )
      .trim()
      .toLowerCase()

  const subcategory =
    String(
      body.subcategory ??
        '',
    )
      .trim()
      .toLowerCase()

  const title =
    String(
      body.title ??
        '',
    ).trim()

  const description =
    String(
      body.description ??
        '',
    ).trim()

  const priceUec =
    body.priceUec ===
      null ||
    body.priceUec ===
      undefined ||
    body.priceUec ===
      ''
      ? null
      : Number(
          body.priceUec,
        )

  const quantity =
    Number(
      body.quantity ?? 1,
    )

  const quality =
    body.quality ===
      null ||
    body.quality ===
      undefined ||
    body.quality ===
      ''
      ? null
      : Number(
          body.quality,
        )

  const starSystem =
    String(
      body.starSystem ?? '',
    )
      .trim()
      .toLowerCase()

  const planetarySystem =
    String(
      body.planetarySystem ??
        '',
    )
      .trim()
      .toLowerCase()

  const locationCode =
    String(
      body.locationCode ??
        '',
    )
      .trim()
      .toLowerCase()

  const location =
    body.location
      ? String(
          body.location,
        ).trim()
      : null

  const negotiable =
    Boolean(
      body.negotiable,
    )

  const offeredItem =
    body.offeredItem
      ? String(
          body.offeredItem,
        ).trim()
      : null

  const wantedItem =
    body.wantedItem
      ? String(
          body.wantedItem,
        ).trim()
      : null

  const imageUrls =
    Array.isArray(
      body.imageUrls,
    )
      ? body.imageUrls
          .map(
            (
              value: unknown,
            ) =>
              String(
                value,
              ).trim(),
          )
          .filter(Boolean)
      : []

  if (
    ![
      'wts',
      'wtb',
      'wtt',
    ].includes(
      listingType,
    )
  ) {
    return NextResponse.json(
      {
        error:
          '交易类型无效',
      },
      {
        status: 400,
      },
    )
  }

const categoryDefinition =
  getMarketCategory(
    category,
  )

if (!categoryDefinition) {
  return NextResponse.json(
    {
      error:
        '商品分类无效',
    },
    {
      status: 400,
    },
  )
}

if (!subcategory) {
  return NextResponse.json(
    {
      error:
        '请选择二级分类',
    },
    {
      status: 400,
    },
  )
}

if (
  subcategory.length >
  80
) {
  return NextResponse.json(
    {
      error:
        '二级分类无效',
    },
    {
      status: 400,
    },
  )
}

const subcategoryDefinition =
  getMarketSubcategory(
    category,
    subcategory,
  )

if (!subcategoryDefinition) {
  return NextResponse.json(
    {
      error:
        '二级分类与商品分类不匹配',
    },
    {
      status: 400,
    },
  )
}

  if (
    title.length < 2 ||
    title.length > 120
  ) {
    return NextResponse.json(
      {
        error:
          '标题长度需为 2–120 个字符',
      },
      {
        status: 400,
      },
    )
  }

  if (
    description.length >
    3000
  ) {
    return NextResponse.json(
      {
        error:
          '描述不能超过 3000 个字符',
      },
      {
        status: 400,
      },
    )
  }

  if (
    !Number.isInteger(
      quantity,
    ) ||
    quantity <= 0
  ) {
    return NextResponse.json(
      {
        error:
          '数量必须为正整数',
      },
      {
        status: 400,
      },
    )
  }

  if (
    priceUec !== null &&
    (
      !Number.isSafeInteger(
        priceUec,
      ) ||
      priceUec < 0
    )
  ) {
    return NextResponse.json(
      {
        error:
          '价格必须为有效整数，且金额不能过大',
      },
      {
        status: 400,
      },
    )
  }

  if (
    quality !== null
  ) {
    if (
      !Number.isFinite(
        quality,
      ) ||
      quality < 0 ||
      quality > 1000
    ) {
      return NextResponse.json(
        {
          error:
            '品质必须在 0–1000 之间',
        },
        {
          status: 400,
        },
      )
    }
  }

  if (!starSystem) {
    return NextResponse.json(
      {
        error:
          '请选择交易所在星系',
      },
      {
        status: 400,
      },
    )
  }

  if (!planetarySystem) {
    return NextResponse.json(
      {
        error:
          '请选择交易区域',
      },
      {
        status: 400,
      },
    )
  }

  if (!locationCode) {
    return NextResponse.json(
      {
        error:
          '请选择交易地点',
      },
      {
        status: 400,
      },
    )
  }

  if (
    !location ||
    location.length > 120
  ) {
    return NextResponse.json(
      {
        error:
          '交易地点无效或过长',
      },
      {
        status: 400,
      },
    )
  }

  if (
    imageUrls.length > 4
  ) {
    return NextResponse.json(
      {
        error:
          '最多上传 4 张图片',
      },
      {
        status: 400,
      },
    )
  }

  const {
    data: listing,
    error: insertError,
  } =
    await supabase
      .from(
        'market_listings',
      )
      .insert({
        seller_id:
          userId,
        listing_type:
          listingType,
        category,
        subcategory,
        title,
        description,
        price_uec:
          priceUec,
        quantity,
        quality,
        star_system:
          starSystem,
        planetary_system:
          planetarySystem,
        location_code:
          locationCode,
        location,
        negotiable,
        offered_item:
          offeredItem,
        wanted_item:
          wantedItem,
        image_urls:
          imageUrls,
      })
      .select(`
        id,
        seller_id,
        listing_type,
        category,
        subcategory,
        title,
        description,
        price_uec,
        quantity,
        quality,
        star_system,
        planetary_system,
        location_code,
        location,
        negotiable,
        offered_item,
        wanted_item,
        image_urls,
        status,
        created_at,
        updated_at,
        closed_at
      `)
      .single()

  if (
    insertError ||
    !listing
  ) {
    console.error(
      'Failed to create market listing:',
      insertError,
    )

    return NextResponse.json(
      {
        error:
          '发布交易失败',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json(
    {
      listing,
    },
    {
      status: 201,
    },
  )
}