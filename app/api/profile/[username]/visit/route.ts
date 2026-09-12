import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(
  request: Request,
  context: {
    params: Promise<{ username: string }>
  }
) {
  try {
    // 1. 检查登录 Token
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { recorded: false, reason: 'not_logged_in' },
        { status: 401 }
      )
    }

    const accessToken = authHeader.slice(7)

    // 2. 环境变量
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: '服务器配置错误' },
        { status: 500 }
      )
    }

    // 3. 验证当前登录用户
    const authClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(accessToken)

    if (userError || !user) {
      return NextResponse.json(
        { recorded: false, reason: 'invalid_session' },
        { status: 401 }
      )
    }

    // 4. Service Role
    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const { username } = await context.params
    const profileSlug = decodeURIComponent(username)

    // 5. 找到被访问的用户
    const {
      data: targetProfile,
      error: targetError,
    } = await adminClient
      .from('profiles')
      .select('id, username, profile_slug, member_number')
      .ilike('profile_slug', profileSlug)
      .maybeSingle()

    if (targetError) {
      console.error(
        'Failed to find target profile:',
        targetError
      )

      return NextResponse.json(
        { error: '无法读取个人主页' },
        { status: 500 }
      )
    }

    if (!targetProfile) {
      return NextResponse.json(
        { recorded: false, reason: 'profile_not_found' },
        { status: 404 }
      )
    }

    // 6. 自己访问自己，不记录
    if (targetProfile.id === user.id) {
      return NextResponse.json({
        recorded: false,
        reason: 'self_visit',
      })
    }

    // 7. 确认访问者有 profile
    const {
      data: visitorProfile,
      error: visitorError,
    } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (visitorError || !visitorProfile) {
      return NextResponse.json(
        { recorded: false, reason: 'visitor_profile_not_found' },
        { status: 404 }
      )
    }

    // 8. 写入 / 更新访客记录
    const { error: visitError } = await adminClient
      .from('profile_visits')
      .upsert(
        {
          profile_id: targetProfile.id,
          visitor_id: visitorProfile.id,
          visited_at: new Date().toISOString(),
        },
        {
          onConflict: 'profile_id,visitor_id',
        }
      )

    if (visitError) {
      console.error(
        'Failed to record profile visit:',
        visitError
      )

      return NextResponse.json(
        { error: '访客记录写入失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      recorded: true,
    })
  } catch (error) {
    console.error('Profile visit API error:', error)

    return NextResponse.json(
      { error: '访客记录失败' },
      { status: 500 }
    )
  }
}