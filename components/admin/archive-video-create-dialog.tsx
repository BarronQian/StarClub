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
  ArchiveDbVideo,
} from '@/lib/archive-db'

type Props = {
  session: ArchiveDbSession | null
  open: boolean

  onOpenChange: (
    open: boolean,
  ) => void

  onCreated: (
    video: ArchiveDbVideo,
  ) => void
}

type Platform =
  | 'youtube'
  | 'bilibili'

type FormState = {
  title: string
  platform: Platform
  videoUrl: string
  embedUrl: string
}

const EMPTY_FORM: FormState = {
  title: '',
  platform: 'youtube',
  videoUrl: '',
  embedUrl: '',
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

export function ArchiveVideoCreateDialog({
  session,
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

  useEffect(
    () => {
      if (open) {
        setForm(
          EMPTY_FORM,
        )
      }
    },
    [
      open,
      session?.id,
    ],
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

    const title =
      form.title.trim()

    const videoUrl =
      form.videoUrl.trim()

    const embedUrl =
      form.embedUrl.trim()

    if (!title) {
      toast.error(
        '请填写视频标题',
      )

      return
    }

    if (
      !videoUrl &&
      !embedUrl
    ) {
      toast.error(
        '请至少填写视频链接或 Embed 链接',
      )

      return
    }

    setIsSubmitting(true)

    try {
      const response =
        await fetch(
          '/api/admin/archive/videos',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                session_id:
                  session.id,

                title,

                platform:
                  form.platform,

                video_url:
                  videoUrl ||
                  null,

                embed_url:
                  embedUrl ||
                  null,
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
            '创建视频失败',
          ),
        )
      }

      if (!result?.video) {
        throw new Error(
          '服务器没有返回 Video 数据',
        )
      }

      const row =
        result.video

      const created:
        ArchiveDbVideo = {
          id:
            row.id,

          title:
            row.title,

          platform:
            row.platform,

          videoUrl:
            row.video_url ??
            null,

          embedUrl:
            row.embed_url ??
            null,

          sortOrder:
            row.sort_order ??
            0,
        }

      onCreated(
        created,
      )

      toast.success(
        '视频已添加',
      )

      onOpenChange(
        false,
      )
    } catch (error) {
      console.error(
        '[Archive video create]',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '创建视频失败，请重试',
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
        if (!isSubmitting) {
          onOpenChange(
            nextOpen,
          )
        }
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            添加视频
          </DialogTitle>

          <DialogDescription>
            {session ? (
              <>
                添加到 Session「
                {session.label}
                」。
              </>
            ) : (
              '添加 Archive 视频。'
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >
          <label className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              视频标题 *
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
              placeholder="例如：英仙座阵型合影活动录像"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              视频平台 *
            </span>

            <select
              value={
                form.platform
              }
              disabled={
                isSubmitting
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  'platform',
                  event.target
                    .value as Platform,
                )
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="youtube">
                YouTube
              </option>

              <option value="bilibili">
                Bilibili
              </option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              视频链接
            </span>

            <input
              type="url"
              value={
                form.videoUrl
              }
              disabled={
                isSubmitting
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  'videoUrl',
                  event.target
                    .value,
                )
              }
              placeholder={
                form.platform ===
                'youtube'
                  ? 'https://www.youtube.com/watch?v=...'
                  : 'https://www.bilibili.com/video/...'
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            />

            <span className="text-[0.68rem] leading-relaxed text-muted-foreground">
              用户点击视频标题或链接时使用的普通视频地址。
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              Embed 链接
            </span>

            <input
              type="url"
              value={
                form.embedUrl
              }
              disabled={
                isSubmitting
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  'embedUrl',
                  event.target
                    .value,
                )
              }
              placeholder={
                form.platform ===
                'youtube'
                  ? 'https://www.youtube.com/embed/...'
                  : 'https://player.bilibili.com/player.html?...'
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            />

            <span className="text-[0.68rem] leading-relaxed text-muted-foreground">
              用于 Archive 页面内嵌播放器。视频链接与
              Embed 链接至少填写一个。
            </span>
          </label>

          <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              目前先分别保存普通链接和 Embed
              链接。后面如果需要，我们可以再增加
              YouTube / Bilibili
              链接自动识别与自动生成 Embed URL，
              这样管理员以后只需要粘贴一个普通视频链接。
            </p>
          </div>

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
                isSubmitting ||
                !session
              }
            >
              {isSubmitting
                ? '添加中...'
                : '添加视频'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}