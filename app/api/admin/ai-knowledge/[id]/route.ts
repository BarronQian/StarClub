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

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/*
 * 编辑知识 / 启用停用
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
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

    const {
      id,
    } =
      await context.params

    if (!id) {
      return NextResponse.json(
        {
          error:
            '知识 ID 无效',
        },
        {
          status: 400,
        },
      )
    }

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

    const updateData:
      Record<string, unknown> = {
        updated_at:
          new Date()
            .toISOString(),
      }

    /*
     * 标题
     */
    if (
      typeof body.title ===
      'string'
    ) {
      const title =
        body.title.trim()

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

      updateData.title =
        title
    }

    /*
     * 分类
     */
    if (
      typeof body.category ===
      'string'
    ) {
      const category =
        body.category.trim()

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

      updateData.category =
        category
    }

    /*
     * 内容
     */
    if (
      typeof body.content ===
      'string'
    ) {
      const content =
        body.content.trim()

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

      updateData.content =
        content
    }

    /*
     * URL
     */
    if (
      body.url === null
    ) {
      updateData.url =
        null
    } else if (
      typeof body.url ===
      'string'
    ) {
      updateData.url =
        body.url.trim() ||
        null
    }

    /*
     * 关键词
     */
    if (
      Array.isArray(
        body.keywords,
      )
    ) {
      updateData.keywords =
        body.keywords
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
    }

    /*
     * 优先级
     */
    if (
      typeof body.sort_order ===
        'number' &&
      Number.isFinite(
        body.sort_order,
      )
    ) {
      updateData.sort_order =
        Math.trunc(
          body.sort_order,
        )
    }

    /*
     * 启用 / 停用
     */
    if (
      typeof body.is_active ===
      'boolean'
    ) {
      updateData.is_active =
        body.is_active
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
        .update(
          updateData,
        )
        .eq(
          'id',
          id,
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
        .maybeSingle()

    if (error) {
      console.error(
        '[AI KNOWLEDGE API] Update failed:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '更新知识失败',
        },
        {
          status: 500,
        },
      )
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            '找不到这条知识',
        },
        {
          status: 404,
        },
      )
    }

    return NextResponse.json(
      {
        knowledge:
          data,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      },
    )
  } catch (error) {
    console.error(
      '[AI KNOWLEDGE API] PATCH error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '更新知识失败，请稍后再试',
      },
      {
        status: 500,
      },
    )
  }
}

/*
 * 永久删除知识
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
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

    const {
      id,
    } =
      await context.params

    if (!id) {
      return NextResponse.json(
        {
          error:
            '知识 ID 无效',
        },
        {
          status: 400,
        },
      )
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
        .delete()
        .eq(
          'id',
          id,
        )
        .select(
          'id',
        )
        .maybeSingle()

    if (error) {
      console.error(
        '[AI KNOWLEDGE API] Delete failed:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '删除知识失败',
        },
        {
          status: 500,
        },
      )
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            '找不到这条知识',
        },
        {
          status: 404,
        },
      )
    }

    return NextResponse.json(
      {
        success: true,
        id:
          data.id,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      },
    )
  } catch (error) {
    console.error(
      '[AI KNOWLEDGE API] DELETE error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '删除知识失败，请稍后再试',
      },
      {
        status: 500,
      },
    )
  }
}