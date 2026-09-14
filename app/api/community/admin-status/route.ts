import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  getAnonClient,
  isAdminUserId,
  isOwnerUserId,
} from '@/lib/admin-auth'

export async function GET(
  request: NextRequest,
) {
  try {
    const authorization =
      request.headers.get(
        'authorization',
      )

    if (
      !authorization?.startsWith(
        'Bearer ',
      )
    ) {
      return NextResponse.json({
        isAdmin: false,
        isOwner: false,
      })
    }

    const token =
      authorization.slice(7)

    const supabase =
      getAnonClient()

    if (!supabase) {
      return NextResponse.json(
        {
          error:
            'Supabase 未配置',
        },
        {
          status: 500,
        },
      )
    }

    const {
      data,
      error,
    } =
      await supabase.auth.getUser(
        token,
      )

    if (
      error ||
      !data.user
    ) {
      return NextResponse.json({
        isAdmin: false,
        isOwner: false,
      })
    }

    const userId =
      data.user.id

    return NextResponse.json({
      isAdmin:
        isAdminUserId(
          userId,
        ),

      isOwner:
        isOwnerUserId(
          userId,
        ),
    })
  } catch (error) {
    console.error(
      'Failed to check community admin status:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '读取管理员状态失败',
      },
      {
        status: 500,
      },
    )
  }
}