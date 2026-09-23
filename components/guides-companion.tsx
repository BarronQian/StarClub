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

const STORAGE_KEY =
  'starclub-last-guides-companion'

const companions: PageCompanionId[] = [
  'asrcwww',
  'meteorowo',
  'arx93',
  'ttv550',
  'furysoulfy',
  'raineyday',
]

export function GuidesCompanion() {
  const [
    companion,
    setCompanion,
  ] =
    useState<PageCompanionId | null>(
      null,
    )

  useEffect(() => {
    const lastCompanion =
      window.sessionStorage.getItem(
        STORAGE_KEY,
      )

    const availableCompanions =
      companions.filter(
        (item) =>
          item !== lastCompanion,
      )

    const randomIndex =
      Math.floor(
        Math.random() *
          availableCompanions.length,
      )

    const nextCompanion =
      availableCompanions[
        randomIndex
      ]

    setCompanion(
      nextCompanion,
    )

    window.sessionStorage.setItem(
      STORAGE_KEY,
      nextCompanion,
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