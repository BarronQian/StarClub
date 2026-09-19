import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

import {
  requireAdminApi,
} from '@/lib/admin-auth'

const BUCKET =
  'community-stickers'

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

function isValidNumber(
  value: unknown,
) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0
  )
}

/*
 * 从 Supabase Public URL 中安全提取
 * community-stickers bucket 内的路径。
 *
 * 浏览器不会传 Storage path 给 DELETE，
 * 服务端根据数据库里保存的 URL 自己解析。
 */
function getStoragePathFromPublicUrl(
  value: string,
) {
  try {
    const url =
      new URL(value)

    const marker =
      `/storage/v1/object/public/${BUCKET}/`

    const index =
      url.pathname.indexOf(
        marker,
      )

    if (index === -1) {
      return null
    }

    const encodedPath =
      url.pathname.slice(
        index +
          marker.length,
      )

    if (!encodedPath) {
      return null
    }

    return decodeURIComponent(
      encodedPath,
    )
  } catch {
    return null
  }
}

/*
 * CREATE
 */
export async function POST(
  request: NextRequest,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  try {
    const body =
      await request.json()

    const name =
      typeof body.name ===
      'string'
        ? body.name.trim()
        : ''

    const originalUrl =
      typeof body.originalUrl ===
      'string'
        ? body.originalUrl.trim()
        : ''

    const optimizedUrl =
      typeof body.optimizedUrl ===
      'string'
        ? body.optimizedUrl.trim()
        : ''

    if (!name) {
      return NextResponse.json(
        {
          error:
            '请输入表情包名称',
        },
        {
          status: 400,
        },
      )
    }

    if (name.length > 80) {
      return NextResponse.json(
        {
          error:
            '表情包名称过长',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !originalUrl ||
      !optimizedUrl
    ) {
      return NextResponse.json(
        {
          error:
            '缺少表情包图片地址',
        },
        {
          status: 400,
        },
      )
    }

    const numericValues = [
      body.originalWidth,
      body.originalHeight,
      body.originalFileSize,
      body.optimizedWidth,
      body.optimizedHeight,
      body.optimizedFileSize,
    ]

    if (
      numericValues.some(
        (value) =>
          !isValidNumber(
            value,
          ),
      )
    ) {
      return NextResponse.json(
        {
          error:
            '图片信息无效',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    const {
      data: lastSticker,
      error: orderError,
    } =
      await supabase
        .from(
          'community_stickers',
        )
        .select(
          'sort_order',
        )
        .order(
          'sort_order',
          {
            ascending: false,
          },
        )
        .limit(1)
        .maybeSingle()

    if (orderError) {
      console.error(
        '[STICKER CREATE] Sort order load failed:',
        orderError,
      )
    }

    const nextSortOrder =
      typeof lastSticker
        ?.sort_order ===
      'number'
        ? lastSticker
            .sort_order + 1
        : 0

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'community_stickers',
        )
        .insert({
          name,

          original_url:
            originalUrl,

          optimized_url:
            optimizedUrl,

          original_width:
            body.originalWidth,

          original_height:
            body.originalHeight,

          original_file_size:
            body.originalFileSize,

          optimized_width:
            body.optimizedWidth,

          optimized_height:
            body.optimizedHeight,

          optimized_file_size:
            body.optimizedFileSize,

          sort_order:
            nextSortOrder,

          is_active: true,
        })
        .select()
        .single()

    if (error) {
      console.error(
        '[STICKER CREATE] Insert failed:',
        error,
      )

      return NextResponse.json(
        {
          error:
            error.message ||
            '保存表情包失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      sticker: data,
    })
  } catch (error) {
    console.error(
      '[STICKER CREATE] POST failed:',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '保存表情包失败',
      },
      {
        status: 500,
      },
    )
  }
}

/*
 * UPDATE
 *
 * 支持：
 * - 修改名称
 * - 上架 / 下架
 * - 修改 sort_order
 */
export async function PATCH(
  request: NextRequest,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  try {
    const body =
      await request.json()

    const id =
      typeof body.id ===
      'string'
        ? body.id.trim()
        : ''

    if (!id) {
      return NextResponse.json(
        {
          error:
            '缺少表情包 ID',
        },
        {
          status: 400,
        },
      )
    }

    const updates: {
      name?: string
      is_active?: boolean
      sort_order?: number
      updated_at?: string
    } = {}

    if (
      typeof body.name ===
      'string'
    ) {
      const name =
        body.name.trim()

      if (!name) {
        return NextResponse.json(
          {
            error:
              '表情包名称不能为空',
          },
          {
            status: 400,
          },
        )
      }

      if (name.length > 80) {
        return NextResponse.json(
          {
            error:
              '表情包名称过长',
          },
          {
            status: 400,
          },
        )
      }

      updates.name =
        name
    }

    if (
      typeof body.isActive ===
      'boolean'
    ) {
      updates.is_active =
        body.isActive
    }

    if (
      body.sortOrder !==
      undefined
    ) {
      if (
        !Number.isInteger(
          body.sortOrder,
        ) ||
        body.sortOrder < 0
      ) {
        return NextResponse.json(
          {
            error:
              '排序值无效',
          },
          {
            status: 400,
          },
        )
      }

      updates.sort_order =
        body.sortOrder
    }

    if (
      Object.keys(
        updates,
      ).length === 0
    ) {
      return NextResponse.json(
        {
          error:
            '没有需要修改的内容',
        },
        {
          status: 400,
        },
      )
    }

    updates.updated_at =
      new Date().toISOString()

    const supabase =
      getAdminSupabase()

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'community_stickers',
        )
        .update(updates)
        .eq(
          'id',
          id,
        )
        .select()
        .single()

    if (error) {
      console.error(
        '[STICKER UPDATE] Failed:',
        error,
      )

      return NextResponse.json(
        {
          error:
            error.message ||
            '更新表情包失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      sticker: data,
    })
  } catch (error) {
    console.error(
      '[STICKER UPDATE] PATCH failed:',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '更新表情包失败',
      },
      {
        status: 500,
      },
    )
  }
}

/*
 * DELETE
 *
 * 永久删除：
 * 1. 查询数据库记录
 * 2. 从数据库 URL 解析 Storage 路径
 * 3. 删除 original + optimized
 * 4. 删除数据库记录
 */
export async function DELETE(
  request: NextRequest,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  try {
    const body =
      await request.json()

    const id =
      typeof body.id ===
      'string'
        ? body.id.trim()
        : ''

    if (!id) {
      return NextResponse.json(
        {
          error:
            '缺少表情包 ID',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    const {
      data: sticker,
      error: loadError,
    } =
      await supabase
        .from(
          'community_stickers',
        )
        .select(`
          id,
          original_url,
          optimized_url
        `)
        .eq(
          'id',
          id,
        )
        .maybeSingle()

    if (loadError) {
      console.error(
        '[STICKER DELETE] Load failed:',
        loadError,
      )

      return NextResponse.json(
        {
          error:
            loadError.message ||
            '读取表情包失败',
        },
        {
          status: 500,
        },
      )
    }

    if (!sticker) {
      return NextResponse.json(
        {
          error:
            '找不到这个表情包',
        },
        {
          status: 404,
        },
      )
    }

    const storagePaths =
      [
        getStoragePathFromPublicUrl(
          sticker.original_url,
        ),
        getStoragePathFromPublicUrl(
          sticker.optimized_url,
        ),
      ].filter(
        (
          path,
        ): path is string =>
          Boolean(path),
      )

    /*
     * 先删 Storage。
     *
     * 如果 Storage 删除失败，
     * 不删除数据库记录，
     * 防止留下无法追踪的孤儿文件。
     */
    if (
      storagePaths.length > 0
    ) {
      const {
        error: storageError,
      } =
        await supabase.storage
          .from(BUCKET)
          .remove(
            storagePaths,
          )

      if (storageError) {
        console.error(
          '[STICKER DELETE] Storage delete failed:',
          storageError,
        )

        return NextResponse.json(
          {
            error:
              storageError.message ||
              '删除表情包图片失败',
          },
          {
            status: 500,
          },
        )
      }
    }

    const {
      error: deleteError,
    } =
      await supabase
        .from(
          'community_stickers',
        )
        .delete()
        .eq(
          'id',
          id,
        )

    if (deleteError) {
      console.error(
        '[STICKER DELETE] Database delete failed:',
        deleteError,
      )

      return NextResponse.json(
        {
          error:
            deleteError.message ||
            '删除表情包记录失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
    })
  } catch (error) {
    console.error(
      '[STICKER DELETE] DELETE failed:',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '删除表情包失败',
      },
      {
        status: 500,
      },
    )
  }
}