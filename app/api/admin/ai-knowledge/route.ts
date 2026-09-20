import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  getAdminSession,
} from '@/lib/admin-auth'

import {
  createAdminClient,
} from '@/lib/supabase-admin'

export const dynamic =
  'force-dynamic'

export const revalidate = 0

const ALLOWED_CATEGORIES =
  new Set([
    'general',
    'website',
    'community',
    'discord',
    'event',
    'guide',
    'market',
    'tool',
    'faq',
  ])

export async function POST(
  request: NextRequest,
) {
  try {
    /*
     * 1. 验证后台管理员
     */
    const session =
      await getAdminSession()

    if (!session) {
      return NextResponse.json(
        {
          error:
            '管理员登录状态已失效',
        },
        {
          status: 401,
        },
      )
    }

    /*
     * 2. 读取请求
     */
    let body:
      Record<string, unknown>

    try {
      body =
        await request.json()
    } catch {
      return NextResponse.json(
        {
          error:
            '请求内容格式错误',
        },
        {
          status: 400,
        },
      )
    }

    /*
     * 3. 清理和验证数据
     */
    const title =
      typeof body.title ===
        'string'
        ? body.title.trim()
        : ''

    const category =
      typeof body.category ===
        'string'
        ? body.category.trim()
        : 'general'

    const content =
      typeof body.content ===
        'string'
        ? body.content.trim()
        : ''

    const url =
      typeof body.url ===
        'string'
        ? body.url.trim()
        : ''

    const isActive =
      body.is_active !==
      false

    const rawSortOrder =
      typeof body.sort_order ===
        'number'
        ? body.sort_order
        : 0

    const sortOrder =
      Number.isFinite(
        rawSortOrder,
      )
        ? Math.trunc(
            rawSortOrder,
          )
        : 0

    const keywords =
      Array.isArray(
        body.keywords,
      )
        ? body.keywords
            .filter(
              (
                item,
              ): item is string =>
                typeof item ===
                'string',
            )
            .map(
              (item) =>
                item.trim(),
            )
            .filter(Boolean)
            .slice(0, 50)
        : []

    if (!title) {
      return NextResponse.json(
        {
          error:
            '请输入知识标题',
        },
        {
          status: 400,
        },
      )
    }

    if (
      title.length > 120
    ) {
      return NextResponse.json(
        {
          error:
            '知识标题不能超过 120 个字符',
        },
        {
          status: 400,
        },
      )
    }

    if (!content) {
      return NextResponse.json(
        {
          error:
            '请输入知识内容',
        },
        {
          status: 400,
        },
      )
    }

    if (
      content.length >
      20000
    ) {
      return NextResponse.json(
        {
          error:
            '单条知识内容不能超过 20000 个字符',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !ALLOWED_CATEGORIES.has(
        category,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '知识分类无效',
        },
        {
          status: 400,
        },
      )
    }

    /*
     * 4. 写入 Supabase
     */
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
        .insert({
          title,
          category,
          content,

          url:
            url ||
            null,

          keywords,

          sort_order:
            sortOrder,

          is_active:
            isActive,

          updated_at:
            new Date()
              .toISOString(),
        })
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
        .single()

    if (error) {
      console.error(
        '[AI KNOWLEDGE API] Insert failed:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '保存知识失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        knowledge:
          data,
      },
      {
        status: 201,

        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      },
    )
  } catch (error) {
    console.error(
      '[AI KNOWLEDGE API] Unexpected error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '保存知识失败，请稍后再试',
      },
      {
        status: 500,
      },
    )
  }
}