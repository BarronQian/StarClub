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

import {
  CLOSED_MS,
} from '@/lib/executive-hangar'

export const dynamic =
  'force-dynamic'

/**
 * 获取当前网站全局行政机库校准基准
 */
export async function GET() {
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

    const supabase =
      createAdminClient()

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'executive_hangar_config',
        )
        .select(
          `
            id,
            anchor_time,
            updated_at,
            updated_by
          `,
        )
        .eq(
          'id',
          1,
        )
        .maybeSingle()

    if (error) {
      console.error(
        'Failed to load executive hangar config:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '读取行政机库校准数据失败',
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
            '行政机库校准数据不存在',
        },
        {
          status: 404,
        },
      )
    }

    const anchorMs =
      new Date(
        data.anchor_time,
      ).getTime()

    const fullGreenTime =
      new Date(
        anchorMs +
          CLOSED_MS,
      ).toISOString()

    return NextResponse.json(
      {
        success: true,

        config: {
          anchorTime:
            data.anchor_time,

          fullGreenTime,

          updatedAt:
            data.updated_at,

          updatedBy:
            data.updated_by,
        },
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
      'Admin executive hangar GET error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '读取行政机库校准数据失败',
      },
      {
        status: 500,
      },
    )
  }
}

/**
 * 修改网站全局行政机库校准基准
 *
 * Admin 输入：
 * 五盏灯全部转绿 / OPEN 的实际时间
 *
 * 数据库存储：
 * CLOSED 周期起点
 */
export async function PATCH(
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

    let body: {
      fullGreenTime?: string
    } = {}

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

    const fullGreenTime =
      String(
        body.fullGreenTime ??
          '',
      ).trim()

    if (!fullGreenTime) {
      return NextResponse.json(
        {
          error:
            '请输入五盏灯全部转绿时间',
        },
        {
          status: 400,
        },
      )
    }

    const fullGreenMs =
      new Date(
        fullGreenTime,
      ).getTime()

    if (
      Number.isNaN(
        fullGreenMs,
      )
    ) {
      return NextResponse.json(
        {
          error:
            '校准时间格式无效',
        },
        {
          status: 400,
        },
      )
    }

    /*
     * 五灯全绿时间
     * -
     * CLOSED 120 分钟
     * =
     * CLOSED 周期起点
     */
    const anchorTime =
      new Date(
        fullGreenMs -
          CLOSED_MS,
      ).toISOString()

    const now =
      new Date().toISOString()

    const supabase =
      createAdminClient()

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'executive_hangar_config',
        )
        .update({
          anchor_time:
            anchorTime,

          updated_at:
            now,

          updated_by:
            'admin',
        })
        .eq(
          'id',
          1,
        )
        .select(
          `
            id,
            anchor_time,
            updated_at,
            updated_by
          `,
        )
        .single()

    if (
      error ||
      !data
    ) {
      console.error(
        'Failed to update executive hangar config:',
        error,
      )

      return NextResponse.json(
        {
          error:
            '保存行政机库校准数据失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        success: true,

        config: {
          anchorTime:
            data.anchor_time,

          fullGreenTime:
            new Date(
              new Date(
                data.anchor_time,
              ).getTime() +
                CLOSED_MS,
            ).toISOString(),

          updatedAt:
            data.updated_at,

          updatedBy:
            data.updated_by,
        },
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
      'Admin executive hangar PATCH error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '保存行政机库校准数据失败',
      },
      {
        status: 500,
      },
    )
  }
}