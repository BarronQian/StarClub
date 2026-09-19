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

    const path =
      url.pathname.slice(
        index +
          marker.length,
      )

    if (!path) {
      return null
    }

    return decodeURIComponent(
      path,
    )
  } catch {
    return null
  }
}

/*
 * 第一步：
 * 读取原图，并为现有 optimized 文件
 * 创建允许覆盖的 Signed Upload。
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
          name,
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
        '[STICKER REGENERATE] Load failed:',
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

    const originalPath =
      getStoragePathFromPublicUrl(
        sticker.original_url,
      )

    const optimizedPath =
      getStoragePathFromPublicUrl(
        sticker.optimized_url,
      )

    if (
      !originalPath ||
      !optimizedPath
    ) {
      return NextResponse.json(
        {
          error:
            '无法识别 Storage 路径',
        },
        {
          status: 500,
        },
      )
    }

    const {
      data: signedUpload,
      error: signedError,
    } =
      await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(
          optimizedPath,
          {
            upsert: true,
          },
        )

    if (
      signedError ||
      !signedUpload
    ) {
      console.error(
        '[STICKER REGENERATE] Signed upload failed:',
        signedError,
      )

      return NextResponse.json(
        {
          error:
            signedError?.message ||
            '创建覆盖上传地址失败',
        },
        {
          status: 500,
        },
      )
    }

    const {
      data: originalPublic,
    } =
      supabase.storage
        .from(BUCKET)
        .getPublicUrl(
          originalPath,
        )

    return NextResponse.json({
      ok: true,

      sticker: {
        id:
          sticker.id,

        name:
          sticker.name,

        originalUrl:
          originalPublic.publicUrl,
      },

      upload: {
        bucket:
          BUCKET,

        path:
          optimizedPath,

        token:
          signedUpload.token,
      },
    })
  } catch (error) {
    console.error(
      '[STICKER REGENERATE] POST failed:',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '准备重新优化失败',
      },
      {
        status: 500,
      },
    )
  }
}

/*
 * 第二步：
 * 浏览器重新压缩并覆盖上传完成后，
 * 更新数据库中的优化版尺寸和容量。
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

    const width =
      body.optimizedWidth

    const height =
      body.optimizedHeight

    const fileSize =
      body.optimizedFileSize

    if (
      !Number.isInteger(
        width,
      ) ||
      width <= 0 ||
      !Number.isInteger(
        height,
      ) ||
      height <= 0 ||
      !Number.isInteger(
        fileSize,
      ) ||
      fileSize <= 0
    ) {
      return NextResponse.json(
        {
          error:
            '优化版图片信息无效',
        },
        {
          status: 400,
        },
      )
    }

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
        .update({
          optimized_width:
            width,

          optimized_height:
            height,

          optimized_file_size:
            fileSize,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          id,
        )
        .select()
        .single()

    if (error) {
      console.error(
        '[STICKER REGENERATE] Metadata update failed:',
        error,
      )

      return NextResponse.json(
        {
          error:
            error.message ||
            '更新优化版信息失败',
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
      '[STICKER REGENERATE] PATCH failed:',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '更新优化版信息失败',
      },
      {
        status: 500,
      },
    )
  }
}