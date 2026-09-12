import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
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
        { error: '登录状态无效，请重新登录' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const requestedHandle =
      typeof body.handle === 'string'
        ? body.handle.trim()
        : ''

    if (!requestedHandle) {
      return NextResponse.json(
        { error: '缺少 RSI Handle' },
        { status: 400 }
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

    const { data: profile, error: profileError } =
      await adminClient
        .from('profiles')
          .select(`
            rsi_verification_handle,
            rsi_verification_code,
            rsi_verification_expires_at
          `)
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: '无法读取验证请求' },
        { status: 500 }
      )
    }

    const verificationHandle =
      profile.rsi_verification_handle

    const verificationCode =
      profile.rsi_verification_code

    const expiresAt =
      profile.rsi_verification_expires_at

      if (
          !verificationHandle ||
          verificationHandle.toLowerCase() !== requestedHandle.toLowerCase()
        ) {
          return NextResponse.json(
            {
              error: '当前验证码与该 RSI Handle 不匹配，请重新开始验证。',
            },
            { status: 400 }
          )
        }

    if (!verificationCode || !expiresAt) {
      return NextResponse.json(
        { error: '当前没有有效的验证请求，请重新生成验证码' },
        { status: 400 }
      )
    }

      if (new Date(expiresAt).getTime() < Date.now()) {
        const { error: cleanupError } = await adminClient
          .from('profiles')
          .update({
            rsi_verification_handle: null,
            rsi_verification_code: null,
            rsi_verification_expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (cleanupError) {
          console.error(
            'RSI expired verification cleanup error:',
            cleanupError
          )
        }

        return NextResponse.json(
          {
            error: '验证码已过期，请重新开始验证。',
            expired: true,
          },
          { status: 400 }
        )
      }

    const rsiUrl =
      `https://robertsspaceindustries.com/citizens/${encodeURIComponent(
        requestedHandle
      )}`

    const rsiResponse = await fetch(rsiUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; StarClubRSIVerification/1.0)',
        Accept: 'text/html',
      },
      cache: 'no-store',
    })

    if (!rsiResponse.ok) {
      return NextResponse.json(
        { error: '无法读取该 RSI Citizen Profile，请检查 Handle 是否正确' },
        { status: 400 }
      )
    }

    const html = await rsiResponse.text()

    // 验证验证码是否真实出现在公开 RSI Profile 页面里
    if (!html.includes(verificationCode)) {
      return NextResponse.json(
        {
          error:
            '暂未在 RSI Profile Bio 中找到验证码，请确认已经保存后再试。',
        },
        { status: 400 }
      )
    }

    // 同时确认返回页面确实属于请求的 Handle
    const lowerHtml = html.toLowerCase()
    const lowerHandle = requestedHandle.toLowerCase()

    if (!lowerHtml.includes(lowerHandle)) {
      return NextResponse.json(
        { error: 'RSI Profile Handle 验证失败' },
        { status: 400 }
      )
    }

    // 一个 RSI Handle 只能绑定一个 StarClub 用户
      const { data: existingProfile, error: existingProfileError } =
        await adminClient
          .from('profiles')
          .select('id')
          .ilike('star_citizen_handle', requestedHandle)
          .eq('rsi_verified', true)
          .neq('id', user.id)
          .maybeSingle()

      if (existingProfileError) {
        console.error(
          'RSI duplicate handle check error:',
          existingProfileError
        )

        return NextResponse.json(
          { error: '检查 RSI Handle 绑定状态失败' },
          { status: 500 }
        )
      }

      if (existingProfile) {
        return NextResponse.json(
          {
            error: '这个 RSI Handle 已经绑定到其他 StarClub 账号。',
          },
          { status: 409 }
        )
      }

    const verifiedAt = new Date().toISOString()

    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        star_citizen_handle: requestedHandle,
        rsi_verified: true,
        rsi_verified_at: verifiedAt,

        // 用完立刻销毁验证码
        rsi_verification_code: null,
        rsi_verification_expires_at: null,

        updated_at: verifiedAt,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error(
        'RSI verification update error:',
        updateError
      )

      return NextResponse.json(
        { error: 'RSI 认证成功，但保存认证状态失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      handle: requestedHandle,
      verifiedAt,
    })
  } catch (error) {
    console.error('RSI verification error:', error)

    return NextResponse.json(
      { error: 'RSI 验证失败，请稍后再试' },
      { status: 500 }
    )
  }
}