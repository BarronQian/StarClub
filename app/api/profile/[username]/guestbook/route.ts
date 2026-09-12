import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminSupabase() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables')
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

async function getAuthenticatedUser(
  request: NextRequest
) {
  const authorization =
    request.headers.get('authorization')

  if (
    !authorization ||
    !authorization.startsWith('Bearer ')
  ) {
    return null
  }

  const token = authorization.slice(7)

  const supabase = getAdminSupabase()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return null
  }

  return user
}

async function getTargetProfile(
  username: string
) {
  const supabase = getAdminSupabase()

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      profile_slug
    `)
    .eq('profile_slug', username)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      username: string
    }>
  }
) {
  try {
    const { username } = await context.params

    const profile = await getTargetProfile(
      decodeURIComponent(username)
    )

    if (!profile) {
      return NextResponse.json(
        {
          error: 'Profile not found',
        },
        {
          status: 404,
        }
      )
    }

    const supabase = getAdminSupabase()

    const { data: messages, error } =
      await supabase
        .from('profile_guestbook')
        .select(`
          id,
          profile_id,
          author_id,
          content,
          created_at
        `)
          .eq('profile_id', profile.id)
          .is('deleted_at', null)
          .order('created_at', {
            ascending: false,
          })
        .limit(100)

    if (error) {
      throw error
    }

    const authorIds = [
      ...new Set(
        (messages || []).map(
          (message) => message.author_id
        )
      ),
    ]

      let authorMap = new Map<
        string,
        {
          id: string
          username: string | null
          display_name: string | null
          star_citizen_handle: string | null
          avatar_url: string | null
          profile_slug: string | null
          member_number: number | null
        }
      >()

    if (authorIds.length > 0) {
      const {
        data: authors,
        error: authorsError,
      } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          star_citizen_handle,
          avatar_url,
          profile_slug,
          member_number
        `)
        .in('id', authorIds)

      if (authorsError) {
        throw authorsError
      }

      authorMap = new Map(
        (authors || []).map((author) => [
          author.id,
          author,
        ])
      )
    }

    const user =
      await getAuthenticatedUser(request)

    const result = (messages || []).map(
      (message) => {
        const author =
          authorMap.get(message.author_id)

        const canDelete =
          user?.id === message.author_id ||
          user?.id === profile.id

        return {
          id: message.id,
          content: message.content,
          createdAt: message.created_at,
          canDelete,
          author: {
            id: author?.id ?? message.author_id,
            username:
              author?.username ?? null,
            displayName:
              author?.display_name ?? null,
            starCitizenHandle:
              author?.star_citizen_handle ?? null,
            avatarUrl:
              author?.avatar_url ?? null,
            profileSlug:
              author?.profile_slug ?? null,
            memberNumber:
              author?.member_number ?? null,
          },
        }
      }
    )

    return NextResponse.json({
      messages: result,
      count: result.length,
    })
  } catch (error) {
    console.error(
      'Guestbook GET failed:',
      error
    )

    return NextResponse.json(
      {
        error: 'Failed to load guestbook',
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      username: string
    }>
  }
) {
  try {
    const user =
      await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        {
          error: '请先登录。',
        },
        {
          status: 401,
        }
      )
    }

    const { username } = await context.params

    const targetProfile =
      await getTargetProfile(
        decodeURIComponent(username)
      )

    if (!targetProfile) {
      return NextResponse.json(
        {
          error: '用户不存在。',
        },
        {
          status: 404,
        }
      )
    }

    if (targetProfile.id === user.id) {
      return NextResponse.json(
        {
          error: '不能给自己的主页留言。',
        },
        {
          status: 400,
        }
      )
    }

    const supabase = getAdminSupabase()

    const {
      data: authorProfile,
      error: authorError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        rsi_verified,
        star_citizen_handle
      `)
      .eq('id', user.id)
      .maybeSingle()

    if (authorError) {
      throw authorError
    }

    if (
      !authorProfile?.rsi_verified ||
      !authorProfile.star_citizen_handle
    ) {
      return NextResponse.json(
        {
          error:
            '完成 RSI Handle 认证后才可以留言。',
        },
        {
          status: 403,
        }
      )
    }

    const body = await request.json()

    const content =
      typeof body.content === 'string'
        ? body.content.trim()
        : ''

    if (!content) {
      return NextResponse.json(
        {
          error: '留言不能为空。',
        },
        {
          status: 400,
        }
      )
    }

    if (content.length > 200) {
      return NextResponse.json(
        {
          error: '留言最多 200 字。',
        },
        {
          status: 400,
        }
      )
    }

    const sevenDaysAgo = new Date(
      Date.now() -
        7 * 24 * 60 * 60 * 1000
    ).toISOString()

    const {
      data: recentMessage,
      error: recentError,
    } = await supabase
      .from('profile_guestbook')
      .select(`
        id,
        created_at
      `)
      .eq(
        'profile_id',
        targetProfile.id
      )
      .eq(
        'author_id',
        user.id
      )
      .gte(
        'created_at',
        sevenDaysAgo
      )
      .order('created_at', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

    if (recentError) {
      throw recentError
    }

    if (recentMessage) {
      const nextAvailable =
        new Date(
          new Date(
            recentMessage.created_at
          ).getTime() +
            7 * 24 * 60 * 60 * 1000
        )

      return NextResponse.json(
        {
          error:
            '你最近已经给这位用户留言过了。',
          nextAvailable:
            nextAvailable.toISOString(),
        },
        {
          status: 429,
        }
      )
    }

    const {
      data: message,
      error: insertError,
    } = await supabase
      .from('profile_guestbook')
      .insert({
        profile_id:
          targetProfile.id,
        author_id: user.id,
        content,
      })
      .select(`
        id,
        content,
        created_at
      `)
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error) {
    console.error(
      'Guestbook POST failed:',
      error
    )

    return NextResponse.json(
      {
        error: '留言失败，请稍后再试。',
      },
      {
        status: 500,
      }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      username: string
    }>
  }
) {
  try {
    const user =
      await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        {
          error: '请先登录。',
        },
        {
          status: 401,
        }
      )
    }

    const { username } = await context.params

    const targetProfile =
      await getTargetProfile(
        decodeURIComponent(username)
      )

    if (!targetProfile) {
      return NextResponse.json(
        {
          error: '用户不存在。',
        },
        {
          status: 404,
        }
      )
    }

    const messageId =
      request.nextUrl.searchParams.get(
        'messageId'
      )

    if (!messageId) {
      return NextResponse.json(
        {
          error: '缺少留言 ID。',
        },
        {
          status: 400,
        }
      )
    }

    const supabase = getAdminSupabase()

    const {
      data: message,
      error: messageError,
    } = await supabase
      .from('profile_guestbook')
      .select(`
        id,
        profile_id,
        author_id
      `)
      .eq('id', messageId)
      .maybeSingle()

    if (messageError) {
      throw messageError
    }

    if (!message) {
      return NextResponse.json(
        {
          error: '留言不存在。',
        },
        {
          status: 404,
        }
      )
    }

    const canDelete =
      message.author_id === user.id ||
      (
        message.profile_id ===
          targetProfile.id &&
        targetProfile.id === user.id
      )

    if (!canDelete) {
      return NextResponse.json(
        {
          error: '没有权限删除这条留言。',
        },
        {
          status: 403,
        }
      )
    }

    const { error: deleteError } =
      await supabase
        .from('profile_guestbook')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('id', messageId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(
      'Guestbook DELETE failed:',
      error
    )

    return NextResponse.json(
      {
        error: '删除失败，请稍后再试。',
      },
      {
        status: 500,
      }
    )
  }
}