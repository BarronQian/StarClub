import {
  ARCHIVE,
} from '../lib/archive'

import {
  createClient,
} from '@supabase/supabase-js'

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

function countArchive() {
  let categoryCount = 0
  let albumCount = 0
  let sessionCount = 0
  let photoCount = 0
  let videoCount = 0

  for (const category of ARCHIVE) {
    categoryCount += 1

    for (const album of category.albums) {
      albumCount += 1

      for (const session of album.sessions) {
        sessionCount += 1

        photoCount +=
          session.photos.length

        /*
         * 新版 videos[]
         */
        if (session.videos) {
          videoCount +=
            session.videos.length
        }

        /*
         * 兼容旧版：
         * videoUrl / videoEmbedUrl
         *
         * 如果同一个 Session 已经存在
         * videos[]，这里仍然单独统计，
         * 方便迁移前发现重复数据。
         */
        if (session.videoUrl) {
          videoCount += 1
        }

        if (session.videoEmbedUrl) {
          videoCount += 1
        }
      }
    }
  }

  return {
    categoryCount,
    albumCount,
    sessionCount,
    photoCount,
    videoCount,
  }
}

function printArchiveStructure() {
  console.log('')
  console.log(
    '======================================',
  )
  console.log(
    'StarClub Archive Migration · DRY RUN',
  )
  console.log(
    '======================================',
  )
  console.log('')

  for (const category of ARCHIVE) {
    console.log(
      `[Category] ${category.index} · ${category.title}`,
    )

    console.log(
      `  slug: ${category.slug}`,
    )

    for (const album of category.albums) {
      console.log(
        `  └─ [Album] ${album.title} (${album.slug})`,
      )

      for (const session of album.sessions) {
        const videoCount =
          (session.videos?.length ?? 0) +
          (session.videoUrl ? 1 : 0) +
          (session.videoEmbedUrl
            ? 1
            : 0)

        console.log(
          `      └─ [Session] ${session.label} (${session.slug}) · ${session.photos.length} Photos · ${videoCount} Videos`,
        )
      }
    }

    console.log('')
  }
}

function validateArchive() {
  const errors:
    string[] = []

  const warnings:
    string[] = []

  const categorySlugs =
    new Set<string>()

  for (const category of ARCHIVE) {
    if (!category.slug) {
      errors.push(
        `Category 缺少 slug：${category.title}`,
      )
    }

    if (
      categorySlugs.has(
        category.slug,
      )
    ) {
      errors.push(
        `Category slug 重复：${category.slug}`,
      )
    }

    categorySlugs.add(
      category.slug,
    )

    const albumSlugs =
      new Set<string>()

    for (const album of category.albums) {
      if (!album.slug) {
        errors.push(
          `Album 缺少 slug：${category.slug} / ${album.title}`,
        )
      }

      if (
        albumSlugs.has(
          album.slug,
        )
      ) {
        errors.push(
          `Album slug 重复：${category.slug} / ${album.slug}`,
        )
      }

      albumSlugs.add(
        album.slug,
      )

      const sessionSlugs =
        new Set<string>()

      for (const session of album.sessions) {
        const location =
          `${category.slug} / ${album.slug} / ${session.slug}`

        if (!session.slug) {
          errors.push(
            `Session 缺少 slug：${category.slug} / ${album.slug}`,
          )
        }

        if (
          sessionSlugs.has(
            session.slug,
          )
        ) {
          errors.push(
            `Session slug 重复：${location}`,
          )
        }

        sessionSlugs.add(
          session.slug,
        )

        if (!session.label) {
          errors.push(
            `Session 缺少 label：${location}`,
          )
        }

        if (
          session.photos.length ===
          0
        ) {
          warnings.push(
            `空 Session：${location}`,
          )
        }

        if (
          session.videos &&
          session.videos.length >
            0 &&
          (
            session.videoUrl ||
            session.videoEmbedUrl
          )
        ) {
          warnings.push(
            `Session 同时存在新版和旧版视频字段：${location}`,
          )
        }

        const photoSources =
          new Set<string>()

        for (
          const [
            photoIndex,
            photo,
          ] of session.photos.entries()
        ) {
          if (!photo.src) {
            errors.push(
              `Photo 缺少 src：${location} / #${photoIndex + 1}`,
            )

            continue
          }

          if (
            photoSources.has(
              photo.src,
            )
          ) {
            warnings.push(
              `Session 内图片路径重复：${location} / ${photo.src}`,
            )
          }

          photoSources.add(
            photo.src,
          )

          if (!photo.alt) {
            warnings.push(
              `Photo 缺少 alt：${location} / ${photo.src}`,
            )
          }

          if (
            photo.width !==
              undefined &&
            photo.width <= 0
          ) {
            errors.push(
              `Photo width 无效：${location} / ${photo.src}`,
            )
          }

          if (
            photo.height !==
              undefined &&
            photo.height <= 0
          ) {
            errors.push(
              `Photo height 无效：${location} / ${photo.src}`,
            )
          }
        }
      }
    }
  }

  return {
    errors,
    warnings,
  }
}

