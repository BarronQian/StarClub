import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

const BUCKET = 'gallery'

/** Maps common image MIME types to a file extension, used as a fallback
 * when the original filename's extension isn't a recognizable image type. */
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
}

/** Only ever keeps the file EXTENSION from the original filename (e.g.
 * ".png") — the storage filename itself is always freshly generated, so the
 * user's original filename (spaces, CJK characters, etc.) never reaches
 * Supabase Storage. */
function getSafeExtension(name: string, mimeType: string): string {
  const lastDot = name.lastIndexOf('.')
  const rawExt = lastDot > 0 ? name.slice(lastDot + 1).toLowerCase() : ''
  const safeExt = /^[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : ''

  return safeExt || MIME_EXTENSIONS[mimeType] || 'jpg'
}

/** Generates a unique, URL-safe storage filename: timestamp + random ID, so
 * two uploads in the same millisecond never collide and the original
 * filename never influences the stored path. */
function generateStorageFilename(name: string, mimeType: string): string {
  const ext = getSafeExtension(name, mimeType)
  const uniqueId =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

  return `${Date.now()}-${uniqueId}.${ext}`
}

/**
 * Issues a short-lived Supabase Storage signed upload token for a freshly
 * generated, unique path in the `gallery` bucket. The admin browser then
 * uploads the image bytes directly to Supabase Storage using this token —
 * they never pass through this Vercel route (or any Vercel function), so
 * the platform's ~4.5MB request body limit no longer applies to gallery
 * image uploads. Only an authenticated admin (verified against
 * STARCLUB_ADMIN_EMAILS via `requireAdminApi`) can obtain a token, and the
 * service-role key used to mint it never leaves this server.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi()
  if (auth.response) return auth.response

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name : ''
  const mimeType = typeof body?.type === 'string' ? body.type : ''

  if (!mimeType.startsWith('image/')) {
    return NextResponse.json({ error: '仅支持上传图片文件' }, { status: 400 })
  }

  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const uniqueName = generateStorageFilename(name, mimeType)
  const path = `${year}/${month}/${uniqueName}`

  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)

  if (error || !data) {
    console.error('[v0] Gallery signed upload URL error:', error)
    return NextResponse.json({ error: '获取上传授权失败，请重试' }, { status: 500 })
  }

  const { data: publicData } = admin.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({
    bucket: BUCKET,
    path,
    token: data.token,
    url: publicData.publicUrl,
  })
}
