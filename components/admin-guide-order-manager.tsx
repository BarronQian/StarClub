'use client'

import {
  useMemo,
  useState,
} from 'react'

type GuideOrderItem = {
  id: string
  title: string
  published: boolean
  featured: boolean
  sort_order: number
}

type Props = {
  guides: GuideOrderItem[]
}

export function AdminGuideOrderManager({
  guides,
}: Props) {
  const initialItems =
    useMemo(
      () =>
        [...guides]
          .filter(
            (guide) =>
              guide.published,
          )
          .sort(
            (a, b) =>
              a.sort_order -
              b.sort_order,
          ),
      [guides],
    )

  const [
    items,
    setItems,
  ] = useState(
    initialItems,
  )

  const [
    isSaving,
    setIsSaving,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState<
    string | null
  >(null)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  function moveItem(
    index: number,
    direction:
      | 'up'
      | 'down',
  ) {
    setItems(
      (current) => {
        const next =
          [...current]

        const targetIndex =
          direction === 'up'
            ? index - 1
            : index + 1

        if (
          targetIndex < 0 ||
          targetIndex >=
            next.length
        ) {
          return current
        }

        const temp =
          next[index]

        next[index] =
          next[targetIndex]

        next[targetIndex] =
          temp

        return next
      },
    )

    setMessage(null)
    setError(null)
  }

  async function saveOrder() {
    setIsSaving(true)
    setMessage(null)
    setError(null)

    try {
      const response =
        await fetch(
          '/api/admin/guides/order',
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                guides:
                  items.map(
                    (
                      guide,
                      index,
                    ) => ({
                      id:
                        guide.id,

                      sort_order:
                        (index + 1) *
                        10,
                    }),
                  ),
              }),
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
            '保存排序失败',
        )
      }

      setMessage(
        '攻略排序已保存',
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '保存排序失败',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (
    items.length === 0
  ) {
    return null
  }

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-display text-[0.62rem] tracking-[0.28em] text-primary">
            GUIDE ORDER
          </span>

          <h2 className="mt-2 font-display text-xl">
            已发布攻略排序
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            使用上下按钮调整前台攻略顺序，完成后保存。
          </p>
        </div>

        <button
          type="button"
          onClick={
            saveOrder
          }
          disabled={
            isSaving
          }
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? '正在保存...'
            : '保存排序'}
        </button>
      </div>

      <div className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border">
        {items.map(
          (
            guide,
            index,
          ) => (
            <div
              key={
                guide.id
              }
              className="flex items-center gap-4 px-4 py-3"
            >
              <div className="w-8 shrink-0 text-center text-xs text-muted-foreground">
                {index +
                  1}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {
                    guide.title
                  }
                </div>

                {guide.featured && (
                  <div className="mt-1 text-xs text-primary">
                    推荐攻略
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    index === 0
                  }
                  onClick={() =>
                    moveItem(
                      index,
                      'up',
                    )
                  }
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ↑
                </button>

                <button
                  type="button"
                  disabled={
                    index ===
                    items.length -
                      1
                  }
                  onClick={() =>
                    moveItem(
                      index,
                      'down',
                    )
                  }
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {message && (
        <p className="mt-4 text-sm text-emerald-600">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}