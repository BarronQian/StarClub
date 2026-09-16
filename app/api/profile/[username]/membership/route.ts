import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const STARCLUB_ORG_SID = 'STARCLUBCN'
const STARCLUB_ORG_ROLE_ID = '1506194379369353236'
const STARCLUB_DISCORD_VERIFIED_ROLE_ID =
  process.env.STARCLUB_DISCORD_VERIFIED_ROLE_ID

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
      !discordGuildId ||
      !STARCLUB_DISCORD_VERIFIED_ROLE_ID
    ) {
      console.error(
        'Public membership API missing server configuration'
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
      const profileSlug =
        decodeURIComponent(username)

    // 1. 读取公开主页用户
    const {
      data: profile,
      error: profileError,
    } = await adminClient
      .from('profiles')
      .select(`
        id,
        username,
        profile_slug,
        member_number,
        discord_id,
        star_citizen_handle,
        rsi_verified
      `)
      .ilike('profile_slug', profileSlug)
      .maybeSingle()

    if (profileError) {
      console.error(
        'Failed to load profile membership:',
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

    let discordMembership = false
    let roles: string[] = []

    // 2. Discord Membership + Roles
    if (profile.discord_id) {
      try {
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

        if (discordResponse.ok) {
          const member = await discordResponse.json()

          discordMembership = true

          roles = Array.isArray(member.roles)
            ? member.roles
            : []
        } else if (discordResponse.status !== 404) {
          console.error(
            'Discord membership lookup failed:',
            discordResponse.status
          )
        }
      } catch (error) {
        console.error(
          'Discord membership lookup failed:',
          error
        )
      }
    }

    // 3. 酒馆 Discord 🍺认证
    const discordVerified =
      discordMembership &&
      roles.includes(
        STARCLUB_DISCORD_VERIFIED_ROLE_ID
      )

    // 4. Discord 人工确认的酒馆俱乐部 Role
    const discordOrgMembership =
      roles.includes(STARCLUB_ORG_ROLE_ID)

    let rsiOrgMembership = false

    // 5. RSI 官网公开 ORG 查询
    if (
      profile.rsi_verified === true &&
      profile.star_citizen_handle
    ) {
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

        if (rsiResponse.ok) {
          const html = await rsiResponse.text()

          rsiOrgMembership = html
            .toUpperCase()
            .includes(STARCLUB_ORG_SID)
        } else {
          console.error(
            'RSI org lookup failed:',
            rsiResponse.status
          )
        }
      } catch (error) {
        console.error(
          'RSI org lookup failed:',
          error
        )
      }
    }

    // 6. 官网自动认证 OR Discord 人工认证
    const orgMembership =
      rsiOrgMembership ||
      discordOrgMembership

    return NextResponse.json({
      discordConnected: Boolean(profile.discord_id),
      discordMembership,
      discordVerified,
      roles,

      orgMembership,

      orgMembershipSource: rsiOrgMembership
        ? 'rsi'
        : discordOrgMembership
          ? 'discord_role'
          : null,
    })
  } catch (error) {
    console.error(
      'Public membership API error:',
      error
    )

    return NextResponse.json(
      { error: '身份读取失败' },
      { status: 500 }
    )
  }
}