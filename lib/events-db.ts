import {
  createClient,
} from '@supabase/supabase-js'

import {
  unstable_cache,
} from 'next/cache'

import type {
  EventItem,
} from '@/lib/events'

type CommunityEventRow = {
  id: string

  slug: string
  tag: string
  title: string
  subtitle: string | null

  date: string
  timezone: string | null
  start_times: string[]

  location: string

  category: EventItem['category']
  subcategory: EventItem['subcategory'] | null
  series: EventItem['series'] | null
  sandbox_type: EventItem['sandboxType'] | null

  custom_tags: EventItem['customTags']
  tags: EventItem['tags']

  status: EventItem['status']

  image: string
  alt: string

  description: string
  details: string | null

  rules: string[]
  rewards: string[]

  slots: string | null

  discord_url: string | null
  archive_href: string | null

  featured_on_home: boolean

  is_published: boolean
  sort_order: number

  deleted_at: string | null

  created_at: string
  updated_at: string
}

function getSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    return null
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

function rowToEventItem(
  row: CommunityEventRow,
): EventItem {
  return {
    slug:
      row.slug,

    tag:
      row.tag,

    title:
      row.title,

    subtitle:
      row.subtitle ?? undefined,

    date:
      row.date,

    timezone:
      row.timezone ?? undefined,

    startTimes:
      row.start_times?.length
        ? row.start_times
        : undefined,

    location:
      row.location,

    category:
      row.category,

    subcategory:
      row.subcategory ?? undefined,

    series:
      row.series ?? undefined,

    sandboxType:
      row.sandbox_type ?? undefined,

    customTags:
      row.custom_tags?.length
        ? row.custom_tags
        : undefined,

    tags:
      row.tags?.length
        ? row.tags
        : undefined,

    status:
      row.status,

    image:
      row.image,

    alt:
      row.alt,

    description:
      row.description,

    details:
      row.details ?? undefined,

    rules:
      row.rules?.length
        ? row.rules
        : undefined,

    rewards:
      row.rewards?.length
        ? row.rewards
        : undefined,

    slots:
      row.slots ?? undefined,

    discordUrl:
      row.discord_url ?? undefined,

    archiveHref:
      row.archive_href ?? undefined,

    featuredOnHome:
      row.featured_on_home,
  }
}

export async function getEventsFromDb(): Promise<
  EventItem[]
> {
  const supabase =
    getSupabase()

  if (!supabase) {
    return []
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'community_events',
    )
    .select('*')
    .eq(
      'is_published',
      true,
    )
    .is(
      'deleted_at',
      null,
    )
    .order(
      'sort_order',
      {
        ascending: false,
      },
    )
    .order(
      'created_at',
      {
        ascending: false,
      },
    )

  if (
    error ||
    !data
  ) {
    console.error(
      '[EVENTS DB]',
      error,
    )

    return []
  }

  return (
    data as CommunityEventRow[]
  ).map(
    rowToEventItem,
  )
}

export async function getEventFromDb(
  slug: string,
): Promise<EventItem | null> {
  const supabase =
    getSupabase()

  if (!supabase) {
    return null
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'community_events',
    )
    .select('*')
    .eq(
      'slug',
      slug,
    )
    .eq(
      'is_published',
      true,
    )
    .is(
      'deleted_at',
      null,
    )
    .maybeSingle()

  if (
    error ||
    !data
  ) {
    if (error) {
      console.error(
        '[EVENT DB]',
        error,
      )
    }

    return null
  }

  return rowToEventItem(
    data as CommunityEventRow,
  )
}

async function getHomeFeaturedEventsFromDbUncached(): Promise<
  EventItem[]
> {
  const supabase =
    getSupabase()

  if (!supabase) {
    return []
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'community_events',
    )
    .select('*')
    .eq(
      'is_published',
      true,
    )
    .eq(
      'featured_on_home',
      true,
    )
    .is(
      'deleted_at',
      null,
    )
    .order(
      'sort_order',
      {
        ascending: false,
      },
    )
    .order(
      'created_at',
      {
        ascending: false,
      },
    )
    .limit(3)

  if (
    error ||
    !data
  ) {
    console.error(
      '[FEATURED EVENTS DB]',
      error,
    )

    return []
  }

  return (
    data as CommunityEventRow[]
  ).map(
    rowToEventItem,
  )
}

export const getHomeFeaturedEventsFromDb =
  unstable_cache(
    getHomeFeaturedEventsFromDbUncached,
    ['home-featured-events'],
    {
      revalidate: 60,
    },
  )