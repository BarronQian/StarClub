import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const STARCLUB_ORG_SID = 'STARCLUBCN'

export async function GET(
  request: Request,
  context: {
    params: Promise<{ username: string }>
  }
) {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        'Public org membership API missing server configuration'
      )

      return NextResponse.json(
        { error: '服务器配置错误' },
        { status: 500 }
      )
    }

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
    const decodedUsername =
      decodeURIComponent(username)

    // 找到公开主页用户
    const {
      data: profile,
      error: profileError,
    } = await adminClient
      .from('profiles')
      .select(`
        id,
        username,
        star_citizen_handle,
        rsi_verified
      `)
      .ilike('username', decodedUsername)
      .maybeSingle()

    if (profileError) {
      console.error(
        'Failed to load profile for org membership:',
        profileError
      )

      return NextResponse.json(
        { error: '无法读取用户资料' },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 没有经过 StarClub RSI Handle 验证，
    // 不使用 Handle 去判断官网 ORG 身份
    if (
      profile.rsi_verified !== true ||
      !profile.star_citizen_handle
    ) {
      return NextResponse.json({
        isMember: false,
        source: null,
      })
    }

    // 只负责 RSI 官网公开资料查询
    try {
      const handle = encodeURIComponent(
        profile.star_citizen_handle
      )

      const rsiResponse = await fetch(
        `https://robertsspaceindustries.com/citizens/${handle}/organizations`,
        {
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 StarClub/1.0',
          },
          cache: 'no-store',
        }
      )

      if (!rsiResponse.ok) {
        console.error(
          'RSI org lookup failed:',
          rsiResponse.status
        )

        return NextResponse.json({
          isMember: false,
          source: null,
        })
      }

      const html = await rsiResponse.text()
      const normalizedHtml = html.toUpperCase()

      const isMember = normalizedHtml.includes(
        STARCLUB_ORG_SID
      )

      return NextResponse.json({
        isMember,
        source: isMember ? 'rsi' : null,
      })
    } catch (error) {
      console.error(
        'RSI public org lookup failed:',
        error
      )

      return NextResponse.json({
        isMember: false,
        source: null,
      })
    }
  } catch (error) {
    console.error(
      'Public org membership API error:',
      error
    )

    return NextResponse.json(
      { error: '俱乐部身份读取失败' },
      { status: 500 }
    )
  }
}