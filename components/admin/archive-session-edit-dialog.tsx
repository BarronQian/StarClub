'use client'

import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import {
  toast,
} from 'sonner'

import {
  Button,
} from '@/components/ui/button'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type {
  ArchiveDbSession,
} from '@/lib/archive-db'

type Props = {
  session: ArchiveDbSession | null
  open: boolean

  onOpenChange: (
    open: boolean,
  ) => void

  onSaved: (
    session: ArchiveDbSession,
  ) => void
}

type FormState = {
  label: string
  slug: string
  eventDate: string
  title: string
  note: string
  captains: string
  reservedSlots: string
  isPublished: boolean
}

const EMPTY_FORM: FormState = {
  label: '',
  slug: '',
  eventDate: '',
  title: '',
  note: '',
  captains: '',
  reservedSlots: '0',
  isPublished: true,
}

function parseCaptains(
  value: string,
) {
  return Array.from(
    new Set(
      value
        .split(/[\n,，]+/)
        .map(
          (item) =>
            item.trim(),
        )
        .filter(Boolean),
    ),
  )
}

function parseReservedSlots(
  value: string,
) {
  const parsed =
    Number.parseInt(
      value,
      10,
    )

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return 0
  }

  return parsed
}

function getErrorMessage(
  value: unknown,
  fallback: string,
) {
  if (
    value &&
    typeof value === 'object' &&
    'error' in value &&
    typeof (
      value as {
        error?: unknown
      }
    ).error === 'string'
  ) {
    return (
      value as {
        error: string
      }
    ).error
  }

  return fallback
}

export function ArchiveSessionEditDialog({
  session,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      EMPTY_FORM,
    )

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false)

  useEffect(
    () => {
      if (!session) {
        setForm(
          EMPTY_FORM,
        )

        return
      }

      setForm({
        label:
          session.label,

        slug:
          session.slug,

        eventDate:
          session.date ?? '',

        title:
          session.title ?? '',

        note:
          session.note ?? '',

        captains:
          session.captains.join(
            '\n',
          ),

        reservedSlots:
          String(
            session.reservedSlots ??
              0,
          ),

        isPublished:
          session.isPublished,
      })
    },
    [session],
  )

  function updateForm<
    K extends keyof FormState,
  >(
    key: K,
    value: FormState[K],
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [key]: value,
      }),
    )
  }

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault()

    if (
      !session ||
      isSubmitting
    ) {
      return
    }

    if (!form.label.trim()) {
      toast.error(
        '请填写 Session Label',
      )

      return
    }

    if (!form.slug.trim()) {
      toast.error(
        '请填写 Session Slug',
      )

      return
    }

    setIsSubmitting(true)

    try {
      const response =
        await fetch(
          `/api/admin/archive/sessions/${encodeURIComponent(
            session.id,
          )}`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                slug:
                  form.slug.trim(),

                label:
                  form.label.trim(),

                event_date:
                  form.eventDate ||
                  null,

                title:
                  form.title.trim(),

                note:
                  form.note.trim(),

                captains:
                  parseCaptains(
                    form.captains,
                  ),

                reserved_slots:
                  parseReservedSlots(
                    form.reservedSlots,
                  ),

                is_published:
                  form.isPublished,
              }),
          },
        )

      const result =
        await response
          .json()
          .catch(() => null)

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            '保存 Session 失败',
          ),
        )
      }

      if (!result?.session) {
        throw new Error(
          '服务器没有返回 Session 数据',
        )
      }

      const row =
        result.session

      const updated:
        ArchiveDbSession = {
          id:
            row.id,

          slug:
            row.slug,

          label:
            row.label,

          date:
            row.event_date ??
            null,

          title:
            row.title ??
            null,

          note:
            row.note ??
            null,

          captains:
            Array.isArray(
              row.captains,
            )
              ? row.captains
              : [],

          reservedSlots:
            row.reserved_slots ??
            0,

          sortOrder:
            row.sort_order ??
            session.sortOrder,

          isPublished:
            row.is_published ??
            true,

          videos:
            session.videos,

          photos:
            session.photos,
        }

      onSaved(updated)

      toast.success(
        'Session 已保存',
      )

      onOpenChange(false)
    } catch (error) {
      console.error(
        '[Archive session edit]',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '保存 Session 失败，请重试',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(
        nextOpen,
      ) => {
        if (!isSubmitting) {
          onOpenChange(
            nextOpen,
          )
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            编辑 Session
          </DialogTitle>

          <DialogDescription>
            修改这一期合影的基本信息。
            照片与视频会在后续独立管理。
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                Label *
              </span>

              <input
                value={
                  form.label
                }
                disabled={
                  isSubmitting
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'label',
                    event.target
                      .value,
                  )
                }
                placeholder="例如：第 19 期"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                Slug *
              </span>

              <input
                value={
                  form.slug
                }
                disabled={
                  isSubmitting
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'slug',
                    event.target
                      .value
                      .trim()
                      .toLowerCase()
                      .replace(
                        /\s+/g,
                        '-',
                      )
                      .replace(
                        /[^a-z0-9-_]/g,
                        '',
                      ),
                  )
                }
                placeholder="例如：session-19"
                className="h-10 rounded-md border border-input bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                日期
              </span>

              <input
                type="date"
                value={
                  form.eventDate
                }
                disabled={
                  isSubmitting
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'eventDate',
                    event.target
                      .value,
                  )
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                Reserved Slots
              </span>

              <input
                type="number"
                min={0}
                step={1}
                value={
                  form.reservedSlots
                }
                disabled={
                  isSubmitting
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'reservedSlots',
                    event.target
                      .value,
                  )
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              标题
            </span>

            <input
              value={
                form.title
              }
              disabled={
                isSubmitting
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  'title',
                  event.target
                    .value,
                )
              }
              placeholder="可选"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              负责人 / Captains
            </span>

            <textarea
              value={
                form.captains
              }
              disabled={
                isSubmitting
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  'captains',
                  event.target
                    .value,
                )
              }
              rows={3}
              placeholder={'每行一个，也可以使用逗号分隔'}
              className="resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              备注
            </span>

            <textarea
              value={
                form.note
              }
              disabled={
                isSubmitting
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  'note',
                  event.target
                    .value,
                )
              }
              rows={4}
              placeholder="可选"
              className="resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:border-primary"
            />
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={
                form.isPublished
              }
              disabled={
                isSubmitting
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  'isPublished',
                  event.target
                    .checked,
                )
              }
              className="size-4"
            />

            <div>
              <p className="text-sm text-foreground">
                已发布
              </p>

              <p className="text-[0.68rem] text-muted-foreground">
                关闭后，这个 Session
                会作为未发布内容保留在后台。
              </p>
            </div>
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={
                isSubmitting
              }
              onClick={() =>
                onOpenChange(
                  false,
                )
              }
            >
              取消
            </Button>

            <Button
              type="submit"
              disabled={
                isSubmitting
              }
            >
              {isSubmitting
                ? '保存中...'
                : '保存修改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}