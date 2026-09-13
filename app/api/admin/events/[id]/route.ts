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

import type {
  EventCategory,
  EventCustomTag,
  EventSandboxType,
  EventSeries,
  EventStatus,
  EventSubcategory,
  EventTag,
} from '@/lib/events'

export const dynamic =
  'force-dynamic'

const VALID_CATEGORIES: EventCategory[] = [
  'activity',
  'competition',
  'teaching',
  'group-photo',
  'other',
]

const VALID_SUBCATEGORIES: EventSubcategory[] = [
  'sandbox',
  'limited-time',
  'ship-flight',
  'custom',
  'community',
  'other',
]

const VALID_SERIES: EventSeries[] = [
  'gun-king',
  'air-combat-ace',
  'star-wing',
  'casual-competition',
  'other',
]

const VALID_SANDBOX_TYPES: EventSandboxType[] = [
  'executive-hangar',
  'asd-onyx',
  'laser-alignment',
  'storm-breaker',
  'tsg',
  'other',
]

const VALID_CUSTOM_TAGS: EventCustomTag[] = [
  'casual',
  'air-combat',
  'fps',
  'entertainment',
  'racing',
  'tribute',
  'other',
]

const VALID_TAGS: EventTag[] = [
  'casual',
  'air-combat',
  'fps',
  'entertainment',
  'racing',
  'crossover',
  'pve',
  'vehicle',
  'other',
]

const VALID_STATUSES: EventStatus[] = [
  'open',
  'upcoming',
  'ongoing',
  'ended',
]

function cleanString(
  value: unknown,
) {
  return String(
    value ?? '',
  ).trim()
}

function cleanOptionalString(
  value: unknown,
) {
  const result =
    cleanString(value)

  return result || null
}

function cleanStringArray(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) =>
      String(
        item ?? '',
      ).trim(),
    )
    .filter(Boolean)
}

function isValidValue<
  T extends string,
