import { createClient } from '@supabase/supabase-js'
import { Suspense } from 'react'

import {
  GuidesPageContent,
  type GuideListItem,
} from '@/components/guides-page-content'

import type { GuideCategory } from '@/lib/guides'

export const dynamic = 'force-dynamic'

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

type GuideRow = {
  id: string
  slug: string
  title: string
  description: string | null
  category: string
  tags: string[] | null
  type: 'article' | 'video' | 'external'
  image: string | null
  author: string | null
  creator: string | null
  video_url: string | null
  original: boolean
  published: boolean
  featured: boolean
  sort_order: number
  published_at: string | null
}

function formatGuideDate(
  value: string | null
) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)

  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Los_Angeles',
    }
  ).format(date)
}

function rowToGuide(
  row: GuideRow
): GuideListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? '',
    category:
      row.category as GuideCategory,
    tags: row.tags ?? [],
    type: row.type,
    image: row.image ?? undefined,
    author: row.author ?? undefined,
    creator: row.creator ?? undefined,
    videoUrl:
      row.video_url ?? undefined,
    original: row.original,
    date: formatGuideDate(
      row.published_at
    ),
  }
}

async function getGuides() {
  const supabase = getSupabase()

  if (!supabase) {
    console.error(
      '[GUIDES] Supabase env missing'
    )

    return []
  }

  const {
    data,
    error,
  } = await supabase
    .from('guides')
    .select(`
      id,
      slug,
      title,
      description,
      category,
      tags,
      type,
      image,
      author,
      creator,
      video_url,
      original,
      published,
      featured,
      sort_order,
      published_at
    `)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false })

  if (error) {
    console.error(
      '[GUIDES] Failed to load guides:',
      error
    )

    return []
  }

  return (
    (data as GuideRow[] | null) ?? []
  ).map(rowToGuide)
}

export default async function GuidesPage() {
  const guides =
    await getGuides()

  return (
    <Suspense
      fallback={
        <div className="site-container py-24 text-sm text-muted-foreground">
          正在加载攻略...
        </div>
      }
    >
      <GuidesPageContent
        guides={guides}
      />
    </Suspense>
  )
}