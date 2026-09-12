import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const STARCLUB_ORG_SID = 'STARCLUBCN'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    const accessToken = authHeader.slice(7)

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

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(accessToken)

    if (userError || !user) {
      return NextResponse.json(
        { error: '登录状态无效，请重新登录' },
        { status: 401 }
      )
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const {
      data: profile,
      error: profileError,
    } = await adminClient
      .from('profiles')
      .select('star_citizen_handle, rsi_verified')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      return NextResponse.json(
        { error: '无法读取 RSI 账号信息' },
        { status: 500 }
      )
    }

    if (
      !profile?.rsi_verified ||
      !profile?.star_citizen_handle
    ) {
      return NextResponse.json({
        isMember: false,
        reason: 'rsi_not_verified',
      })
    }

    const handle = profile.star_citizen_handle

    const rsiResponse = await fetch(
      `https://robertsspaceindustries.com/en/citizens/${encodeURIComponent(handle)}/organizations`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 StarClub/1.0',
        },
        cache: 'no-store',
      }
    )

    if (!rsiResponse.ok) {
      console.error(
        'RSI org membership lookup failed:',
        rsiResponse.status
      )

      return NextResponse.json(
        { error: 'RSI 组织成员状态检查失败' },
        { status: 502 }
      )
    }

    const html = await rsiResponse.text()

    const normalizedHtml = html.toUpperCase()

    const isMember =
      normalizedHtml.includes(STARCLUB_ORG_SID)

    return NextResponse.json({
      isMember,
      handle,
      orgSid: STARCLUB_ORG_SID,
    })
  } catch (error) {
    console.error(
      'RSI org membership check error:',
      error
    )

    return NextResponse.json(
      { error: 'ORG 成员状态检查失败' },
      { status: 500 }
    )
  }
}