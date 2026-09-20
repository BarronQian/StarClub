import type {
  Metadata,
} from 'next'

import {
  redirect,
} from 'next/navigation'

import {
  getAdminSession,
} from '@/lib/admin-auth'

import {
  createAdminClient,
} from '@/lib/supabase-admin'

import {
  AdminHeader,
} from '@/components/admin/admin-header'

import {
  AIKnowledgeAdmin,
} from '@/components/admin/ai-knowledge-admin'

export const metadata: Metadata = {
  title:
    'AI 知识库 | 星际酒馆 StarClub',

  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic =
  'force-dynamic'

export type AIKnowledge = {
  id: string

  title: string
  category: string
  content: string

  url: string | null
  keywords: string[]

  is_active: boolean
  sort_order: number

  created_at: string
  updated_at: string
}

export default async function AdminAIKnowledgePage() {
  const session =
    await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  const supabase =
    createAdminClient()

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'ai_assistant_knowledge',
      )
      .select(`
        id,
        title,
        category,
        content,
        url,
        keywords,
        is_active,
        sort_order,
        created_at,
        updated_at
      `)
      .order(
        'sort_order',
        {
          ascending: false,
        },
      )
      .order(
        'updated_at',
        {
          ascending: false,
        },
      )

  if (error) {
    console.error(
      '[AI KNOWLEDGE ADMIN] Load failed:',
      error,
    )
  }

  const knowledge =
    (data ??
      []) as AIKnowledge[]

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-10 pt-20">
      <AdminHeader
        adminEmail={
          session.email
        }
        active="ai-knowledge"
      />

      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
              AI 知识库
            </h2>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
              管理酒馆智能助手
              Chris Robots（小萝卜）
              使用的动态知识。
              启用后的内容可以被智能助手检索，
              无需重新部署网站。
            </p>
          </div>

          <div className="text-right text-xs text-muted-foreground">
            <div>
              {knowledge.length}{' '}
              条知识
            </div>

            <div className="mt-1">
              {
                knowledge.filter(
                  (item) =>
                    item.is_active,
                ).length
              }{' '}
              条启用
            </div>
          </div>
        </div>

        <AIKnowledgeAdmin
          initialKnowledge={
            knowledge
          }
        />
        
      </section>
    </main>
  )
}