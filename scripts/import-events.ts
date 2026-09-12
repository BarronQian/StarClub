import { createClient } from '@supabase/supabase-js'

import {
  EVENTS,
} from '../lib/events'

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error(
    'Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL',
  )
}

if (!serviceRoleKey) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY',
  )
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
)

async function main() {
  console.log(
    `准备导入 ${EVENTS.length} 条活动...`,
  )

  const rows = EVENTS.map(
    (event, index) => ({
      slug:
        event.slug,

      tag:
        event.tag,

      title:
        event.title,

      subtitle:
        event.subtitle ?? null,

      date:
        event.date,

      timezone:
        event.timezone ?? null,

      start_times:
        event.startTimes ?? [],

      location:
        event.location,

      category:
        event.category,

      subcategory:
        event.subcategory ?? null,

      series:
        event.series ?? null,

      sandbox_type:
        event.sandboxType ?? null,

      custom_tags:
        event.customTags ?? [],

      tags:
        event.tags ?? [],

      status:
        event.status,

      image:
        event.image,

      alt:
        event.alt,

      description:
        event.description,

      details:
        event.details ?? null,

      rules:
        event.rules ?? [],

      rewards:
        event.rewards ?? [],

      slots:
        event.slots ?? null,

      discord_url:
        event.discordUrl ?? null,

      archive_href:
        event.archiveHref ?? null,

      featured_on_home:
        event.featuredOnHome ?? false,

      is_published:
        true,

      sort_order:
        EVENTS.length - index,
    }),
  )

  const {
    data,
    error,
  } = await supabase
    .from(
      'community_events',
    )
    .upsert(
      rows,
      {
        onConflict:
          'slug',
      },
    )
    .select(
      'id, slug, title',
    )

  if (error) {
    console.error(
      '导入失败：',
      error,
    )

    process.exit(1)
  }

  console.log(
    `导入成功：${data?.length ?? 0} 条`,
  )

  for (
    const item of
      data ?? []
  ) {
    console.log(
      `✓ ${item.slug} — ${item.title}`,
    )
  }
}

main().catch(
  (error) => {
    console.error(
      '导入脚本异常：',
      error,
    )

    process.exit(1)
  },
)