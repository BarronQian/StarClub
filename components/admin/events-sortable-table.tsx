'use client'

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
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
  GripVertical,
} from 'lucide-react'

import {
  useState,
} from 'react'

import {
  Badge,
} from '@/components/ui/badge'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  EventActions,
} from '@/components/admin/event-actions'

import {
  EVENT_CATEGORY_LABEL,
  EVENT_STATUS_LABEL,
} from '@/lib/events'

import type {
  EventCategory,
  EventStatus,
} from '@/lib/events'

export type AdminEventRow = {
  id: string
  slug: string
  tag: string
  title: string
  subtitle: string | null
  date: string
  location: string
  category: EventCategory
  status: EventStatus
  featured_on_home: boolean
  is_published: boolean
  sort_order: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

type EventsSortableTableProps = {
  initialEvents: AdminEventRow[]
}

function getStatusClass(
  status: EventStatus,
) {
  if (status === 'open') {
    return 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
  }

  if (status === 'ongoing') {
    return 'border-blue-500/30 text-blue-600 dark:text-blue-400'
  }

  if (status === 'upcoming') {
    return 'border-amber-500/30 text-amber-600 dark:text-amber-400'
  }

  return 'border-muted-foreground/30 text-muted-foreground'
}

function SortableEventRow({
  event,
  disabled,
}: {
  event: AdminEventRow
  disabled: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: event.id,
    disabled,
  })

  const style = {
    transform:
      CSS.Transform.toString(
        transform,
      ),
    transition,
    opacity:
      isDragging ? 0.5 : 1,
    position:
      'relative' as const,
    zIndex:
      isDragging ? 20 : 0,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={
        isDragging
          ? 'bg-muted/70'
          : undefined
      }
    >
      <TableCell className="w-10 pr-0">
        <button
          type="button"
          disabled={disabled}
          {...attributes}
          {...listeners}
          className="flex size-8 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`拖动排序 ${event.title}`}
          title="按住拖动调整顺序"
        >
          <GripVertical
            className="size-4"
          />
        </button>
      </TableCell>

      <TableCell className="max-w-72">
        <div className="font-medium text-foreground">
          {event.title}
        </div>

        {event.subtitle ? (
          <div className="mt-1 truncate text-[0.68rem] text-muted-foreground">
            {event.subtitle}
          </div>
        ) : null}

        <div className="mt-1 text-[0.65rem] text-muted-foreground/70">
          {event.slug}
        </div>
      </TableCell>

      <TableCell>
        <Badge variant="outline">
          {
            EVENT_CATEGORY_LABEL[
              event.category
            ]
          }
        </Badge>
      </TableCell>

      <TableCell>
        <Badge
          variant="outline"
          className={
            getStatusClass(
              event.status,
            )
          }
        >
          {
            EVENT_STATUS_LABEL[
              event.status
            ]
          }
        </Badge>
      </TableCell>

      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
        {event.date}
      </TableCell>

      <TableCell>
        {event.is_published ? (
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          >
            已发布
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-muted-foreground/30 text-muted-foreground"
          >
            草稿
          </Badge>
        )}
      </TableCell>

      <TableCell>
        {event.featured_on_home ? (
          <Badge
            variant="outline"
            className="border-primary/30 text-primary"
          >
            推荐
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">
            —
          </span>
        )}
      </TableCell>

      <TableCell className="text-right">
        <EventActions
          id={event.id}
          slug={event.slug}
          status={event.status}
        />
      </TableCell>
    </TableRow>
  )
}

export function EventsSortableTable({
  initialEvents,
}: EventsSortableTableProps) {
  const [
    events,
    setEvents,
  ] = useState(
    initialEvents,
  )

  const [
    saving,
    setSaving,
  ] = useState(false)

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

  async function handleDragEnd(
    dragEvent: DragEndEvent,
  ) {
    const {
      active,
      over,
    } = dragEvent

    if (
      !over ||
      active.id === over.id ||
      saving
    ) {
      return
    }

    const oldIndex =
      events.findIndex(
        (event) =>
          event.id ===
          active.id,
      )

    const newIndex =
      events.findIndex(
        (event) =>
          event.id ===
          over.id,
      )

    if (
      oldIndex === -1 ||
      newIndex === -1
    ) {
      return
    }

    const previousEvents =
      events

    const nextEvents =
      arrayMove(
        events,
        oldIndex,
        newIndex,
      )

    setEvents(
      nextEvents,
    )

    setSaving(true)

    try {
      const response =
        await fetch(
          '/api/admin/events/reorder',
          {
            method:
              'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                ids:
                  nextEvents.map(
                    (event) =>
                      event.id,
                  ),
              }),
          },
        )

      const data =
        await response
          .json()
          .catch(
            () => null,
          )

      if (!response.ok) {
        throw new Error(
          data?.error ||
            '活动排序保存失败',
        )
      }
    } catch (error) {
      setEvents(
        previousEvents,
      )

      window.alert(
        error instanceof Error
          ? error.message
          : '活动排序保存失败',
      )
    } finally {
      setSaving(false)
    }
  }

  if (
    events.length === 0
  ) {
    return (
      <div className="corner-cut border border-border bg-card py-12 text-center text-sm text-muted-foreground">
        当前没有活动
      </div>
    )
  }

  return (
    <div className="corner-cut overflow-hidden border border-border bg-card">
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={
            closestCenter
          }
          onDragEnd={
            handleDragEnd
          }
        >
          <SortableContext
            items={events.map(
              (event) =>
                event.id,
            )}
            strategy={
              verticalListSortingStrategy
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <span className="sr-only">
                      排序
                    </span>
                  </TableHead>

                  <TableHead>
                    活动
                  </TableHead>

                  <TableHead>
                    分类
                  </TableHead>

                  <TableHead>
                    状态
                  </TableHead>

                  <TableHead>
                    日期
                  </TableHead>

                  <TableHead>
                    发布
                  </TableHead>

                  <TableHead>
                    首页
                  </TableHead>

                  <TableHead className="text-right">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {events.map(
                  (event) => (
                    <SortableEventRow
                      key={
                        event.id
                      }
                      event={
                        event
                      }
                      disabled={
                        saving
                      }
                    />
                  ),
                )}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      </div>

      {saving ? (
        <div className="border-t border-border px-4 py-2 text-[0.68rem] text-muted-foreground">
          正在保存活动顺序...
        </div>
      ) : null}
    </div>
  )
}