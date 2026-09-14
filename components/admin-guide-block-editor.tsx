'use client'

import {
  useMemo,
  useState,
} from 'react'

type BlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'list'
  | 'callout'
  | 'video'

export type EditableGuideBlock = {
  id: string
  block_type: BlockType
  block_order: number
  content: Record<string, unknown>
}

type Props = {
  guideId: string
  initialBlocks?: EditableGuideBlock[]
}

function createBlock(
  type: BlockType,
  order: number,
): EditableGuideBlock {
  const id =
    `temp-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`

  switch (type) {
    case 'heading':
      return {
        id,
        block_type: type,
        block_order: order,
        content: {
          text: '',
          level: 2,
        },
      }

    case 'paragraph':
      return {
        id,
        block_type: type,
        block_order: order,
        content: {
          text: '',
        },
      }

    case 'image':
      return {
        id,
        block_type: type,
        block_order: order,
        content: {
          src: '',
          alt: '',
          caption: '',
        },
      }

    case 'list':
      return {
        id,
        block_type: type,
        block_order: order,
        content: {
          items: [''],
          ordered: false,
        },
      }

    case 'callout':
      return {
        id,
        block_type: type,
        block_order: order,
        content: {
          title: '',
          text: '',
        },
      }

    case 'video':
      return {
        id,
        block_type: type,
        block_order: order,
        content: {
          url: '',
          title: '',
        },
      }
  }
}

function normalizeOrders(
  blocks: EditableGuideBlock[],
) {
  return blocks.map(
    (block, index) => ({
      ...block,
      block_order:
        (index + 1) * 10,
    }),
  )
}

