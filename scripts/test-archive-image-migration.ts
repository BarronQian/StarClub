import fs from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

import {
  createClient,
} from '@supabase/supabase-js'

const TEST_IMAGE =
  'public/images/archive/limited-time-events/supply-or-die/session-01/2025-02-15-1.jpg'

const BUCKET =
  'archive'

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
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

function getPublicUrl(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  storagePath: string,
) {
  const {
    data,
  } = supabase
    .storage
    .from(BUCKET)
    .getPublicUrl(storagePath)

  return data.publicUrl
}

async function uploadBuffer(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  storagePath: string,
  buffer: Buffer,
  contentType: string,
) {
  const {
    error,
  } = await supabase
    .storage
    .from(BUCKET)
    .upload(
      storagePath,
      buffer,
      {
        contentType,
        upsert: true,
        cacheControl: '31536000',
      },
    )

  if (error) {
    throw new Error(
      `上传失败：${storagePath} · ${error.message}`,
    )
  }

  return getPublicUrl(
    supabase,
    storagePath,
  )
}

async function main() {
  console.log('')
  console.log(
    '======================================',
  )
  console.log(
    'Archive Image Migration Test',
  )
  console.log(
    '======================================',
  )

  const absolutePath =
    path.resolve(TEST_IMAGE)

  console.log('')
  console.log(
    `读取：${absolutePath}`,
  )

  const originalBuffer =
    await fs.readFile(
      absolutePath,
    )

  const metadata =
    await sharp(
      originalBuffer,
    ).metadata()

  const width =
    metadata.width

  const height =
    metadata.height

  if (
    !width ||
    !height
  ) {
    throw new Error(
      '无法读取测试图片尺寸。',
    )
  }

  const longestEdge =
    Math.max(
      width,
      height,
    )

  const extension =
    path
      .extname(TEST_IMAGE)
      .toLowerCase()

  const originalContentType =
    extension === '.png'
      ? 'image/png'
      : extension === '.webp'
        ? 'image/webp'
        : 'image/jpeg'

  const originalExtension =
    extension === '.jpeg'
      ? 'jpg'
      : extension.replace(
          '.',
          '',
        )

  console.log('')
  console.log(
    `Original: ${width} × ${height}`,
  )

  console.log(
    `Original size: ${(
      originalBuffer.length /
      1024 /
      1024
    ).toFixed(2)} MB`,
  )

  /*
   * 测试文件全部放在独立目录。
   * 正式迁移时会换成正式路径。
   */
  const baseName =
    'supply-or-die-test'

  const originalPath =
    `migration-test/original/${baseName}.${originalExtension}`

  const displayPath =
    `migration-test/display/${baseName}.webp`

  const thumbnailPath =
    `migration-test/thumbnail/${baseName}.webp`

  const supabase =
    getSupabaseAdmin()

  console.log('')
  console.log(
    '上传 Original...',
  )

  const originalUrl =
    await uploadBuffer(
      supabase,
      originalPath,
      originalBuffer,
      originalContentType,
    )

  let displayUrl =
    originalUrl

  let displayWidth =
    width

  let displayHeight =
    height

  let displayBuffer:
    Buffer | null =
    null

  /*
   * Display 规则：
   *
   * < 1200
   *   → 不生成 Display
   *   → display_url = original_url
   *
   * 1200 - 2200
   *   → 不缩尺寸
   *   → WebP 90%
   *
   * > 2200
   *   → 最长边缩到 2200
   *   → WebP 90%
   */
  if (longestEdge >= 1200) {
    let displaySharp =
      sharp(
        originalBuffer,
      )

    if (
      longestEdge >
      2200
    ) {
      displaySharp =
        displaySharp.resize({
          width:
            width >= height
              ? 2200
              : undefined,

          height:
            height > width
              ? 2200
              : undefined,

          fit: 'inside',
          withoutEnlargement: true,
        })
    }

    displayBuffer =
      await displaySharp
        .webp({
          quality: 90,
        })
        .toBuffer()

    const displayMetadata =
      await sharp(
        displayBuffer,
      ).metadata()

    displayWidth =
      displayMetadata.width ??
      width

    displayHeight =
      displayMetadata.height ??
      height

    console.log('')
    console.log(
      '上传 Display...',
    )

    displayUrl =
      await uploadBuffer(
        supabase,
        displayPath,
        displayBuffer,
        'image/webp',
      )
  }

  /*
   * Thumbnail：
   * 最长边最多 800
   * 不裁切
   * 不拉伸
   * 不放大
   */
  const thumbnailBuffer =
    await sharp(
      originalBuffer,
    )
      .resize({
        width:
          width >= height
            ? 800
            : undefined,

        height:
          height > width
            ? 800
            : undefined,

        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 82,
      })
      .toBuffer()

  const thumbnailMetadata =
    await sharp(
      thumbnailBuffer,
    ).metadata()

  const thumbnailWidth =
    thumbnailMetadata.width ??
    width

  const thumbnailHeight =
    thumbnailMetadata.height ??
    height

  console.log('')
  console.log(
    '上传 Thumbnail...',
  )

  const thumbnailUrl =
    await uploadBuffer(
      supabase,
      thumbnailPath,
      thumbnailBuffer,
      'image/webp',
    )

  console.log('')
  console.log(
    '======================================',
  )
  console.log(
    '测试结果',
  )
  console.log(
    '======================================',
  )

  console.log('')
  console.log(
    `Original: ${width} × ${height}`,
  )

  console.log(
    `Original size: ${(
      originalBuffer.length /
      1024 /
      1024
    ).toFixed(2)} MB`,
  )

  console.log('')
  console.log(
    `Display: ${displayWidth} × ${displayHeight}`,
  )

  if (displayBuffer) {
    console.log(
      `Display size: ${(
        displayBuffer.length /
        1024 /
        1024
      ).toFixed(2)} MB`,
    )
  } else {
    console.log(
      'Display: 使用 Original，不生成独立文件',
    )
  }

  console.log('')
  console.log(
    `Thumbnail: ${thumbnailWidth} × ${thumbnailHeight}`,
  )

  console.log(
    `Thumbnail size: ${(
      thumbnailBuffer.length /
      1024 /
      1024
    ).toFixed(2)} MB`,
  )

  console.log('')
  console.log(
    'Original URL:',
  )
  console.log(
    originalUrl,
  )

  console.log('')
  console.log(
    'Display URL:',
  )
  console.log(
    displayUrl,
  )

  console.log('')
  console.log(
    'Thumbnail URL:',
  )
  console.log(
    thumbnailUrl,
  )

  console.log('')
  console.log(
    '✓ 图片迁移测试完成',
  )

  console.log(
    '✓ 没有修改数据库',
  )

  console.log(
    '✓ 没有删除本地旧图片',
  )
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Archive 图片迁移测试失败：',
    )

    console.error(
      error,
    )

    process.exit(1)
  },
)