'use client'

import {
  MoreHorizontal,
  Pencil,
  Trash2,
  VolumeX,
} from 'lucide-react'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

type CommunityPostMenuProps = {
  createdAt: string

  isOwner: boolean
  isAdmin?: boolean

  onEdit?: () => void
  onDelete?: () => void

  onAdminDelete?: () => void
  onMuteUser?: () => void
}

const EDIT_WINDOW_MS =
  48 * 60 * 60 * 1000

export function CommunityPostMenu({
  createdAt,
  isOwner,
  isAdmin = false,
  onEdit,
  onDelete,
  onAdminDelete,
  onMuteUser,
}: CommunityPostMenuProps) {
  const [
    open,
    setOpen,
  ] = useState(false)

  const menuRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const createdTime =
    new Date(
      createdAt,
    ).getTime()

  const canEdit =
    Number.isFinite(
      createdTime,
    ) &&
    Date.now() - createdTime <=
      EDIT_WINDOW_MS

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (
      event: MouseEvent,
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === 'Escape'
      ) {
        setOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handlePointerDown,
    )

    document.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handlePointerDown,
      )

      document.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [open])

  if (
    !isOwner &&
    !isAdmin
  ) {
    return null
  }

  return (
    <div
      ref={menuRef}
      className="relative shrink-0"
    >
      <button
        type="button"
        aria-label="更多操作"
        aria-expanded={open}
        onClick={() => {
          setOpen(
            (current) =>
              !current,
          )
        }}
        className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <MoreHorizontal
          className="size-5"
          strokeWidth={1.8}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-xl border border-border bg-background py-1.5 shadow-xl">

          {isOwner && (
            <>
              <button
                type="button"
                disabled={!canEdit}
                title={
                  canEdit
                    ? '编辑动态'
                    : '仅发布后 48 小时内可编辑'
                }
                onClick={() => {
                  if (!canEdit) {
                    return
                  }

                  setOpen(false)
                  onEdit?.()
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Pencil
                  className="size-4"
                  strokeWidth={1.8}
                />

                <div>
                  <div className="font-medium">
                    编辑动态
                  </div>

                  {!canEdit && (
                    <div className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                      已超过 48 小时
                    </div>
                  )}
                </div>
              </button>

              <div className="mx-3 border-t border-border" />

              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onDelete?.()
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
              >
                <Trash2
                  className="size-4"
                  strokeWidth={1.8}
                />

                删除动态
              </button>
            </>
          )}

          {isAdmin &&
            !isOwner && (
              <>
                <div className="px-4 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  ADMIN
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onAdminDelete?.()
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <Trash2
                    className="size-4"
                    strokeWidth={1.8}
                  />

                  管理员删除动态
                </button>

                <div className="mx-3 border-t border-border" />

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onMuteUser?.()
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
                >
                  <VolumeX
                    className="size-4"
                    strokeWidth={1.8}
                  />

                  禁言用户
                </button>
              </>
            )}

        </div>
      )}
    </div>
  )
}