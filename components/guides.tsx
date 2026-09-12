import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'

const GUIDES = [
  {
    cat: '新人起飞',
    title: '落地第一小时：从租机到第一笔货运收益',
    read: '8 分钟',
    level: '入门',
  },
  {
    cat: '飞行操控',
    title: '解耦飞行与漂移入门：键位配置与手感调校',
    read: '12 分钟',
    level: '入门',
  },
  {
    cat: '工业采矿',
    title: '宝石识别速查表与激光功率配比实测',
    read: '15 分钟',
    level: '进阶',
  },
  {
    cat: '赏金任务',
    title: 'ERT 单人打法：目标优先级与撤退时机',
    read: '18 分钟',
    level: '硬核',
  },
  {
    cat: '舰船选购',
    title: '2954 版本性价比舰船榜：按玩法拆解',
    read: '20 分钟',
    level: '通用',
  },
  {
    cat: '故障排查',
    title: '常见卡死、掉线与账号回档自救流程',
    read: '6 分钟',
    level: '通用',
  },
]

export function Guides() {
  return (
    <section id="guides" className="relative py-20 lg:py-32">
      <div aria-hidden="true" className="hud-grid absolute inset-0 opacity-40" />
      <div className="site-container relative">
        <SectionHeading
          index="03"
          eyebrow="Chinese Guides"
          title="中文攻略库"
          description="由社区飞行员实测撰写并按版本更新，覆盖从首次落地到硬核赏金的完整路线。"
        />

        <ul className="mt-12 border-t border-border">
          {GUIDES.map((guide, i) => (
            <Reveal
              key={guide.title}
              as="li"
              delay={i * 70}
              className="border-b border-border"
            >
              <a
                href="#join"
                className="group flex flex-col gap-3 py-6 transition-colors sm:flex-row sm:items-center sm:gap-8 sm:py-7"
              >
                <span className="font-display text-[0.62rem] tracking-[0.3em] text-primary/70 sm:w-10">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[0.65rem] tracking-[0.26em] text-muted-foreground sm:w-28">
                  {guide.cat}
                </span>
                <span className="flex-1 text-base leading-snug text-pretty text-foreground transition-colors group-hover:text-primary sm:text-lg">
                  {guide.title}
                </span>
                <span className="flex items-center gap-5 text-[0.68rem] text-muted-foreground">
                  <span className="border border-border px-2 py-0.5 tracking-[0.16em]">
                    {guide.level}
                  </span>
                  <span className="tabular-nums">{guide.read}</span>
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" />
                </span>
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
