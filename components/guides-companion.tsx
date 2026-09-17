'use client'

import {
  useEffect,
  useState,
} from 'react'

import {
  PageCompanion,
} from '@/components/page-companion'

import type {
  PageCompanionId,
} from '@/lib/page-companion'

export function GuidesCompanion() {
  const [
    companion,
    setCompanion,
  ] =
    useState<PageCompanionId | null>(
      null,
    )

  useEffect(() => {
    const companions:
      PageCompanionId[] = [
        'asrcwww',
        'meteorowo',
        'arx93',
      ]

    const randomIndex =
      Math.floor(
        Math.random() *
          companions.length,
      )

    setCompanion(
      companions[randomIndex],
    )
  }, [])

  if (!companion) {
    return null
  }

  return (
    <PageCompanion
      companion={companion}
    />
  )
}