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
  ArchiveDbCategory,
} from '@/lib/archive-db'

type ArchiveVideo =
  ArchiveDbCategory['albums'][number]['sessions'][number]['videos'][number]

type Props = {
  video: ArchiveVideo | null
  open: boolean
  onOpenChange: (
    open: boolean,
  ) => void
  onSaved: (
    video: ArchiveVideo,
  ) => void
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

export function ArchiveVideoEditDialog({
  video,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [
    title,
    setTitle,
  ] =
    useState('')

  const [
    platform,
    setPlatform,
  ] =
    useState<
      'youtube' | 'bilibili'
    >('youtube')

  const [
    videoUrl,
    setVideoUrl,
  ] =
    useState('')

  const [
    embedUrl,
    setEmbedUrl,
  ] =
    useState('')

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false)

  useEffect(() => {
    if (!video) {
      return
    }

    setTitle(
      video.title,
    )

    setPlatform(
      video.platform,
    )

    setVideoUrl(
      video.videoUrl ?? '',
    )

    setEmbedUrl(
      video.embedUrl ?? '',
    )
  }, [video])

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault()

    if (
      !video ||
      isSubmitting
    ) {
      return
    }

    if (!title.trim()) {
      toast.error(
        '请填写视频标题',
      )

      return
    }

    if (
      !videoUrl.trim() &&
      !embedUrl.trim()
    ) {
      toast.error(
        'Video URL 和 Embed URL 至少填写一个',
      )

      return
    }

    setIsSubmitting(true)

    try {
      const response =
        await fetch(
          `/api/admin/archive/videos/${encodeURIComponent(
            video.id,
          )}`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                title:
                  title.trim(),

                platform,

                video_url:
                  videoUrl.trim() ||
                  null,

                embed_url:
                  embedUrl.trim() ||
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
            '保存视频失败',
          ),
        )
      }

      if (!result?.video) {
        throw new Error(
          '服务器没有返回更新后的视频',
        )
      }

      const row =
        result.video

      const updated:
        ArchiveVideo = {
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
            video.sortOrder,
        }

      onSaved(updated)

      toast.success(
        '视频已更新',
      )

      onOpenChange(
        false,
      )
    } catch (error) {
      console.error(
        '[Archive video edit]',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '保存视频失败，请重试',
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
        <form
          onSubmit={
            handleSubmit
          }
        >
          <DialogHeader>
            <DialogTitle>
              编辑视频
            </DialogTitle>

            <DialogDescription>
              修改视频标题、平台以及视频链接。
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-5">
            <label className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                视频标题 *
              </span>

              <input
                value={
                  title
                }
                disabled={
                  isSubmitting
                }
                onChange={(
                  event,
                ) =>
                  setTitle(
                    event.target.value,
                  )
                }
                placeholder="例如：活动完整录像"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                视频平台 *
              </span>

              <select
                value={
                  platform
                }
                disabled={
                  isSubmitting
                }
                onChange={(
                  event,
                ) =>
                  setPlatform(
                    event.target
                      .value as
                      | 'youtube'
                      | 'bilibili',
                  )
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
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
                Video URL
              </span>

              <input
                value={
                  videoUrl
                }
                disabled={
                  isSubmitting
                }
                onChange={(
                  event,
                ) =>
                  setVideoUrl(
                    event.target.value,
                  )
                }
                placeholder="https://..."
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                Embed URL
              </span>

              <input
                value={
                  embedUrl
                }
                disabled={
                  isSubmitting
                }
                onChange={(
                  event,
                ) =>
                  setEmbedUrl(
                    event.target.value,
                  )
                }
                placeholder="https://..."
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />

              <span className="text-[0.68rem] text-muted-foreground">
                Video URL 和 Embed URL 至少填写一个。
              </span>
            </label>
          </div>

          <DialogFooter className="mt-6">
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