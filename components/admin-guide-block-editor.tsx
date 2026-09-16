'use client'

import {
  useMemo,
  useState,
} from 'react'

import {
  getVideoEmbedUrl,
} from '@/lib/video-embed'

import {
  getSupabaseBrowser,
} from '@/lib/supabase-browser'

type BlockType =
  | 'section'
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'gallery'
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

type GalleryImage = {
  src: string
  alt: string
  caption: string
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
    case 'section':
      return {
        id,
        block_type: type,
        block_order: order,
        content: {
          title: '',
          author: '',
          author_url: '',
          description: '',
        },
      }

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
    
    case 'gallery':
      return {
        id,
        block_type: type,
        block_order: order,
        content: {
          images: [],
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
  
      const sectionGroups =
    useMemo(() => {
      const groups: {
        sectionIndex: number
        section: EditableGuideBlock
        children: {
          block: EditableGuideBlock
          index: number
        }[]
      }[] = []

      let currentGroup:
        | (typeof groups)[number]
        | null = null

      blocks.forEach(
        (block, index) => {
          if (
            block.block_type ===
            'section'
          ) {
            currentGroup = {
              sectionIndex:
                index,
              section:
                block,
              children: [],
            }

            groups.push(
              currentGroup,
            )

            return
          }

          if (currentGroup) {
            currentGroup.children.push({
              block,
              index,
            })
          }
        },
      )

      return groups
    }, [blocks])

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

    function addBlockToSection(
    sectionIndex: number,
    type: Exclude<
      BlockType,
      'section'
    >,
  ) {
    setBlocks((current) => {
      let insertIndex =
        current.length

      for (
        let i =
          sectionIndex + 1;
        i < current.length;
        i++
      ) {
        if (
          current[i]
            .block_type ===
          'section'
        ) {
          insertIndex = i
          break
        }
      }

      const next = [
        ...current,
      ]

      next.splice(
        insertIndex,
        0,
        createBlock(
          type,
          (insertIndex + 1) *
            10,
        ),
      )

      return normalizeOrders(
        next,
      )
    })

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

  async function uploadGuideImage(
    file: File,
  ) {
    const signResponse =
      await fetch(
        '/api/admin/guides/upload',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }),
        },
      )

    const signData =
      await signResponse
        .json()
        .catch(() => ({}))

    if (!signResponse.ok) {
      throw new Error(
        signData.error ??
          `无法准备上传 ${file.name}`,
      )
    }

    if (
      typeof signData.path !==
        'string' ||
      typeof signData.token !==
        'string' ||
      typeof signData.publicUrl !==
        'string'
    ) {
      throw new Error(
        '服务器没有返回完整的上传信息',
      )
    }

    const supabase =
      getSupabaseBrowser()

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from('guide-images')
        .uploadToSignedUrl(
          signData.path,
          signData.token,
          file,
          {
            contentType:
              file.type,
          },
        )

    if (uploadError) {
      throw new Error(
        uploadError.message ||
          `上传 ${file.name} 失败`,
      )
    }

    return signData.publicUrl
  }

  async function uploadBlockImage(
    file: File,
    blockIndex: number,
  ) {
    setError(null)
    setSuccess(null)

    try {
      const publicUrl =
        await uploadGuideImage(
          file,
        )

      updateBlockContent(
        blockIndex,
        'src',
        publicUrl,
      )

      setSuccess(
        `图片 ${file.name} 上传成功`,
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

  async function uploadGalleryImages(
    files: File[],
    blockIndex: number,
  ) {
    if (files.length === 0) {
      return
    }

    setError(null)
    setSuccess(
      `正在上传 0 / ${files.length} 张图片…`,
    )

    const uploadedImages: {
      src: string
      alt: string
      caption: string
    }[] = []

    const failedFiles: string[] = []

    for (
      let i = 0;
      i < files.length;
      i++
    ) {
      const file = files[i]

      try {
        const publicUrl =
          await uploadGuideImage(
            file,
          )

        uploadedImages.push({
          src: publicUrl,
          alt: '',
          caption: '',
        })

        setSuccess(
          `正在上传 ${i + 1} / ${files.length} 张图片…`,
        )
      } catch (err) {
        console.error(
          `[ADMIN GUIDE GALLERY] ${file.name} upload failed:`,
          err,
        )

        failedFiles.push(
          `${file.name}: ${
            err instanceof Error
              ? err.message
              : '上传失败'
          }`,
        )
      }
    }

    if (
      uploadedImages.length > 0
    ) {
      setBlocks((current) =>
        current.map(
          (block, index) => {
            if (
              index !==
              blockIndex
            ) {
              return block
            }

            const currentImages =
              Array.isArray(
                block.content.images,
              )
                ? block.content.images
                : []

            return {
              ...block,
              content: {
                ...block.content,
                images: [
                  ...currentImages,
                  ...uploadedImages,
                ],
              },
            }
          },
        ),
      )
    }

    if (
      failedFiles.length > 0
    ) {
      setError(
        `有 ${failedFiles.length} 张图片上传失败：${failedFiles.join(
          '；',
        )}`,
      )
    }

    if (
      uploadedImages.length > 0
    ) {
      setSuccess(
        `成功上传 ${uploadedImages.length} / ${files.length} 张图片`,
      )
    } else {
      setSuccess(null)
    }
  }

    function updateGalleryImage(
    blockIndex: number,
    imageIndex: number,
    key: keyof GalleryImage,
    value: string,
  ) {
    setBlocks((current) =>
      current.map(
        (block, index) => {
          if (
            index !== blockIndex
          ) {
            return block
          }

          const images =
            Array.isArray(
              block.content.images,
            )
              ? [
                  ...block.content.images,
                ] as GalleryImage[]
              : []

          images[imageIndex] = {
            ...images[imageIndex],
            [key]: value,
          }

          return {
            ...block,
            content: {
              ...block.content,
              images,
            },
          }
        },
      ),
    )

    setSuccess(null)
  }

  function removeGalleryImage(
    blockIndex: number,
    imageIndex: number,
  ) {
    setBlocks((current) =>
      current.map(
        (block, index) => {
          if (
            index !== blockIndex
          ) {
            return block
          }

          const images =
            Array.isArray(
              block.content.images,
            )
              ? (
                  block.content.images as GalleryImage[]
                ).filter(
                  (_, index) =>
                    index !==
                    imageIndex,
                )
              : []

          return {
            ...block,
            content: {
              ...block.content,
              images,
            },
          }
        },
      ),
    )

    setSuccess(null)
  }

  function moveGalleryImage(
    blockIndex: number,
    imageIndex: number,
    direction: 'left' | 'right',
  ) {
    setBlocks((current) =>
      current.map(
        (block, index) => {
          if (
            index !== blockIndex
          ) {
            return block
          }

          const images =
            Array.isArray(
              block.content.images,
            )
              ? [
                  ...block.content.images,
                ] as GalleryImage[]
              : []

          const targetIndex =
            direction === 'left'
              ? imageIndex - 1
              : imageIndex + 1

          if (
            targetIndex < 0 ||
            targetIndex >=
              images.length
          ) {
            return block
          }

          const currentImage =
            images[imageIndex]

          images[imageIndex] =
            images[targetIndex]

          images[targetIndex] =
            currentImage

          return {
            ...block,
            content: {
              ...block.content,
              images,
            },
          }
        },
      ),
    )

    setSuccess(null)
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
          label="新建正文"
          onClick={() =>
            addBlock('section')
          }
        />
      </div>

      {blocks.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">
          还没有正文内容。
          <br />
          点击上方「新建正文」开始添加第一篇正文。
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {sectionGroups.map(
            (group, groupIndex) => (
              <div
                key={group.section.id}
                className="overflow-hidden rounded-2xl border border-border bg-background"
              >
                <div className="border-b border-border bg-muted/20 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                        正文 {groupIndex + 1}
                      </span>

                      <span className="text-sm font-medium">
                        {typeof group.section.content.title === 'string' &&
                        group.section.content.title
                          ? group.section.content.title
                          : '未命名正文'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <SmallButton
                        disabled={group.sectionIndex === 0}
                        onClick={() =>
                          moveBlock(
                            group.sectionIndex,
                            'up',
                          )
                        }
                      >
                        上移
                      </SmallButton>

                      <SmallButton
                        disabled={
                          group.sectionIndex ===
                          blocks.length - 1
                        }
                        onClick={() =>
                          moveBlock(
                            group.sectionIndex,
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
                            group.sectionIndex,
                          )
                        }
                        className="rounded-full border border-destructive/30 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/5"
                      >
                        删除正文
                      </button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <BlockEditorFields
                      block={group.section}
                      index={group.sectionIndex}
                      updateBlockContent={updateBlockContent}
                      uploadBlockImage={uploadBlockImage}
                      uploadGalleryImages={uploadGalleryImages}
                      updateGalleryImage={updateGalleryImage}
                      removeGalleryImage={removeGalleryImage}
                      moveGalleryImage={moveGalleryImage}
                      updateListItem={updateListItem}
                      addListItem={addListItem}
                      removeListItem={removeListItem}
                    />
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-medium">
                        正文内容
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        下面添加的标题、段落、图片、多图组、列表、提示框和视频都只属于这一篇正文。
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <BlockAddButton
                        label="标题"
                        onClick={() =>
                          addBlockToSection(
                            group.sectionIndex,
                            'heading',
                          )
                        }
                      />

                      <BlockAddButton
                        label="段落"
                        onClick={() =>
                          addBlockToSection(
                            group.sectionIndex,
                            'paragraph',
                          )
                        }
                      />

                      <BlockAddButton
                        label="图片"
                        onClick={() =>
                          addBlockToSection(
                            group.sectionIndex,
                            'image',
                          )
                        }
                      />

                      <BlockAddButton
                        label="多图组"
                        onClick={() =>
                          addBlockToSection(
                            group.sectionIndex,
                            'gallery',
                          )
                        }
                      />

                      <BlockAddButton
                        label="列表"
                        onClick={() =>
                          addBlockToSection(
                            group.sectionIndex,
                            'list',
                          )
                        }
                      />

                      <BlockAddButton
                        label="提示框"
                        onClick={() =>
                          addBlockToSection(
                            group.sectionIndex,
                            'callout',
                          )
                        }
                      />

                      <BlockAddButton
                        label="视频"
                        onClick={() =>
                          addBlockToSection(
                            group.sectionIndex,
                            'video',
                          )
                        }
                      />
                    </div>
                  </div>

                  {group.children.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
                      这篇正文还没有内容。
                      <br />
                      使用上方按钮添加标题、段落、图片或视频。
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {group.children.map(
                        ({ block, index }, childIndex) => (
                          <div
                            key={block.id}
                            className="rounded-2xl border border-border bg-card p-5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                              <div className="flex items-center gap-3">
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                                  {childIndex + 1}
                                </span>

                                <span className="text-sm font-medium">
                                  {getBlockLabel(
                                    block.block_type,
                                  )}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <SmallButton
                                  disabled={childIndex === 0}
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
                                    childIndex ===
                                    group.children.length - 1
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
                                    removeBlock(index)
                                  }
                                  className="rounded-full border border-destructive/30 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/5"
                                >
                                  删除
                                </button>
                              </div>
                            </div>

                            <div className="mt-5">
                              <BlockEditorFields
                                block={block}
                                index={index}
                                updateBlockContent={updateBlockContent}
                                uploadBlockImage={uploadBlockImage}
                                uploadGalleryImages={uploadGalleryImages}
                                updateGalleryImage={updateGalleryImage}
                                removeGalleryImage={removeGalleryImage}
                                moveGalleryImage={moveGalleryImage}
                                updateListItem={updateListItem}
                                addListItem={addListItem}
                                removeListItem={removeListItem}
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
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
    case 'section':
      return '正文'

    case 'heading':
      return '标题'

    case 'paragraph':
      return '段落'

    case 'image':
      return '图片'

    case 'gallery':
      return '多图组'

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
    uploadGalleryImages: (
    files: File[],
    blockIndex: number,
  ) => Promise<void>

  updateGalleryImage: (
    blockIndex: number,
    imageIndex: number,
    key: keyof GalleryImage,
    value: string,
  ) => void

  removeGalleryImage: (
    blockIndex: number,
    imageIndex: number,
  ) => void

  moveGalleryImage: (
    blockIndex: number,
    imageIndex: number,
    direction: 'left' | 'right',
  ) => void
}

function BlockEditorFields({
  block,
  index,
  updateBlockContent,
  uploadBlockImage,
  uploadGalleryImages,
  updateGalleryImage,
  removeGalleryImage,
  moveGalleryImage,
  updateListItem,
  addListItem,
  removeListItem,
}: FieldProps) {

  const content =
    block.content ?? {}

    if (
    block.block_type ===
    'section'
  ) {
    return (
      <div className="grid gap-5">
        <div className="rounded-2xl border border-primary/20 bg-primary/3 p-5">
          <div className="mb-5">
            <span className="font-display text-[0.6rem] tracking-[0.28em] text-primary">
              ARTICLE SECTION
            </span>

            <h3 className="mt-2 text-base font-medium">
              正文信息
            </h3>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              从这里开始视为一篇新的独立正文。后续的段落、图片组、列表、提示框和视频，都属于这篇正文，直到下一个「正文」区块出现。
            </p>
          </div>

          <div className="grid gap-5">
            <div>
              <label className="text-sm font-medium">
                正文标题
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
                placeholder="例如：Checkmate 死局行政机库开启攻略"
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">
                  作者
                </label>

                <input
                  value={
                    typeof content.author ===
                    'string'
                      ? content.author
                      : ''
                  }
                  onChange={(e) =>
                    updateBlockContent(
                      index,
                      'author',
                      e.target.value,
                    )
                  }
                  placeholder="例如：Furysoulfy"
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  作者主页链接
                </label>

                <input
                  value={
                    typeof content.author_url ===
                    'string'
                      ? content.author_url
                      : ''
                  }
                  onChange={(e) =>
                    updateBlockContent(
                      index,
                      'author_url',
                      e.target.value,
                    )
                  }
                  placeholder="/profile/xxx 或外部链接"
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">
                正文简介
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  可选
                </span>
              </label>

              <textarea
                rows={3}
                value={
                  typeof content.description ===
                  'string'
                    ? content.description
                    : ''
                }
                onChange={(e) =>
                  updateBlockContent(
                    index,
                    'description',
                    e.target.value,
                  )
                }
                placeholder="简单介绍这篇攻略的内容、路线或作者说明……"
                className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

    if (
    block.block_type ===
    'gallery'
  ) {
    const images =
      Array.isArray(
        content.images,
      )
        ? (
            content.images as GalleryImage[]
          )
        : []

    return (
      <div className="grid gap-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-medium">
              多图组
            </h4>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              一次可以选择多张图片。
              前台将作为同一个图片组左右切换显示。
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              当前 {images.length} 张图片
            </p>
          </div>

          <label className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary">
            + 批量添加图片

            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const files =
                  Array.from(
                    e.target.files ??
                      [],
                  )

                if (
                  files.length >
                  0
                ) {
                  uploadGalleryImages(
                    files,
                    index,
                  )
                }

                e.target.value =
                  ''
              }}
            />
          </label>
        </div>

        {images.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              这个图片组还没有图片
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              点击「批量添加图片」可以一次选择多张截图。
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map(
              (
                image,
                imageIndex,
              ) => (
                <div
                  key={`${image.src}-${imageIndex}`}
                  className="overflow-hidden rounded-2xl border border-border bg-background"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <img
                      src={
                        image.src
                      }
                      alt={
                        image.alt ||
                        `图片 ${
                          imageIndex +
                          1
                        }`
                      }
                      className="size-full object-cover"
                    />

                    <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                      {imageIndex +
                        1}{' '}
                      /{' '}
                      {images.length}
                    </div>
                  </div>

                  <div className="grid gap-3 p-4">
                    <div>
                      <label className="text-xs font-medium">
                        Alt
                      </label>

                      <input
                        value={
                          image.alt ??
                          ''
                        }
                        onChange={(e) =>
                          updateGalleryImage(
                            index,
                            imageIndex,
                            'alt',
                            e.target
                              .value,
                          )
                        }
                        placeholder="图片内容说明"
                        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium">
                        图片说明
                      </label>

                      <input
                        value={
                          image.caption ??
                          ''
                        }
                        onChange={(e) =>
                          updateGalleryImage(
                            index,
                            imageIndex,
                            'caption',
                            e.target
                              .value,
                          )
                        }
                        placeholder="可选"
                        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                      <div className="flex gap-2">
                        <SmallButton
                          disabled={
                            imageIndex ===
                            0
                          }
                          onClick={() =>
                            moveGalleryImage(
                              index,
                              imageIndex,
                              'left',
                            )
                          }
                        >
                          ←
                        </SmallButton>

                        <SmallButton
                          disabled={
                            imageIndex ===
                            images.length -
                              1
                          }
                          onClick={() =>
                            moveGalleryImage(
                              index,
                              imageIndex,
                              'right',
                            )
                          }
                        >
                          →
                        </SmallButton>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeGalleryImage(
                            index,
                            imageIndex,
                          )
                        }
                        className="rounded-full border border-destructive/30 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/5"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    )
  }

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
  const url =
    typeof content.url ===
    'string'
      ? content.url
      : ''

  const video =
    getVideoEmbedUrl(
      url,
    )

  return (
    <div className="grid gap-4">
      <div>
        <label className="text-sm font-medium">
          视频链接
        </label>

        <input
          value={url}
          onChange={(e) =>
            updateBlockContent(
              index,
              'url',
              e.target.value,
            )
          }
          placeholder="直接粘贴 Bilibili 或 YouTube 视频链接"
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
        />

        <p className="mt-2 text-xs text-muted-foreground">
          支持 Bilibili、
          YouTube 和 youtu.be
          普通分享链接，无需手动填写
          iframe 地址。
        </p>
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

      {url && !video && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-600">
          暂时无法识别这个视频链接。
          请使用 Bilibili 或
          YouTube 视频地址。
        </div>
      )}

      {video && (
        <div className="overflow-hidden rounded-2xl border border-border bg-black">
          <div className="aspect-video">
            <iframe
              src={
                video.embedUrl
              }
              title={
                typeof content.title ===
                'string' &&
                content.title
                  ? content.title
                  : '视频预览'
              }
              className="h-full w-full"
              allow="fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}
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