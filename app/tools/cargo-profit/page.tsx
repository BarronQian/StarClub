import type { Metadata } from 'next'
import { Reveal } from '@/components/reveal'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { CargoProfitTool } from '@/components/tools/cargo-profit-tool'

export const metadata: Metadata = {
  title: '货运利润计算器 · 星际酒馆 StarClub',
  description:
    'Star Citizen 货运利润计算器：输入货舱容量、买入价、卖出价与可用资金，快速估算单次运货的净利润与投资回报率。',
}

const META = ['CARGO RUN', 'PROFIT ESTIMATE', 'ROI CALCULATOR']

export default function CargoProfitPage() {
  return (
    <div className="pb-24 lg:pb-32">
      <section className="relative border-b border-border">
        <div
          aria-hidden="true"
          className="hud-grid absolute inset-0 -z-10 opacity-60"
        />
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-10 lg:py-16">
          <ArchiveBreadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '实用工具', href: '/tools' },
              { label: '货运利润计算器' },
            ]}
          />
          <Reveal className="mt-7 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="font-display text-[0.6rem] tracking-[0.34em] text-primary">
                  TRADE RUN
                </span>
                <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
                <span className="text-[0.6rem] tracking-[0.3em] text-muted-foreground uppercase">
                  Cargo Profit Calculator
                </span>
              </div>
              <h1 className="max-w-2xl font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
                货运利润计算器
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                输入货舱容量、买入价与卖出价，快速估算单次运货的净利润，或直接点选常见货船容量。
                <br className="hidden sm:block" />
                填写可用资金后还会自动计算实际可购入的货物数量。
              </p>
            </div>
            <ul className="flex flex-wrap gap-x-8 gap-y-2 lg:flex-col lg:items-end lg:gap-y-2.5">
              {META.map((item) => (
                <li
                  key={item}
                  className="text-[0.58rem] tracking-[0.26em] text-muted-foreground uppercase"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 pt-10 lg:px-10 lg:pt-14">
        <div
          aria-hidden="true"
          className="hud-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] opacity-40"
        />
        <Reveal>
          <CargoProfitTool />
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-14 lg:px-10 lg:pt-20">
        <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
          价格需自行填写实时行情（例如 UEX Corp 或游戏内 Kiosk 报价）。计算结果不包含运输途中的损耗、税费与其他额外开销，仅供参考。
        </p>
      </section>
    </div>
  )
}
