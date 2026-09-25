import {
  createAdminClient,
} from '@/lib/supabase-admin'

export type ArchiveDbPhoto = {
  id: string
  originalUrl: string | null
  displayUrl: string
  thumbnailUrl: string | null
  alt: string
  caption: string | null
  wide: boolean
  width: number | null
  height: number | null
  sortOrder: number
}

export type ArchiveDbVideo = {
  id: string
  title: string
  platform:
    | 'youtube'
    | 'bilibili'
  videoUrl: string | null
  embedUrl: string | null
  sortOrder: number
}

export type ArchiveDbSession = {
  id: string
  slug: string
  label: string
  date: string | null
  title: string | null
  note: string | null
  captains: string[]
  reservedSlots: number
  sortOrder: number
  isPublished: boolean
  videos: ArchiveDbVideo[]
  photos: ArchiveDbPhoto[]
}

export type ArchiveDbAlbum = {
  id: string
  categoryId: string
  slug: string
  title: string
  en: string
  summary: string
  place: string | null

  coverOriginalUrl:
    | string
    | null

  coverDisplayUrl:
    | string
    | null

  coverThumbnailUrl:
    | string
    | null

  sortOrder: number
  isPublished: boolean
  sessions: ArchiveDbSession[]
}

export type ArchiveDbCategory = {
  id: string
  slug: string
  index: string
  title: string
  en: string
  summary: string

  coverOriginalUrl:
    | string
    | null

  coverDisplayUrl:
    | string
    | null

  coverThumbnailUrl:
    | string
    | null

  sortOrder: number
  isPublished: boolean
  albums: ArchiveDbAlbum[]
}

type CategoryRow = {
  id: string
  slug: string
  index_label: string
  title: string
  en: string
  summary: string
  cover_original_url:
    | string
    | null
  cover_display_url:
    | string
    | null
  cover_thumbnail_url:
    | string
    | null
  sort_order: number
  is_published: boolean
}

type AlbumRow = {
  id: string
  category_id: string
  slug: string
  title: string
  en: string
  summary: string
  place: string | null
  cover_original_url:
    | string
    | null
  cover_display_url:
    | string
    | null
  cover_thumbnail_url:
    | string
    | null
  sort_order: number
  is_published: boolean
}

type SessionRow = {
  id: string
  album_id: string
  slug: string
  label: string
  event_date: string | null
  title: string | null
  note: string | null
  captains: string[] | null
  reserved_slots: number
  sort_order: number
  is_published: boolean
}

type VideoRow = {
  id: string
  session_id: string
  title: string
  platform:
    | 'youtube'
    | 'bilibili'
  video_url: string | null
  embed_url: string | null
  sort_order: number
}

type PhotoRow = {
  id: string
  session_id: string
  original_url: string | null
  display_url: string
  thumbnail_url: string | null
  alt: string
  caption: string | null
  wide: boolean
  width: number | null
  height: number | null
  sort_order: number
}

function mapPhoto(
  row: PhotoRow,
): ArchiveDbPhoto {
  return {
    id: row.id,
    originalUrl:
      row.original_url,
    displayUrl:
      row.display_url,
    thumbnailUrl:
      row.thumbnail_url,
    alt: row.alt ?? '',
    caption: row.caption,
    wide: row.wide,
    width: row.width,
    height: row.height,
    sortOrder:
      row.sort_order,
  }
}

function mapVideo(
  row: VideoRow,
): ArchiveDbVideo {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    videoUrl:
      row.video_url,
    embedUrl:
      row.embed_url,
    sortOrder:
      row.sort_order,
  }
}

export async function getArchiveFromDb(
  options?: {
    includeUnpublished?: boolean
  },
): Promise<
  ArchiveDbCategory[]
