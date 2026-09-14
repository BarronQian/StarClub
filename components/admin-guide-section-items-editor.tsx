'use client'

import {
  useEffect,
  useState,
} from 'react'

type GuideSectionItem = {
  id?: string
  slug: string
  title: string
  subtitle: string
  description: string
  image: string
  source: string
  acquisition: string
  tags: string[]
  published: boolean
  sort_order: number
}

type Props = {
  guideId: string
  sectionId: string
  sectionTitle: string
}

function createEmptyItem(): GuideSectionItem {
  return {
    slug: '',
    title: '',
    subtitle: '',
    description: '',
    image: '',
    source: '',
    acquisition: '',
    tags: [],
    published: true,
    sort_order: 0,
  }
}

export function AdminGuideSectionItemsEditor({
  guideId,
  sectionId,
  sectionTitle,
}: Props) {
  const [
    items,
    setItems,
  ] = useState<GuideSectionItem[]>([])

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    isSaving,
    setIsSaving,
  ] = useState(false)

  const [
    uploadingIndex,
    setUploadingIndex,
  ] = useState<number | null>(null)

  const [
    message,
    setMessage,
  ] = useState<string | null>(null)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadItems() {
      setIsLoading(true)
      setError(null)

      try {
        const response =
          await fetch(
            `/api/admin/guides/${guideId}/sections/${sectionId}/items`,
          )

        const data =
          await response
            .json()
            .catch(() => ({}))

        if (!response.ok) {
          throw new Error(
            data.error ??
              '读取护甲条目失败',
          )
        }

        if (cancelled) {
          return
        }

        const loadedItems =
          Array.isArray(data.items)
            ? data.items.map(
                (
                  item: Record<
                    string,
                    unknown
                  >,
                ): GuideSectionItem => ({
                  id:
                    typeof item.id ===
                    'string'
                      ? item.id
                      : undefined,

                  slug:
                    typeof item.slug ===
                    'string'
                      ? item.slug
                      : '',

                  title:
                    typeof item.title ===
                    'string'
                      ? item.title
                      : '',

                  subtitle:
                    typeof item.subtitle ===
                    'string'
                      ? item.subtitle
                      : '',

                  description:
                    typeof item.description ===
                    'string'
                      ? item.description
                      : '',

                  image:
                    typeof item.image ===
                    'string'
                      ? item.image
                      : '',

                  source:
                    typeof item.source ===
                    'string'
                      ? item.source
                      : '',

                  acquisition:
                    typeof item.acquisition ===
                    'string'
                      ? item.acquisition
                      : '',

                  tags:
                    Array.isArray(
                      item.tags,
                    )
                      ? item.tags.filter(
                          (
                            tag,
                          ): tag is string =>
                            typeof tag ===
                            'string',
                        )
                      : [],

                  published:
                    item.published !==
                    false,

                  sort_order:
                    typeof item.sort_order ===
                    'number'
                      ? item.sort_order
                      : 0,
                }),
              )
            : []

        setItems(
          loadedItems.sort(
            (
              a: GuideSectionItem,
              b: GuideSectionItem,
            ) =>
              a.sort_order -
              b.sort_order,
          ),
        )
      } catch (err) {
        if (cancelled) {
          return
        }

        console.error(
          '[ADMIN GUIDE SECTION ITEMS] Load failed:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : '读取护甲条目失败',
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadItems()

    return () => {
      cancelled = true
    }
  }, [
    guideId,
    sectionId,
  ])

  function updateItem(
    index: number,
    key: keyof GuideSectionItem,
    value:
      | string
      | string[]
      | boolean
      | number,
  ) {
    setItems((current) => {
      const next =
        [...current]

      next[index] = {
        ...next[index],
        [key]: value,
      }

      return next
    })

    setMessage(null)
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        ...createEmptyItem(),
        sort_order:
          (current.length + 1) *
          10,
      },
    ])

    setMessage(null)
    setError(null)
  }

  function removeItem(
    index: number,
  ) {
    const item =
      items[index]

    const confirmed =
      window.confirm(
        `确定删除「${
          item?.title ||
          item?.slug ||
          '这个护甲'
        }」吗？保存后将从数据库删除。`,
      )

    if (!confirmed) {
      return
    }

    setItems((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    )

    setMessage(null)
  }

  function moveItem(
    index: number,
    direction:
      | 'up'
      | 'down',
  ) {
    setItems((current) => {
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
        (item, itemIndex) => ({
          ...item,
          sort_order:
            (itemIndex + 1) *
            10,
        }),
      )
    })

    setMessage(null)
  }

  function addTag(
    itemIndex: number,
  ) {
    setItems((current) => {
      const next =
        [...current]

      next[itemIndex] = {
        ...next[itemIndex],
        tags: [
          ...next[itemIndex].tags,
          '',
        ],
      }

      return next
    })
  }

  function updateTag(
    itemIndex: number,
    tagIndex: number,
    value: string,
  ) {
    setItems((current) => {
      const next =
        [...current]

      const tags = [
        ...next[itemIndex].tags,
      ]

      tags[tagIndex] =
        value

      next[itemIndex] = {
        ...next[itemIndex],
        tags,
      }

      return next
    })
  }

  function removeTag(
    itemIndex: number,
    tagIndex: number,
  ) {
    setItems((current) => {
      const next =
        [...current]

      next[itemIndex] = {
        ...next[itemIndex],

        tags:
          next[
            itemIndex
          ].tags.filter(
            (_, index) =>
              index !==
              tagIndex,
          ),
      }

      return next
    })
  }

  async function uploadImage(
    file: File,
    itemIndex: number,
  ) {
    setUploadingIndex(
      itemIndex,
    )

    setError(null)

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
          .catch(() => ({}))

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

      updateItem(
        itemIndex,
        'image',
        data.url,
      )
    } catch (err) {
      console.error(
        '[ADMIN GUIDE ITEM IMAGE] Upload failed:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : '上传图片失败',
      )
    } finally {
      setUploadingIndex(null)
    }
  }

  async function saveItems() {
    setIsSaving(true)
    setMessage(null)
    setError(null)

    try {
      const payload =
        items.map(
          (
            item: GuideSectionItem,
            index: number,
          ) => ({
            ...item,

            tags:
              item.tags
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
          `/api/admin/guides/${guideId}/sections/${sectionId}/items`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                items:
                  payload,
              }),
          },
        )

      const data =
        await response
          .json()
          .catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.error ??
            '保存护甲条目失败',
        )
      }

      const savedItems =
        Array.isArray(
          data.items,
        )
          ? data.items.map(
              (
                item: Record<
                  string,
                  unknown
                >,
              ): GuideSectionItem => ({
                id:
                  typeof item.id ===
                  'string'
                    ? item.id
                    : undefined,

                slug:
                  typeof item.slug ===
                  'string'
                    ? item.slug
                    : '',

                title:
                  typeof item.title ===
                  'string'
                    ? item.title
                    : '',

                subtitle:
                  typeof item.subtitle ===
                  'string'
                    ? item.subtitle
                    : '',

                description:
                  typeof item.description ===
                  'string'
                    ? item.description
                    : '',

                image:
                  typeof item.image ===
                  'string'
                    ? item.image
                    : '',

                source:
                  typeof item.source ===
                  'string'
                    ? item.source
                    : '',

                acquisition:
                  typeof item.acquisition ===
                  'string'
                    ? item.acquisition
                    : '',

                tags:
                  Array.isArray(
                    item.tags,
                  )
                    ? item.tags.filter(
                        (
                          tag,
                        ): tag is string =>
                          typeof tag ===
                          'string',
                      )
                    : [],

                published:
                  item.published !==
                  false,

                sort_order:
                  typeof item.sort_order ===
                  'number'
                    ? item.sort_order
                    : 0,
              }),
            )
          : payload

      setItems(savedItems)

      setMessage(
        '护甲条目已保存',
      )
    } catch (err) {
      console.error(
        '[ADMIN GUIDE SECTION ITEMS] Save failed:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : '保存护甲条目失败',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mt-6 rounded-xl border border-border bg-background/50 px-5 py-6 text-sm text-muted-foreground">
        正在读取护甲条目...
      </div>
    )
  }

  return (
    <div className="mt-8 border-t border-border pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-display text-[0.58rem] tracking-[0.28em] text-primary">
            ARMOR ITEMS
          </span>

          <h3 className="mt-2 font-display text-lg">
            {sectionTitle}
            {' · '}
            护甲条目管理
          </h3>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            管理该系列中的具体护甲、来源与获取方式。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addItem}
            className="rounded-full border border-border px-4 py-2 text-xs transition-colors hover:border-primary/40"
          >
            + 新增护甲
          </button>

          <button
            type="button"
            onClick={saveItems}
            disabled={isSaving}
            className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {isSaving
              ? '保存中...'
              : '保存护甲条目'}
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-xs text-green-600">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="mt-5 space-y-4">
        {items.map(
          (
            item,
            index,
          ) => (
            <div
              key={
                item.id ??
                `new-item-${index}`
              }
              className="rounded-xl border border-border bg-background/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[0.6rem] tracking-[0.2em] text-muted-foreground">
                    ARMOR{' '}
                    {String(
                      index + 1,
                    ).padStart(
                      2,
                      '0',
                    )}
                  </div>

                  <div className="mt-1 font-medium">
                    {item.title ||
                      '未命名护甲'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      index === 0
                    }
                    onClick={() =>
                      moveItem(
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
                      index ===
                      items.length - 1
                    }
                    onClick={() =>
                      moveItem(
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
                      removeItem(
                        index,
                      )
                    }
                    className="rounded-full border border-destructive/30 px-3 py-1.5 text-xs text-destructive"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="text-xs font-medium">
                    护甲名称
                  </label>

                  <input
                    value={
                      item.title
                    }
                    onChange={(e) =>
                      updateItem(
                        index,
                        'title',
                        e.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="Palatino Helmet"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">
                    中文名称 / 副标题
                  </label>

                  <input
                    value={
                      item.subtitle
                    }
                    onChange={(e) =>
                      updateItem(
                        index,
                        'subtitle',
                        e.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">
                    Slug
                  </label>

                  <input
                    value={
                      item.slug
                    }
                    onChange={(e) =>
                      updateItem(
                        index,
                        'slug',
                        e.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="palatino-helmet"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">
                    排序
                  </label>

                  <input
                    type="number"
                    value={
                      item.sort_order
                    }
                    onChange={(e) =>
                      updateItem(
                        index,
                        'sort_order',
                        Number(
                          e.target.value,
                        ),
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-medium">
                  护甲介绍
                </label>

                <textarea
                  value={
                    item.description
                  }
                  onChange={(e) =>
                    updateItem(
                      index,
                      'description',
                      e.target.value,
                    )
                  }
                  rows={3}
                  className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none focus:border-primary"
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="text-xs font-medium">
                    来源
                  </label>

                  <input
                    value={
                      item.source
                    }
                    onChange={(e) =>
                      updateItem(
                        index,
                        'source',
                        e.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="例如：只可搜刮"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">
                    获取方式
                  </label>

                  <input
                    value={
                      item.acquisition
                    }
                    onChange={(e) =>
                      updateItem(
                        index,
                        'acquisition',
                        e.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="例如：特定地点箱子掉落"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-medium">
                  图片
                </label>

                <input
                  value={
                    item.image
                  }
                  onChange={(e) =>
                    updateItem(
                      index,
                      'image',
                      e.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="/images/... 或 Supabase 图片 URL"
                />

                <div className="mt-3 flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center rounded-full border border-border px-4 py-2 text-xs transition-colors hover:border-primary/40">
                    {uploadingIndex ===
                    index
                      ? '正在上传...'
                      : '选择并上传图片'}

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={
                        uploadingIndex !==
                        null
                      }
                      onChange={(e) => {
                        const file =
                          e.target
                            .files?.[0]

                        if (file) {
                          uploadImage(
                            file,
                            index,
                          )
                        }

                        e.target.value =
                          ''
                      }}
                      className="hidden"
                    />
                  </label>

                  {item.image && (
                    <button
                      type="button"
                      onClick={() =>
                        updateItem(
                          index,
                          'image',
                          '',
                        )
                      }
                      className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground"
                    >
                      清除图片
                    </button>
                  )}
                </div>

                {item.image && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-border bg-muted">
                    <img
                      src={
                        item.image
                      }
                      alt={
                        item.title ||
                        '护甲预览'
                      }
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">
                    Tags
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      addTag(index)
                    }
                    className="text-xs text-primary"
                  >
                    + 添加 Tag
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {item.tags.map(
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
                          value={tag}
                          onChange={(e) =>
                            updateTag(
                              index,
                              tagIndex,
                              e.target
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

                  {item.tags.length ===
                    0 && (
                    <p className="text-xs text-muted-foreground">
                      暂无 Tag
                    </p>
                  )}
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    item.published
                  }
                  onChange={(e) =>
                    updateItem(
                      index,
                      'published',
                      e.target
                        .checked,
                    )
                  }
                  className="h-4 w-4"
                />

                <span className="text-xs">
                  前台发布此护甲
                </span>
              </label>
            </div>
          ),
        )}

        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-xs text-muted-foreground">
            该系列目前还没有具体护甲条目。
          </div>
        )}
      </div>
    </div>
  )
}