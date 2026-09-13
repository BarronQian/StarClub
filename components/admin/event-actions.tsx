'use client'

import {
  useState,
} from 'react'

import Link from 'next/link'

import {
  useRouter,
} from 'next/navigation'

import {
  Button,
} from '@/components/ui/button'

type EventActionsProps = {
  id: string
  slug: string
  status: string
}

export function EventActions({
  id,
  slug,
  status,
}: EventActionsProps) {
  const router =
    useRouter()

  const [
    loading,
    setLoading,
  ] = useState<
    'end' | 'delete' | null
  >(null)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  async function markEnded() {
    if (loading) {
      return
    }

    const confirmed =
      window.confirm(
        '确定要将这个活动标记为“已结束”吗？',
      )

    if (!confirmed) {
      return
    }

    setLoading('end')
    setError(null)

    try {
      const response =
        await fetch(
          `/api/admin/events/${id}`,
          {
            method:
              'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                status:
                  'ended',
              }),
          },
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            '标记活动失败',
        )
      }

      router.refresh()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '标记活动失败',
      )
    } finally {
      setLoading(null)
    }
  }

  async function deleteEvent() {
    if (loading) {
      return
    }

    const confirmed =
      window.confirm(
        '确定要删除这个活动吗？\n\n活动将从前台和后台列表隐藏，但数据库记录会保留。',
      )

    if (!confirmed) {
      return
    }

    setLoading('delete')
    setError(null)

    try {
      const response =
        await fetch(
          `/api/admin/events/${id}`,
          {
            method:
              'DELETE',
          },
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            '删除活动失败',
        )
      }

      router.refresh()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '删除活动失败',
      )
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href={`/events/${slug}`}
          target="_blank"
          className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          查看
        </Link>

        <Link
          href={`/admin/events/${id}`}
          className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          编辑
        </Link>

        {status !== 'ended' ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              loading !== null
            }
            onClick={
              markEnded
            }
          >
            {loading === 'end'
              ? '处理中...'
              : '标记已结束'}
          </Button>
        ) : null}

        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={
            loading !== null
          }
          onClick={
            deleteEvent
          }
        >
          {loading === 'delete'
            ? '删除中...'
            : '删除'}
        </Button>
      </div>

      {error ? (
        <p className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}