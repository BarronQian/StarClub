'use client'

import {
  ShieldCheck,
  UserRoundCheck,
  X,
} from 'lucide-react'

type MarketRsiRequiredDialogProps = {
  open: boolean
  onClose: () => void
  onVerify: () => void
}

export function MarketRsiRequiredDialog({
  open,
  onClose,
  onVerify,
}: MarketRsiRequiredDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-140 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#37332f] sm:p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground dark:hover:bg-white/8"
        >
          <X className="size-4" />
        </button>

        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#a66700]/10">
          <ShieldCheck className="size-5 text-[#a66700]" />
        </div>

        <h2 className="mt-5 text-xl font-semibold tracking-tight">
          完成游戏 ID 认证
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          为保障星际酒馆玩家市场的交易安全，
          发布商品或进行玩家交易前，需要完成
          Star Citizen Handle 认证。
        </p>

        <div className="mt-5 rounded-2xl border border-border bg-[#f7f7f5] px-4 py-3.5 dark:border-white/8 dark:bg-[#302d29]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Discord 账号
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              已登录
            </span>
          </div>

          <div className="my-3 border-t border-border dark:border-white/8" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Star Citizen 游戏 ID
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <span className="size-1.5 rounded-full bg-amber-500" />
              尚未认证
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onVerify}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-neutral-800 active:scale-[0.99] dark:bg-white dark:text-[#2b2825] dark:hover:bg-white/90"
        >
          <UserRoundCheck className="size-4" />
          立即认证游戏 ID
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-2.5 w-full rounded-xl px-5 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground dark:hover:bg-white/6"
        >
          暂时取消
        </button>
      </div>
    </div>
  )
}