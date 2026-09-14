import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

import {
  AdminGuideForm,
  type AdminGuideFormData,
} from '@/components/admin-guide-form'

import {
  AdminGuideBlockEditor,
  type EditableGuideBlock,
} from '@/components/admin-guide-block-editor'

import {
  AdminGuideDeleteButton,
} from '@/components/admin-guide-delete-button'

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

type BlockRow = {
  id: string
  block_type:
    | 'heading'
    | 'paragraph'
    | 'image'
    | 'list'
    | 'callout'
    | 'video'
  block_order: number
  content: Record<
    string,
    unknown
  >
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

async function getGuideBlocks(
  guideId: string,
) {
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
      'guide_content_blocks',
    )
    .select(`
      id,
      block_type,
      block_order,
      content
    `)
    .eq(
      'guide_id',
      guideId,
    )
    .order(
      'block_order',
      {
        ascending: true,
      },
    )

  if (error) {
    console.error(
      '[ADMIN GUIDE BLOCKS] Load failed:',
      error,
    )

    return []
  }

  return (
    data ?? []
  ) as BlockRow[]
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

  const blocks =
    guide.type ===
    'article'
      ? await getGuideBlocks(
          guide.id,
        )
      : []

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

  const initialBlocks: EditableGuideBlock[] =
    blocks.map(
      (block) => ({
        id:
          block.id,

        block_type:
          block.block_type,

        block_order:
          block.block_order,

        content:
          block.content ??
          {},
      }),
    )

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

            <AdminGuideDeleteButton
              guideId={guide.id}
              guideTitle={guide.title}
            />
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

        {guide.type ===
          'article' && (
          <div className="mt-8">
            <AdminGuideBlockEditor
              guideId={
                guide.id
              }
              initialBlocks={
                initialBlocks
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}