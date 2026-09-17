import {
  createClient,
} from '@supabase/supabase-js'

export type SponsorGiftRow = {
  id: string

  sponsor_id: string | null
  sponsor_name: string

  recipient_name: string
  event_name: string | null
  gift_name: string
  quantity: number

  gift_value: number
  gifted_at: string

  text_color: string
  font_size:
    | 'small'
    | 'medium'
    | 'large'
    | 'xlarge'
  speed:
    | 'slow'
    | 'normal'
    | 'fast'
  depth:
    | 'back'
    | 'middle'
    | 'front'

  is_visible: boolean
  sort_order: number
  created_at: string
}

function getSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY

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

export async function getSponsorGiftsFromDb() {
  const supabase =
    getSupabase()

  const {
    data,
    error,
  } =
    await supabase
      .from('sponsor_gifts')
      .select(`
        id,
        sponsor_id,
        sponsor_name,
        recipient_name,
        event_name,
        gift_name,
        quantity,
        gift_value,
        gifted_at,
        text_color,
        font_size,
        speed,
        depth,
        is_visible,
        sort_order,
        created_at
      `)
      .eq(
        'is_visible',
        true,
      )
      .order(
        'gifted_at',
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
      .order(
        'created_at',
        {
          ascending: false,
        },
      )

  if (error) {
    console.error(
      'Failed to load sponsor gifts:',
      error,
    )

    return []
  }

  return (
    data ?? []
  ).map(
    (gift) => ({
      ...gift,

      quantity:
        Number(
          gift.quantity,
        ),

      gift_value:
        Number(
          gift.gift_value,
        ),

      sort_order:
        Number(
          gift.sort_order,
        ),
    }),
  ) as SponsorGiftRow[]
}