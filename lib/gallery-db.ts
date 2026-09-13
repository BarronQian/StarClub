import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

import type { GalleryShot } from '@/lib/gallery'
import { GALLERY } from '@/lib/gallery'

const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (
    !supabaseUrl ||
    !supabaseServiceRoleKey
  ) {
    return null
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

type GalleryRow = {
  id: number
  src: string
  alt: string | null
  caption: string
  author: string | null
  author_url: string | null
  profile_id: string | null
  category: GalleryShot['category']
  width: number | null
  height: number | null
  aspect_ratio: number | null
  published_at: string
  wide: boolean
  hero_featured: boolean
}

type GalleryLikeRow = {
  gallery_id: number
}

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  star_citizen_handle: string | null
  profile_slug: string | null
}

/**
 * 从数据库读取出来的 GalleryShot。
 *
 * heroFeatured 对应数据库中的 hero_featured。
 */
export type GalleryDbShot =
  GalleryShot & {
    heroFeatured: boolean
  }

function getFallbackGallery(): GalleryDbShot[] {
  return GALLERY.map((shot) => ({
    ...shot,
    likes: 0,
    heroFeatured: false,
  }))
}

function rowToGalleryShot(
  row: GalleryRow,
  profile: ProfileRow | null,
  likes: number,
): GalleryDbShot {
  const width =
    row.width ?? 1

  const height =
    row.height ?? 1

  return {
    id: row.id,

    src: row.src,

    alt:
      row.alt ??
      row.caption,

    caption:
      row.caption,

    author:
      row.author ??
      '未知作者',

    authorUrl:
      row.author_url ??
      undefined,

    profileId:
      profile?.id ??
      undefined,

    profileSlug:
      profile?.profile_slug ??
      undefined,

    category:
      row.category,

    width,

    height,

    aspectRatio:
      row.aspect_ratio ??
      width / height,

    publishedAt:
      row.published_at,

    likes,

    wide:
      row.wide ??
      false,

    heroFeatured:
      row.hero_featured ??
      false,
  }
}

async function loadGalleryLikeCounts(
  supabase: ReturnType<
    typeof getSupabase
  > extends infer T
    ? NonNullable<T>
    : never,
): Promise<Map<number, number>> {
  const {
    data,
    error,
  } = await supabase
    .from('gallery_likes')
    .select('gallery_id')

  if (error) {
    console.error(
      'Failed to load gallery likes:',
      error,
    )

    return new Map()
  }

  const counts =
    new Map<number, number>()

  for (
    const row of
      (data ??
        []) as GalleryLikeRow[]
  ) {
    const galleryId =
      Number(
        row.gallery_id,
      )

    counts.set(
      galleryId,
      (counts.get(
        galleryId,
      ) ?? 0) + 1,
    )
  }

  return counts
}

async function loadProfilesByIds(
  supabase: ReturnType<
    typeof getSupabase
  > extends infer T
    ? NonNullable<T>
    : never,
  profileIds: string[],
): Promise<
  Map<string, ProfileRow>
> {
  if (
    profileIds.length === 0
  ) {
    return new Map()
  }

  const {
    data,
    error,
  } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      display_name,
      star_citizen_handle,
      profile_slug
    `)
    .in(
      'id',
      profileIds,
    )

  if (error) {
    console.error(
      'Failed to load gallery author profiles:',
      error,
    )

    return new Map()
  }

  const profiles =
    (data ??
      []) as ProfileRow[]

  return new Map(
    profiles.map(
      (profile) => [
        profile.id,
        profile,
      ],
    ),
  )
}

async function getGalleryFromDbUncached(): Promise<
  GalleryDbShot[]
> {
  const supabase =
    getSupabase()

  if (!supabase) {
    console.warn(
      'Supabase environment variables are missing. Using static gallery fallback.',
    )

    return getFallbackGallery()
  }

  const {
    data:
      galleryData,
    error:
      galleryError,
  } = await supabase
    .from('gallery')
    .select(`
      id,
      src,
      alt,
      caption,
      author,
      author_url,
      profile_id,
      category,
      width,
      height,
      aspect_ratio,
      published_at,
      wide,
      hero_featured
    `)
    .order(
      'published_at',
      {
        ascending: false,
      },
    )

  if (galleryError) {
    console.error(
      'Failed to load gallery from Supabase:',
      galleryError,
    )

    return getFallbackGallery()
  }

  if (
    !galleryData?.length
  ) {
    return getFallbackGallery()
  }

  const rows =
    galleryData as GalleryRow[]

  const profileIds = [
    ...new Set(
      rows
        .map(
          (row) =>
            row.profile_id,
        )
        .filter(
          (
            profileId,
          ): profileId is string =>
            Boolean(
              profileId,
            ),
        ),
    ),
  ]

  const [
    profileById,
    likeCounts,
  ] =
    await Promise.all([
      loadProfilesByIds(
        supabase,
        profileIds,
      ),

      loadGalleryLikeCounts(
        supabase,
      ),
    ])

  return rows.map(
    (row) => {
      const profile =
        row.profile_id
          ? profileById.get(
              row.profile_id,
            ) ?? null
          : null

      const likes =
        likeCounts.get(
          row.id,
        ) ?? 0

      return rowToGalleryShot(
        row,
        profile,
        likes,
      )
    },
  )
}

export const getGalleryFromDb =
  unstable_cache(
    getGalleryFromDbUncached,
    ['public-gallery'],
    {
      revalidate: 60,
    },
  )
  
export async function getFeaturedGalleryFromDb(
  limit = 8,
): Promise<
  GalleryDbShot[]
> {
  const gallery =
    await getGalleryFromDb()

  return [...gallery]
    .sort(
      (a, b) =>
        new Date(
          b.publishedAt,
        ).getTime() -
        new Date(
          a.publishedAt,
        ).getTime(),
    )
    .slice(0, limit)
}

export type AdminGalleryShot =
  GalleryDbShot & {
    id: number
  }

export async function getAdminGalleryFromDb(): Promise<
  AdminGalleryShot[]
> {
  const supabase =
    getSupabase()

  if (!supabase) {
    throw new Error(
      'Supabase environment variables are missing.',
    )
  }

  const {
    data:
      galleryData,
    error:
      galleryError,
  } = await supabase
    .from('gallery')
    .select(`
      id,
      src,
      alt,
      caption,
      author,
      author_url,
      profile_id,
      category,
      width,
      height,
      aspect_ratio,
      published_at,
      wide,
      hero_featured
    `)
    .order(
      'published_at',
      {
        ascending: false,
      },
    )

  if (galleryError) {
    throw new Error(
      `Failed to load gallery from Supabase: ${galleryError.message}`,
    )
  }

  const rows =
    (galleryData ??
      []) as GalleryRow[]

  const profileIds = [
    ...new Set(
      rows
        .map(
          (row) =>
            row.profile_id,
        )
        .filter(
          (
            profileId,
          ): profileId is string =>
            Boolean(
              profileId,
            ),
        ),
    ),
  ]

  const [
    profileById,
    likeCounts,
  ] =
    await Promise.all([
      loadProfilesByIds(
        supabase,
        profileIds,
      ),

      loadGalleryLikeCounts(
        supabase,
      ),
    ])

  return rows.map(
    (row) => {
      const profile =
        row.profile_id
          ? profileById.get(
              row.profile_id,
            ) ?? null
          : null

      const likes =
        likeCounts.get(
          row.id,
        ) ?? 0

      return {
        id: row.id,

        ...rowToGalleryShot(
          row,
          profile,
          likes,
        ),
      }
    },
  )
}