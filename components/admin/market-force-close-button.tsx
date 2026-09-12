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

export function MarketForceCloseButton({
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
    isClosing,
    setIsClosing,
  ] = useState(false)

  async function handleForceClose() {
    if (isClosing) {
      return
    }

    setIsClosing(true)

    try {
      const response =
        await fetch(
          `/api/admin/market/listings/${listingId}`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              action:
                'force_close',
            }),
          },
        )

      const result =
        await response
          .json()
          .catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.error ||
            '强制下架失败',
        )
      }

      toast.success(
        '商单已强制下架',
      )

      setOpen(false)

      router.refresh()
    } catch (error) {
      console.error(
        'Force close market listing error:',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : '强制下架失败',
      )
    } finally {
      setIsClosing(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() =>
          setOpen(true)
        }
      >
        强制下架
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
              强制下架商单
            </AlertDialogTitle>

            <AlertDialogDescription>
              确定要强制下架《
              {title}
              》吗？
              下架后该商单将停止交易，
              但数据库记录仍会保留。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={
                isClosing
              }
            >
              取消
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(
                event,
              ) => {
                event.preventDefault()

                void handleForceClose()
              }}
              disabled={
                isClosing
              }
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isClosing
                ? '下架中...'
                : '确认下架'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}