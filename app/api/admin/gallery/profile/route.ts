import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

type RequestBody = {
  galleryId?: number
  profileId?: string | null
}

function normalizeAuthor(
  value: string | null | undefined,
) {
  return (
    value
      ?.trim()
      .replace(/^@+/, '')
      .toLowerCase() ?? ''
  )
}

export async function POST(
  request: NextRequest,
) {
  try {
    const auth =
      await requireAdminApi()

    if (auth.response) {
      return auth.response
    }

    const body =
      (await request.json()) as RequestBody

    const galleryId =
      Number(body.galleryId)

    const profileId =
      body.profileId?.trim() || null

    if (
      !Number.isInteger(galleryId) ||
      galleryId <= 0
    ) {
      return NextResponse.json(
        {
          error: '作品 ID 无效',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      createAdminClient()

    /*
     * 先读取当前作品，
     * 主要是为了获得 author。
     */
    const {
      data: targetGallery,
      error: targetError,
    } = await supabase
      .from('gallery')
      .select(`
        id,
        author
      `)
      .eq('id', galleryId)
      .maybeSingle()

    if (targetError) {
      throw targetError
    }

    if (!targetGallery) {
      return NextResponse.json(
        {
          error: '作品不存在',
        },
        {
          status: 404,
        },
      )
    }

    const normalizedTargetAuthor =
      normalizeAuthor(
        targetGallery.author,
      )

    if (!normalizedTargetAuthor) {
      return NextResponse.json(
        {
          error: '该作品没有有效作者名称',
        },
        {
          status: 400,
        },
      )
    }

    /*
     * 读取所有作品的 id + author。
     *
     * 后台绑定操作频率很低，
     * 这样做逻辑简单，而且可以兼容：
     *
     * Lapernum
     * @Lapernum
     * lapernum
     * LAPERNUM
     */
    const {
      data: galleryRows,
      error: galleryRowsError,
    } = await supabase
      .from('gallery')
      .select(`
        id,
        author
      `)

    if (galleryRowsError) {
      throw galleryRowsError
    }

    const matchingIds =
      (galleryRows ?? [])
        .filter(
          (row) =>
            normalizeAuthor(
              row.author,
            ) ===
            normalizedTargetAuthor,
        )
        .map(
          (row) =>
            Number(row.id),
        )

    if (
      matchingIds.length === 0
    ) {
      return NextResponse.json(
        {
          error: '没有找到该作者的作品',
        },
        {
          status: 404,
        },
      )
    }

    /*
     * 绑定账号
     */
    if (profileId) {
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          star_citizen_handle,
          profile_slug
        `)
        .eq(
          'id',
          profileId,
        )
        .maybeSingle()

      if (profileError) {
        throw profileError
      }

      if (!profile) {
        return NextResponse.json(
          {
            error: '选择的用户不存在',
          },
          {
            status: 404,
          },
        )
      }

      const {
        error: updateError,
      } = await supabase
        .from('gallery')
        .update({
          profile_id:
            profileId,
        })
        .in(
          'id',
          matchingIds,
        )

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({
        success: true,

        updatedCount:
          matchingIds.length,

        author:
          targetGallery.author,

        profile: {
          id:
            profile.id,

          username:
            profile.username,

          displayName:
            profile.display_name,

          starCitizenHandle:
            profile.star_citizen_handle,

          profileSlug:
            profile.profile_slug,
        },
      })
    }

    /*
     * 解除绑定：
     * 同作者所有作品一起解除。
     */
    const {
      error: unbindError,
    } = await supabase
      .from('gallery')
      .update({
        profile_id: null,
      })
      .in(
        'id',
        matchingIds,
      )

    if (unbindError) {
      throw unbindError
    }

    return NextResponse.json({
      success: true,

      updatedCount:
        matchingIds.length,

      author:
        targetGallery.author,

      profile: null,
    })
  } catch (error) {
    console.error(
      'Failed to update gallery profile binding:',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '保存作者绑定失败',
      },
      {
        status: 500,
      },
    )
  }
}