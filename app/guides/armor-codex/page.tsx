import { createClient } from '@supabase/supabase-js'

import {
  ArmorCodexContent,
  type ArmorSeriesItem,
} from '@/components/armor-codex-content'

function getSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL

  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

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
    }
  )
}

type GuideSectionRow = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  image: string | null
  tags: string[] | null
  published: boolean
  sort_order: number
}

async function getArmorSeries() {
  const supabase = getSupabase()

  if (!supabase) {
    console.error(
      '[ARMOR CODEX] Supabase env missing'
    )

    return []
  }

  const {
    data: guide,
    error: guideError,
  } = await supabase
    .from('guides')
    .select('id')
    .eq('slug', 'armor-codex')
    .single()

  if (
    guideError ||
    !guide
  ) {
    console.error(
      '[ARMOR CODEX] Failed to find parent guide:',
      guideError
    )

    return []
  }

  const {
    data,
    error,
  } = await supabase
    .from('guide_sections')
    .select(`
      id,
      slug,
      title,
      subtitle,
      image,
      tags,
      published,
      sort_order
    `)
    .eq(
      'guide_id',
      guide.id
    )
    .eq(
      'published',
      true
    )
    .order(
      'sort_order',
      {
        ascending: true,
      }
    )

  if (error) {
    console.error(
      '[ARMOR CODEX] Failed to load sections:',
      error
    )

    return []
  }

  return (
    (data as GuideSectionRow[] | null) ?? []
  ).map(
    (row): ArmorSeriesItem => ({
      id: row.id,
      slug: row.slug,
      name: row.title,
      cn: row.subtitle ?? '',
      image: row.image ?? '',
      sources:
        (row.tags ?? []) as ArmorSeriesItem['sources'],
    })
  )
}

export default async function ArmorCodexPage() {
  const armorSeries =
    await getArmorSeries()

  return (
    <ArmorCodexContent
      armorSeries={armorSeries}
    />
  )
}