async function runDatabasePreflight() {
  const supabase =
    getSupabaseAdmin()

  const tables = [
    'archive_categories',
    'archive_albums',
    'archive_sessions',
    'archive_session_videos',
    'archive_photos',
  ] as const

  console.log('')
  console.log(
    '======================================',
  )
  console.log(
    'Supabase Preflight',
  )
  console.log(
    '======================================',
  )

  let totalRows = 0

  for (const table of tables) {
    const {
      count,
      error,
    } = await supabase
      .from(table)
      .select('*', {
        count: 'exact',
        head: true,
      })

    if (error) {
      throw new Error(
        `${table} 检查失败：${error.message}`,
      )
    }

    const rowCount =
      count ?? 0

    totalRows +=
      rowCount

    console.log(
      `${table}: ${rowCount}`,
    )
  }

  console.log('')

  if (totalRows !== 0) {
    throw new Error(
      `Archive 数据库不是空的，目前共有 ${totalRows} 行数据。迁移已停止，不会写入任何数据。`,
    )
  }

  console.log(
    '✓ Archive 五张表全部为空',
  )

  console.log(
    '✓ Preflight 通过',
  )

  console.log(
    '✓ 本次仍未写入任何数据',
  )
}

async function main() {
  const counts =
    countArchive()

  printArchiveStructure()

  console.log(
    '======================================',
  )

  console.log(
    'Archive 数据统计',
  )

  console.log(
    '======================================',
  )

  console.log(
    `Categories: ${counts.categoryCount}`,
  )

  console.log(
    `Albums:     ${counts.albumCount}`,
  )

  console.log(
    `Sessions:   ${counts.sessionCount}`,
  )

  console.log(
    `Photos:     ${counts.photoCount}`,
  )

  console.log(
    `Videos:     ${counts.videoCount}`,
  )

  console.log('')

  const validation =
  validateArchive()

console.log(
  '======================================',
)

console.log(
  '数据完整性检查',
)

console.log(
  '======================================',
)

console.log(
  `Errors:   ${validation.errors.length}`,
)

console.log(
  `Warnings: ${validation.warnings.length}`,
)

if (
  validation.errors.length >
  0
) {
  console.log('')
  console.log(
    '--- Errors ---',
  )

  for (
    const error of
    validation.errors
  ) {
    console.log(
      `❌ ${error}`,
    )
  }
}

if (
  validation.warnings.length >
  0
) {
  console.log('')
  console.log(
    '--- Warnings ---',
  )

  for (
    const warning of
    validation.warnings
  ) {
    console.log(
      `⚠️ ${warning}`,
    )
  }
}

console.log('')

    if (
    validation.errors.length >
    0
  ) {
    throw new Error(
      'Archive 数据完整性检查失败，迁移已停止。',
    )
  }

  console.log(
    'DRY RUN 完成。',
  )

  console.log(
    '本次没有修改 Supabase 数据库。',
  )
  await runDatabasePreflight()
}

main().catch((error) => {
  console.error('')
  console.error(
    'Migration Preflight 失败：',
  )
  console.error(error)

  process.exit(1)
})