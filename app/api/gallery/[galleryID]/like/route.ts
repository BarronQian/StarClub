import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { createClient } from '@supabase/supabase-js'

export const dynamic =
  'force-dynamic'

export const revalidate = 0

function getAdminSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      'Supabase server environment variables are missing',
    )
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    },
  )
}

function getGalleryId(
  request: NextRequest,
) {
  const pathname =
    request.nextUrl.pathname

  const match =
    pathname.match(
      /\/api\/gallery\/(\d+)\/like\/?$/,
    )

  return (
    match?.[1] ??
    null
  )
}

async function getAuthenticatedUser(
  request: NextRequest,
) {
  const authorization =
    request.headers.get(
      'authorization',
    )

  if (
    !authorization ||
    !authorization.startsWith(
      'Bearer ',
    )
  ) {
    return null
  }

  const accessToken =
    authorization.slice(
      7,
    )

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

/*
 * 获取作品当前点赞状态
 */
export async function GET(
  request: NextRequest,
) {
  try {
    const galleryId =
      getGalleryId(
        request,
      )

    if (!galleryId) {
      return NextResponse.json(
        {
          error:
            '作品 ID 无效',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    /*
     * 获取真实点赞总数
     */
    const {
      count,
      error:
        countError,
    } = await supabase
      .from(
        'gallery_likes',
      )
      .select('*', {
        count:
          'exact',

        head:
          true,
      })
      .eq(
        'gallery_id',
        Number(
          galleryId,
        ),
      )

    if (
      countError
    ) {
      throw countError
    }

    /*
     * 未登录用户也可以查看点赞数量。
     *
     * 如果登录，
     * 再查询当前用户是否点过赞。
     */
    const user =
      await getAuthenticatedUser(
        request,
      )

    let liked =
      false

    if (user) {
      const {
        data:
          existingLike,

        error:
          likeError,
      } = await supabase
        .from(
          'gallery_likes',
        )
        .select(
          'id',
        )
        .eq(
          'gallery_id',
          Number(
            galleryId,
          ),
        )
        .eq(
          'user_id',
          user.id,
        )
        .maybeSingle()

      if (
        likeError
      ) {
        throw likeError
      }

      liked =
        Boolean(
          existingLike,
        )
    }

    return NextResponse.json({
      success:
        true,

      liked,

      likeCount:
        count ?? 0,
    })
  } catch (
    error
  ) {
    console.error(
      'Failed to load gallery like state:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '读取点赞失败',
      },
      {
        status: 500,
      },
    )
  }
}

/*
 * 点赞 / 取消点赞
 */
export async function POST(
  request: NextRequest,
) {
  try {
    /*
     * 先读取 URL 中的真实作品 ID。
     */
    const galleryId =
      getGalleryId(
        request,
      )

    if (!galleryId) {
      return NextResponse.json(
        {
          error:
            '作品 ID 无效',
        },
        {
          status: 400,
        },
      )
    }

    const numericGalleryId =
      Number(
        galleryId,
      )

    /*
     * 必须登录才能点赞。
     */
    const user =
      await getAuthenticatedUser(
        request,
      )

    if (!user) {
      return NextResponse.json(
        {
          error:
            '请先登录',
        },
        {
          status: 401,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    /*
     * 检查用户资料与封禁状态。
     */
    const {
      data:
        profile,

      error:
        profileError,
    } = await supabase
      .from(
        'profiles',
      )
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
      profileError ||
      !profile
    ) {
      return NextResponse.json(
        {
          error:
            '找不到个人资料',
        },
        {
          status: 404,
        },
      )
    }

    /*
     * 被封禁账号不可点赞。
     *
     * 禁言用户仍允许点赞，
     * 所以这里不检查 muted_until。
     */
    if (
      profile.banned_at
    ) {
      return NextResponse.json(
        {
          error:
            '该账号已被封禁，无法进行点赞操作',
        },
        {
          status: 403,
        },
      )
    }

    /*
     * 检查作品是否仍存在。
     */
    const {
      data:
        galleryItem,

      error:
        galleryError,
    } = await supabase
      .from(
        'gallery',
      )
      .select(
        'id',
      )
      .eq(
        'id',
        numericGalleryId,
      )
      .maybeSingle()

    if (
      galleryError
    ) {
      throw galleryError
    }

    if (
      !galleryItem
    ) {
      return NextResponse.json(
        {
          error:
            '影廊作品不存在',
        },
        {
          status: 404,
        },
      )
    }

    /*
     * 查询当前用户是否已经点赞。
     */
    const {
      data:
        existingLike,

      error:
        likeError,
    } = await supabase
      .from(
        'gallery_likes',
      )
      .select(
        'id',
      )
      .eq(
        'gallery_id',
        numericGalleryId,
      )
      .eq(
        'user_id',
        user.id,
      )
      .maybeSingle()

    if (
      likeError
    ) {
      throw likeError
    }

    let liked =
      false

    if (
      existingLike
    ) {
      /*
       * 已点赞
       * → 删除点赞
       */
      const {
        error,
      } = await supabase
        .from(
          'gallery_likes',
        )
        .delete()
        .eq(
          'gallery_id',
          numericGalleryId,
        )
        .eq(
          'user_id',
          user.id,
        )

      if (
        error
      ) {
        throw error
      }

      liked =
        false
    } else {
      /*
       * 未点赞
       * → 新增点赞
       */
      const {
        error,
      } = await supabase
        .from(
          'gallery_likes',
        )
        .insert({
          gallery_id:
            numericGalleryId,

          user_id:
            user.id,
        })

      if (
        error
      ) {
        throw error
      }

      liked =
        true
    }

    /*
     * 操作完成后重新统计真实点赞数。
     */
    const {
      count,
      error:
        countError,
    } = await supabase
      .from(
        'gallery_likes',
      )
      .select('*', {
        count:
          'exact',

        head:
          true,
      })
      .eq(
        'gallery_id',
        numericGalleryId,
      )

    if (
      countError
    ) {
      throw countError
    }

    return NextResponse.json({
      success:
        true,

      liked,

      likeCount:
        count ?? 0,
    })
  } catch (
    error
  ) {
    console.error(
      'Failed to toggle gallery like:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '点赞失败',
      },
      {
        status: 500,
      },
    )
  }
}