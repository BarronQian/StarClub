import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const discordBotToken =
      process.env.DISCORD_BOT_TOKEN

    const discordGuildId =
      process.env.DISCORD_GUILD_ID

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !discordBotToken ||
      !discordGuildId
    ) {
      console.error(
        'Public identities API missing server configuration'
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

    // 找到公开主页对应的 StarClub 用户
    const {
      data: profile,
      error: profileError,
    } = await adminClient
      .from('profiles')
      .select(`
        id,
        username,
        discord_id
      `)
      .ilike('username', decodedUsername)
      .maybeSingle()

    if (profileError) {
      console.error(
        'Failed to load profile for identities:',
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

    // 没有 Discord ID 就不可能同步 Discord Role
    if (!profile.discord_id) {
      return NextResponse.json({
        isMember: false,
        roles: [],
      })
    }

    // 从 Discord Guild 实时读取这个用户
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

    // Discord 返回 404 = 当前已经不在酒馆服务器
    if (discordResponse.status === 404) {
      return NextResponse.json({
        isMember: false,
        roles: [],
      })
    }

    if (!discordResponse.ok) {
      const errorText =
        await discordResponse.text()

      console.error(
        'Discord public identity lookup failed:',
        discordResponse.status,
        errorText
      )

      return NextResponse.json(
        { error: '无法读取 Discord 身份' },
        { status: 502 }
      )
    }

    const member = await discordResponse.json()

    return NextResponse.json({
      isMember: true,
      roles: Array.isArray(member.roles)
        ? member.roles
        : [],
    })
  } catch (error) {
    console.error(
      'Public profile identities API error:',
      error
    )

    return NextResponse.json(
      { error: '身份读取失败' },
      { status: 500 }
    )
  }
}