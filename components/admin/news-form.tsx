'use client'

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { toast } from 'sonner'
import { createClient as createSupabaseBrowserClient } from '@supabase/supabase-js'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { readJsonResponse } from '@/lib/read-json-response'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
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

export function NewsForm() {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [source, setSource] = useState('RSI')
  const [sourceUrl, setSourceUrl] = useState('')
  const [publishedAt, setPublishedAt] = useState(todayIso())

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = event.target.files?.[0]

    if (!selected) return

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  const resetForm = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setTitle('')
    setSummary('')
    setSource('RSI')
    setSourceUrl('')
    setPublishedAt(todayIso())

    setFile(null)
    setPreviewUrl(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadCover = async () => {
    if (!file) {
      return null
    }

    /*
      直接复用影廊现有的 signed upload API。
      图片从浏览器直接上传至 Supabase Storage，
      不经过 Vercel。
    */
    const urlRes = await fetch(
      '/api/admin/gallery/upload-url',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: file.name,
          type: file.type,
        }),
      },
    )

    const signed = await readJsonResponse(urlRes)

    if (!signed.ok) {
      throw new Error(
        signed.message || '获取图片上传授权失败',
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
          file,
          {
            contentType: file.type,
          },
        )

    if (uploadError) {
      throw new Error('封面图片上传失败，请重试')
    }

    return url
  }

  const handleSubmit = async () => {
    if (
      !title.trim() ||
      !summary.trim() ||
      !source.trim() ||
      !sourceUrl.trim() ||
      !publishedAt
    ) {
      toast.error('请填写所有必填项目')
      return
    }

    setIsSubmitting(true)

    try {
      // 如果选择了封面，先上传。
      const imageUrl = await uploadCover()

      // 然后创建资讯记录。
      const response = await fetch(
        '/api/admin/news/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
            summary: summary.trim(),
            source: source.trim(),
            sourceUrl: sourceUrl.trim(),
            imageUrl,
            publishedAt,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || '发布资讯失败',
        )
      }

      toast.success('资讯发布成功')

      resetForm()
    } catch (error) {
      console.error(
        '[v0] News publish error:',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '发布资讯失败，请重试',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="news-title"
            className="text-xs text-muted-foreground"
          >
            资讯标题 *
          </Label>

          <Input
            id="news-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：Alpha 4.10 正式更新至 LIVE"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="news-source"
              className="text-xs text-muted-foreground"
            >
              来源 *
            </Label>

            <select
              id="news-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="RSI">RSI</option>
              <option value="Spectrum">Spectrum</option>
              <option value="CIG">CIG</option>
              <option value="YouTube">YouTube</option>
              <option value="Other">其他</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="news-date"
              className="text-xs text-muted-foreground"
            >
              发布日期 *
            </Label>

            <Input
              id="news-date"
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="news-url"
            className="text-xs text-muted-foreground"
          >
            原文链接 *
          </Label>

          <Input
            id="news-url"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://robertsspaceindustries.com/..."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="news-cover"
            className="text-xs text-muted-foreground"
          >
            封面图片
          </Label>

          <Input
            id="news-cover"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />

          <p className="text-xs text-muted-foreground">
            可选。图片将直接上传至 StarClub Storage。
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="news-summary"
            className="text-xs text-muted-foreground"
          >
            资讯内容 *
          </Label>

          <Textarea
            id="news-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="将整理、翻译好的中文资讯内容粘贴到这里……"
            rows={10}
            className="min-h-55 resize-y leading-7"
          />
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting
            ? '发布中...'
            : '发布资讯'}
        </Button>
      </div>

      <div>
        <p className="mb-3 font-display text-[0.62rem] tracking-[0.2em] text-muted-foreground">
          实时预览
        </p>

        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <div className="relative aspect-video bg-muted">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={title || '资讯封面预览'}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                暂无封面图片
              </div>
            )}
          </div>

          <div className="space-y-2 p-4">
            <p className="font-medium text-foreground">
              {title || '资讯标题'}
            </p>

            <p className="text-xs text-muted-foreground">
              {source} · {publishedAt}
            </p>

            <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
              {summary || '资讯内容将在这里预览'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}