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

    if (!supabaseUrl || !serviceRoleKey) {
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
    const profileSlug = decodeURIComponent(username)

    // 找到主页主人
    const {
      data: targetProfile,
      error: targetError,
    } = await adminClient
      .from('profiles')
      .select('id, profile_slug, member_number')
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
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 最近访客
    const {
      data: visits,
      error: visitsError,
    } = await adminClient
      .from('profile_visits')
      .select(`
        visitor_id,
        visited_at
      `)
      .eq('profile_id', targetProfile.id)
      .order('visited_at', { ascending: false })
      .limit(12)

    if (visitsError) {
      console.error(
        'Failed to load profile visits:',
        visitsError
      )

      return NextResponse.json(
        { error: '无法读取访客记录' },
        { status: 500 }
      )
    }

    if (!visits || visits.length === 0) {
      return NextResponse.json({
        visitors: [],
        count: 0,
      })
    }

    const visitorIds = visits.map(
      (visit) => visit.visitor_id
    )

    // 读取访客公开资料
    const {
      data: profiles,
      error: profilesError,
    } = await adminClient
      .from('profiles')
      .select(`
        id,
        username,
        profile_slug,
        member_number,
        display_name,
        star_citizen_handle,
        avatar_url
      `)
      .in('id', visitorIds)

    if (profilesError) {
      console.error(
        'Failed to load visitor profiles:',
        profilesError
      )

      return NextResponse.json(
        { error: '无法读取访客资料' },
        { status: 500 }
      )
    }

    // 保留 profile_visits 的访问时间排序
    const visitors = visits
      .map((visit) => {
        const visitor = profiles?.find(
          (profile) =>
            profile.id === visit.visitor_id
        )

        if (!visitor) return null

        return {
          id: visitor.id,
          username: visitor.username,
          profileSlug: visitor.profile_slug ?? null,
          memberNumber: visitor.member_number ?? null,
          displayName: visitor.display_name,
          starCitizenHandle: visitor.star_citizen_handle,
          avatarUrl: visitor.avatar_url,
          visitedAt: visit.visited_at,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      visitors,
      count: visitors.length,
    })
  } catch (error) {
    console.error(
      'Profile visitors API error:',
      error
    )

    return NextResponse.json(
      { error: '访客记录读取失败' },
      { status: 500 }
    )
  }
}