import type { Metadata } from 'next'
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

async function getArmorCodexGuide() {
  const supabase = getSupabase()

  if (!supabase) {
    return null
  }

  const {
    data,
    error,
  } = await supabase
    .from('guides')
    .select(`
      title,
      description,
      image,
      seo_title,
      seo_description
    `)
    .eq(
      'slug',
      'armor-codex'
    )
    .eq(
      'published',
      true
    )
    .single()

  if (
    error ||
    !data
  ) {
    console.error(
      '[ARMOR CODEX] Failed to load guide metadata:',
      error
    )

    return null
  }

  return data
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

export async function generateMetadata(): Promise<Metadata> {
  const guide =
    await getArmorCodexGuide()

  const title =
    guide?.seo_title?.trim() ||
    guide?.title ||
    '星际公民护甲图鉴'

  const description =
    guide?.seo_description?.trim() ||
    guide?.description ||
    '整理《星际公民》稀有护甲、获取方式与系列资料的中文护甲图鉴。'

  const image =
    guide?.image ||
    undefined

  return {
    title,
    description,

    alternates: {
      canonical: '/guides/armor-codex',
    },

    openGraph: {
      title,
      description,
      type: 'website',

      images:
        image
          ? [
              {
                url: image,
                alt: title,
              },
            ]
          : undefined,
    },

    twitter: {
      card:
        'summary_large_image',

      title,
      description,

      images:
        image
          ? [image]
          : undefined,
    },
  }
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