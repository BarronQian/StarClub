import {
  NextResponse,
  type NextRequest,
} from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

const GALLERY_BUCKET = 'gallery'

function getStoragePath(
  url: string | null,
) {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)

    const markers = [
      `/storage/v1/object/public/${GALLERY_BUCKET}/`,
      `/storage/v1/object/sign/${GALLERY_BUCKET}/`,
    ]

    for (const marker of markers) {
      const index =
        parsed.pathname.indexOf(marker)

      if (index === -1) {
        continue
      }

      const path =
        parsed.pathname.slice(
          index + marker.length,
        )

      return decodeURIComponent(path)
    }
  } catch {
    return null
  }

  return null
}

export async function POST(
  request: NextRequest,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  const body =
    await request
      .json()
      .catch(() => null)

  const id = Number(body?.id)

  if (!Number.isFinite(id)) {
    return NextResponse.json(
      {
        error: '缺少作品 ID',
      },
      {
        status: 400,
      },
    )
  }

  const admin =
    createAdminClient()

  /*
   * 删除数据库记录之前，
   * 先读取该作品对应的三层图片地址。
   */
  const {
    data: shot,
    error: readError,
  } = await admin
    .from('gallery')
    .select(
      `
        id,
        src,
        original_url,
        display_url,
        thumbnail_url
      `,
    )
    .eq('id', id)
    .maybeSingle()

  if (readError) {
    console.error(
      '[Gallery delete] Failed to read gallery item:',
      readError,
    )

    return NextResponse.json(
      {
        error:
          '读取作品信息失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  if (!shot) {
    return NextResponse.json(
      {
        error: '作品不存在',
      },
      {
        status: 404,
      },
    )
  }

  /*
   * 先删除数据库记录。
   *
   * Storage 清理失败不会导致数据库删除失败，
   * 避免出现图片删掉了但数据库记录还存在的破图状态。
   */
  const { error: deleteError } =
    await admin
      .from('gallery')
      .delete()
      .eq('id', id)

  if (deleteError) {
    console.error(
      '[Gallery delete] Database delete failed:',
      deleteError,
    )

    return NextResponse.json(
      {
        error:
          '删除失败，请重试',
      },
      {
        status: 500,
      },
    )
  }

  /*
   * 新作品：
   * original_url / display_url / thumbnail_url
   *
   * 老作品：
   * 三个字段可能都指向同一个 src。
   *
   * Set 自动去重，避免重复删除同一个文件。
   */
  const storagePaths = Array.from(
    new Set(
      [
        shot.original_url,
        shot.display_url,
        shot.thumbnail_url,
        shot.src,
      ]
        .map((url) =>
          getStoragePath(url),
        )
        .filter(
          (
            path,
          ): path is string =>
            Boolean(path),
        ),
    ),
  )

  if (storagePaths.length > 0) {
    const {
      error: storageError,
    } = await admin.storage
      .from(GALLERY_BUCKET)
      .remove(storagePaths)

    if (storageError) {
      /*
       * 数据库已经成功删除，
       * 所以这里仅记录错误。
       *
       * 最坏情况只是留下孤立 Storage 文件，
       * 不会让前台出现破图记录。
       */
      console.error(
        '[Gallery delete] Storage cleanup failed:',
        storageError,
      )
    }
  }

  revalidatePath('/gallery')
  revalidatePath('/')

  return NextResponse.json({
    ok: true,
  })
}