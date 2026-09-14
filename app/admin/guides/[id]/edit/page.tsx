import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

import {
  AdminGuideForm,
  type AdminGuideFormData,
} from '@/components/admin-guide-form'

function getSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY

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

type GuideRow = {
  id: string
  slug: string
  title: string
  description: string | null
  category: string
  tags: string[] | null
  type:
    | 'article'
    | 'video'
    | 'discord'
    | 'external'
  image: string | null
  author: string | null
  creator: string | null
  video_url: string | null
  original: boolean
  published: boolean
  featured: boolean
  sort_order: number
  published_at: string | null
  seo_title: string | null
  seo_description: string | null
}

async function getGuide(
  id: string,
) {
  const supabase =
    getSupabase()

  if (!supabase) {
    return null
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
      published_at,
      seo_title,
      seo_description
    `)
    .eq(
      'id',
      id,
    )
    .single()

  if (
    error ||
    !data
  ) {
    return null
  }

  return data as GuideRow
}

type EditGuidePageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditGuidePage({
  params,
}: EditGuidePageProps) {
  const {
    id,
  } = await params

  const guide =
    await getGuide(id)

  if (!guide) {
    notFound()
  }

  const initialData: AdminGuideFormData =
    {
      id:
        guide.id,

      title:
        guide.title,

      slug:
        guide.slug,

      description:
        guide.description ??
        '',

      category:
        guide.category as AdminGuideFormData['category'],

      tags:
        guide.tags ??
        [],

      type:
        guide.type,

      image:
        guide.image ??
        '',

      author:
        guide.author ??
        '',

      creator:
        guide.creator ??
        '',

      video_url:
        guide.video_url ??
        '',

      original:
        guide.original,

      published:
        guide.published,

      featured:
        guide.featured,

      sort_order:
        guide.sort_order,

      published_at:
        guide.published_at ??
        '',

      seo_title:
        guide.seo_title ??
        '',

      seo_description:
        guide.seo_description ??
        '',
    }

  return (
    <div className="min-h-screen bg-background">
      <div className="site-container max-w-5xl py-10 lg:py-14">
        <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-display text-[0.65rem] tracking-[0.32em] text-primary">
              ADMIN / GUIDES
            </span>

            <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
              编辑攻略
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              {guide.title}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {guide.published && (
              <Link
                href={`/guides/${guide.slug}`}
                target="_blank"
                className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                查看前台
              </Link>
            )}

            <Link
              href="/admin/guides"
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              返回攻略管理
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <AdminGuideForm
            mode="edit"
            initialData={
              initialData
            }
          />
        </div>
      </div>
    </div>
  )
}