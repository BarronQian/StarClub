import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const discordBotToken =
      process.env.DISCORD_BOT_TOKEN

    const discordGuildId =
      process.env.DISCORD_GUILD_ID

    const verifiedRoleId =
      process.env.STARCLUB_DISCORD_VERIFIED_ROLE_ID

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !serviceRoleKey ||
      !discordBotToken ||
      !discordGuildId ||
      !verifiedRoleId
    ) {
      console.error('Missing Discord membership environment variables')

      return NextResponse.json(
        { error: '服务器配置错误' },
        { status: 500 }
      )
    }

    // 验证当前 StarClub 登录用户
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

    // 服务器读取该账号绑定的 Discord ID
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

    const {
      data: profile,
      error: profileError,
    } = await adminClient
      .from('profiles')
      .select('discord_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error(
        'Failed to load Discord profile:',
        profileError
      )

      return NextResponse.json(
        { error: '无法读取 Discord 账号信息' },
        { status: 500 }
      )
    }

    if (!profile?.discord_id) {
      return NextResponse.json({
        isMember: false,
        reason: 'discord_not_connected',
      })
    }

    // 向 Discord 查询这个用户是否属于星际酒馆 Guild
    const discordResponse = await fetch(
      `https://discord.com/api/v10/guilds/${discordGuildId}/members/${profile.discord_id}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bot ${discordBotToken}`,
        },
        cache: 'no-store',
      }
    )

    // Discord 404 = 这个 Discord 用户不在服务器里
    if (discordResponse.status === 404) {
      return NextResponse.json({
        isMember: false,
        reason: 'not_in_guild',
      })
    }

    if (!discordResponse.ok) {
      const discordError = await discordResponse.text()

      console.error(
        'Discord membership lookup failed:',
        discordResponse.status,
        discordError
      )

      return NextResponse.json(
        { error: 'Discord 社区成员状态检查失败' },
        { status: 502 }
      )
    }

    const member =
      await discordResponse.json()

    const roles =
      Array.isArray(member.roles)
        ? member.roles
        : []

    const isVerified =
      roles.includes(
        verifiedRoleId
      )

    return NextResponse.json({
      isMember: true,
      isVerified,
      discordId:
        profile.discord_id,
      joinedAt:
        member.joined_at ?? null,
      roles,
    })
    
  } catch (error) {
    console.error(
      'Discord membership check error:',
      error
    )

    return NextResponse.json(
      { error: '社区成员状态检查失败' },
      { status: 500 }
    )
  }
}