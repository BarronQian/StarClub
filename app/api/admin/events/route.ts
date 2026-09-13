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

  return result ||
    null
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

function isValidValue<T extends string>(
  value: string,
  allowed: readonly T[],
): value is T {
  return allowed.includes(
    value as T,
  )
}

export async function POST(
  request: NextRequest,
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
      body.isPublished ===
      undefined
        ? true
        : Boolean(
            body.isPublished,
          )

    if (!slug) {
      return NextResponse.json(
        {
          error:
            'Slug 不能为空',
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

    if (!tag) {
      return NextResponse.json(
        {
          error:
            '活动标签不能为空',
        },
        {
          status: 400,
        },
      )
    }

    if (!title) {
      return NextResponse.json(
        {
          error:
            '活动标题不能为空',
        },
        {
          status: 400,
        },
      )
    }

    if (!date) {
      return NextResponse.json(
        {
          error:
            '活动日期不能为空',
        },
        {
          status: 400,
        },
      )
    }

    if (!location) {
      return NextResponse.json(
        {
          error:
            '活动地点不能为空',
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

    if (!image) {
      return NextResponse.json(
        {
          error:
            '活动封面不能为空',
        },
        {
          status: 400,
        },
      )
    }

    if (!description) {
      return NextResponse.json(
        {
          error:
            '活动简介不能为空',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      createAdminClient()

    const {
      data: existingEvent,
      error:
        existingEventError,
    } =
      await supabase
        .from(
          'community_events',
        )
        .select(
          'id, slug',
        )
        .eq(
          'slug',
          slug,
        )
        .maybeSingle()

    if (
      existingEventError
    ) {
      console.error(
        'Failed to check event slug:',
        existingEventError,
      )

      return NextResponse.json(
        {
          error:
            '检查活动 Slug 失败',
        },
        {
          status: 500,
        },
      )
    }

    if (existingEvent) {
      return NextResponse.json(
        {
          error:
            '该 Slug 已经存在，请使用其他 Slug',
        },
        {
          status: 409,
        },
      )
    }

    const {
  data: topEvent,
  error: topEventError,
} =
  await supabase
    .from(
      'community_events',
    )
    .select(
      'sort_order',
    )
    .is(
      'deleted_at',
      null,
    )
    .order(
      'sort_order',
      {
        ascending: false,
      },
    )
    .limit(1)
    .maybeSingle()

if (topEventError) {
  console.error(
    'Failed to get highest event sort order:',
    topEventError,
  )

  return NextResponse.json(
    {
      error:
        '获取活动排序失败',
    },
    {
      status: 500,
    },
  )
}

const sortOrder =
  (topEvent?.sort_order ??
    0) + 1

    const now =
      new Date().toISOString()

    const {
      data: event,
      error:
        createError,
    } =
      await supabase
        .from(
          'community_events',
        )
        .insert({
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

          deleted_at:
            null,

          created_at:
            now,

          updated_at:
            now,
        })
        .select(`
          id,
          slug,
          title,
          status,
          is_published,
          featured_on_home,
          created_at
        `)
        .single()

    if (
      createError ||
      !event
    ) {
      console.error(
        'Failed to create community event:',
        createError,
      )

      return NextResponse.json(
        {
          error:
            '创建活动失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        success: true,
        event,
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
      'Admin event POST error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '创建活动失败',
      },
      {
        status: 500,
      },
    )
  }
}