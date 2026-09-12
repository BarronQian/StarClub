'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

function formatUEC(value: number): string {
  return `${Math.round(value).toLocaleString('en-US')} aUEC`
}

const SHIP_PRESETS = [
  { name: '本手 · 100i', scu: 4 },
  { name: '自由客 · Freelancer', scu: 66 },
  { name: '毛虫 · Caterpillar', scu: 576 },
  { name: '大力神 · C2', scu: 696 },
  { name: '船体 C · Hull C', scu: 4608 },
]

export function CargoProfitTool() {
  const [capacity, setCapacity] = useState('696')
  const [buyPrice, setBuyPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [capital, setCapital] = useState('')

  const capacityNum = Number(capacity)
  const buyNum = Number(buyPrice)
  const sellNum = Number(sellPrice)

  const capacityInvalid = capacity !== '' && (!Number.isFinite(capacityNum) || capacityNum <= 0)
  const buyInvalid = buyPrice !== '' && (!Number.isFinite(buyNum) || buyNum <= 0)
  const sellInvalid = sellPrice !== '' && (!Number.isFinite(sellNum) || sellNum < 0)

  const result = useMemo(() => {
    const cap = Number(capacity)
    const buy = Number(buyPrice)
    const sell = Number(sellPrice)
    const budget = capital ? Number(capital) : null

    if (!Number.isFinite(cap) || cap <= 0) return null
    if (!Number.isFinite(buy) || buy <= 0) return null
    if (!Number.isFinite(sell) || sell < 0) return null

    const affordableScu = budget !== null && budget >= 0 ? Math.floor(budget / buy) : cap
    const maxScu = Math.max(0, Math.min(cap, affordableScu))

    const investment = maxScu * buy
    const revenue = maxScu * sell
    const profit = revenue - investment
    const roi = investment > 0 ? (profit / investment) * 100 : 0

    return { maxScu, investment, revenue, profit, roi }
  }, [capacity, buyPrice, sellPrice, capital])

  const inputClass = (invalid: boolean) =>
    cn(
      'h-11 w-full border bg-background px-3 text-sm tabular-nums text-foreground outline-none transition-colors placeholder:text-muted-foreground/50',
      invalid
        ? 'border-destructive focus-visible:border-destructive'
        : 'border-border focus-visible:border-primary',
    )

  return (
    <div className="flex flex-col gap-6">
      {/* 输入面板 */}
      <div className="corner-cut flex flex-col gap-6 border border-border bg-card px-6 py-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-2">
            <span className="text-[0.58rem] tracking-[0.26em] text-muted-foreground uppercase">
              货舱容量 (SCU)
            </span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className={inputClass(capacityInvalid)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[0.58rem] tracking-[0.26em] text-muted-foreground uppercase">
              买入价 (aUEC / SCU)
            </span>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="例如 12.5"
              className={inputClass(buyInvalid)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[0.58rem] tracking-[0.26em] text-muted-foreground uppercase">
              卖出价 (aUEC / SCU)
            </span>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="例如 18.2"
              className={inputClass(sellInvalid)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[0.58rem] tracking-[0.26em] text-muted-foreground uppercase">
              可用资金（可选）
            </span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              placeholder="留空表示装满货舱"
              className={inputClass(false)}
            />
          </label>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-border pt-5">
          <span className="text-[0.55rem] tracking-[0.24em] text-muted-foreground uppercase">
            常见货船容量
          </span>
          <div className="flex flex-wrap gap-2">
            {SHIP_PRESETS.map((ship) => (
              <button
                key={ship.name}
                type="button"
                onClick={() => setCapacity(String(ship.scu))}
                className={cn(
                  'pill border px-3 py-1.5 font-display text-[0.6rem] tracking-[0.14em] transition-colors',
                  Number(capacity) === ship.scu
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                {ship.name} · {ship.scu} SCU
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 结果面板 */}
      {result ? (
        <div className="flex flex-col gap-4 sm:flex-row">
          <dl
            className={cn(
              'corner-cut flex flex-1 flex-col gap-5 border bg-card px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8',
              result.profit >= 0 ? 'border-primary/50' : 'border-destructive/50',
            )}
          >
            <div className="flex flex-col gap-1.5">
              <dt className="text-[0.58rem] tracking-[0.26em] text-muted-foreground uppercase">
                预计净利润
              </dt>
              <dd
                className={cn(
                  'font-display text-4xl tabular-nums tracking-tight sm:text-5xl',
                  result.profit >= 0 ? 'text-primary' : 'text-destructive',
                )}
              >
                {formatUEC(result.profit)}
              </dd>
            </div>
            <div className="flex flex-col gap-1.5 sm:items-end">
              <dt className="text-[0.58rem] tracking-[0.26em] text-muted-foreground uppercase">
                投资回报率
              </dt>
              <dd
                className={cn(
                  'font-display text-4xl tabular-nums tracking-tight sm:text-5xl',
                  result.roi >= 0 ? 'text-primary' : 'text-destructive',
                )}
              >
                {result.roi.toFixed(1)}%
              </dd>
            </div>
          </dl>

          <dl className="corner-cut grid flex-1 grid-cols-3 gap-6 border border-border bg-card px-6 py-6 lg:px-8">
            <div className="flex flex-col gap-1.5">
              <dt className="text-[0.55rem] tracking-[0.24em] text-muted-foreground uppercase">
                可购入
              </dt>
              <dd className="font-display text-lg tabular-nums tracking-tight text-foreground">
                {result.maxScu} SCU
              </dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt className="text-[0.55rem] tracking-[0.24em] text-muted-foreground uppercase">
                投入成本
              </dt>
              <dd className="font-display text-lg tabular-nums tracking-tight text-foreground">
                {formatUEC(result.investment)}
              </dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt className="text-[0.55rem] tracking-[0.24em] text-muted-foreground uppercase">
                预计收入
              </dt>
              <dd className="font-display text-lg tabular-nums tracking-tight text-foreground">
                {formatUEC(result.revenue)}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="corner-cut border border-border bg-card px-6 py-16 text-center lg:px-8">
          <p className="text-sm text-muted-foreground">
            请输入货舱容量、买入价与卖出价以计算利润。
          </p>
        </div>
      )}
    </div>
  )
}
