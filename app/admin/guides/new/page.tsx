'use client'

import {
  useState,
  type FormEvent,
} from 'react'

import Link from 'next/link'
import {
  useRouter,
} from 'next/navigation'

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
  | 'discord'
  | 'external'

export default function NewGuidePage() {
  const router =
    useRouter()

  const [title, setTitle] =
    useState('')

  const [slug, setSlug] =
    useState('')

  const [
    description,
    setDescription,
  ] = useState('')

  const [
    category,
    setCategory,
  ] =
    useState<GuideCategory>(
      categories[0],
    )

  const [tags, setTags] =
    useState<string[]>([])

  const [type, setType] =
    useState<GuideType>(
      'article',
    )

  const [image, setImage] =
    useState('')

  const [author, setAuthor] =
    useState('')

  const [creator, setCreator] =
    useState(
      '星际酒馆 StarClub',
    )

  const [
    videoUrl,
    setVideoUrl,
  ] = useState('')

  const [
    original,
    setOriginal,
  ] = useState(true)

  const [
    published,
    setPublished,
  ] = useState(false)

  const [
    featured,
    setFeatured,
  ] = useState(false)

  const [
    sortOrder,
    setSortOrder,
  ] = useState(0)

  const [
    publishedAt,
    setPublishedAt,
  ] = useState('')

  const [
    seoTitle,
    setSeoTitle,
  ] = useState('')

  const [
    seoDescription,
    setSeoDescription,
  ] = useState('')

  const [error, setError] =
    useState<string | null>(
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
    setTags([])
  }

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault()

    setError(null)

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

    setIsSaving(true)

    try {
      const response =
        await fetch(
          '/api/admin/guides',
          {
            method: 'POST',
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
                original,
                published,
                featured,
                sort_order:
                  sortOrder,
                published_at:
                  publishedAt
                    ? new Date(
                        publishedAt,
                      ).toISOString()
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
            '创建攻略失败',
        )
      }

      router.push(
        `/admin/guides/${data.guide.id}/edit`,
      )

      router.refresh()
    } catch (err) {
      console.error(
        '[ADMIN GUIDES] Create failed:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : '创建攻略失败',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="site-container max-w-5xl py-10 lg:py-14">
        <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-display text-[0.65rem] tracking-[0.32em] text-primary">
              ADMIN / GUIDES
            </span>

            <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
              新建攻略
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              创建新的图文攻略或视频攻略。
            </p>
          </div>

          <Link
            href="/admin/guides"
            className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            返回攻略管理
          </Link>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-8 space-y-8"
        >
          <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div>
              <span className="font-display text-[0.62rem] tracking-[0.28em] text-primary">
                BASIC INFO
              </span>

              <h2 className="mt-2 font-display text-xl">
                基础信息
              </h2>
            </div>

            <div className="mt-6 grid gap-6">
              <div>
                <label className="text-sm font-medium">
                  攻略标题 *
                </label>

                <input
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target
                        .value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                  placeholder="例如：4.8.2 零比特保姆级赚钱教学全流程"
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
                      e.target
                        .value,
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
                      e.target
                        .value,
                    )
                  }
                  rows={4}
                  className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none transition-colors focus:border-primary"
                  placeholder="攻略列表页和详情页使用的简介"
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
                      e.target
                        .value as GuideCategory,
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
                      e.target
                        .value as GuideType,
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

                  <option value="discord">
                    Discord
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

                <input
                  value={image}
                  onChange={(e) =>
                    setImage(
                      e.target
                        .value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="/images/guides/..."
                />
              </div>

              {type ===
                'video' && (
                <div>
                  <label className="text-sm font-medium">
                    视频链接 *
                  </label>

                  <input
                    value={
                      videoUrl
                    }
                    onChange={(e) =>
                      setVideoUrl(
                        e.target
                          .value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="https://www.bilibili.com/video/BV..."
                  />
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
                      e.target
                        .value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="HotpotKing「火锅」"
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
                      e.target
                        .value,
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
                  checked={
                    original
                  }
                  onChange={(e) =>
                    setOriginal(
                      e.target
                        .checked,
                    )
                  }
                />

                酒馆原创
              </label>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={
                    published
                  }
                  onChange={(e) =>
                    setPublished(
                      e.target
                        .checked,
                    )
                  }
                />

                立即发布
              </label>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={
                    featured
                  }
                  onChange={(e) =>
                    setFeatured(
                      e.target
                        .checked,
                    )
                  }
                />

                推荐攻略
              </label>

              <div>
                <label className="text-sm font-medium">
                  排序
                </label>

                <input
                  type="number"
                  value={
                    sortOrder
                  }
                  onChange={(e) =>
                    setSortOrder(
                      Number(
                        e.target
                          .value,
                      ),
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  发布时间
                </label>

                <input
                  type="datetime-local"
                  value={
                    publishedAt
                  }
                  onChange={(e) =>
                    setPublishedAt(
                      e.target
                        .value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  留空且选择“立即发布”时，会自动使用当前时间。
                </p>
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
                      e.target
                        .value,
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
                      e.target
                        .value,
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

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
            <Link
              href="/admin/guides"
              className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              取消
            </Link>

            <button
              type="submit"
              disabled={
                isSaving
              }
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? '正在创建...'
                : '创建攻略'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}