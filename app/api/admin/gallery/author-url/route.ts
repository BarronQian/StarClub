import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi()
  if (auth.response) return auth.response

  const author = request.nextUrl.searchParams.get('author')?.trim()

  if (!author) {
    return NextResponse.json({ author_url: null })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('gallery')
    .select('author_url')
    .eq('author', author)
    .not('author_url', 'is', null)
    .neq('author_url', '')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ author_url: null })
  }

  return NextResponse.json({
    author_url: data?.author_url ?? null,
  })
}