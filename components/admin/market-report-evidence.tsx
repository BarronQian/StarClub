'use client'

import {
  useEffect,
  useState,
} from 'react'

import {
  ImageIcon,
  X,
} from 'lucide-react'

type MarketReportEvidenceProps = {
  url: string | null
}

export function MarketReportEvidence({
  url,
}: MarketReportEvidenceProps) {
  const [
    open,
    setOpen,
  ] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === 'Escape'
      ) {
        setOpen(false)
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    document.body.style.overflow =
      'hidden'

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )

      document.body.style.overflow =
        ''
    }
  }, [open])

  if (!url) {
    return (
      <span className="text-xs text-muted-foreground">
        —
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        <ImageIcon className="size-3.5" />
        查看截图
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          onClick={() =>
            setOpen(false)
          }
        >
          <button
            type="button"
            aria-label="关闭截图"
            onClick={() =>
              setOpen(false)
            }
            className="absolute right-6 top-6 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-5" />
          </button>

          <img
            src={url}
            alt="举报截图证据"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
            className="max-h-[88vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
          />
        </div>
      ) : null}
    </>
  )
}