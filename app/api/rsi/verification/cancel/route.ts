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

    // 验证当前登录用户
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

    // Service Role 只在服务器使用
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

    // 只清除“正在进行中的验证”
    // 不碰已经认证成功的 Handle
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        rsi_verification_handle: null,
        rsi_verification_code: null,
        rsi_verification_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error(
        'RSI verification cancel error:',
        updateError
      )

      return NextResponse.json(
        { error: '取消 RSI 验证失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(
      'RSI verification cancel error:',
      error
    )

    return NextResponse.json(
      { error: '取消 RSI 验证失败，请稍后再试' },
      { status: 500 }
    )
  }
}