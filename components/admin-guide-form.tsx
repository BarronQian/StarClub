'use client'

import {
  useState,
  type FormEvent,
} from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  GUIDE_TAGS,
  type GuideCategory,
} from '@/lib/guides'

const categories =
  Object.keys(
    GUIDE_TAGS,
  ) as GuideCategory[]

type GuideType =
  | 'article'
  | 'video'
  | 'external'

export type AdminGuideFormData = {
  id?: string
  title: string
  slug: string
  description: string
  category: GuideCategory
  tags: string[]
  type: GuideType
  image: string
  author: string
  creator: string
  video_url: string
  external_url: string
  original: boolean
  published: boolean
  featured: boolean
  sort_order: number
  published_at: string
  seo_title: string
  seo_description: string
}

type AdminGuideFormProps = {
  mode: 'create' | 'edit'
  initialData?: Partial<AdminGuideFormData>
}

export function AdminGuideForm({
  mode,
  initialData,
}: AdminGuideFormProps) {
  const router =
    useRouter()

  const [title, setTitle] =
    useState(
      initialData?.title ??
        '',
    )

  const [slug, setSlug] =
    useState(
      initialData?.slug ??
        '',
    )

  const [
    description,
    setDescription,
  ] = useState(
    initialData?.description ??
      '',
  )

  const [
    category,
    setCategory,
  ] =
    useState<GuideCategory>(
      initialData?.category ??
        categories[0],
    )

  const [tags, setTags] =
    useState<string[]>(
      initialData?.tags ??
        [],
    )

  const [type, setType] =
    useState<GuideType>(
      initialData?.type ??
        'article',
    )

  const [image, setImage] =
    useState(
      initialData?.image ??
        '',
    )

    const [
      isUploadingImage,
      setIsUploadingImage,
    ] = useState(false)

    const [
      imageUploadError,
      setImageUploadError,
    ] = useState<
      string | null
    >(null)

  const [author, setAuthor] =
    useState(
      initialData?.author ??
        '',
    )

  const [creator, setCreator] =
    useState(
      initialData?.creator ??
        '星际酒馆 StarClub',
    )

  const [
    videoUrl,
    setVideoUrl,
  ] = useState(
    initialData?.video_url ??
      '',
  )
  const [
    externalUrl,
    setExternalUrl,
  ] = useState(
    initialData?.external_url ??
      '',
  )
  const [
    original,
    setOriginal,
  ] = useState(
    initialData?.original ??
      true,
  )

  const [
    published,
    setPublished,
  ] = useState(
    initialData?.published ??
      false,
  )

  const [
    featured,
    setFeatured,
  ] = useState(
    initialData?.featured ??
      false,
  )

  const [
    sortOrder,
    setSortOrder,
  ] = useState(
    initialData?.sort_order ??
      0,
  )

  const [
    seoTitle,
    setSeoTitle,
  ] = useState(
    initialData?.seo_title ??
      '',
  )

  const [
    seoDescription,
    setSeoDescription,
  ] = useState(
    initialData?.seo_description ??
      '',
  )

  const [error, setError] =
    useState<string | null>(
      null,
    )

  const [
    success,
    setSuccess,
  ] = useState<string | null>(
    null,
  )

  const [
    isSaving,
    setIsSaving,
  ] = useState(false)

  const availableTags =
    GUIDE_TAGS[category] ??
    []

  function toggleTag(
    tag: string,
  ) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter(
            (item) =>
              item !== tag,
          )
        : [
            ...current,
            tag,
          ],
    )
  }

  function handleCategoryChange(
    value: GuideCategory,
  ) {
    setCategory(value)

    setTags((current) =>
      current.filter(
        (tag) =>
          (
            GUIDE_TAGS[value] ??
            []
          ).includes(tag),
      ),
    )
  }

  async function handleImageUpload(
  file: File,
) {
  setImageUploadError(null)
  setIsUploadingImage(true)

  try {
    const formData =
      new FormData()

    formData.append(
      'file',
      file,
    )

    const response =
      await fetch(
        '/api/admin/guides/upload',
        {
          method: 'POST',
          body: formData,
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
          '上传图片失败',
      )
    }

    if (
      typeof data.url !==
      'string'
    ) {
      throw new Error(
        '上传成功，但没有返回图片地址',
      )
    }

    setImage(
      data.url,
    )
  } catch (err) {
    console.error(
      '[ADMIN GUIDE IMAGE] Upload failed:',
      err,
    )

    setImageUploadError(
      err instanceof Error
        ? err.message
        : '上传图片失败',
    )
  } finally {
    setIsUploadingImage(false)
  }
}

  async function handleSubmit(
    nextPublished: boolean,
  ) {

    setError(null)
    setSuccess(null)

    if (!title.trim()) {
      setError(
        '请填写攻略标题',
      )
      return
    }

    if (!slug.trim()) {
      setError(
        '请填写 slug',
      )
      return
    }

    if (
      type === 'video' &&
      !videoUrl.trim()
    ) {
      setError(
        '视频攻略需要填写视频链接',
      )
      return
    }

    if (
        type === 'external' &&
        !externalUrl.trim()
      ) {
        setError(
          '外部攻略需要填写外部链接',
        )
        return
      }

    if (
      mode === 'edit' &&
      !initialData?.id
    ) {
      setError(
        '缺少攻略 ID',
      )
      return
    }

    setIsSaving(true)

    try {
      const endpoint =
        mode === 'create'
          ? '/api/admin/guides'
          : `/api/admin/guides/${initialData?.id}`

      const response =
        await fetch(
          endpoint,
          {
            method:
              mode ===
              'create'
                ? 'POST'
                : 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                title:
                  title.trim(),

                slug:
                  slug.trim(),

                description:
                  description.trim(),

                category,

                tags,

                type,

                image:
                  image.trim(),

                author:
                  author.trim(),

                creator:
                  creator.trim(),

                video_url:
                  videoUrl.trim(),
                
                  external_url:
                  externalUrl.trim(),

                original,

                published:
                  nextPublished,

                featured,

                sort_order:
                  sortOrder,

                  published_at:
                    nextPublished
                      ? initialData?.published_at ||
                        new Date().toISOString()
                      : '',

                seo_title:
                  seoTitle.trim(),

                seo_description:
                  seoDescription.trim(),
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
            '保存攻略失败',
        )
      }
      setPublished(
        nextPublished,
      )

      if (
        mode ===
        'create'
      ) {
        router.push(
          `/admin/guides/${data.guide.id}/edit`,
        )

        router.refresh()
        return
      }

      setSuccess(
        '攻略已保存',
      )

      router.refresh()
    } catch (err) {
      console.error(
        '[ADMIN GUIDES] Save failed:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : '保存攻略失败',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
      }}
      className="space-y-8"
    >
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <span className="font-display text-[0.62rem] tracking-[0.28em] text-primary">
          BASIC INFO
        </span>

        <h2 className="mt-2 font-display text-xl">
          基础信息
        </h2>

        <div className="mt-6 grid gap-6">
          <div>
            <label className="text-sm font-medium">
              攻略标题 *
            </label>

            <input
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value,
                )
              }
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              placeholder="攻略标题"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Slug *
            </label>

            <input
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value,
                )
              }
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              placeholder="money-making-4-8-2"
            />

            <p className="mt-2 text-xs text-muted-foreground">
              页面地址：
              /guides/
              {slug ||
                'your-guide'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">
              简介
            </label>

            <textarea
              value={
                description
              }
              onChange={(e) =>
                setDescription(
                  e.target.value,
                )
              }
              rows={4}
              className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none focus:border-primary"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <span className="font-display text-[0.62rem] tracking-[0.28em] text-primary">
          CLASSIFICATION
        </span>

        <h2 className="mt-2 font-display text-xl">
          分类与标签
        </h2>

        <div className="mt-6 grid gap-6">
          <div>
            <label className="text-sm font-medium">
              分类 *
            </label>

            <select
              value={category}
              onChange={(e) =>
                handleCategoryChange(
                  e.target.value as GuideCategory,
                )
              }
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            >
              {categories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">
              标签
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              {availableTags.map(
                (tag) => {
                  const active =
                    tags.includes(
                      tag,
                    )

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        toggleTag(
                          tag,
                        )
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {tag}
                    </button>
                  )
                },
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              攻略类型
            </label>

            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as GuideType,
                )
              }
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="article">
                图文攻略
              </option>

              <option value="video">
                视频攻略
              </option>

              <option value="external">
                外部链接
              </option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <span className="font-display text-[0.62rem] tracking-[0.28em] text-primary">
          MEDIA
        </span>

        <h2 className="mt-2 font-display text-xl">
          媒体信息
        </h2>

        <div className="mt-6 grid gap-6">
          <div>
            <label className="text-sm font-medium">
              封面图片
            </label>

            <div className="mt-2 grid gap-3">
              <input
                value={image}
                onChange={(e) =>
                  setImage(
                    e.target.value,
                  )
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="/images/guides/... 或 Supabase 图片地址"
              />

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                  {isUploadingImage
                    ? '正在上传...'
                    : '选择并上传图片'}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={
                      isUploadingImage
                    }
                    onChange={(e) => {
                      const file =
                        e.target.files?.[0]

                      if (file) {
                        handleImageUpload(
                          file,
                        )
                      }

                      e.target.value =
                        ''
                    }}
                    className="hidden"
                  />
                </label>

                {image && (
                  <button
                    type="button"
                    onClick={() =>
                      setImage('')
                    }
                    className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    清除封面
                  </button>
                )}
              </div>

              {imageUploadError && (
                <p className="text-xs text-destructive">
                  {imageUploadError}
                </p>
              )}

              {image && (
                <div className="overflow-hidden rounded-2xl border border-border bg-background">
                  <img
                    src={image}
                    alt="攻略封面预览"
                    className="aspect-video w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {type ===
            'video' && (
            <div>
              <label className="text-sm font-medium">
                视频链接 *
              </label>

              <input
                value={videoUrl}
                onChange={(e) =>
                  setVideoUrl(
                    e.target.value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="https://www.bilibili.com/video/BV..."
              />
            </div>
          )}

          {type ===
              'external' && (
              <div>
                <label className="text-sm font-medium">
                  外部链接 *
                </label>

                <input
                  value={externalUrl}
                  onChange={(e) =>
                    setExternalUrl(
                      e.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="https://..."
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  可填写 Discord、Spectrum、外部攻略网站或其他资源链接。
                </p>
              </div>
            )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <span className="font-display text-[0.62rem] tracking-[0.28em] text-primary">
          CREDIT
        </span>

        <h2 className="mt-2 font-display text-xl">
          作者与出品
        </h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">
              作者
            </label>

            <input
              value={author}
              onChange={(e) =>
                setAuthor(
                  e.target.value,
                )
              }
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              出品 / 发布者
            </label>

            <input
              value={creator}
              onChange={(e) =>
                setCreator(
                  e.target.value,
                )
              }
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <span className="font-display text-[0.62rem] tracking-[0.28em] text-primary">
          PUBLISHING
        </span>

        <h2 className="mt-2 font-display text-xl">
          发布设置
        </h2>

        <div className="mt-6 grid gap-5">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={original}
              onChange={(e) =>
                setOriginal(
                  e.target.checked,
                )
              }
            />

            酒馆原创
          </label>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) =>
                setFeatured(
                  e.target.checked,
                )
              }
            />

            推荐攻略
          </label>
          
          <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              当前状态：
            </span>

            <span
              className={`ml-2 font-medium ${
                published
                  ? 'text-emerald-600'
                  : 'text-muted-foreground'
              }`}
            >
              {published
                ? '已发布'
                : '草稿'}
            </span>
          </div>

          <div>
            <label className="text-sm font-medium">
              排序
            </label>

            <input
              type="number"
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(
                  Number(
                    e.target.value,
                  ),
                )
              }
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <span className="font-display text-[0.62rem] tracking-[0.28em] text-primary">
          SEO
        </span>

        <h2 className="mt-2 font-display text-xl">
          SEO
        </h2>

        <div className="mt-6 grid gap-6">
          <div>
            <label className="text-sm font-medium">
              SEO 标题
            </label>

            <input
              value={seoTitle}
              onChange={(e) =>
                setSeoTitle(
                  e.target.value,
                )
              }
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              SEO 描述
            </label>

            <textarea
              value={
                seoDescription
              }
              onChange={(e) =>
                setSeoDescription(
                  e.target.value,
                )
              }
              rows={3}
              className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600">
          {success}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
        <Link
          href="/admin/guides"
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          取消
        </Link>

          {published ? (
            <button
              type="button"
              disabled={
                isSaving ||
                isUploadingImage
              }
              onClick={() =>
                handleSubmit(true)
              }
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploadingImage
                ? '正在上传图片...'
                : isSaving
                  ? '正在保存...'
                  : '保存修改'}
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={
                  isSaving ||
                  isUploadingImage
                }
                onClick={() =>
                  handleSubmit(false)
                }
                className="rounded-full border border-border px-6 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving
                  ? '正在保存...'
                  : '保存为草稿'}
              </button>

              <button
                type="button"
                disabled={
                  isSaving ||
                  isUploadingImage
                }
                onClick={() =>
                  handleSubmit(true)
                }
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploadingImage
                  ? '正在上传图片...'
                  : isSaving
                    ? '正在发布...'
                    : '发布'}
              </button>
            </>
          )}
      </div>
    </form>
  )
}