export function AdminGuideBlockEditor({
  guideId,
  initialBlocks = [],
}: Props) {
  const [blocks, setBlocks] =
    useState<EditableGuideBlock[]>(
      normalizeOrders(
        initialBlocks,
      ),
    )

  const [error, setError] =
    useState<string | null>(
      null,
    )

  const [success, setSuccess] =
    useState<string | null>(
      null,
    )

  const [isSaving, setIsSaving] =
    useState(false)

  const blockCount =
    useMemo(
      () => blocks.length,
      [blocks],
    )

  function addBlock(
    type: BlockType,
  ) {
    setBlocks((current) =>
      normalizeOrders([
        ...current,
        createBlock(
          type,
          (current.length + 1) *
            10,
        ),
      ]),
    )

    setSuccess(null)
  }

  function removeBlock(
    index: number,
  ) {
    setBlocks((current) =>
      normalizeOrders(
        current.filter(
          (_, i) =>
            i !== index,
        ),
      ),
    )

    setSuccess(null)
  }

  function moveBlock(
    index: number,
    direction:
      | 'up'
      | 'down',
  ) {
    setBlocks((current) => {
      const next = [
        ...current,
      ]

      const target =
        direction === 'up'
          ? index - 1
          : index + 1

      if (
        target < 0 ||
        target >= next.length
      ) {
        return current
      }

      const temp =
        next[index]

      next[index] =
        next[target]

      next[target] =
        temp

      return normalizeOrders(
        next,
      )
    })

    setSuccess(null)
  }

  function updateBlockContent(
    index: number,
    key: string,
    value: unknown,
  ) {
    setBlocks((current) =>
      current.map(
        (block, i) =>
          i === index
            ? {
                ...block,
                content: {
                  ...block.content,
                  [key]:
                    value,
                },
              }
            : block,
      ),
    )

    setSuccess(null)
  }

  function updateListItem(
    blockIndex: number,
    itemIndex: number,
    value: string,
  ) {
    setBlocks((current) =>
      current.map(
        (block, i) => {
          if (
            i !==
            blockIndex
          ) {
            return block
          }

          const items =
            Array.isArray(
              block.content.items,
            )
              ? [
                  ...block
                    .content
                    .items,
                ]
              : []

          items[
            itemIndex
          ] = value

          return {
            ...block,
            content: {
              ...block.content,
              items,
            },
          }
        },
      ),
    )

    setSuccess(null)
  }

  function addListItem(
    blockIndex: number,
  ) {
    setBlocks((current) =>
      current.map(
        (block, i) => {
          if (
            i !==
            blockIndex
          ) {
            return block
          }

          const items =
            Array.isArray(
              block.content.items,
            )
              ? [
                  ...block
                    .content
                    .items,
                  '',
                ]
              : ['']

          return {
            ...block,
            content: {
              ...block.content,
              items,
            },
          }
        },
      ),
    )

    setSuccess(null)
  }

  function removeListItem(
    blockIndex: number,
    itemIndex: number,
  ) {
    setBlocks((current) =>
      current.map(
        (block, i) => {
          if (
            i !==
            blockIndex
          ) {
            return block
          }

          const items =
            Array.isArray(
              block.content.items,
            )
              ? block.content.items.filter(
                  (
                    _,
                    itemI,
                  ) =>
                    itemI !==
                    itemIndex,
                )
              : []

          return {
            ...block,
            content: {
              ...block.content,
              items,
            },
          }
        },
      ),
    )

    setSuccess(null)
  }

  async function uploadBlockImage(
  file: File,
  blockIndex: number,
) {
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

    updateBlockContent(
      blockIndex,
      'src',
      data.url,
    )
  } catch (err) {
    console.error(
      '[ADMIN GUIDE BLOCK IMAGE] Upload failed:',
      err,
    )

    setError(
      err instanceof Error
        ? err.message
        : '上传图片失败',
    )
  }
}

  async function saveBlocks() {
    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      const response =
        await fetch(
          `/api/admin/guides/${guideId}/blocks`,
          {
            method: 'PUT',
            headers: {
              'Content-Type':
                'application/json',
            },
            body:
              JSON.stringify({
                blocks:
                  normalizeOrders(
                    blocks,
                  ),
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
            '保存正文失败',
        )
      }

      setBlocks(
        Array.isArray(
          data.blocks,
        )
          ? data.blocks
          : blocks,
      )

      setSuccess(
        '正文已保存',
      )
    } catch (err) {
      console.error(
        '[ADMIN GUIDE BLOCKS] Save failed:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : '保存正文失败',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-display text-[0.62rem] tracking-[0.28em] text-primary">
            CONTENT BLOCKS
          </span>

          <h2 className="mt-2 font-display text-xl">
            图文正文
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            当前共 {blockCount}{' '}
            个内容区块。
          </p>
        </div>

        <button
          type="button"
          onClick={
            saveBlocks
          }
          disabled={
            isSaving
          }
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSaving
            ? '正在保存...'
            : '保存正文'}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <BlockAddButton
          label="标题"
          onClick={() =>
            addBlock(
              'heading',
            )
          }
        />

        <BlockAddButton
          label="段落"
          onClick={() =>
            addBlock(
              'paragraph',
            )
          }
        />

        <BlockAddButton
          label="图片"
          onClick={() =>
            addBlock(
              'image',
            )
          }
        />

        <BlockAddButton
          label="列表"
          onClick={() =>
            addBlock(
              'list',
            )
          }
        />

        <BlockAddButton
          label="提示框"
          onClick={() =>
            addBlock(
              'callout',
            )
          }
        />

        <BlockAddButton
          label="视频"
          onClick={() =>
            addBlock(
              'video',
            )
          }
        />
      </div>

      {blocks.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">
          还没有正文内容。
          <br />
          从上方选择一种
          Block 开始添加。
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {blocks.map(
            (
              block,
              index,
            ) => (
              <div
                key={
                  block.id
                }
                className="rounded-2xl border border-border bg-background p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                      {
                        index +
                        1
                      }
                    </span>

                    <span className="text-sm font-medium">
                      {getBlockLabel(
                        block.block_type,
                      )}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <SmallButton
                      disabled={
                        index ===
                        0
                      }
                      onClick={() =>
                        moveBlock(
                          index,
                          'up',
                        )
                      }
                    >
                      上移
                    </SmallButton>

                    <SmallButton
                      disabled={
                        index ===
                        blocks.length -
                          1
                      }
                      onClick={() =>
                        moveBlock(
                          index,
                          'down',
                        )
                      }
                    >
                      下移
                    </SmallButton>

                    <button
                      type="button"
                      onClick={() =>
                        removeBlock(
                          index,
                        )
                      }
                      className="rounded-full border border-destructive/30 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/5"
                    >
                      删除
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <BlockEditorFields
                    block={
                      block
                    }
                    index={
                      index
                    }
                    updateBlockContent={
                      updateBlockContent
                    }
                      uploadBlockImage={
                      uploadBlockImage
                    }
                    updateListItem={
                      updateListItem
                    }
                    addListItem={
                      addListItem
                    }
                    removeListItem={
                      removeListItem
                    }
                  />
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600">
          {success}
        </div>
      )}
    </section>
  )
}

function BlockAddButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      + {label}
    </button>
  )
}

