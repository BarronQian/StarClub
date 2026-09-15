import { NextResponse, type NextRequest } from 'next/server'

import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  const body = await request.json().catch(() => null)

  const id =
      typeof body?.id === 'string'
        ? body.id.trim()
        : ''

    if (!id) {
      return NextResponse.json(
        { error: '缺少资讯 ID' },
        { status: 400 },
      )
    }

  const admin = createAdminClient()

  const { error } = await admin
    .from('sc_news')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(
      '[v0] News delete error:',
      error,
    )

    return NextResponse.json(
      { error: '删除失败，请重试' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
  })
}