'use client'

import {
  useState,
} from 'react'

import {
  useRouter,
} from 'next/navigation'

import {
  Loader2,
} from 'lucide-react'

type MarketReportActionsProps = {
  reportId: string
  listingTitle: string
  sellerName: string
  listingClosed: boolean
  sellerMarketBanned: boolean
}

type ReportAction =
  | 'dismiss'
  | 'resolve'
  | 'close_listing'
  | 'market_ban'

export function MarketReportActions({
  reportId,
  listingTitle,
  sellerName,
  listingClosed,
  sellerMarketBanned,
}: MarketReportActionsProps) {
  const router =
    useRouter()

  const [
    loadingAction,
    setLoadingAction,
  ] =
    useState<ReportAction | null>(
      null,
    )

  const [
    error,
    setError,
  ] = useState('')

  async function runAction(
    action: ReportAction,
  ) {
    if (loadingAction) {
      return
    }

    let confirmMessage = ''

    if (
      action ===
      'dismiss'
    ) {
      confirmMessage =
        `确定驳回针对「${listingTitle}」的举报吗？`
    }

    if (
      action ===
      'resolve'
    ) {
      confirmMessage =
        `确定将针对「${listingTitle}」的举报标记为已处理吗？`
    }

    if (
      action ===
      'close_listing'
    ) {
      confirmMessage =
        `确定强制下架「${listingTitle}」吗？\n\n该举报也会自动标记为已处理。`
    }

    if (
      action ===
      'market_ban'
    ) {
      confirmMessage =
        `确定对 ${sellerName} 执行市场封禁吗？\n\n该用户将无法继续使用市场发布等功能，关联交易也会被下架。`
    }

    if (
      !window.confirm(
        confirmMessage,
      )
    ) {
      return
    }

    let note = ''

    if (
      action ===
        'dismiss' ||
      action ===
        'resolve'
    ) {
      note =
        window.prompt(
          '处理备注（可选）：',
          '',
        ) ?? ''

      if (
        note.length >
        2000
      ) {
        setError(
          '处理备注不能超过 2000 个字符',
        )
        return
      }
    }

    let marketBanReason = ''

    if (
      action ===
      'market_ban'
    ) {
      marketBanReason =
        window.prompt(
          '请输入市场封禁原因：',
          '违反星际酒馆市场规则',
        ) ?? ''

      if (
        !marketBanReason.trim()
      ) {
        return
      }

      if (
        marketBanReason.length >
        1000
      ) {
        setError(
          '市场封禁原因不能超过 1000 个字符',
        )
        return
      }
    }

    setError('')
    setLoadingAction(action)

    try {
      const response =
        await fetch(
          `/api/admin/market/reports/${reportId}`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                action,

                note:
                  note.trim(),

                marketBanReason:
                  marketBanReason.trim(),
              }),
          },
        )

      let data: {
        error?: string
      } = {}

      try {
        data =
          await response.json()
      } catch {
        data = {}
      }

      if (!response.ok) {
        throw new Error(
          data.error ??
            '操作失败',
        )
      }

      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '操作失败',
      )
    } finally {
      setLoadingAction(null)
    }
  }

  function isLoading(
    action: ReportAction,
  ) {
    return (
      loadingAction ===
      action
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={
            Boolean(
              loadingAction,
            )
          }
          onClick={() =>
            runAction(
              'dismiss',
            )
          }
          className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          {isLoading(
            'dismiss',
          ) ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : null}

          驳回
        </button>

        <button
          type="button"
          disabled={
            Boolean(
              loadingAction,
            )
          }
          onClick={() =>
            runAction(
              'resolve',
            )
          }
          className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          {isLoading(
            'resolve',
          ) ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : null}

          已处理
        </button>

        {!listingClosed ? (
          <button
            type="button"
            disabled={
              Boolean(
                loadingAction,
              )
            }
            onClick={() =>
              runAction(
                'close_listing',
              )
            }
            className="inline-flex h-8 items-center justify-center rounded-md border border-amber-500/30 bg-background px-3 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/10 disabled:pointer-events-none disabled:opacity-50 dark:text-amber-400"
          >
            {isLoading(
              'close_listing',
            ) ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : null}

            强制下架
          </button>
        ) : null}

        {!sellerMarketBanned ? (
          <button
            type="button"
            disabled={
              Boolean(
                loadingAction,
              )
            }
            onClick={() =>
              runAction(
                'market_ban',
              )
            }
            className="inline-flex h-8 items-center justify-center rounded-md border border-red-500/30 bg-background px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:pointer-events-none disabled:opacity-50 dark:text-red-400"
          >
            {isLoading(
              'market_ban',
            ) ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : null}

            市场封禁
          </button>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md border border-red-500/20 bg-red-500/5 px-3 text-xs text-red-500">
            已市场封禁
          </span>
        )}
      </div>

      {error ? (
        <p className="text-right text-xs text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  )
}