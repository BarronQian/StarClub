'use client'

import {
  useState,
} from 'react'

import {
  useRouter,
} from 'next/navigation'

import {
  toast,
} from 'sonner'

import {
  Button,
} from '@/components/ui/button'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function MarketDeleteButton({
  listingId,
  title,
}: {
  listingId: string
  title: string
}) {
  const router =
    useRouter()

  const [
    open,
    setOpen,
  ] = useState(false)

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false)

  async function handleDelete() {
    if (isDeleting) {
      return
    }

    setIsDeleting(true)

    try {
      const response =
        await fetch(
          `/api/admin/market/listings/${listingId}`,
          {
            method:
              'DELETE',
          },
        )

      const result =
        await response
          .json()
          .catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.error ||
            '永久删除商单失败',
        )
      }

      toast.success(
        '商单已永久删除',
      )

      setOpen(false)

      router.refresh()
    } catch (error) {
      console.error(
        'Delete market listing error:',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '永久删除商单失败',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="
          border-destructive/30
          text-destructive
          hover:bg-destructive/10
          hover:text-destructive
        "
        onClick={() =>
          setOpen(true)
        }
      >
        永久删除
      </Button>

      <AlertDialog
        open={open}
        onOpenChange={
          setOpen
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              永久删除商单？
            </AlertDialogTitle>

            <AlertDialogDescription>
              确定要永久删除《
              {title}
              》吗？
              该商单以及关联的举报、
              交易申请等数据将被永久删除。
              此操作无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={
                isDeleting
              }
            >
              取消
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(
                event,
              ) => {
                event.preventDefault()

                void handleDelete()
              }}
              disabled={
                isDeleting
              }
              className="
                bg-destructive
                text-white
                hover:bg-destructive/90
              "
            >
              {isDeleting
                ? '删除中...'
                : '确认永久删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}