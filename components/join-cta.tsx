import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { DISCORD_URL, ORG_URL, EXTERNAL } from '@/lib/links'

const STEPS = [
  {
    step: '01',
    title: '加入 Discord',
    desc: '进入星际酒馆社区，解锁交流、组队、活动与攻略内容。',
  },
  {
    step: '02',
    title: '完成社区认证',
    desc: '阅读服务器规则并完成认证，设置游戏 ID，方便酒友互相认识与组队。',
  },
  {
    step: '03',
    title: '加入官方 ORG',
    desc: '可选择加入 StarClub 官方 ORG，参与更多社区长期企划与集体活动。',
  },
]

export function JoinCta() {
  return (
    <section
      id="join"
      className="relative overflow-hidden border-t border-border bg-card py-20 lg:py-32"
    >
      <div className="site-container">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center lg:gap-20">
          <div>
            <Reveal className="flex items-center gap-3">
              <span className="h-px w-10 bg-primary/40" aria-hidden="true" />
              <span className="font-display text-[0.62rem] tracking-[0.34em] text-primary">
                05 · JOIN THE CREW
              </span>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="mt-6 font-display text-4xl leading-[1.05] text-balance sm:text-5xl lg:text-6xl">
                酒馆的灯
                <br />
                一直为你亮着
              </h2>
            </Reveal>
            <Reveal delay={170}>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                无论你是刚买下第一艘 Aurora，还是已经指挥过整支舰队，星际酒馆都有一个座位留给你。加入 Discord 即刻上线，或直接提交官方 ORG 申请。
              </p>
            </Reveal>
            <Reveal delay={240} className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <a
                href={DISCORD_URL}
                {...EXTERNAL}
                className="pill group inline-flex items-center justify-center gap-2 bg-primary px-8 py-4 font-display text-xs tracking-[0.22em] text-primary-foreground shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_14px_30px_rgba(0,0,0,0.18)] active:translate-y-0 active:scale-[0.99]"
              >
                加入 DISCORD
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href={ORG_URL}
                {...EXTERNAL}
                className="pill inline-flex items-center justify-center gap-2 border border-input bg-background px-8 py-4 font-display text-xs tracking-[0.22em] text-foreground shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:border-primary hover:text-primary hover:shadow-[0_12px_28px_rgba(0,0,0,0.14)] active:translate-y-0 active:scale-[0.99]"
              >
                加入官方 ORG
              </a>
            </Reveal>
          </div>

          <div className="flex flex-col gap-4">
            <Reveal className="corner-cut relative aspect-video w-full border border-border">
              <Image
                src="/images/group-stairs.jpg"
                alt="星际酒馆成员在空间站自动扶梯上列队合影"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </Reveal>

            <ol className="flex flex-col">
              {STEPS.map((item, i) => (
                <Reveal
                  key={item.step}
                  as="li"
                  delay={i * 130}
                  className="corner-cut border border-border bg-background p-6 not-last:mb-3 lg:p-7"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-display text-sm tracking-[0.24em] text-primary">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="text-base font-medium text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
