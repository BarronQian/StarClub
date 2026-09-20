import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  requireAdminApi,
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
      const auth =
        await requireAdminApi()

      if (auth.response) {
        return auth.response
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

    const hasEditableField =
  [
    'title',
    'category',
    'content',
    'url',
    'keywords',
    'sort_order',
    'is_active',
  ].some(
    (key) =>
      Object.prototype
        .hasOwnProperty.call(
          body,
          key,
        ),
  )

if (!hasEditableField) {
  return NextResponse.json(
    {
      error:
        '没有需要更新的内容',
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
      const url =
        body.url.trim()

      if (
        url.length > 500
      ) {
        return NextResponse.json(
          {
            error:
              '相关页面 URL 不能超过 500 个字符',
          },
          {
            status: 400,
          },
        )
      }

      updateData.url =
        url || null
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
          Array.from(
            new Set(
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
                    item
                      .trim()
                      .slice(
                        0,
                        60,
                      ),
                )
                .filter(Boolean),
            ),
          ).slice(
            0,
            50,
          )
      }

    /*
     * 优先级
     */
      if (
        typeof body.sort_order ===
        'number'
      ) {
        if (
          !Number.isFinite(
            body.sort_order,
          )
        ) {
          return NextResponse.json(
            {
              error:
                '优先级格式无效',
            },
            {
              status: 400,
            },
          )
        }

        const sortOrder =
          Math.trunc(
            body.sort_order,
          )

        if (
          sortOrder < -10000 ||
          sortOrder > 10000
        ) {
          return NextResponse.json(
            {
              error:
                '优先级必须在 -10000 到 10000 之间',
            },
            {
              status: 400,
            },
          )
        }

        updateData.sort_order =
          sortOrder
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
      const auth =
        await requireAdminApi()

      if (auth.response) {
        return auth.response
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