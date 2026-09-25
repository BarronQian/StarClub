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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type {
  ArchiveDbAlbum,
  ArchiveDbSession,
} from '@/lib/archive-db'

type Props = {
  album:
    | ArchiveDbAlbum
    | null

  open: boolean

  onOpenChange: (
    open: boolean,
  ) => void

  onCreated: (
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

const EMPTY_FORM:
  FormState = {
  label: '',
  slug: '',
  eventDate: '',
  title: '',
  note: '',
  captains: '',
  reservedSlots: '0',
  isPublished: true,
}

function createSlug(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      '-',
    )
    .replace(
      /[^a-z0-9-_]/g,
      '',
    )
    .replace(
      /-+/g,
      '-',
    )
    .replace(
      /^[-_]+|[-_]+$/g,
      '',
    )
}

function getErrorMessage(
  value: unknown,
  fallback: string,
) {
  if (
    value &&
    typeof value ===
      'object' &&
    'error' in value &&
    typeof (
      value as {
        error?: unknown
      }
    ).error ===
      'string'
  ) {
    return (
      value as {
        error: string
      }
    ).error
  }

  return fallback
}

function parseCaptains(
  value: string,
) {
  /*
   * 支持：
   *
   * Furysoulfy
   * Coolapple-pie
   *
   * 或：
   *
   * Furysoulfy, Coolapple-pie
   *
   * 中英文逗号、换行都可以。
   */
  return Array.from(
    new Set(
      value
        .split(
          /[\n,，]+/,
        )
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
  const number =
    Number(value)

  if (
    !Number.isFinite(
      number,
    ) ||
    number < 0
  ) {
    return 0
  }

  return Math.floor(
    number,
  )
}

export function ArchiveSessionCreateDialog({
  album,
  open,
  onOpenChange,
  onCreated,
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

  useEffect(() => {
    if (!open) {
      return
    }

    setForm(
      EMPTY_FORM,
    )
  }, [
    album?.id,
    open,
  ])

  function updateForm<
    K extends keyof FormState,
  >(
    key: K,
    value:
      FormState[K],
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [key]:
          value,
      }),
    )
  }

  function handleLabelChange(
    value: string,
  ) {
    setForm(
      (previous) => {
        const shouldGenerateSlug =
          !previous.slug ||
          previous.slug ===
            createSlug(
              previous.label,
            )

        return {
          ...previous,

          label:
            value,

          slug:
            shouldGenerateSlug
              ? createSlug(
                  value,
                )
              : previous.slug,
        }
      },
    )
  }

  async function handleSubmit(
    event:
      FormEvent,
  ) {
    event.preventDefault()

    if (!album) {
      return
    }

    if (
      !form.label.trim()
    ) {
      toast.error(
        '请填写 Session Label',
      )

      return
    }

    const slug =
      createSlug(
        form.slug,
      )

    if (!slug) {
      toast.error(
        '请填写 Session Slug',
      )

      return
    }

    setIsSubmitting(
      true,
    )

    try {
      const response =
        await fetch(
          '/api/admin/archive/sessions',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                album_id:
                  album.id,

                slug,

                label:
                  form.label,

                event_date:
                  form.eventDate ||
                  null,

                title:
                  form.title,

                note:
                  form.note,

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
          .catch(
            () => null,
          )

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            '创建 Session 失败',
          ),
        )
      }

      if (
        !result?.session
      ) {
        throw new Error(
          '服务器没有返回 Session 数据',
        )
      }

      /*
       * Session API 返回的是
       * Supabase snake_case。
       *
       * 转成后台统一使用的
       * ArchiveDbSession。
       *
       * 新 Session 暂时还没有
       * Photos / Videos。
       */
      const created:
        ArchiveDbSession = {
        id:
          result.session.id,

        slug:
          result.session.slug,

        label:
          result.session.label,

        date:
          result.session
            .event_date,

        title:
          result.session.title,

        note:
          result.session.note,

        captains:
          Array.isArray(
            result.session
              .captains,
          )
            ? result.session
                .captains
            : [],

        reservedSlots:
          result.session
            .reserved_slots ??
          0,

        sortOrder:
          result.session
            .sort_order ??
          0,

        isPublished:
          result.session
            .is_published ??
          true,

        videos: [],

        photos: [],
      }

      onCreated(
        created,
      )

      toast.success(
        'Session 创建成功',
      )

      onOpenChange(
        false,
      )
    } catch (error) {
      console.error(
        '[Archive session create]',
        error,
      )

      toast.error(
        error instanceof
          Error
          ? error.message
          : '创建 Session 失败，请重试',
      )
    } finally {
      setIsSubmitting(
        false,
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(
        nextOpen,
      ) => {
        if (
          isSubmitting
        ) {
          return
        }

        onOpenChange(
          nextOpen,
        )
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            新建 Session
          </DialogTitle>

          <DialogDescription>
            {album ? (
              <>
                在「
                {
                  album.title
                }
                」中创建一期新的合影 Session。
              </>
            ) : (
              '创建新的合影 Session。'
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-2 space-y-5"
        >
          <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">
              所属 Album
            </p>

            <p className="mt-1 text-sm font-medium text-foreground">
              {album
                ?.title ||
                '—'}
            </p>

            {album?.en ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {
                  album.en
                }
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                Session Label *
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
                  handleLabelChange(
                    event.target
                      .value,
                  )
                }
                placeholder="例如：第一期"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:opacity-50"
              />

              <span className="text-[0.68rem] text-muted-foreground">
                前台显示的期数或自定义名称，例如「第一期」「01」「2026 周年合影」。
              </span>
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
                    createSlug(
                      event.target
                        .value,
                    ),
                  )
                }
                placeholder="例如：session-01"
                className="h-10 rounded-md border border-input bg-background px-3 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:opacity-50"
              />

              <span className="text-[0.68rem] text-muted-foreground">
                Session 内部唯一标识，只使用英文、数字、- 或 _。
              </span>
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
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                Reserved Slots
              </span>

              <input
                type="number"
                min="0"
                step="1"
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
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
              />

              <span className="text-[0.68rem] text-muted-foreground">
                保留位置数量；没有则保持 0。
              </span>
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              Session 标题
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
              placeholder="可选，例如：英仙座舰队阵型合影"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:opacity-50"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              Captains / 负责人
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
              placeholder={'Furysoulfy\nCoolapple-pie'}
              className="resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:opacity-50"
            />

            <span className="text-[0.68rem] text-muted-foreground">
              每行一个名字，也支持英文逗号或中文逗号分隔。
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              Note / 备注
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
              rows={5}
              placeholder="这一期合影的说明、活动背景或其他备注..."
              className="resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:opacity-50"
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
                关闭后 Session 会保留在后台，但正式 Archive 前台不会显示。
              </p>
            </div>
          </label>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
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
                ? '创建中...'
                : '创建 Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}