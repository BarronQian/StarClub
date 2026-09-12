import type { Metadata } from 'next'
import { Reveal } from '@/components/reveal'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { VerseLocalTimeTool } from '@/components/tools/verse-local-time-tool'

export const metadata: Metadata = {
  title: 'Verse Local Time · 星际酒馆 StarClub',
  description:
    '将一个活动时间同时转换为北京、美西、美东、UTC、伦敦、中欧、东京、悉尼等多个时区，方便全球华人玩家协调进入维尔斯（the Verse）的时间。',
}

const META = ['8 TIME ZONES', 'DST AWARE', 'GLOBAL CITIZENS']

export default function VerseTimePage() {
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
              { label: 'Verse Local Time' },
            ]}
          />
          <Reveal className="mt-7 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="font-display text-[0.6rem] tracking-[0.34em] text-primary">
                  VERSE LOCAL TIME
                </span>
                <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
                <span className="text-[0.6rem] tracking-[0.3em] text-muted-foreground uppercase">
                  Global Timezone Converter
                </span>
              </div>
              <h1 className="max-w-2xl font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
                维尔斯本地时间
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                地球上的时区各不相同，但进入维尔斯（the Verse）的那一刻，大家共享同一个坐标。
                <br className="hidden sm:block" />
                选择一个时间与你所在的坐标时区，一次性换算成全球酒友常用的本地时间。
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
          <VerseLocalTimeTool />
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-14 lg:px-10 lg:pt-20">
        <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
          换算结果会自动处理夏令时差异。标记为&ldquo;本地&rdquo;的卡片对应你选择的坐标时区。也可以直接复制 Discord 时间戳标签，粘贴到消息中后自动显示为每位读者本地时区的时间。
        </p>
      </section>
    </div>
  )
}
