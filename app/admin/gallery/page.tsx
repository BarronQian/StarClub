import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getAdminSession } from '@/lib/admin-auth'
import { getAdminGalleryFromDb } from '@/lib/gallery-db'
import { createAdminClient } from '@/lib/supabase-admin'

import { GalleryAdmin } from '@/components/admin/gallery-admin'

export const metadata: Metadata = {
  title: '影廊后台 | 星际酒馆 StarClub',
  robots: {
    index: false,
    follow: false,
  },
}

export type GalleryProfileOption = {
  id: string
  username: string | null
  displayName: string | null
  starCitizenHandle: string | null
  profileSlug: string | null
}

export default async function AdminGalleryPage() {
  const session =
    await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  const supabase =
    createAdminClient()

  const [
    shots,
    profilesResult,
  ] =
    await Promise.all([
      getAdminGalleryFromDb(),

      supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          star_citizen_handle,
          profile_slug
        `)
        .order(
          'member_number',
          {
            ascending: true,
            nullsFirst: false,
          },
        ),
    ])

  if (
    profilesResult.error
  ) {
    throw new Error(
      `Failed to load gallery profile options: ${profilesResult.error.message}`,
    )
  }

  const profiles: GalleryProfileOption[] =
    (
      profilesResult.data ??
      []
    ).map(
      (profile) => ({
        id: profile.id,

        username:
          profile.username,

        displayName:
          profile.display_name,

        starCitizenHandle:
          profile.star_citizen_handle,

        profileSlug:
          profile.profile_slug,
      }),
    )

  return (
    <GalleryAdmin
      initialShots={shots}
      profiles={profiles}
      adminEmail={
        session.email
      }
    />
  )
}