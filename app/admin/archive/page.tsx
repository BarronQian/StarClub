import type {
  Metadata,
} from 'next'

import {
  redirect,
} from 'next/navigation'

import {
  getAdminSession,
} from '@/lib/admin-auth'

import {
  getArchiveFromDb,
} from '@/lib/archive-db'

import {
  ArchiveAdmin,
} from '@/components/admin/archive-admin'

export const metadata: Metadata = {
  title:
    '合影后台 | 星际酒馆 StarClub',

  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminArchivePage() {
  const session =
    await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  const categories =
    await getArchiveFromDb({
      includeUnpublished: true,
    })

  return (
    <ArchiveAdmin
      initialCategories={
        categories
      }
      adminEmail={
        session.email
      }
    />
  )
}