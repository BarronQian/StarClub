import {
  NextResponse,
  type NextRequest,
} from 'next/server'

import {
  requireAdminApi,
} from '@/lib/admin-auth'

import {
  createAdminClient,
} from '@/lib/supabase-admin'

export async function PATCH(
  request: NextRequest,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  const body =
    await request
      .json()
      .catch(() => null)

  const ids =
    Array.isArray(body?.ids)
      ? body.ids.filter(
          (id: unknown) =>
            typeof id ===
              'string' &&
            id.length > 0,
        )
      : []

  if (ids.length === 0) {
    return NextResponse.json(
      {
        error:
          '未提供活动排序数据',
      },
      {
        status: 400,
      },
    )
  }

  const uniqueIds =
    Array.from(
      new Set(ids),
    )

  if (
    uniqueIds.length !==
    ids.length
  ) {
    return NextResponse.json(
      {
        error:
          '活动排序数据包含重复 ID',
      },
      {
        status: 400,
      },
    )
  }

  const admin =
    createAdminClient()

  const {
    data: existingEvents,
    error: loadError,
  } =
    await admin
      .from(
        'community_events',
      )
      .select(
        'id',
      )
      .in(
        'id',
        uniqueIds,
      )
      .is(
        'deleted_at',
        null,
      )

  if (loadError) {
    console.error(
      '[v0] Failed to validate event reorder:',
      loadError,
    )

    return NextResponse.json(
      {
        error:
          '活动排序验证失败',
      },
      {
        status: 500,
      },
    )
  }

  if (
    existingEvents.length !==
    uniqueIds.length
  ) {
    return NextResponse.json(
      {
        error:
          '排序列表中包含不存在的活动',
      },
      {
        status: 400,
      },
    )
  }

  const total =
    uniqueIds.length

  const results =
    await Promise.all(
      uniqueIds.map(
        async (
          id,
          index,
        ) => {
          const sortOrder =
            total -
            index

          return admin
            .from(
              'community_events',
            )
            .update({
              sort_order:
                sortOrder,
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              'id',
              id,
            )
            .is(
              'deleted_at',
              null,
            )
        },
      ),
    )

  const failedResult =
    results.find(
      (result) =>
        result.error,
    )

  if (
    failedResult?.error
  ) {
    console.error(
      '[v0] Failed to save event reorder:',
      failedResult.error,
    )

    return NextResponse.json(
      {
        error:
          '活动排序保存失败',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json({
    success: true,
  })
}