> {
  const includeUnpublished =
    options?.includeUnpublished ??
    false

  const supabase =
    createAdminClient()

  let categoryQuery =
    supabase
      .from(
        'archive_categories',
      )
      .select('*')
      .order(
        'sort_order',
        {
          ascending: true,
        },
      )

  let albumQuery =
    supabase
      .from(
        'archive_albums',
      )
      .select('*')
      .order(
        'sort_order',
        {
          ascending: true,
        },
      )

  let sessionQuery =
    supabase
      .from(
        'archive_sessions',
      )
      .select('*')
      .order(
        'sort_order',
        {
          ascending: true,
        },
      )

  if (!includeUnpublished) {
    categoryQuery =
      categoryQuery.eq(
        'is_published',
        true,
      )

    albumQuery =
      albumQuery.eq(
        'is_published',
        true,
      )

    sessionQuery =
      sessionQuery.eq(
        'is_published',
        true,
      )
  }

  const [
    categoryResult,
    albumResult,
    sessionResult,
    videoResult,
    photoResult,
  ] = await Promise.all([
    categoryQuery,
    albumQuery,
    sessionQuery,

    supabase
      .from(
        'archive_session_videos',
      )
      .select('*')
      .order(
        'sort_order',
        {
          ascending: true,
        },
      ),

    supabase
      .from(
        'archive_photos',
      )
      .select('*')
      .order(
        'sort_order',
        {
          ascending: true,
        },
      ),
  ])

  if (categoryResult.error) {
    throw categoryResult.error
  }

  if (albumResult.error) {
    throw albumResult.error
  }

  if (sessionResult.error) {
    throw sessionResult.error
  }

  if (videoResult.error) {
    throw videoResult.error
  }

  if (photoResult.error) {
    throw photoResult.error
  }

  const categories =
    (categoryResult.data ??
      []) as CategoryRow[]

  const albums =
    (albumResult.data ??
      []) as AlbumRow[]

  const sessions =
    (sessionResult.data ??
      []) as SessionRow[]

  const videos =
    (videoResult.data ??
      []) as VideoRow[]

  const photos =
    (photoResult.data ??
      []) as PhotoRow[]

  const videosBySession =
    new Map<
      string,
      ArchiveDbVideo[]
    >()

  for (const row of videos) {
    const current =
      videosBySession.get(
        row.session_id,
      ) ?? []

    current.push(
      mapVideo(row),
    )

    videosBySession.set(
      row.session_id,
      current,
    )
  }

  const photosBySession =
    new Map<
      string,
      ArchiveDbPhoto[]
    >()

  for (const row of photos) {
    const current =
      photosBySession.get(
        row.session_id,
      ) ?? []

    current.push(
      mapPhoto(row),
    )

    photosBySession.set(
      row.session_id,
      current,
    )
  }

  const sessionsByAlbum =
    new Map<
      string,
      ArchiveDbSession[]
    >()

  for (
    const row of sessions
  ) {
    const current =
      sessionsByAlbum.get(
        row.album_id,
      ) ?? []

    current.push({
      id: row.id,
      slug: row.slug,
      label: row.label,
      date: row.event_date,
      title: row.title,
      note: row.note,
      captains:
        row.captains ?? [],
      reservedSlots:
        row.reserved_slots,
      sortOrder:
        row.sort_order,
      isPublished:
        row.is_published,
      videos:
        videosBySession.get(
          row.id,
        ) ?? [],
      photos:
        photosBySession.get(
          row.id,
        ) ?? [],
    })

    sessionsByAlbum.set(
      row.album_id,
      current,
    )
  }

  const albumsByCategory =
    new Map<
      string,
      ArchiveDbAlbum[]
    >()

  for (
    const row of albums
  ) {
    const current =
      albumsByCategory.get(
        row.category_id,
      ) ?? []

    current.push({
      id: row.id,
      categoryId:
        row.category_id,
      slug: row.slug,
      title: row.title,
      en: row.en,
      summary: row.summary,
      place: row.place,

      coverOriginalUrl:
        row.cover_original_url,

      coverDisplayUrl:
        row.cover_display_url,

      coverThumbnailUrl:
        row.cover_thumbnail_url,

      sortOrder:
        row.sort_order,

      isPublished:
        row.is_published,

      sessions:
        sessionsByAlbum.get(
          row.id,
        ) ?? [],
    })

    albumsByCategory.set(
      row.category_id,
      current,
    )
  }

  return categories.map(
    (row) => ({
      id: row.id,
      slug: row.slug,
      index:
        row.index_label,
      title: row.title,
      en: row.en,
      summary: row.summary,

      coverOriginalUrl:
        row.cover_original_url,

      coverDisplayUrl:
        row.cover_display_url,

      coverThumbnailUrl:
        row.cover_thumbnail_url,

      sortOrder:
        row.sort_order,

      isPublished:
        row.is_published,

      albums:
        albumsByCategory.get(
          row.id,
        ) ?? [],
    }),
  )
}

export async function getArchiveCategoryFromDb(
  categorySlug: string,
  options?: {
    includeUnpublished?: boolean
  },
) {
  const categories =
    await getArchiveFromDb(
      options,
    )

  return (
    categories.find(
      (category) =>
        category.slug ===
        categorySlug,
    ) ?? null
  )
}

export async function getArchiveAlbumFromDb(
  categorySlug: string,
  albumSlug: string,
  options?: {
    includeUnpublished?: boolean
  },
) {
  const category =
    await getArchiveCategoryFromDb(
      categorySlug,
      options,
    )

  if (!category) {
    return null
  }

  const album =
    category.albums.find(
      (item) =>
        item.slug ===
        albumSlug,
    ) ?? null

  if (!album) {
    return null
  }

  return {
    category,
    album,
  }
}