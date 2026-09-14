import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

import {
  requireAdminApi,
} from '@/lib/admin-auth'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type SectionInput = {
  id?: string
  slug?: string
  title?: string
  subtitle?: string
  description?: string
  image?: string
  tags?: unknown
  published?: boolean
  sort_order?: number
}

function getAdminSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      'Missing Supabase server environment variables',
    )
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

function normalizeSlug(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(
      /[^a-z0-9-_]/g,
      '',
    )
}

function normalizeTags(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (
        item,
      ): item is string =>
        typeof item ===
        'string',
    )
    .map((item) =>
      item.trim(),
    )
    .filter(Boolean)
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  try {
    const { id } =
      await context.params

    const supabase =
      getAdminSupabase()

    const {
      data: sections,
      error,
    } = await supabase
      .from(
        'guide_sections',
      )
      .select(
        `
        id,
        guide_id,
        slug,
        title,
        subtitle,
        description,
        image,
        tags,
        published,
        sort_order,
        created_at,
        updated_at
        `,
      )
      .eq(
        'guide_id',
        id,
      )
      .order(
        'sort_order',
        {
          ascending: true,
        },
      )

    if (error) {
      console.error(
        '[GUIDE SECTIONS] GET failed:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '读取系列失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      sections:
        sections ?? [],
    })
  } catch (error) {
    console.error(
      '[GUIDE SECTIONS] GET failed:',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '读取系列失败',
      },
      {
        status: 500,
      },
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  try {
    const { id } =
      await context.params

    const body =
      (await request.json()) as {
        sections?: SectionInput[]
      }

    if (
      !Array.isArray(
        body.sections,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '系列数据格式错误',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      getAdminSupabase()

    const {
      data: guide,
      error: guideError,
    } = await supabase
      .from('guides')
      .select(
        'id,title,slug',
      )
      .eq(
        'id',
        id,
      )
      .single()

    if (
      guideError ||
      !guide
    ) {
      return NextResponse.json(
        {
          error:
            '攻略不存在',
        },
        {
          status: 404,
        },
      )
    }

    const normalized =
      body.sections.map(
        (
          section,
          index,
        ) => {
          const slug =
            normalizeSlug(
              section.slug ??
                '',
            )

          const title =
            (
              section.title ??
              ''
            ).trim()

          return {
            id:
              section.id,

            guide_id:
              id,

            slug,

            title,

            subtitle:
              (
                section.subtitle ??
                ''
              ).trim() ||
              null,

            description:
              (
                section.description ??
                ''
              ).trim() ||
              null,

            image:
              (
                section.image ??
                ''
              ).trim() ||
              null,

            tags:
              normalizeTags(
                section.tags,
              ),

            published:
              section.published !==
              false,

            sort_order:
              Number.isFinite(
                section.sort_order,
              )
                ? Number(
                    section.sort_order,
                  )
                : (index + 1) *
                  10,
          }
        },
      )

    for (
      const section of
      normalized
    ) {
      if (
        !section.slug ||
        !section.title
      ) {
        return NextResponse.json(
          {
            error:
              '每个系列都必须填写标题和 Slug',
          },
          {
            status: 400,
          },
        )
      }
    }

    const slugs =
      normalized.map(
        (section) =>
          section.slug,
      )

    if (
      new Set(slugs)
        .size !==
      slugs.length
    ) {
      return NextResponse.json(
        {
          error:
            '系列 Slug 不能重复',
        },
        {
          status: 400,
        },
      )
    }

    const {
      data:
        currentSections,
      error:
        currentError,
    } = await supabase
      .from(
        'guide_sections',
      )
      .select('id')
      .eq(
        'guide_id',
        id,
      )

    if (currentError) {
      return NextResponse.json(
        {
          error:
            '读取现有系列失败',
        },
        {
          status: 500,
        },
      )
    }

    const incomingIds =
      new Set(
        normalized
          .map(
            (section) =>
              section.id,
          )
          .filter(
            (
              value,
            ): value is string =>
              typeof value ===
              'string' &&
              value.length > 0,
          ),
      )

    const idsToDelete =
      (
        currentSections ??
        []
      )
        .map(
          (section) =>
            section.id,
        )
        .filter(
          (sectionId) =>
            !incomingIds.has(
              sectionId,
            ),
        )

    if (
      idsToDelete.length >
      0
    ) {
      const {
        error:
          deleteError,
      } = await supabase
        .from(
          'guide_sections',
        )
        .delete()
        .in(
          'id',
          idsToDelete,
        )

      if (deleteError) {
        console.error(
          '[GUIDE SECTIONS] Delete failed:',
          deleteError,
        )

        return NextResponse.json(
          {
            error:
              '删除旧系列失败',
          },
          {
            status: 500,
          },
        )
      }
    }

    for (
      const section of
      normalized
    ) {
      if (
        section.id
      ) {
        const {
          error:
            updateError,
        } = await supabase
          .from(
            'guide_sections',
          )
          .update({
            slug:
              section.slug,

            title:
              section.title,

            subtitle:
              section.subtitle,

            description:
              section.description,

            image:
              section.image,

            tags:
              section.tags,

            published:
              section.published,

            sort_order:
              section.sort_order,
          })
          .eq(
            'id',
            section.id,
          )
          .eq(
            'guide_id',
            id,
          )

        if (
          updateError
        ) {
          console.error(
            '[GUIDE SECTIONS] Update failed:',
            updateError,
          )

          return NextResponse.json(
            {
              error:
                `更新系列「${section.title}」失败`,
            },
            {
              status: 500,
            },
          )
        }
      } else {
        const {
          error:
            insertError,
        } = await supabase
          .from(
            'guide_sections',
          )
          .insert({
            guide_id:
              id,

            slug:
              section.slug,

            title:
              section.title,

            subtitle:
              section.subtitle,

            description:
              section.description,

            image:
              section.image,

            tags:
              section.tags,

            published:
              section.published,

            sort_order:
              section.sort_order,
          })

        if (
          insertError
        ) {
          console.error(
            '[GUIDE SECTIONS] Insert failed:',
            insertError,
          )

          return NextResponse.json(
            {
              error:
                `新增系列「${section.title}」失败`,
            },
            {
              status: 500,
            },
          )
        }
      }
    }

    const {
      data: sections,
      error:
        reloadError,
    } = await supabase
      .from(
        'guide_sections',
      )
      .select(
        `
        id,
        guide_id,
        slug,
        title,
        subtitle,
        description,
        image,
        tags,
        published,
        sort_order,
        created_at,
        updated_at
        `,
      )
      .eq(
        'guide_id',
        id,
      )
      .order(
        'sort_order',
        {
          ascending: true,
        },
      )

    if (reloadError) {
      return NextResponse.json(
        {
          error:
            '系列已保存，但重新读取失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      sections:
        sections ?? [],
    })
  } catch (error) {
    console.error(
      '[GUIDE SECTIONS] PUT failed:',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '保存系列失败',
      },
      {
        status: 500,
      },
    )
  }
}