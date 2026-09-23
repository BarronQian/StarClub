import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

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
        persistSession: false,
        autoRefreshToken: false,
      },
    },
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

/*
 * 批量读取当前登录用户
 * 对一组 Gallery 作品的点赞状态。
 *
 * 点赞总数不在这里重新统计，
 * Gallery 本身已经携带 likes。
 */
export async function POST(
  request: NextRequest,
) {
  try {
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

    const body =
      await request
        .json()
        .catch(
          () => null,
        )

    const rawIds =
      Array.isArray(
        body?.galleryIds,
      )
        ? body.galleryIds
        : []

    /*
     * 清理 ID：
     * - 必须是有效数字
     * - 必须大于 0
     * - 去重
     */
    const galleryIds = [
      ...new Set(
        rawIds
          .map(
            (
              value: unknown,
            ) =>
              Number(
                value,
              ),
          )
          .filter(
            (
              value: number,
            ) =>
              Number.isInteger(
                value,
              ) &&
              value > 0,
          ),
      ),
    ]

    /*
     * 防止异常请求一次传入
     * 过多作品 ID。
     */
    if (
      galleryIds.length >
      200
    ) {
      return NextResponse.json(
        {
          error:
            '一次最多查询 200 个作品',
        },
        {
          status: 400,
        },
      )
    }

    if (
      galleryIds.length ===
      0
    ) {
      return NextResponse.json({
        success: true,
        likedIds: [],
      })
    }

    const supabase =
      getAdminSupabase()

    /*
     * 一次 Supabase 查询，
     * 找出当前用户在这些作品中
     * 点赞过哪些。
     */
    const {
      data,
      error,
    } =
      await supabase
        .from(
          'gallery_likes',
        )
        .select(
          'gallery_id',
        )
        .eq(
          'user_id',
          user.id,
        )
        .in(
          'gallery_id',
          galleryIds,
        )

    if (error) {
      throw error
    }

    const likedIds =
      (data ?? [])
        .map(
          (item) =>
            Number(
              item.gallery_id,
            ),
        )
        .filter(
          (id) =>
            Number.isInteger(
              id,
            ),
        )

    return NextResponse.json({
      success: true,
      likedIds,
    })
  } catch (error) {
    console.error(
      'Failed to load gallery like states:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '读取点赞状态失败',
      },
      {
        status: 500,
      },
    )
  }
}