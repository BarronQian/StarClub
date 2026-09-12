import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. This bypasses Row Level Security entirely,
 * so it must NEVER be imported from a Client Component or exposed to the
 * browser — only from Server Components, Server Actions, and Route
 * Handlers, after the caller has been verified with `requireAdminApi()` /
 * `getAdminSession()` from `lib/admin-auth.ts`.
 */
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Supabase service-role client is not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).',
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
