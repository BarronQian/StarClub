'use client'

import {
  useState,
} from 'react'

import {
  useRouter,
} from 'next/navigation'

type Props = {
  guideId: string
  guideTitle: string
}

export function AdminGuideDeleteButton({
  guideId,
  guideTitle,
}: Props) {
  const router =
    useRouter()

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  async function handleDelete() {
    const confirmed =
      window.confirm(
        `确定要删除攻略「${guideTitle}」吗？\n\n删除后正文内容也会一起删除，而且无法恢复。`,
      )

    if (!confirmed) {
      return
    }

    const secondConfirm =
      window.confirm(
        '再次确认：真的要永久删除这篇攻略吗？',
      )

    if (!secondConfirm) {
      return
    }

    setError(null)
    setIsDeleting(true)

    try {
      const response =
        await fetch(
          `/api/admin/guides/${guideId}`,
          {
            method:
              'DELETE',
          },
        )

      const data =
        await response
          .json()
          .catch(
            () => ({}),
          )

      if (!response.ok) {
        throw new Error(
          data.error ??
            '删除攻略失败',
        )
      }

      router.push(
        '/admin/guides',
      )

      router.refresh()
    } catch (err) {
      console.error(
        '[ADMIN GUIDE DELETE] Failed:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : '删除攻略失败',
      )

      setIsDeleting(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={
          handleDelete
        }
        disabled={
          isDeleting
        }
        className="rounded-full border border-destructive/40 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDeleting
          ? '正在删除...'
          : '删除攻略'}
      </button>

      {error && (
        <p className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}