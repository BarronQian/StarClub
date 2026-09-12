import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi()
  if (auth.response) return auth.response

  const body = await request.json().catch(() => null)
  const id = Number(body?.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: '缺少作品 ID' }, { status: 400 })
  }

  // Safety: only the database row is removed. The Storage object is kept
  // intentionally — see the Gallery Admin spec's "Delete" section.
  const admin = createAdminClient()
  const { error } = await admin.from('gallery').delete().eq('id', id)

  if (error) {
    console.error('[v0] Gallery delete error:', error)
    return NextResponse.json({ error: '删除失败，请重试' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
