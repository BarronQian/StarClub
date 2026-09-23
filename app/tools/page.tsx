import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Timer, Clock, Globe2, Coins } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { PageCompanion } from '@/components/page-companion'
import { CommunityTools } from '@/components/community-tools'

export const metadata: Metadata = {
  title: 'Star Citizen 实用工具',
  description:
    '星际酒馆 StarClub 的 Star Citizen（星际公民）玩家实用工具集，包括行政机库计时器、Discord 时间戳生成器、维尔斯本地时间与货运利润计算器等社区自制在线工具。',
}

const TOOLS = [
  {
    href: '/tools/executive-hangar',
    label: '行政机库计时器',
    en: 'Executive Hangar Timers',
    desc: '派罗 PYAM-EXHANG 行政机库 185 分钟全服同步周期实时倒计时，红灯充能 / 绿灯开启 / 黑区重置一目了然。',
    tag: '实时',
    icon: Timer,
  },
  {
    href: '/tools/discord-timestamp',
    label: 'Discord 时间戳生成器',
    en: 'Discord Timestamp Generator',
    desc: '生成 Discord 动态时间戳标签，发布后自动显示为每位读者本地时区的时间，适合活动公告与开播提醒。',
    tag: '排期',
    icon: Clock,
  },
  {
    href: '/tools/verse-time',
    label: '维尔斯本地时间',
    en: 'Verse Local Time',
    desc: '一次性将活动时间换算为北京、美西、美东、UTC、伦敦等多个时区，方便全球酒友协调进入维尔斯的时间。',
    tag: '时区',
    icon: Globe2,
  },
  {
    href: '/tools/cargo-profit',
    label: '货运利润计算器',
    en: 'Cargo Profit Calculator',
    desc: '输入货舱容量、买入价与卖出价，快速估算单次运货的净利润与投资回报率。',
    tag: '计算',
    icon: Coins,
  },
]

export default function ToolsPage() {
  return (
    <div className="pb-24 lg:pb-32">
      <section className="relative border-b border-border">
        <div
          aria-hidden="true"
          className="hud-grid absolute inset-0 -z-10 opacity-70"
        />
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-24">
          <ArchiveBreadcrumb
            items={[{ label: '首页', href: '/' }, { label: '实用工具' }]}
          />
          <Reveal className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="font-display text-[0.65rem] tracking-[0.4em] text-primary">
                TOOLS
              </span>
              <span className="h-px w-10 bg-primary/40" aria-hidden="true" />
              <span className="text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
                Utilities
              </span>
            </div>
            <h1 className="max-w-3xl font-display text-4xl leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
              实用工具
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              由酒馆成员维护的在线小工具，帮你在星际里少绕路。攻略专区将在稍后加入。
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-16 lg:px-10 lg:pt-24">
        <ul className="grid gap-5 sm:grid-cols-2">
          {TOOLS.map((tool, i) => {
            const Icon = tool.icon
            return (
              <Reveal key={tool.href} delay={i * 90}>
                <li className="h-full">
                  <Link
                    href={tool.href}
                    className="group corner-cut relative flex h-full flex-col gap-6 border border-border bg-card p-6 transition-colors hover:border-primary/50 lg:p-8"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid size-11 shrink-0 place-items-center border border-primary/40 text-primary">
                        <Icon className="size-5" strokeWidth={1.6} />
                      </span>
                      <span className="pill border border-primary/40 px-3 py-1 font-display text-[0.6rem] tracking-[0.28em] text-primary">
                        {tool.tag}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <h2 className="font-display text-2xl tracking-tight text-foreground">
                        {tool.label}
                      </h2>
                      <span className="text-[0.65rem] tracking-[0.3em] text-muted-foreground uppercase">
                        {tool.en}
                      </span>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {tool.desc}
                      </p>
                    </div>
                    <span className="mt-auto flex items-center gap-2 font-display text-[0.68rem] tracking-[0.24em] text-primary">
                      打开工具
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </Link>
                </li>
              </Reveal>
            )
          })}
        </ul>
        <p className="mt-10 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          更多工具与中文攻略正在筹备中，欢迎在 Discord 里告诉我们你想要什么。
        </p>
      </section>

          <CommunityTools />
          
      <PageCompanion companion="walkertian" />
    </div>
  )
}
