import type { Metadata } from 'next'
import { Reveal } from '@/components/reveal'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { DiscordTimestampTool } from '@/components/tools/discord-timestamp-tool'

export const metadata: Metadata = {
  title: 'Discord 时间戳生成器 · 星际酒馆 StarClub',
  description:
    '快速生成 Discord 动态时间戳标签，自动适配每位读者本地时区，适用于活动公告、开播提醒与跨时区排期。',
}

const META = ['DISCORD MARKUP', 'AUTO TIMEZONE', 'ONE-CLICK COPY']

export default function DiscordTimestampPage() {
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
              { label: 'Discord 时间戳生成器' },
            ]}
          />
          <Reveal className="mt-7 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="font-display text-[0.6rem] tracking-[0.34em] text-primary">
                  TIMESTAMP
                </span>
                <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
                <span className="text-[0.6rem] tracking-[0.3em] text-muted-foreground uppercase">
                  Discord Timestamp Generator
                </span>
              </div>
              <h1 className="max-w-2xl font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
                Discord 时间戳生成器
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                选择一个日期与时间，生成 Discord 动态时间戳标签。
                <br className="hidden sm:block" />
                发布后会自动显示为每位读者本地时区的时间，无需手动换算。
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
          <DiscordTimestampTool />
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-14 lg:px-10 lg:pt-20">
        <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
          将复制的标签（例如 {'<t:1735689600:F>'}）粘贴到 Discord 消息中，发送后会自动渲染为每位读者本地时区对应的时间与格式。
        </p>
      </section>
    </div>
  )
}
