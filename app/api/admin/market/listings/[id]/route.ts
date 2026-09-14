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

    const action =
      String(
        body.action ?? '',
      ).toLowerCase()

    if (
      action !==
      'force_close'
    ) {
      return NextResponse.json(
        {
          error:
            '管理员操作无效',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      createAdminClient()

    const {
      data: listing,
      error: listingError,
    } = await supabase
      .from(
        'market_listings',
      )
      .select(`
        id,
        seller_id,
        listing_type,
        title,
        quantity,
        status,
        closed_at,
        deleted_at
      `)
      .eq(
        'id',
        id,
      )
      .maybeSingle()

    if (listingError) {
      console.error(
        'Failed to load market listing for admin:',
        listingError,
      )

      return NextResponse.json(
        {
          error:
            '读取商单失败',
        },
        {
          status: 500,
        },
      )
    }

    if (
      !listing ||
      listing.deleted_at
    ) {
      return NextResponse.json(
        {
          error:
            '该商单不存在或已删除',
        },
        {
          status: 404,
        },
      )
    }

    if (
      listing.closed_at
    ) {
      return NextResponse.json(
        {
          success: true,
          listing,
          alreadyClosed: true,
        },
        {
          headers: {
            'Cache-Control':
              'no-store, max-age=0',
          },
        },
      )
    }

    const now =
      new Date().toISOString()

    const {
      data: updatedListing,
      error: updateError,
    } = await supabase
      .from(
        'market_listings',
      )
      .update({
        closed_at:
          now,
        updated_at:
          now,
      })
      .eq(
        'id',
        id,
      )
      .select(`
        id,
        seller_id,
        listing_type,
        title,
        quantity,
        status,
        closed_at,
        updated_at
      `)
      .single()

    if (
      updateError ||
      !updatedListing
    ) {
      console.error(
        'Failed to force close market listing:',
        updateError,
      )

      return NextResponse.json(
        {
          error:
            '强制下架商单失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        success: true,
        listing:
          updatedListing,
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
      'Admin market listing PATCH error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '管理员操作失败',
      },
      {
        status: 500,
      },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
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

    const supabase =
      createAdminClient()

    const {
      data: listing,
      error: listingError,
    } =
      await supabase
        .from(
          'market_listings',
        )
        .select(`
          id,
          title,
          seller_id
        `)
        .eq(
          'id',
          id,
        )
        .maybeSingle()

    if (listingError) {
      console.error(
        'Failed to load market listing before permanent delete:',
        listingError,
      )

      return NextResponse.json(
        {
          error:
            '读取商单失败',
        },
        {
          status: 500,
        },
      )
    }

    if (!listing) {
      return NextResponse.json(
        {
          error:
            '该商单不存在',
        },
        {
          status: 404,
        },
      )
    }

    const {
      error: deleteError,
    } =
      await supabase
        .from(
          'market_listings',
        )
        .delete()
        .eq(
          'id',
          id,
        )

    if (deleteError) {
      console.error(
        'Failed to permanently delete market listing:',
        deleteError,
      )

      if (
        deleteError.code ===
        '23503'
      ) {
        return NextResponse.json(
          {
            error:
              '该商单仍有关联的交易记录，暂时无法永久删除',
          },
          {
            status: 409,
          },
        )
      }

      return NextResponse.json(
        {
          error:
            '永久删除商单失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(
      {
        success: true,
        deletedListing: {
          id:
            listing.id,
          title:
            listing.title,
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
      'Admin market listing DELETE error:',
      error,
    )

    return NextResponse.json(
      {
        error:
          '永久删除商单失败',
      },
      {
        status: 500,
      },
    )
  }
}