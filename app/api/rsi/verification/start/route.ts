import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      const missing = []

      if (!supabaseUrl) {
        missing.push('SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL')
      }

      if (!supabaseAnonKey) {
        missing.push(
          'NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
        )
      }

      if (!serviceRoleKey) {
        missing.push('SUPABASE_SERVICE_ROLE_KEY')
      }

      console.error('Missing Supabase environment variables:', missing)

      return NextResponse.json(
        {
          error: `服务器配置错误：缺少 ${missing.join(', ')}`,
        },
        { status: 500 }
      )
    }

    // 用用户自己的 access token 确认身份
    const authClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
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

    const handle =
      typeof body.handle === 'string'
        ? body.handle.trim()
        : ''

    if (!handle) {
      return NextResponse.json(
        { error: '请输入 Star Citizen Handle' },
        { status: 400 }
      )
    }

    // 基础限制，避免把明显异常内容写进数据库
    if (handle.length < 3 || handle.length > 64) {
      return NextResponse.json(
        { error: 'Star Citizen Handle 格式无效' },
        { status: 400 }
      )
    }

// 只有服务器持有 Service Role
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

// 检查是否已经有仍然有效的验证请求
const {
  data: existingVerification,
  error: existingVerificationError,
} = await adminClient
  .from('profiles')
  .select(`
    rsi_verification_handle,
    rsi_verification_code,
    rsi_verification_expires_at
  `)
  .eq('id', user.id)
  .maybeSingle()

if (existingVerificationError) {
  console.error(
    'Failed to check existing RSI verification:',
    existingVerificationError
  )

  return NextResponse.json(
    { error: '无法检查当前 RSI 验证状态' },
    { status: 500 }
  )
}

const existingExpiresAt =
  existingVerification?.rsi_verification_expires_at
    ? new Date(
        existingVerification.rsi_verification_expires_at
      ).getTime()
    : 0

if (
  existingVerification?.rsi_verification_handle &&
  existingVerification?.rsi_verification_code &&
  existingExpiresAt > Date.now()
) {
  return NextResponse.json(
    {
      error: '已有正在进行中的 RSI 验证，请继续当前验证或先取消。',
      pending: true,
    },
    { status: 409 }
  )
}

const verificationCode =
  `STARCLUB-${crypto.randomBytes(5).toString('hex').toUpperCase()}`

const expiresAt =
  new Date(Date.now() + 30 * 60 * 1000).toISOString()

    const { error: updateError } = await adminClient
      .from('profiles')
        .update({
          rsi_verification_handle: handle,
          rsi_verification_code: verificationCode,
          rsi_verification_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
      .eq('id', user.id)

    if (updateError) {
      console.error('RSI verification start error:', updateError)

      return NextResponse.json(
        { error: '无法创建验证码' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      handle,
      verificationCode,
      expiresAt,
    })
  } catch (error) {
    console.error('RSI verification start error:', error)

    return NextResponse.json(
      { error: '创建验证请求失败' },
      { status: 500 }
    )
  }
}