import { Users, Trophy, BookOpen, Globe2 } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'

const PILLARS = [
  {
    icon: Users,
    title: '自由开放',
    desc: '去舰队化的开放社区环境，自由交流、组队与互助，不设组织门槛与阵营限制。',
  },
  {
    icon: Trophy,
    title: '多样活动',
    desc: '定期举办竞技赛事、集体行动与特色社区活动，让不同玩法的玩家都能参与其中。',
  },
  {
    icon: BookOpen,
    title: '资讯攻略',
    desc: '同步《星际公民》最新资讯与社区动态，持续分享中文攻略、教程与实用游戏资料。',
  },
  {
    icon: Globe2,
    title: '全球社区',
    desc: '连接北美、亚洲、欧洲、澳洲等多个时区的华人玩家，随时找到同行的伙伴。',
  },
]

export function About() {
  return (
    <section id="about" className="relative overflow-hidden py-20 lg:py-32">
      <div className="site-container">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 xl:gap-20 2xl:gap-24">
          <div>
            <SectionHeading
              index="01"
              eyebrow="About StarClub"
              title="海外华人玩家的避风港，全球华人玩家的大家园。"
            />

            <Reveal delay={80} className="mt-6 flex flex-col gap-4">
              <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                星际酒馆诞生于《Star Citizen》早期开发阶段，由一群热爱太空与自由探索的华人玩家相聚而成，如今已成长为面向全球华人的独立社区。
              </p>
              <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                我们组织编队飞行、PvP / FPS 赛事、萌新教学与探索远征，坚持自由、平等、互助，不隶属任何势力，也不过度军事化管理。
              </p>
            </Reveal>

            <Reveal delay={160} className="mt-6 flex flex-col gap-4">
              <div className="glass corner-cut border border-border p-6">
                <p className="font-display text-[0.62rem] tracking-[0.32em] text-primary">
                  COMMUNITY MANIFESTO
                </p>
                <p className="mt-4 text-sm leading-relaxed text-foreground/85">
                  「不是所有人都能找到这里。自由的人，自然会相遇。」
                </p>
                <p className="mt-4 text-xs tracking-[0.2em] text-muted-foreground">
                  — 星际酒馆
                </p>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3 text-[0.62rem] tracking-[0.26em] text-muted-foreground">
                <span>北美 / 亚洲 / 欧洲/澳洲/南美等地区时区</span>
                <span>7 × 24 值守</span>
                <span>非付费门槛</span>
              </div>
            </Reveal>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
            {PILLARS.map((pillar, i) => (
              <Reveal
                key={pillar.title}
                delay={i * 110}
                className="group glass corner-cut relative border border-border p-6 transition-colors hover:border-primary/50 lg:p-7 xl:p-8"
              >
                <span
                  aria-hidden="true"
                  className="absolute right-5 top-5 font-display text-[0.6rem] tracking-[0.3em] text-muted-foreground/60"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <pillar.icon
                  className="size-6 text-primary transition-transform duration-500 group-hover:-translate-y-0.5"
                  strokeWidth={1.4}
                />
                <h3 className="mt-6 text-lg font-medium text-foreground">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {pillar.desc}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
