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

function getSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      'Missing Supabase server environment variables'
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
    }
  )
}

type RouteContext = {
  params: Promise<{
    id: string
    sectionId: string
  }>
}

const normalizeTags = (
  value: unknown
): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === 'string'
    )
    .map((item) => item.trim())
    .filter(Boolean)
}

type NormalizedGuideSectionItem = {
  id?: string
  section_id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  image: string | null
  source: string | null
  acquisition: string | null
  tags: string[]
  published: boolean
  sort_order: number
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  const {
    id,
    sectionId,
  } = await context.params

  const supabase =
    getSupabase()

  const {
    data: section,
    error: sectionError,
  } = await supabase
    .from('guide_sections')
    .select(`
      id,
      guide_id
    `)
    .eq(
      'id',
      sectionId
    )
    .eq(
      'guide_id',
      id
    )
    .single()

  if (
    sectionError ||
    !section
  ) {
    return NextResponse.json(
      {
        error:
          'Guide section not found',
      },
      {
        status: 404,
      }
    )
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'guide_section_items'
    )
    .select(`
      id,
      section_id,
      slug,
      title,
      subtitle,
      description,
      image,
      source,
      acquisition,
      tags,
      published,
      sort_order,
      created_at,
      updated_at
    `)
    .eq(
      'section_id',
      sectionId
    )
    .order(
      'sort_order',
      {
        ascending: true,
      }
    )

  if (error) {
    console.error(
      '[GUIDE SECTION ITEMS] Failed to load:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to load items',
      },
      {
        status: 500,
      }
    )
  }

  return NextResponse.json({
    ok: true,
    items: data ?? [],
  })
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  const {
    id,
    sectionId,
  } = await context.params

  const supabase =
    getSupabase()

  const {
    data: section,
    error: sectionError,
  } = await supabase
    .from('guide_sections')
    .select(`
      id,
      guide_id
    `)
    .eq(
      'id',
      sectionId
    )
    .eq(
      'guide_id',
      id
    )
    .single()

  if (
    sectionError ||
    !section
  ) {
    return NextResponse.json(
      {
        error:
          'Guide section not found',
      },
      {
        status: 404,
      }
    )
  }

  const body =
    await request.json()

  const incomingItems =
    Array.isArray(body?.items)
      ? body.items
      : []

  const normalizedItems: NormalizedGuideSectionItem[] =
    incomingItems.map(
      (
        item: Record<
          string,
          unknown
        >,
        index: number
      ) => {
        const rawId =
          typeof item.id === 'string'
            ? item.id.trim()
            : ''

        const rawSlug =
          typeof item.slug === 'string'
            ? item.slug.trim()
            : ''

        const rawTitle =
          typeof item.title === 'string'
            ? item.title.trim()
            : ''

        const subtitle =
          typeof item.subtitle === 'string'
            ? item.subtitle.trim()
            : ''

        const description =
          typeof item.description === 'string'
            ? item.description.trim()
            : ''

        const image =
          typeof item.image === 'string'
            ? item.image.trim()
            : ''

        const source =
          typeof item.source === 'string'
            ? item.source.trim()
            : ''

        const acquisition =
          typeof item.acquisition === 'string'
            ? item.acquisition.trim()
            : ''

        const sortOrder =
          typeof item.sort_order === 'number' &&
          Number.isFinite(
            item.sort_order
          )
            ? item.sort_order
            : (index + 1) * 10

        return {
          id:
            rawId ||
            undefined,

          section_id:
            sectionId,

          slug:
            rawSlug,

          title:
            rawTitle,

          subtitle:
            subtitle || null,

          description:
            description || null,

          image:
            image || null,

          source:
            source || null,

          acquisition:
            acquisition || null,

          tags:
            normalizeTags(
              item.tags
            ),

          published:
            typeof item.published ===
            'boolean'
              ? item.published
              : true,

          sort_order:
            sortOrder,
        }
      }
    )

  for (
    const item
    of normalizedItems
  ) {
    if (
      !item.slug ||
      !item.title
    ) {
      return NextResponse.json(
        {
          error:
            'Each item requires title and slug',
        },
        {
          status: 400,
        }
      )
    }
  }

  const slugSet =
    new Set<string>()

  for (
    const item
    of normalizedItems
  ) {
    if (
      slugSet.has(
        item.slug
      )
    ) {
      return NextResponse.json(
        {
          error:
            `Duplicate item slug: ${item.slug}`,
        },
        {
          status: 400,
        }
      )
    }

    slugSet.add(
      item.slug
    )
  }

  const {
    data: existingItems,
    error: existingError,
  } = await supabase
    .from(
      'guide_section_items'
    )
    .select('id')
    .eq(
      'section_id',
      sectionId
    )

  if (existingError) {
    console.error(
      '[GUIDE SECTION ITEMS] Failed to read existing items:',
      existingError
    )

    return NextResponse.json(
      {
        error:
          'Failed to load existing items',
      },
      {
        status: 500,
      }
    )
  }

  const incomingIds =
    new Set<string>(
      normalizedItems
        .map(
          (
            item: {
              id?: string
            }
          ) =>
            item.id
        )
        .filter(
          (
            itemId: string | undefined
          ): itemId is string =>
            Boolean(itemId)
        )
    )

  const idsToDelete =
    (
      existingItems ?? []
    )
      .map(
        (item) =>
          item.id
      )
      .filter(
        (existingId) =>
          !incomingIds.has(
            existingId
          )
      )

  if (
    idsToDelete.length >
    0
  ) {
    const {
      error: deleteError,
    } = await supabase
      .from(
        'guide_section_items'
      )
      .delete()
      .eq(
        'section_id',
        sectionId
      )
      .in(
        'id',
        idsToDelete
      )

    if (deleteError) {
      console.error(
        '[GUIDE SECTION ITEMS] Failed to delete:',
        deleteError
      )

      return NextResponse.json(
        {
          error:
            'Failed to delete removed items',
        },
        {
          status: 500,
        }
      )
    }
  }

  for (
    const item
    of normalizedItems
  ) {
    if (item.id) {
      const {
        id: itemId,
        ...updateData
      } = item

      const {
        error: updateError,
      } = await supabase
        .from(
          'guide_section_items'
        )
        .update(
          updateData
        )
        .eq(
          'id',
          itemId
        )
        .eq(
          'section_id',
          sectionId
        )

      if (updateError) {
        console.error(
          '[GUIDE SECTION ITEMS] Failed to update item:',
          updateError
        )

        return NextResponse.json(
          {
            error:
              'Failed to update item',
          },
          {
            status: 500,
          }
        )
      }

      continue
    }

    const {
      id: _unusedId,
      ...insertData
    } = item

    const {
      error: insertError,
    } = await supabase
      .from(
        'guide_section_items'
      )
      .insert(
        insertData
      )

    if (insertError) {
      console.error(
        '[GUIDE SECTION ITEMS] Failed to insert item:',
        insertError
      )

      return NextResponse.json(
        {
          error:
            'Failed to create item',
        },
        {
          status: 500,
        }
      )
    }
  }

  const {
    data: savedItems,
    error: reloadError,
  } = await supabase
    .from(
      'guide_section_items'
    )
    .select(`
      id,
      section_id,
      slug,
      title,
      subtitle,
      description,
      image,
      source,
      acquisition,
      tags,
      published,
      sort_order,
      created_at,
      updated_at
    `)
    .eq(
      'section_id',
      sectionId
    )
    .order(
      'sort_order',
      {
        ascending: true,
      }
    )

  if (reloadError) {
    console.error(
      '[GUIDE SECTION ITEMS] Failed to reload:',
      reloadError
    )

    return NextResponse.json(
      {
        error:
          'Items saved but failed to reload',
      },
      {
        status: 500,
      }
    )
  }

  return NextResponse.json({
    ok: true,
    items:
      savedItems ?? [],
  })
}