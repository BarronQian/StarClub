'use client'

import {
  useMemo,
  useState,
} from 'react'

import {
  useRouter,
} from 'next/navigation'

import {
  Button,
} from '@/components/ui/button'

import {
  Input,
} from '@/components/ui/input'

import {
  Textarea,
} from '@/components/ui/textarea'

import type {
  AIKnowledge,
} from '@/app/admin/ai-knowledge/page'

type Props = {
  initialKnowledge:
    AIKnowledge[]
}

const CATEGORY_OPTIONS = [
  {
    value: 'general',
    label: '通用知识',
  },
  {
    value: 'website',
    label: '官网功能',
  },
  {
    value: 'community',
    label: '社区',
  },
  {
    value: 'discord',
    label: 'Discord',
  },
  {
    value: 'event',
    label: '活动',
  },
  {
    value: 'guide',
    label: '攻略',
  },
  {
    value: 'market',
    label: '玩家市场',
  },
  {
    value: 'tool',
    label: '实用工具',
  },
  {
    value: 'faq',
    label: '常见问题',
  },
]

function getCategoryLabel(
  value: string,
) {
  return (
    CATEGORY_OPTIONS.find(
      (option) =>
        option.value === value,
    )?.label ?? value
  )
}

export function AIKnowledgeAdmin({
  initialKnowledge,
}: Props) {
  const router =
    useRouter()

  const [
    showForm,
    setShowForm,
  ] = useState(false)

  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(
    null,
  )

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    operatingId,
    setOperatingId,
  ] = useState<string | null>(
    null,
  )

  const [
    error,
    setError,
  ] = useState('')

  const [
    listError,
    setListError,
  ] = useState('')

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState('all')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all')

  const [
    title,
    setTitle,
  ] = useState('')

  const [
    category,
    setCategory,
  ] = useState(
    'general',
  )

  const [
    content,
    setContent,
  ] = useState('')

  const [
    url,
    setUrl,
  ] = useState('')

  const [
    keywords,
    setKeywords,
  ] = useState('')

  const [
    sortOrder,
    setSortOrder,
  ] = useState('0')

  const [
    isActive,
    setIsActive,
  ] = useState(true)

  const activeCount =
    initialKnowledge.filter(
      (item) =>
        item.is_active,
    ).length

  const filteredKnowledge =
    useMemo(() => {
      const cleanSearch =
        search
          .trim()
          .toLowerCase()

      return initialKnowledge.filter(
        (item) => {
          if (
            categoryFilter !==
              'all' &&
            item.category !==
              categoryFilter
          ) {
            return false
          }

          if (
            statusFilter ===
              'active' &&
            !item.is_active
          ) {
            return false
          }

          if (
            statusFilter ===
              'inactive' &&
            item.is_active
          ) {
            return false
          }

          if (!cleanSearch) {
            return true
          }

          const searchableText = [
            item.title,
            item.category,
            item.content,
            item.url ?? '',
            ...item.keywords,
          ]
            .join(' ')
            .toLowerCase()

          return searchableText.includes(
            cleanSearch,
          )
        },
      )
    }, [
      initialKnowledge,
      search,
      categoryFilter,
      statusFilter,
    ])

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setCategory('general')
    setContent('')
    setUrl('')
    setKeywords('')
    setSortOrder('0')
    setIsActive(true)
    setError('')
  }

  function closeForm() {
    resetForm()
    setShowForm(false)
  }

  function openCreateForm() {
    resetForm()
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function openEditForm(
    item: AIKnowledge,
  ) {
    setEditingId(
      item.id,
    )

    setTitle(
      item.title,
    )

    setCategory(
      item.category,
    )

    setContent(
      item.content,
    )

    setUrl(
      item.url ?? '',
    )

    setKeywords(
      item.keywords.join(
        ', ',
      ),
    )

    setSortOrder(
      String(
        item.sort_order,
      ),
    )

    setIsActive(
      item.is_active,
    )

    setError('')
    setListError('')
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function buildPayload() {
    const cleanTitle =
      title.trim()

    const cleanContent =
      content.trim()

    if (!cleanTitle) {
      setError(
        '请输入知识标题',
      )

      return null
    }

    if (!cleanContent) {
      setError(
        '请输入知识内容',
      )

      return null
    }

    const parsedKeywords =
      Array.from(
        new Set(
          keywords
            .split(
              /[,，\n]/,
            )
            .map(
              (item) =>
                item.trim(),
            )
            .filter(Boolean),
        ),
      )

    const parsedSortOrder =
      Number.parseInt(
        sortOrder,
        10,
      )

    return {
      title:
        cleanTitle,

      category,

      content:
        cleanContent,

      url:
        url.trim() ||
        null,

      keywords:
        parsedKeywords,

      sort_order:
        Number.isFinite(
          parsedSortOrder,
        )
          ? parsedSortOrder
          : 0,

      is_active:
        isActive,
    }
  }

  async function saveKnowledge() {
    if (saving) {
      return
    }

    const payload =
      buildPayload()

    if (!payload) {
      return
    }

    setSaving(true)
    setError('')
    setListError('')

    try {
      const endpoint =
        editingId
          ? `/api/admin/ai-knowledge/${editingId}`
          : '/api/admin/ai-knowledge'

      const response =
        await fetch(
          endpoint,
          {
            method:
              editingId
                ? 'PATCH'
                : 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            (editingId
              ? '更新知识失败'
              : '新增知识失败'),
        )
      }

      closeForm()

      router.refresh()
    } catch (error) {
      console.error(
        '[AI KNOWLEDGE ADMIN] Save failed:',
        error,
      )

      setError(
        error instanceof Error
          ? error.message
          : '保存知识失败',
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleKnowledge(
    item: AIKnowledge,
  ) {
    if (operatingId) {
      return
    }

    setOperatingId(
      item.id,
    )

    setListError('')

    try {
      const response =
        await fetch(
          `/api/admin/ai-knowledge/${item.id}`,
          {
            method:
              'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                is_active:
                  !item.is_active,
              }),
          },
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            '修改状态失败',
        )
      }

      router.refresh()
    } catch (error) {
      console.error(
        '[AI KNOWLEDGE ADMIN] Toggle failed:',
        error,
      )

      setListError(
        error instanceof Error
          ? error.message
          : '修改状态失败',
      )
    } finally {
      setOperatingId(
        null,
      )
    }
  }

  async function deleteKnowledge(
    item: AIKnowledge,
  ) {
    if (operatingId) {
      return
    }

    const confirmed =
      window.confirm(
        `确定要永久删除「${item.title}」吗？\n\n删除后无法恢复。`,
      )

    if (!confirmed) {
      return
    }

    setOperatingId(
      item.id,
    )

    setListError('')

    try {
      const response =
        await fetch(
          `/api/admin/ai-knowledge/${item.id}`,
          {
            method:
              'DELETE',
          },
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            '删除知识失败',
        )
      }

      if (
        editingId ===
        item.id
      ) {
        closeForm()
      }

      router.refresh()
    } catch (error) {
      console.error(
        '[AI KNOWLEDGE ADMIN] Delete failed:',
        error,
      )

      setListError(
        error instanceof Error
          ? error.message
          : '删除知识失败',
      )
    } finally {
      setOperatingId(
        null,
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-muted-foreground">
          共{' '}
          {
            initialKnowledge.length
          }{' '}
          条知识 ·{' '}
          {
            activeCount
          }{' '}
          条启用
        </div>

        <Button
          type="button"
          onClick={() => {
            if (
              showForm &&
              !editingId
            ) {
              closeForm()
              return
            }

            openCreateForm()
          }}
        >
          {showForm &&
          !editingId
            ? '收起'
            : '+ 新增知识'}
        </Button>
      </div>

      {showForm && (
        <section className="rounded-xl border border-border bg-background p-5 sm:p-6">
          <div>
            <h3 className="font-display text-sm tracking-[0.12em] text-foreground">
              {editingId
                ? '编辑 AI 知识'
                : '新增 AI 知识'}
            </h3>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {editingId
                ? '修改并保存后，小萝卜将使用最新版本的知识。'
                : '保存并启用后，小萝卜即可在相关问题中检索这条知识。'}
            </p>
          </div>

          <div className="mt-6 grid gap-5">
            <label className="grid gap-2">
              <span className="text-xs font-medium text-foreground">
                标题 *
              </span>

              <Input
                value={
                  title
                }
                onChange={(
                  event,
                ) =>
                  setTitle(
                    event.target
                      .value,
                  )
                }
                maxLength={
                  120
                }
                placeholder="例如：如何完成 Handle Name 验证"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-medium text-foreground">
                分类
              </span>

              <select
                value={
                  category
                }
                onChange={(
                  event,
                ) =>
                  setCategory(
                    event.target
                      .value,
                  )
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CATEGORY_OPTIONS.map(
                  (
                    option,
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="grid gap-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-foreground">
                  知识内容 *
                </span>

                <span className="text-[0.65rem] text-muted-foreground">
                  {
                    content.length
                  }{' '}
                  / 20000
                </span>
              </div>

              <Textarea
                value={
                  content
                }
                onChange={(
                  event,
                ) =>
                  setContent(
                    event.target
                      .value,
                  )
                }
                maxLength={
                  20000
                }
                placeholder="填写希望小萝卜掌握的准确资料。可以包含步骤、规则、说明、注意事项等。"
                className="min-h-[220px] resize-y"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-medium text-foreground">
                相关页面 URL
              </span>

              <Input
                value={url}
                onChange={(
                  event,
                ) =>
                  setUrl(
                    event.target
                      .value,
                  )
                }
                placeholder="/profile 或 https://www.starclubsc.com/..."
              />

              <span className="text-[0.65rem] leading-4 text-muted-foreground">
                如果这条知识有对应官网页面，可以填写。没有可以留空。
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-medium text-foreground">
                检索关键词
              </span>

              <Textarea
                value={
                  keywords
                }
                onChange={(
                  event,
                ) =>
                  setKeywords(
                    event.target
                      .value,
                  )
                }
                placeholder="例如：Handle, 验证, 游戏ID, RSI, 绑定"
                className="min-h-[90px] resize-y"
              />

              <span className="text-[0.65rem] leading-4 text-muted-foreground">
                支持中文逗号、英文逗号或换行分隔。建议填写用户可能使用的不同说法。
              </span>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-medium text-foreground">
                  优先级
                </span>

                <Input
                  type="number"
                  value={
                    sortOrder
                  }
                  onChange={(
                    event,
                  ) =>
                    setSortOrder(
                      event.target
                        .value,
                    )
                  }
                />

                <span className="text-[0.65rem] leading-4 text-muted-foreground">
                  数字越高，在同类知识中越优先。
                </span>
              </label>

              <label className="flex min-h-[88px] items-center gap-3 rounded-lg border border-border px-4">
                <input
                  type="checkbox"
                  checked={
                    isActive
                  }
                  onChange={(
                    event,
                  ) =>
                    setIsActive(
                      event.target
                        .checked,
                    )
                  }
                  className="size-4"
                />

                <div>
                  <div className="text-xs font-medium text-foreground">
                    启用知识
                  </div>

                  <div className="mt-1 text-[0.65rem] leading-4 text-muted-foreground">
                    启用后，小萝卜可以检索这条知识。
                  </div>
                </div>
              </label>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-border pt-5">
              <Button
                type="button"
                variant="outline"
                disabled={
                  saving
                }
                onClick={
                  closeForm
                }
              >
                取消
              </Button>

              <Button
                type="button"
                disabled={
                  saving
                }
                onClick={
                  saveKnowledge
                }
              >
                {saving
                  ? '保存中...'
                  : editingId
                    ? '保存修改'
                    : '保存知识'}
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_150px]">
          <Input
            value={
              search
            }
            onChange={(
              event,
            ) =>
              setSearch(
                event.target
                  .value,
              )
            }
            placeholder="搜索标题、内容、关键词、URL..."
          />

          <select
            value={
              categoryFilter
            }
            onChange={(
              event,
            ) =>
              setCategoryFilter(
                event.target
                  .value,
              )
            }
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">
              全部分类
            </option>

            {CATEGORY_OPTIONS.map(
              (
                option,
              ) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {
                    option.label
                  }
                </option>
              ),
            )}
          </select>

          <select
            value={
              statusFilter
            }
            onChange={(
              event,
            ) =>
              setStatusFilter(
                event.target
                  .value,
              )
            }
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">
              全部状态
            </option>

            <option value="active">
              启用中
            </option>

            <option value="inactive">
              已停用
            </option>
          </select>
        </div>

        <div className="mt-3 text-[0.7rem] text-muted-foreground">
          当前显示{' '}
          {
            filteredKnowledge.length
          }{' '}
          /{' '}
          {
            initialKnowledge.length
          }{' '}
          条
        </div>
      </section>

      {listError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          {listError}
        </div>
      )}

      {initialKnowledge.length ===
      0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            AI 知识库目前为空
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            点击右上角「新增知识」，开始给小萝卜添加动态知识。
          </p>
        </div>
      ) : filteredKnowledge.length ===
        0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="text-sm font-medium text-foreground">
            没有找到符合条件的知识
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            可以尝试更换关键词、分类或状态筛选。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredKnowledge.map(
            (item) => {
              const operating =
                operatingId ===
                item.id

              return (
                <article
                  key={
                    item.id
                  }
                  className="rounded-xl border border-border bg-background p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-foreground">
                          {
                            item.title
                          }
                        </h3>

                        <span className="rounded-full border border-border px-2 py-0.5 text-[0.65rem] text-muted-foreground">
                          {getCategoryLabel(
                            item.category,
                          )}
                        </span>

                        <span
                          className={
                            item.is_active
                              ? 'rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] text-emerald-600 dark:text-emerald-400'
                              : 'rounded-full bg-muted px-2 py-0.5 text-[0.65rem] text-muted-foreground'
                          }
                        >
                          {item.is_active
                            ? '启用中'
                            : '已停用'}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                        {
                          item.content
                        }
                      </p>

                      {item.keywords
                        .length >
                        0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {item.keywords.map(
                            (
                              keyword,
                            ) => (
                              <span
                                key={
                                  keyword
                                }
                                className="rounded-md bg-muted px-2 py-1 text-[0.65rem] text-muted-foreground"
                              >
                                {
                                  keyword
                                }
                              </span>
                            ),
                          )}
                        </div>
                      )}

                      {item.url && (
                        <p className="mt-3 break-all text-[0.65rem] text-muted-foreground">
                          {
                            item.url
                          }
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-3">
                      <span className="text-[0.65rem] text-muted-foreground">
                        优先级{' '}
                        {
                          item.sort_order
                        }
                      </span>

                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            Boolean(
                              operatingId,
                            )
                          }
                          onClick={() =>
                            openEditForm(
                              item,
                            )
                          }
                        >
                          编辑
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            Boolean(
                              operatingId,
                            )
                          }
                          onClick={() =>
                            void toggleKnowledge(
                              item,
                            )
                          }
                        >
                          {operating
                            ? '处理中...'
                            : item.is_active
                              ? '停用'
                              : '启用'}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={
                            Boolean(
                              operatingId,
                            )
                          }
                          onClick={() =>
                            void deleteKnowledge(
                              item,
                            )
                          }
                        >
                          {operating
                            ? '处理中...'
                            : '删除'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            },
          )}
        </div>
      )}
    </div>
  )
}