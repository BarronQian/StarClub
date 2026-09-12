'use client'

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient as createSupabaseBrowserClient } from '@supabase/supabase-js'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { readJsonResponse } from '@/lib/read-json-response'

type AdminNewsItem = {
  id: number
  source: string | null
  title_original: string | null
  title_zh: string | null
  summary_original: string | null
  summary_zh: string | null
  source_url: string | null
  image_url: string | null
  published_at: string | null
}

let browserSupabase:
  ReturnType<typeof createSupabaseBrowserClient> | null = null

function getBrowserSupabase() {
  if (!browserSupabase) {
    browserSupabase = createSupabaseBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    )
  }

  return browserSupabase
}

export function NewsAdminList({
  items,
}: {
  items: AdminNewsItem[]
}) {
  const router = useRouter()

  const [deletingId, setDeletingId] =
    useState<number | null>(null)

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [isSaving, setIsSaving] =
    useState(false)

  const [editTitle, setEditTitle] =
    useState('')

  const [editSummary, setEditSummary] =
    useState('')

  const [editSource, setEditSource] =
    useState('RSI')

  const [editSourceUrl, setEditSourceUrl] =
    useState('')

  const [editPublishedAt, setEditPublishedAt] =
    useState('')

  const [editFile, setEditFile] =
    useState<File | null>(null)

  const [editPreviewUrl, setEditPreviewUrl] =
    useState<string | null>(null)

  const fileInputRef =
    useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (editPreviewUrl) {
        URL.revokeObjectURL(editPreviewUrl)
      }
    }
  }, [editPreviewUrl])

  const clearEditImage = () => {
    if (editPreviewUrl) {
      URL.revokeObjectURL(editPreviewUrl)
    }

    setEditFile(null)
    setEditPreviewUrl(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const startEdit = (
    item: AdminNewsItem,
  ) => {
    clearEditImage()

    setEditingId(item.id)

    setEditTitle(
      item.title_zh ||
        item.title_original ||
        '',
    )

    setEditSummary(
      item.summary_zh ||
        item.summary_original ||
        '',
    )

    setEditSource(
      item.source || 'RSI',
    )

    setEditSourceUrl(
      item.source_url || '',
    )

    setEditPublishedAt(
      item.published_at
        ? String(item.published_at).slice(0, 10)
        : '',
    )
  }

  const cancelEdit = () => {
    clearEditImage()
    setEditingId(null)
  }

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selected =
      event.target.files?.[0]

    if (!selected) {
      return
    }

    if (editPreviewUrl) {
      URL.revokeObjectURL(editPreviewUrl)
    }

    setEditFile(selected)

    setEditPreviewUrl(
      URL.createObjectURL(selected),
    )
  }

  const uploadNewCover = async () => {
    if (!editFile) {
      return null
    }

    const urlRes = await fetch(
      '/api/admin/gallery/upload-url',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFile.name,
          type: editFile.type,
        }),
      },
    )

    const signed =
      await readJsonResponse(urlRes)

    if (!signed.ok) {
      throw new Error(
        signed.message ||
          '获取图片上传授权失败',
      )
    }

    const {
      bucket,
      path,
      token,
      url,
    } = signed.data as {
      bucket: string
      path: string
      token: string
      url: string
    }

    const { error: uploadError } =
      await getBrowserSupabase()
        .storage
        .from(bucket)
        .uploadToSignedUrl(
          path,
          token,
          editFile,
          {
            contentType: editFile.type,
          },
        )

    if (uploadError) {
      throw new Error(
        '封面图片上传失败，请重试',
      )
    }

    return url
  }

  const handleSave = async (
    item: AdminNewsItem,
  ) => {
    if (
      !editTitle.trim() ||
      !editSummary.trim() ||
      !editSource.trim() ||
      !editSourceUrl.trim() ||
      !editPublishedAt
    ) {
      toast.error('请填写所有必填项目')
      return
    }

    setIsSaving(true)

    try {
      const newImageUrl =
        await uploadNewCover()

      const payload: Record<
        string,
        unknown
      > = {
        id: item.id,
        title: editTitle,
        summary: editSummary,
        source: editSource,
        sourceUrl: editSourceUrl,
        publishedAt: editPublishedAt,
      }

      if (newImageUrl) {
        payload.imageUrl = newImageUrl
      }

      const response = await fetch(
        '/api/admin/news/update',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(payload),
        },
      )

      const data = await response
        .json()
        .catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error ||
            '保存失败，请重试',
        )
      }

      toast.success('资讯已更新')

      clearEditImage()
      setEditingId(null)

      router.refresh()
    } catch (error) {
      console.error(
        '[v0] News update error:',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '保存失败，请重试',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (
    item: AdminNewsItem,
  ) => {
    const title =
      item.title_zh ||
      item.title_original ||
      '未命名资讯'

    const confirmed = window.confirm(
      `确定要删除这条资讯吗？\n\n${title}\n\n删除后无法恢复。`,
    )

    if (!confirmed) {
      return
    }

    setDeletingId(item.id)

    try {
      const response = await fetch(
        '/api/admin/news/delete',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            id: item.id,
          }),
        },
      )

      const data = await response
        .json()
        .catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error ||
            '删除失败，请重试',
        )
      }

      toast.success('资讯已删除')

      router.refresh()
    } catch (error) {
      console.error(
        '[v0] News delete error:',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '删除失败，请重试',
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="corner-cut border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        暂无已发布资讯
      </div>
    )
  }

  return (
    <div className="corner-cut overflow-hidden border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="w-24 px-4 py-3 text-left font-medium">
                封面
              </th>

              <th className="px-4 py-3 text-left font-medium">
                标题
              </th>

              <th className="w-28 px-4 py-3 text-left font-medium">
                来源
              </th>

              <th className="w-36 px-4 py-3 text-left font-medium">
                日期
              </th>

              <th className="w-40 px-4 py-3 text-right font-medium">
                操作
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const title =
                item.title_zh ||
                item.title_original ||
                '未命名资讯'

              const isDeleting =
                deletingId === item.id

              const isEditing =
                editingId === item.id

              return (
                <>
                  <tr
                    key={item.id}
                    className="border-b border-border"
                  >
                    <td className="px-4 py-3">
                      <div className="relative h-12 w-16 overflow-hidden rounded-sm bg-muted">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt={title}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
                            无封面
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="max-w-105 px-4 py-3">
                      <div className="truncate font-medium text-foreground">
                        {title}
                      </div>

                      {item.source_url && (
                        <div className="mt-1 truncate text-xs text-muted-foreground">
                          {item.source_url}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {item.source || '—'}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {item.published_at
                        ? String(
                            item.published_at,
                          ).slice(0, 10)
                        : '—'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            isEditing
                              ? cancelEdit()
                              : startEdit(item)
                          }
                          className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          {isEditing
                            ? '取消'
                            : '编辑'}
                        </button>

                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() =>
                            handleDelete(item)
                          }
                          className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isDeleting
                            ? '删除中...'
                            : '删除'}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {isEditing && (
                    <tr
                      key={`${item.id}-edit`}
                      className="border-b border-border bg-muted/10"
                    >
                      <td
                        colSpan={5}
                        className="px-4 py-5"
                      >
                        <div className="grid gap-5">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-1.5">
                              <Label
                                htmlFor={`news-title-${item.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                资讯标题 *
                              </Label>

                              <Input
                                id={`news-title-${item.id}`}
                                value={editTitle}
                                onChange={(e) =>
                                  setEditTitle(
                                    e.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="grid gap-1.5">
                              <Label
                                htmlFor={`news-source-${item.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                来源 *
                              </Label>

                              <select
                                id={`news-source-${item.id}`}
                                value={editSource}
                                onChange={(e) =>
                                  setEditSource(
                                    e.target.value,
                                  )
                                }
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                              >
                                <option value="RSI">
                                  RSI
                                </option>
                                <option value="Spectrum">
                                  Spectrum
                                </option>
                                <option value="CIG">
                                  CIG
                                </option>
                                <option value="YouTube">
                                  YouTube
                                </option>
                                <option value="Other">
                                  其他
                                </option>
                              </select>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-1.5">
                              <Label
                                htmlFor={`news-url-${item.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                原文链接 *
                              </Label>

                              <Input
                                id={`news-url-${item.id}`}
                                type="url"
                                value={editSourceUrl}
                                onChange={(e) =>
                                  setEditSourceUrl(
                                    e.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="grid gap-1.5">
                              <Label
                                htmlFor={`news-date-${item.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                发布日期 *
                              </Label>

                              <Input
                                id={`news-date-${item.id}`}
                                type="date"
                                value={editPublishedAt}
                                onChange={(e) =>
                                  setEditPublishedAt(
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="grid gap-1.5">
                            <Label className="text-xs text-muted-foreground">
                              封面图片
                            </Label>

                            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                              <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                                {editPreviewUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={editPreviewUrl}
                                    alt="新封面预览"
                                    className="absolute inset-0 h-full w-full object-cover"
                                  />
                                ) : item.image_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.image_url}
                                    alt={title}
                                    className="absolute inset-0 h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                                    暂无封面
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col justify-center gap-2">
                                <Input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                />

                                <p className="text-xs text-muted-foreground">
                                  不选择新图片则保留当前封面。
                                </p>

                                {editFile && (
                                  <button
                                    type="button"
                                    onClick={clearEditImage}
                                    className="w-fit text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                                  >
                                    取消更换封面
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-1.5">
                            <Label
                              htmlFor={`news-summary-${item.id}`}
                              className="text-xs text-muted-foreground"
                            >
                              资讯内容 *
                            </Label>

                            <Textarea
                              id={`news-summary-${item.id}`}
                              value={editSummary}
                              onChange={(e) =>
                                setEditSummary(
                                  e.target.value,
                                )
                              }
                              rows={8}
                              className="resize-y leading-7"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={cancelEdit}
                              disabled={isSaving}
                            >
                              取消
                            </Button>

                            <Button
                              type="button"
                              onClick={() =>
                                handleSave(item)
                              }
                              disabled={isSaving}
                            >
                              {isSaving
                                ? '保存中...'
                                : '保存修改'}
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}