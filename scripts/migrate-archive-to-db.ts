import {
  ARCHIVE,
} from '../lib/archive'

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

function main() {
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

  console.log(
    'DRY RUN 完成。',
  )

  console.log(
    '本次没有修改 Supabase 数据库。',
  )
}

main()