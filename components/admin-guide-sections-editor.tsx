'use client'

import {
  useMemo,
  useState,
} from 'react'

type GuideSection = {
  id?: string
  slug: string
  title: string
  subtitle: string
  description: string
  image: string
  tags: string[]
  published: boolean
  sort_order: number
}

type Props = {
  guideId: string
  initialSections: GuideSection[]
}

function createEmptySection(): GuideSection {
  return {
    slug: '',
    title: '',
    subtitle: '',
    description: '',
    image: '',
    tags: [],
    published: true,
    sort_order: 0,
  }
}

export function AdminGuideSectionsEditor({
  guideId,
  initialSections,
}: Props) {
  const [sections, setSections] =
    useState<GuideSection[]>(
      initialSections,
    )

  const [isSaving, setIsSaving] =
    useState(false)

  const [message, setMessage] =
    useState<string | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const sortedSections =
    useMemo(
      () =>
        [...sections].sort(
          (a, b) =>
            a.sort_order -
            b.sort_order,
        ),
      [sections],
    )

  function updateSection(
    index: number,
    key: keyof GuideSection,
    value:
      | string
      | string[]
      | boolean
      | number,
  ) {
    setSections(
      (current) => {
        const next =
          [...current]

        next[index] = {
          ...next[index],
          [key]: value,
        }

        return next
      },
    )
  }

  function addSection() {
    setSections(
      (current) => [
        ...current,
        {
          ...createEmptySection(),
          sort_order:
            (current.length + 1) *
            10,
        },
      ],
    )

    setMessage(null)
    setError(null)
  }

  function removeSection(
    index: number,
  ) {
    const section =
      sections[index]

    const title =
      section?.title ||
      section?.slug ||
      '这个系列'

    const confirmed =
      window.confirm(
        `确定要删除「${title}」吗？保存后将从数据库删除。`,
      )

    if (!confirmed) {
      return
    }

    setSections(
      (current) =>
        current.filter(
          (_, itemIndex) =>
            itemIndex !== index,
        ),
    )

    setMessage(null)
    setError(null)
  }

  function moveSection(
    index: number,
    direction:
      | 'up'
      | 'down',
  ) {
    setSections(
      (current) => {
        const next =
          [...current]

        const targetIndex =
          direction === 'up'
            ? index - 1
            : index + 1

        if (
          targetIndex < 0 ||
          targetIndex >=
            next.length
        ) {
          return current
        }

        const temp =
          next[index]

        next[index] =
          next[targetIndex]

        next[targetIndex] =
          temp

        return next.map(
          (
            section,
            itemIndex,
          ) => ({
            ...section,
            sort_order:
              (itemIndex + 1) *
              10,
          }),
        )
      },
    )

    setMessage(null)
    setError(null)
  }

  function addTag(
    index: number,
  ) {
    setSections(
      (current) => {
        const next =
          [...current]

        next[index] = {
          ...next[index],
          tags: [
            ...next[index].tags,
            '',
          ],
        }

        return next
      },
    )
  }

  function updateTag(
    sectionIndex: number,
    tagIndex: number,
    value: string,
  ) {
    setSections(
      (current) => {
        const next =
          [...current]

        const tags = [
          ...next[
            sectionIndex
          ].tags,
        ]

        tags[tagIndex] =
          value

        next[
          sectionIndex
        ] = {
          ...next[
            sectionIndex
          ],
          tags,
        }

        return next
      },
    )
  }

  function removeTag(
    sectionIndex: number,
    tagIndex: number,
  ) {
    setSections(
      (current) => {
        const next =
          [...current]

        next[
          sectionIndex
        ] = {
          ...next[
            sectionIndex
          ],
          tags:
            next[
              sectionIndex
            ].tags.filter(
              (
                _,
                itemIndex,
              ) =>
                itemIndex !==
                tagIndex,
            ),
        }

        return next
      },
    )
  }

  async function saveSections() {
    setIsSaving(true)
    setMessage(null)
    setError(null)

    try {
      const payload =
        sections.map(
          (
            section,
            index,
          ) => ({
            ...section,

            tags:
              section.tags
                .map(
                  (tag) =>
                    tag.trim(),
                )
                .filter(Boolean),

            sort_order:
              (index + 1) *
              10,
          }),
        )

      const response =
        await fetch(
          `/api/admin/guides/${guideId}/sections`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                sections:
                  payload,
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
            '保存系列失败',
        )
      }

      const savedSections =
        Array.isArray(
          data.sections,
        )
          ? data.sections.map(
              (
                section: Record<
                  string,
                  unknown
                >,
              ) => ({
                id:
                  typeof section.id ===
                  'string'
                    ? section.id
                    : undefined,

                slug:
                  typeof section.slug ===
                  'string'
                    ? section.slug
                    : '',

                title:
                  typeof section.title ===
                  'string'
                    ? section.title
                    : '',

                subtitle:
                  typeof section.subtitle ===
                  'string'
                    ? section.subtitle
                    : '',

                description:
                  typeof section.description ===
                  'string'
                    ? section.description
                    : '',

                image:
                  typeof section.image ===
                  'string'
                    ? section.image
                    : '',

                tags:
                  Array.isArray(
                    section.tags,
                  )
                    ? section.tags.filter(
                        (
                          tag,
                        ): tag is string =>
                          typeof tag ===
                          'string',
                      )
                    : [],

                published:
                  section.published !==
                  false,

                sort_order:
                  typeof section.sort_order ===
                  'number'
                    ? section.sort_order
                    : 0,
              }),
            )
          : payload

      setSections(
        savedSections,
      )

      setMessage(
        '系列已保存',
      )
    } catch (err) {
      console.error(
        '[ADMIN GUIDE SECTIONS] Save failed:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : '保存系列失败',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mt-10 border-t border-border pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-display text-[0.62rem] tracking-[0.3em] text-primary">
            GUIDE SERIES
          </span>

          <h2 className="mt-2 font-display text-2xl tracking-tight">
            Armor Codex 系列管理
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            管理护甲图鉴中的各个系列。
            排序会直接影响前台显示顺序。
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={
              addSection
            }
            className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-primary/40"
          >
            新增系列
          </button>

          <button
            type="button"
            onClick={
              saveSections
            }
            disabled={
              isSaving
            }
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isSaving
              ? '保存中...'
              : '保存全部系列'}
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-600">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-5">
        {sortedSections.map(
          (
            section,
            sortedIndex,
          ) => {
            const index =
              sections.findIndex(
                (item) =>
                  item === section,
              )

            return (
              <div
                key={
                  section.id ??
                  `new-${index}`
                }
                className="rounded-2xl border border-border bg-card p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      SERIES{' '}
                      {String(
                        sortedIndex +
                          1,
                      ).padStart(
                        2,
                        '0',
                      )}
                    </div>

                    <div className="mt-1 font-display text-xl">
                      {section.title ||
                        '未命名系列'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={
                        sortedIndex ===
                        0
                      }
                      onClick={() =>
                        moveSection(
                          index,
                          'up',
                        )
                      }
                      className="rounded-full border border-border px-3 py-1.5 text-xs disabled:opacity-30"
                    >
                      上移
                    </button>

                    <button
                      type="button"
                      disabled={
                        sortedIndex ===
                        sortedSections.length -
                          1
                      }
                      onClick={() =>
                        moveSection(
                          index,
                          'down',
                        )
                      }
                      className="rounded-full border border-border px-3 py-1.5 text-xs disabled:opacity-30"
                    >
                      下移
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        removeSection(
                          index,
                        )
                      }
                      className="rounded-full border border-destructive/30 px-3 py-1.5 text-xs text-destructive"
                    >
                      删除
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">
                      英文标题
                    </label>

                    <input
                      value={
                        section.title
                      }
                      onChange={(e) =>
                        updateSection(
                          index,
                          'title',
                          e.target
                            .value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                      placeholder="Palatino"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      中文标题 / 副标题
                    </label>

                    <input
                      value={
                        section.subtitle
                      }
                      onChange={(e) =>
                        updateSection(
                          index,
                          'subtitle',
                          e.target
                            .value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                      placeholder="帕拉提诺护甲系列"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Slug
                    </label>

                    <input
                      value={
                        section.slug
                      }
                      onChange={(e) =>
                        updateSection(
                          index,
                          'slug',
                          e.target
                            .value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                      placeholder="palatino"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      排序
                    </label>

                    <input
                      type="number"
                      value={
                        section.sort_order
                      }
                      onChange={(e) =>
                        updateSection(
                          index,
                          'sort_order',
                          Number(
                            e.target
                              .value,
                          ),
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-sm font-medium">
                    系列介绍
                  </label>

                  <textarea
                    value={
                      section.description
                    }
                    onChange={(e) =>
                      updateSection(
                        index,
                        'description',
                        e.target
                          .value,
                      )
                    }
                    rows={4}
                    className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none focus:border-primary"
                  />
                </div>

                <div className="mt-5">
                  <label className="text-sm font-medium">
                    封面图片
                  </label>

                  <input
                    value={
                      section.image
                    }
                    onChange={(e) =>
                      updateSection(
                        index,
                        'image',
                        e.target
                          .value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="/images/... 或 Supabase 图片 URL"
                  />

                  {section.image && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-muted">
                      <img
                        src={
                          section.image
                        }
                        alt={
                          section.title
                        }
                        className="aspect-video w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium">
                      Tags
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        addTag(
                          index,
                        )
                      }
                      className="text-xs text-primary"
                    >
                      + 添加 Tag
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {section.tags.map(
                      (
                        tag,
                        tagIndex,
                      ) => (
                        <div
                          key={
                            tagIndex
                          }
                          className="flex gap-2"
                        >
                          <input
                            value={
                              tag
                            }
                            onChange={(
                              e,
                            ) =>
                              updateTag(
                                index,
                                tagIndex,
                                e
                                  .target
                                  .value,
                              )
                            }
                            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeTag(
                                index,
                                tagIndex,
                              )
                            }
                            className="rounded-xl border border-border px-3 text-xs text-muted-foreground"
                          >
                            删除
                          </button>
                        </div>
                      ),
                    )}

                    {section.tags
                      .length ===
                      0 && (
                      <p className="text-xs text-muted-foreground">
                        暂无 Tag
                      </p>
                    )}
                  </div>
                </div>

                <label className="mt-5 flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      section.published
                    }
                    onChange={(e) =>
                      updateSection(
                        index,
                        'published',
                        e.target
                          .checked,
                      )
                    }
                    className="h-4 w-4"
                  />

                  <span className="text-sm">
                    前台发布此系列
                  </span>
                </label>
              </div>
            )
          },
        )}

        {sections.length ===
          0 && (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            目前没有任何系列。
          </div>
        )}
      </div>
    </section>
  )
}