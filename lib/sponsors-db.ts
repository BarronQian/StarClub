import { createClient } from '@supabase/supabase-js'

export type SponsorRow = {
  id: string
  name: string
  nickname: string | null
  badge: string | null
  amount: number
  sort_order: number
  is_visible: boolean
}

function getSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      'Missing Supabase server environment variables',
    )
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

export async function getSponsorsFromDb() {
  const supabase =
    getSupabase()

  const {
    data,
    error,
  } =
    await supabase
      .from('sponsors')
      .select(`
        id,
        name,
        nickname,
        badge,
        amount,
        sort_order,
        is_visible
      `)
      .eq(
        'is_visible',
        true,
      )
      .order(
        'amount',
        {
          ascending: false,
        },
      )
      .order(
        'sort_order',
        {
          ascending: false,
        },
      )

  if (error) {
    console.error(
      'Failed to load sponsors:',
      error,
    )

    return []
  }

  return (
    data ?? []
  ).map(
    (
      sponsor,
      index,
    ) => ({
      ...sponsor,
      amount:
        Number(
          sponsor.amount,
        ),
      rank:
        index + 1,
    }),
  )
}