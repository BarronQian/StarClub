import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getEventsFromDb } from '@/lib/events-db'
import { ARCHIVE } from '@/lib/archive'

async function getPublishedGuideSlugs() {
  const supabaseUrl =
    process.env.SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    return []
  }

  const supabase =
    createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    )

  const {
    data,
    error,
  } = await supabase
    .from('guides')
    .select('slug, published_at')
    .eq('published', true)

  if (
    error ||
    !data
  ) {
    console.error(
      '[SITEMAP GUIDES]',
      error,
    )

    return []
  }

  return data
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    'https://www.starclubsc.com'

  const events =
    await getEventsFromDb()

  const guides =
    await getPublishedGuideSlugs()

  const routes = [
    '',
    '/about',
    '/archive',
    '/changelog',
    '/community',
    '/events',
    '/gallery',
    '/guides',
    '/guides/armor-codex',
    '/guides/star-citizen-fleet-overview',
    '/guides/videos',
    '/hall-of-fame',
    '/market',
    '/partners',
    '/rules',
    '/sponsors',
    '/team',
    '/tools',
  ]

  const staticPages: MetadataRoute.Sitemap =
    routes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency:
        route === ''
          ? 'daily'
          : 'weekly',
      priority:
        route === ''
          ? 1
          : route === '/community' ||
              route === '/events' ||
              route === '/gallery' ||
              route === '/guides' ||
              route === '/market'
            ? 0.9
            : 0.7,
    }))

  const eventPages: MetadataRoute.Sitemap =
    events.map((event) => ({
      url:
        `${baseUrl}/events/${encodeURIComponent(
          event.slug,
        )}`,
      changeFrequency:
        'weekly',
      priority: 0.8,
    }))
  
  const guidePages: MetadataRoute.Sitemap =
  guides.map((guide) => ({
    url:
      `${baseUrl}/guides/${encodeURIComponent(
        guide.slug,
      )}`,

    lastModified:
      guide.published_at
        ? new Date(
            guide.published_at,
          )
        : undefined,

    changeFrequency:
      'monthly',

    priority: 0.8,
  }))

  const archivePages: MetadataRoute.Sitemap =
  ARCHIVE.map((category) => ({
    url:
      `${baseUrl}/archive/${encodeURIComponent(
        category.slug,
      )}`,

    changeFrequency:
      'monthly',

    priority: 0.8,
  }))

  const archiveAlbumPages: MetadataRoute.Sitemap =
  ARCHIVE.flatMap((category) =>
    category.albums.map((album) => ({
      url:
        `${baseUrl}/archive/${encodeURIComponent(
          category.slug,
        )}/${encodeURIComponent(
          album.slug,
        )}`,

      changeFrequency:
        'monthly',

      priority: 0.8,
    })),
  )

  return [
    ...staticPages,
    ...eventPages,
    ...guidePages,
    ...archivePages,
    ...archiveAlbumPages,
  ]
}