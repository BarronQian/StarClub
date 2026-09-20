'use client'

import {
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
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

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

  function resetForm() {
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

  async function createKnowledge() {
    if (saving) {
      return
    }

    const cleanTitle =
      title.trim()

    const cleanContent =
      content.trim()

    if (!cleanTitle) {
      setError(
        '请输入知识标题',
      )
      return
    }

    if (!cleanContent) {
      setError(
        '请输入知识内容',
      )
      return
    }

    const parsedKeywords =
      keywords
        .split(/[,，\n]/)
        .map(
          (item) =>
            item.trim(),
        )
        .filter(Boolean)

    const parsedSortOrder =
      Number.parseInt(
        sortOrder,
        10,
      )

    setSaving(true)
    setError('')

    try {
      const response =
        await fetch(
          '/api/admin/ai-knowledge',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
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
              }),
          },
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            '新增知识失败',
        )
      }

      resetForm()
      setShowForm(false)

      router.refresh()
    } catch (error) {
      console.error(
        '[AI KNOWLEDGE ADMIN] Create failed:',
        error,
      )

      setError(
        error instanceof Error
          ? error.message
          : '新增知识失败',
      )
    } finally {
      setSaving(false)
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
            initialKnowledge.filter(
              (item) =>
                item.is_active,
            ).length
          }{' '}
          条启用
        </div>

        <Button
          type="button"
          onClick={() => {
            setShowForm(
              (value) =>
                !value,
            )

            setError('')
          }}
        >
          {showForm
            ? '收起'
            : '+ 新增知识'}
        </Button>
      </div>

      {showForm && (
        <section className="rounded-xl border border-border bg-background p-5 sm:p-6">
          <div>
            <h3 className="font-display text-sm tracking-[0.12em] text-foreground">
              新增 AI 知识
            </h3>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              保存并启用后，小萝卜即可在相关问题中检索这条知识。
            </p>
          </div>

          <div className="mt-6 grid gap-5">
            <label className="grid gap-2">
              <span className="text-xs font-medium text-foreground">
                标题 *
              </span>

              <Input
                value={title}
                onChange={(
                  event,
                ) =>
                  setTitle(
                    event.target
                      .value,
                  )
                }
                maxLength={120}
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
                  (option) => (
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
                  字符
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
                支持中文逗号、英文逗号或换行分隔。建议同时填写用户可能使用的不同说法。
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
                    立即启用
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
                  createKnowledge
                }
              >
                {saving
                  ? '保存中...'
                  : '保存知识'}
              </Button>
            </div>
          </div>
        </section>
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
      ) : (
        <div className="space-y-3">
          {initialKnowledge.map(
            (item) => (
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
                        {
                          item.category
                        }
                      </span>

                      <span
                        className={
                          item.is_active
                            ? 'text-[0.65rem] text-emerald-600'
                            : 'text-[0.65rem] text-muted-foreground'
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

                  <div className="shrink-0 text-right text-[0.65rem] text-muted-foreground">
                    优先级{' '}
                    {
                      item.sort_order
                    }
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </div>
  )
}