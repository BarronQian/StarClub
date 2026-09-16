import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

const supabaseUrl =
  'https://nngrkcavazaypdvwcdbb.supabase.co'

const supabaseKey =
  'sb_publishable_QDDFLRFV2DK2VpoF4t5mjg_Sg_pLzyp'

let browserClient:
  SupabaseClient | null = null

export function getSupabaseBrowser() {
  if (!browserClient) {
    browserClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    )
  }

  return browserClient
}