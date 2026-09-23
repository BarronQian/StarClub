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
  'starclub-guides-companion-history'

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

    // 只保留当前仍然存在于角色池中的角色
    history = history.filter(
      (item) =>
        companions.includes(item),
    )

    let availableCompanions =
      companions.filter(
        (item) =>
          !history.includes(item),
      )

    // 全部角色都出现过一轮
    // 开启新的一轮
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