function SmallButton({
  children,
  disabled,
  onClick,
}: {
  children:
    React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function getBlockLabel(
  type: BlockType,
) {
  switch (type) {
    case 'heading':
      return '标题'

    case 'paragraph':
      return '段落'

    case 'image':
      return '图片'

    case 'list':
      return '列表'

    case 'callout':
      return '提示框'

    case 'video':
      return '视频'
  }
}

type FieldProps = {
  block: EditableGuideBlock
  index: number
  updateBlockContent: (
    index: number,
    key: string,
    value: unknown,
  ) => void
  updateListItem: (
    blockIndex: number,
    itemIndex: number,
    value: string,
  ) => void
  addListItem: (
    blockIndex: number,
  ) => void
  removeListItem: (
    blockIndex: number,
    itemIndex: number,
  ) => void
  uploadBlockImage: (
  file: File,
  blockIndex: number,
) => Promise<void>
}

function BlockEditorFields({
  block,
  index,
  updateBlockContent,
  uploadBlockImage,
  updateListItem,
  addListItem,
  removeListItem,
}: FieldProps) {
  const content =
    block.content ?? {}

  if (
    block.block_type ===
    'heading'
  ) {
    return (
      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium">
            标题文字
          </label>

          <input
            value={
              typeof content.text ===
              'string'
                ? content.text
                : ''
            }
            onChange={(e) =>
              updateBlockContent(
                index,
                'text',
                e.target.value,
              )
            }
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            标题级别
          </label>

          <select
            value={
              typeof content.level ===
              'number'
                ? content.level
                : 2
            }
            onChange={(e) =>
              updateBlockContent(
                index,
                'level',
                Number(
                  e.target.value,
                ),
              )
            }
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          >
            <option value={2}>
              H2
            </option>

            <option value={3}>
              H3
            </option>
          </select>
        </div>
      </div>
    )
  }

  if (
    block.block_type ===
    'paragraph'
  ) {
    return (
      <div>
        <label className="text-sm font-medium">
          段落内容
        </label>

        <textarea
          rows={6}
          value={
            typeof content.text ===
            'string'
              ? content.text
              : ''
          }
          onChange={(e) =>
            updateBlockContent(
              index,
              'text',
              e.target.value,
            )
          }
          className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-7 outline-none focus:border-primary"
        />
      </div>
    )
  }

if (
  block.block_type ===
  'image'
) {
  const src =
    typeof content.src ===
    'string'
      ? content.src
      : ''

  return (
    <div className="grid gap-4">
      <div>
        <label className="text-sm font-medium">
          图片地址
        </label>

        <input
          value={src}
          onChange={(e) =>
            updateBlockContent(
              index,
              'src',
              e.target.value,
            )
          }
          placeholder="图片 URL 或上传图片"
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
        />

        <label className="mt-3 inline-flex cursor-pointer rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
          上传图片

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file =
                e.target.files?.[0]

              if (file) {
                uploadBlockImage(
                  file,
                  index,
                )
              }

              e.target.value =
                ''
            }}
          />
        </label>
      </div>

      {src && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <img
            src={src}
            alt="正文图片预览"
            className="max-h-105 w-full object-contain"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium">
          Alt
        </label>

        <input
          value={
            typeof content.alt ===
            'string'
              ? content.alt
              : ''
          }
          onChange={(e) =>
            updateBlockContent(
              index,
              'alt',
              e.target.value,
            )
          }
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="text-sm font-medium">
          图片说明
        </label>

        <input
          value={
            typeof content.caption ===
            'string'
              ? content.caption
              : ''
          }
          onChange={(e) =>
            updateBlockContent(
              index,
              'caption',
              e.target.value,
            )
          }
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
        />
      </div>
    </div>
  )
}

  if (
    block.block_type ===
    'callout'
  ) {
    return (
      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium">
            提示标题
          </label>

          <input
            value={
              typeof content.title ===
              'string'
                ? content.title
                : ''
            }
            onChange={(e) =>
              updateBlockContent(
                index,
                'title',
                e.target.value,
              )
            }
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            提示内容
          </label>

          <textarea
            rows={4}
            value={
              typeof content.text ===
              'string'
                ? content.text
                : ''
            }
            onChange={(e) =>
              updateBlockContent(
                index,
                'text',
                e.target.value,
              )
            }
            className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-7 outline-none focus:border-primary"
          />
        </div>
      </div>
    )
  }

  if (
    block.block_type ===
    'video'
  ) {
    return (
      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium">
            视频嵌入地址
          </label>

          <input
            value={
              typeof content.url ===
              'string'
                ? content.url
                : ''
            }
            onChange={(e) =>
              updateBlockContent(
                index,
                'url',
                e.target.value,
              )
            }
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            视频标题
          </label>

          <input
            value={
              typeof content.title ===
              'string'
                ? content.title
                : ''
            }
            onChange={(e) =>
              updateBlockContent(
                index,
                'title',
                e.target.value,
              )
            }
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
    )
  }

  if (
    block.block_type ===
    'list'
  ) {
    const items =
      Array.isArray(
        content.items,
      )
        ? content.items.map(
            (item) =>
              typeof item ===
              'string'
                ? item
                : '',
          )
        : []

    return (
      <div className="grid gap-5">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={
              content.ordered ===
              true
            }
            onChange={(e) =>
              updateBlockContent(
                index,
                'ordered',
                e.target.checked,
              )
            }
          />

          使用数字序号
        </label>

        <div className="space-y-3">
          {items.map(
            (
              item,
              itemIndex,
            ) => (
              <div
                key={
                  itemIndex
                }
                className="flex gap-2"
              >
                <input
                  value={
                    item
                  }
                  onChange={(e) =>
                    updateListItem(
                      index,
                      itemIndex,
                      e.target.value,
                    )
                  }
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />

                <button
                  type="button"
                  onClick={() =>
                    removeListItem(
                      index,
                      itemIndex,
                    )
                  }
                  className="rounded-xl border border-destructive/30 px-3 text-xs text-destructive"
                >
                  删除
                </button>
              </div>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            addListItem(
              index,
            )
          }
          className="w-fit rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          + 添加一项
        </button>
      </div>
    )
  }

  return null
}