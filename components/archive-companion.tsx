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
  'starclub-archive-companion-history'

const companions: PageCompanionId[] = [
  'cyanaemorrachi',
  'walkerjack4396',
  'sleepmita',
  'embergt',
  'lightrepulsor',
]

export function ArchiveCompanion() {
  const [
    companion,
    setCompanion,
  ] =
    useState<PageCompanionId | null>(
      null,
    )

  useEffect(() => {
    let history: PageCompanionId[] = []

    try {
      const stored =
        window.sessionStorage.getItem(
          STORAGE_KEY,
        )

      if (stored) {
        history = JSON.parse(stored)
      }
    } catch {
      history = []
    }

    history = history.filter(
      (item) =>
        companions.includes(item),
    )

    let availableCompanions =
      companions.filter(
        (item) =>
          !history.includes(item),
      )

    // 一轮全部出现完毕
    if (
      availableCompanions.length === 0
    ) {
      const lastCompanion =
        history[history.length - 1]

      history = []

      // 新一轮第一人不能和上一轮最后一人相同
      availableCompanions =
        companions.filter(
          (item) =>
            item !== lastCompanion,
        )
    }

    const randomIndex =
      Math.floor(
        Math.random() *
          availableCompanions.length,
      )

    const nextCompanion =
      availableCompanions[
        randomIndex
      ]

    setCompanion(nextCompanion)

    const nextHistory = [
      ...history,
      nextCompanion,
    ]

    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextHistory),
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