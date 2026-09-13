'use client'

import {
  useMemo,
  useState,
} from 'react'

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'

import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import {
  CSS,
} from '@dnd-kit/utilities'

import {
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

type Sponsor = {
  id: string
  rank: number
  name: string
  nickname: string | null
  badge: string | null
  amount: number
  sort_order: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

type FormState = {
  name: string
  nickname: string
  badge: string
  amount: string
  isVisible: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  nickname: '',
  badge: '',
  amount: '',
  isVisible: true,
}

function SortableSponsorRow({
  sponsor,
  index,
  canDrag,
  deletingId,
  onEdit,
  onToggleVisible,
  onDelete,
}: {
  sponsor: Sponsor
  index: number
  canDrag: boolean
  deletingId: string | null

  onEdit: (
    sponsor: Sponsor,
  ) => void

  onToggleVisible: (
    sponsor: Sponsor,
  ) => void

  onDelete: (
    sponsor: Sponsor,
  ) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } =
    useSortable({
      id: sponsor.id,
      disabled:
        !canDrag,
    })

  const style = {
    transform:
      CSS.Transform.toString(
        transform,
      ),
    transition,
    opacity:
      isDragging
        ? 0.55
        : 1,
    zIndex:
      isDragging
        ? 10
        : undefined,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={
        isDragging
          ? 'relative bg-muted/60 shadow-lg'
          : 'transition-colors hover:bg-muted/20'
      }
    >
      <td className="w-12 px-3 py-4">
        <button
          type="button"
          disabled={
            !canDrag
          }
          {...attributes}
          {...listeners}
          title={
            canDrag
              ? '拖动调整同金额排名'
              : '只有金额相同的赞助者可以调整排名'
          }
          className={
            canDrag
              ? 'flex size-7 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing'
              : 'flex size-7 cursor-not-allowed items-center justify-center rounded-md text-muted-foreground/25'
          }
        >
          <GripVertical className="size-4" />
        </button>
      </td>

      <td className="px-5 py-4 font-display text-xs text-muted-foreground">
        {String(
          index + 1,
        ).padStart(
          2,
          '0',
        )}
      </td>

      <td className="px-5 py-4 font-medium">
        {sponsor.name}
      </td>

      <td className="px-5 py-4 text-muted-foreground">
        {sponsor.nickname ||
          '—'}
      </td>

      <td className="px-5 py-4">
        {sponsor.badge ? (
          <span className="rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-xs text-amber-700">
            {sponsor.badge}
          </span>
        ) : (
          <span className="text-muted-foreground">
            —
          </span>
        )}
      </td>

      <td className="px-5 py-4 text-right font-medium">
        $
        {sponsor.amount.toLocaleString(
          'en-US',
          {
            minimumFractionDigits:
              2,
            maximumFractionDigits:
              2,
          },
        )}
      </td>

      <td className="px-5 py-4 text-center">
        <button
          type="button"
          onClick={() =>
            onToggleVisible(
              sponsor,
            )
          }
          className={
            sponsor.is_visible
              ? 'inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-600'
              : 'inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground'
          }
        >
          {sponsor.is_visible ? (
            <Eye className="size-3.5" />
          ) : (
            <EyeOff className="size-3.5" />
          )}

          {sponsor.is_visible
            ? '显示'
            : '隐藏'}
        </button>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              onEdit(
                sponsor,
              )
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs transition-colors hover:bg-muted"
          >
            <Pencil className="size-3.5" />
            编辑
          </button>

          <button
            type="button"
            disabled={
              deletingId ===
              sponsor.id
            }
            onClick={() =>
              onDelete(
                sponsor,
              )
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 px-3 text-xs text-red-500 transition-colors hover:bg-red-500/5 disabled:opacity-40"
          >
            <Trash2 className="size-3.5" />

            {deletingId ===
            sponsor.id
              ? '删除中'
              : '删除'}
          </button>
        </div>
      </td>
    </tr>
  )
}

export function SponsorManager({
  initialSponsors,
}: {
  initialSponsors: Sponsor[]
}) {
  const [
    sponsors,
    setSponsors,
  ] =
    useState<Sponsor[]>(
      initialSponsors,
    )

  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      EMPTY_FORM,
    )

  const [
    editingId,
    setEditingId,
  ] =
    useState<
      string | null
    >(null)

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<
      string | null
    >(null)

  const [
    reordering,
    setReordering,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

  const sensors =
    useSensors(
      useSensor(
        PointerSensor,
        {
          activationConstraint: {
            distance: 6,
          },
        },
      ),

      useSensor(
        KeyboardSensor,
        {
          coordinateGetter:
            sortableKeyboardCoordinates,
        },
      ),
    )

  const sortedSponsors =
    useMemo(
      () =>
        [...sponsors].sort(
          (
            a,
            b,
          ) => {
            if (
              b.amount !==
              a.amount
            ) {
              return (
                b.amount -
                a.amount
              )
            }

            return (
              b.sort_order -
              a.sort_order
            )
          },
        ),
      [sponsors],
    )

  const amountCounts =
    useMemo(() => {
      const counts =
        new Map<
          number,
          number
        >()

      for (
        const sponsor of
        sortedSponsors
      ) {
        counts.set(
          sponsor.amount,
          (
            counts.get(
              sponsor.amount,
            ) ?? 0
          ) + 1,
        )
      }

      return counts
    }, [
      sortedSponsors,
    ])

  function resetForm() {
    setEditingId(null)
    setForm(
      EMPTY_FORM,
    )
    setError('')
  }

  function startEdit(
    sponsor: Sponsor,
  ) {
    setEditingId(
      sponsor.id,
    )

    setForm({
      name:
        sponsor.name,

      nickname:
        sponsor.nickname ??
        '',

      badge:
        sponsor.badge ??
        '',

      amount:
        String(
          sponsor.amount,
        ),

      isVisible:
        sponsor.is_visible,
    })

    setError('')

    window.scrollTo({
      top: 0,
      behavior:
        'smooth',
    })
  }

  async function saveSponsor() {
    if (saving) {
      return
    }

    const name =
      form.name.trim()

    const amount =
      Number(
        form.amount,
      )

    if (!name) {
      setError(
        '请填写赞助者名称',
      )
      return
    }

    if (
      !Number.isFinite(
        amount,
      ) ||
      amount < 0
    ) {
      setError(
        '赞助金额无效',
      )
      return
    }

    setSaving(true)
    setError('')

    try {
      const endpoint =
        editingId
          ? `/api/admin/sponsors/${editingId}`
          : '/api/admin/sponsors'

      const response =
        await fetch(
          endpoint,
          {
            method:
              editingId
                ? 'PATCH'
                : 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                name,
                nickname:
                  form.nickname,
                badge:
                  form.badge,
                amount,
                isVisible:
                  form.isVisible,
              }),
          },
        )

      const data =
        await response.json()

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            '保存失败',
        )
      }

      const sponsor =
        data.sponsor as Sponsor

      setSponsors(
        (
          current,
        ) => {
          const exists =
            current.some(
              (
                item,
              ) =>
                item.id ===
                sponsor.id,
            )

          if (exists) {
            return current.map(
              (
                item,
              ) =>
                item.id ===
                sponsor.id
                  ? {
                      ...item,
                      ...sponsor,
                    }
                  : item,
            )
          }

          return [
            ...current,
            sponsor,
          ]
        },
      )

      resetForm()
    } catch (
      error
    ) {
      setError(
        error instanceof
          Error
          ? error.message
          : '保存失败',
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleVisible(
    sponsor: Sponsor,
  ) {
    try {
      const response =
        await fetch(
          `/api/admin/sponsors/${sponsor.id}`,
          {
            method:
              'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                isVisible:
                  !sponsor.is_visible,
              }),
          },
        )

      const data =
        await response.json()

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            '更新显示状态失败',
        )
      }

      setSponsors(
        (
          current,
        ) =>
          current.map(
            (
              item,
            ) =>
              item.id ===
              sponsor.id
                ? {
                    ...item,
                    is_visible:
                      !sponsor.is_visible,
                  }
                : item,
          ),
      )
    } catch (
      error
    ) {
      setError(
        error instanceof
          Error
          ? error.message
          : '更新显示状态失败',
      )
    }
  }

  async function deleteSponsor(
    sponsor: Sponsor,
  ) {
    if (
      deletingId
    ) {
      return
    }

    const confirmed =
      window.confirm(
        `确定删除赞助者「${sponsor.name}」吗？`,
      )

    if (!confirmed) {
      return
    }

    setDeletingId(
      sponsor.id,
    )
    setError('')

    try {
      const response =
        await fetch(
          `/api/admin/sponsors/${sponsor.id}`,
          {
            method:
              'DELETE',
          },
        )

      const data =
        await response.json()

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            '删除失败',
        )
      }

      setSponsors(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item.id !==
              sponsor.id,
          ),
      )

      if (
        editingId ===
        sponsor.id
      ) {
        resetForm()
      }
    } catch (
      error
    ) {
      setError(
        error instanceof
          Error
          ? error.message
          : '删除失败',
      )
    } finally {
      setDeletingId(
        null,
      )
    }
  }

  async function handleDragEnd(
    event: DragEndEvent,
  ) {
    const {
      active,
      over,
    } = event

    if (
      !over ||
      active.id === over.id ||
      reordering
    ) {
      return
    }

    const oldIndex =
      sortedSponsors.findIndex(
        (
          sponsor,
        ) =>
          sponsor.id ===
          active.id,
      )

    const newIndex =
      sortedSponsors.findIndex(
        (
          sponsor,
        ) =>
          sponsor.id ===
          over.id,
      )

    if (
      oldIndex === -1 ||
      newIndex === -1
    ) {
      return
    }

    const activeSponsor =
      sortedSponsors[
        oldIndex
      ]

    const overSponsor =
      sortedSponsors[
        newIndex
      ]

    if (
      activeSponsor.amount !==
      overSponsor.amount
    ) {
      setError(
        '赞助榜以总赞助金额为主要排名规则，只能调整金额相同的赞助者顺序。',
      )
      return
    }

    const previous =
      [...sponsors]

    const reordered =
      arrayMove(
        sortedSponsors,
        oldIndex,
        newIndex,
      ).map(
        (
          sponsor,
          index,
          array,
        ) => ({
          ...sponsor,
          sort_order:
            array.length -
            index,
        }),
      )

    setSponsors(
      reordered,
    )

    setReordering(
      true,
    )
    setError('')

    try {
      const response =
        await fetch(
          '/api/admin/sponsors/reorder',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                orderedIds:
                  reordered.map(
                    (
                      sponsor,
                    ) =>
                      sponsor.id,
                  ),
              }),
          },
        )

      const data =
        await response.json()

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            '保存排序失败',
        )
      }
    } catch (
      error
    ) {
      setSponsors(
        previous,
      )

      setError(
        error instanceof
          Error
          ? error.message
          : '保存排序失败',
      )
    } finally {
      setReordering(
        false,
      )
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-sm font-medium">
              {editingId
                ? '编辑赞助者'
                : '新增赞助者'}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              修改后将直接影响公开赞助榜。
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={
                resetForm
              }
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              取消编辑
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs font-medium">
              游戏 ID / 名称
            </span>

            <input
              value={
                form.name
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,
                  name:
                    event.target.value,
                })
              }
              placeholder="例如 BTxiaocui"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-foreground/30"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium">
              中文昵称
            </span>

            <input
              value={
                form.nickname
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,
                  nickname:
                    event.target.value,
                })
              }
              placeholder="可留空"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-foreground/30"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium">
              荣誉称号
            </span>

            <input
              value={
                form.badge
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,
                  badge:
                    event.target.value,
                })
              }
              placeholder="例如 赞助大亨"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-foreground/30"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium">
              总赞助金额 USD
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                form.amount
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,
                  amount:
                    event.target.value,
                })
              }
              placeholder="0.00"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-foreground/30"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={
                form.isVisible
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,
                  isVisible:
                    event.target.checked,
                })
              }
            />

            在公开赞助榜显示
          </label>

          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              saveSponsor
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-all hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {editingId ? (
              <Pencil className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}

            {saving
              ? '保存中...'
              : editingId
                ? '保存修改'
                : '新增赞助者'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold">
              赞助榜
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              按总赞助金额自动排名；金额相同时可拖动左侧手柄调整顺序。
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground">
              {sponsors.length}{' '}
              人
            </span>

            {reordering && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                正在保存排序...
              </p>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <DndContext
            sensors={
              sensors
            }
            collisionDetection={
              closestCenter
            }
            onDragEnd={
              handleDragEnd
            }
          >
            <SortableContext
              items={
                sortedSponsors.map(
                  (
                    sponsor,
                  ) =>
                    sponsor.id,
                )
              }
              strategy={
                verticalListSortingStrategy
              }
            >
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                  <tr>
                    <th className="w-12 px-3 py-3" />

                    <th className="px-5 py-3 text-left font-medium">
                      排名
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      名称
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      昵称
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      称号
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      总赞助
                    </th>

                    <th className="px-5 py-3 text-center font-medium">
                      状态
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      操作
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {sortedSponsors.map(
                    (
                      sponsor,
                      index,
                    ) => (
                      <SortableSponsorRow
                        key={
                          sponsor.id
                        }
                        sponsor={
                          sponsor
                        }
                        index={
                          index
                        }
                        canDrag={
                          (
                            amountCounts.get(
                              sponsor.amount,
                            ) ?? 0
                          ) > 1
                        }
                        deletingId={
                          deletingId
                        }
                        onEdit={
                          startEdit
                        }
                        onToggleVisible={
                          toggleVisible
                        }
                        onDelete={
                          deleteSponsor
                        }
                      />
                    ),
                  )}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
      </section>
    </div>
  )
}