>(
  value: string,
  allowed: readonly T[],
): value is T {
  return allowed.includes(
    value as T,
  )
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  },
) {
  try {
    const session =
      await getAdminSession()

    if (!session) {
      return NextResponse.json(
        {
          error:
            '没有管理员权限',
        },
        {
          status: 401,
        },
      )
    }

    const { id } =
      await context.params

    let body: any = {}

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

    const slug =
      cleanString(
        body.slug,
      )

    const tag =
      cleanString(
        body.tag,
      )

    const title =
      cleanString(
        body.title,
      )

    const subtitle =
      cleanOptionalString(
        body.subtitle,
      )

    const date =
      cleanString(
        body.date,
      )

    const timezone =
      cleanOptionalString(
        body.timezone,
      )

    const startTimes =
      cleanStringArray(
        body.startTimes,
      )

    const location =
      cleanString(
        body.location,
      )

    const category =
      cleanString(
        body.category,
      )

    const subcategory =
      cleanOptionalString(
        body.subcategory,
      )

    const series =
      cleanOptionalString(
        body.series,
      )

    const sandboxType =
      cleanOptionalString(
        body.sandboxType,
      )

    const customTags =
      cleanStringArray(
        body.customTags,
      )

    const tags =
      cleanStringArray(
        body.tags,
      )

    const status =
      cleanString(
        body.status,
      )

    const image =
      cleanString(
        body.image,
      )

    const alt =
      cleanString(
        body.alt,
      )

    const description =
      cleanString(
        body.description,
      )

    const details =
      cleanOptionalString(
        body.details,
      )

    const rules =
      cleanStringArray(
        body.rules,
      )

    const rewards =
      cleanStringArray(
        body.rewards,
      )

    const slots =
      cleanOptionalString(
        body.slots,
      )

    const discordUrl =
      cleanOptionalString(
        body.discordUrl,
      )

    const archiveHref =
      cleanOptionalString(
        body.archiveHref,
      )

    const featuredOnHome =
      Boolean(
        body.featuredOnHome,
      )

    const isPublished =
      Boolean(
        body.isPublished,
      )

    const sortOrder =
      Number.isFinite(
        Number(
          body.sortOrder,
        ),
      )
        ? Number(
            body.sortOrder,
          )
        : 0

    if (
      !slug ||
      !tag ||
      !title ||
      !date ||
      !location ||
      !image ||
      !description
    ) {
      return NextResponse.json(
        {
          error:
            '请填写所有必填字段',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        slug,
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Slug 只能使用小写英文字母、数字和连字符',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !isValidValue(
        category,
        VALID_CATEGORIES,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '活动分类无效',
        },
        {
          status: 400,
        },
      )
    }

    if (
      subcategory &&
      !isValidValue(
        subcategory,
        VALID_SUBCATEGORIES,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '活动子分类无效',
        },
        {
          status: 400,
        },
      )
    }

    if (
      series &&
      !isValidValue(
        series,
        VALID_SERIES,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '赛事系列无效',
        },
        {
          status: 400,
        },
      )
    }

    if (
      sandboxType &&
      !isValidValue(
        sandboxType,
        VALID_SANDBOX_TYPES,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '沙盒活动类型无效',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !isValidValue(
        status,
        VALID_STATUSES,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '活动状态无效',
        },
        {
          status: 400,
        },
      )
    }

    if (
      customTags.some(
        (value) =>
          !isValidValue(
            value,
            VALID_CUSTOM_TAGS,
          ),
      )
    ) {
      return NextResponse.json(
        {
          error:
            '活动自定义标签无效',
        },
        {
          status: 400,
        },
      )
    }

    if (
      tags.some(
        (value) =>
          !isValidValue(
            value,
            VALID_TAGS,
          ),
      )
    ) {
      return NextResponse.json(
        {
          error:
            '活动标签无效',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      createAdminClient()

    const {
      data: currentEvent,
      error:
        currentEventError,
    } =
      await supabase
        .from(
          'community_events',
        )
        .select(
          'id, slug, deleted_at',
        )
        .eq(
          'id',
          id,
        )
        .maybeSingle()

    if (
      currentEventError
    ) {
      console.error(
        'Failed to load event for admin edit:',
        currentEventError,
      )

      return NextResponse.json(
        {
          error:
            '读取活动失败',
        },
        {
          status: 500,
        },
      )
    }

    if (
      !currentEvent ||
      currentEvent.deleted_at
    ) {
      return NextResponse.json(
        {
          error:
            '活动不存在或已删除',
        },
        {
          status: 404,
        },
      )
    }

    if (
      slug !==
      currentEvent.slug
    ) {
      const {
        data:
          duplicateEvent,
        error:
          duplicateError,
      } =
        await supabase
          .from(
            'community_events',
          )
          .select('id')
          .eq(
            'slug',
            slug,
          )
          .neq(
            'id',
            id,
          )
          .maybeSingle()

      if (
        duplicateError
      ) {
        return NextResponse.json(
          {
            error:
              '检查 Slug 失败',
          },
          {
            status: 500,
          },
        )
      }

      if (
        duplicateEvent
      ) {
        return NextResponse.json(
          {
            error:
              '该 Slug 已经存在',
          },
          {
            status: 409,
          },
        )
      }
    }

    const now =
      new Date().toISOString()

    const {
      data: updatedEvent,
      error:
        updateError,
    } =
      await supabase
        .from(
          'community_events',
        )
        .update({
          slug,
          tag,
          title,
          subtitle,

          date,
          timezone,
          start_times:
            startTimes,

          location,

          category,
          subcategory,
          series,
          sandbox_type:
            sandboxType,

          custom_tags:
            customTags,
          tags,

          status,

          image,
          alt:
            alt ||
            title,

          description,
          details,

          rules,
          rewards,

          slots,

          discord_url:
            discordUrl,

          archive_href:
            archiveHref,

          featured_on_home:
            featuredOnHome,

          is_published:
            isPublished,

          sort_order:
            sortOrder,

          updated_at:
            now,
        })
        .eq(
          'id',
          id,
        )
        .select(`
          id,
          slug,
          title,
          status,
          is_published,
          featured_on_home,
          updated_at
        `)
        .single()

    if (
      updateError ||
      !updatedEvent
    ) {
      console.error(
        'Failed to update community event:',
        updateError,
      )

      return NextResponse.json(
        {
          error:
            '保存活动失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        success: true,
        event:
          updatedEvent,
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
      'Admin event PATCH error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '保存活动失败',
      },
      {
        status: 500,
      },
    )
  }
}