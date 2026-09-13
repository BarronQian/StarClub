import type { Metadata } from 'next'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { Reveal } from '@/components/reveal'

export const metadata: Metadata = {
  title: '合作组织 | 星际酒馆 StarClub',
  description:
    '星际酒馆 StarClub 的社区合作伙伴与友好组织。',
}

const PARTNERS = [
  {
    name: 'Kitsune 泛星际报团队',
    logo: '/images/partners/kitsune.png',
    description: '星际公民中文社区攻略内容创作团队',
    href: 'https://kitsuneint.com',
  },
]

export default function PartnersPage() {
  return (
    <div className="pb-24 lg:pb-32">
      <section className="relative border-b border-border">
        <div
          aria-hidden="true"
          className="hud-grid absolute inset-0 -z-10 opacity-70"
        />

        <div className="site-container py-16 lg:py-24">
          <ArchiveBreadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '合作组织' },
            ]}
          />

          <Reveal className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="font-display text-[0.65rem] tracking-[0.4em] text-primary">
                PARTNERS
              </span>

              <span
                className="h-px w-10 bg-primary/40"
                aria-hidden="true"
              />

              <span className="text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
                Community Partners
              </span>
            </div>

            <h1 className="max-w-3xl font-display text-4xl leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
              合作组织
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              与星际酒馆保持长期交流、内容合作与社区互动的伙伴。
            </p>
          </Reveal>
        </div>
      </section>

<section className="site-container pt-16 lg:pt-24">
    <Reveal>
    <div className="border-b border-border pb-14 lg:pb-18">
      <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
        <div>
          <span className="font-display text-[0.65rem] tracking-[0.3em] text-primary">
            COOPERATIVE ORGANIZATIONS
          </span>

          <h2 className="mt-3 font-display text-2xl tracking-tight sm:text-3xl">
            合作组织
          </h2>

          <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
            与星际酒馆保持长期交流、内容合作与社区互动的伙伴。
          </p>
        </div>

          <div className="flex flex-wrap items-center gap-12 lg:gap-16">
            {PARTNERS.map((partner) => (
              <a
                key={partner.name}
                href={partner.href}
                target="_blank"
                rel="noopener noreferrer"
                title={partner.name}
                className="group relative flex min-h-45 items-center justify-center px-10"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-auto max-h-36 w-auto max-w-90 object-contain
                    drop-shadow-[0_10px_10px_rgba(255,255,255,0.9)]
                    transition-all duration-300 ease-out
                    group-hover:-translate-y-1.5
                    group-hover:scale-110
                    group-hover:drop-shadow-[0_24px_38px_rgba(76,29,149,0.24)]"
                />

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-24 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-r from-indigo-400/10 via-purple-400/10 to-red-400/10 blur-3xl transition-all duration-300 group-hover:h-28 group-hover:w-64 group-hover:opacity-100"
                />
              </a>
            ))}
          </div>
      </div>
    </div>
  </Reveal>
  
    <div className="mt-16 grid gap-12 lg:mt-20 lg:grid-cols-[0.8fr_1.2fr]">
    <div>
      <span className="font-display text-[0.65rem] tracking-[0.3em] text-primary">
        WORK WITH STARCLUB
      </span>

      <h2 className="mt-3 font-display text-2xl tracking-tight sm:text-3xl">
        开放社区合作
      </h2>

      <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
        星际酒馆欢迎来自《星际公民》中文社区的玩家团体、内容创作者、
        社区项目及其他志同道合的伙伴与我们建立交流与合作。
      </p>
    </div>

    <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
      {[
        {
          number: '01',
          title: '联合活动',
          en: 'COMMUNITY EVENTS',
          description: '共同策划赛事、聚会、游戏内活动及其他社区企划。',
        },
        {
          number: '02',
          title: '内容合作',
          en: 'CONTENT',
          description: '攻略、视频、摄影、资讯及其他社区内容的交流与合作。',
        },
        {
          number: '03',
          title: '社区交流',
          en: 'COMMUNITY',
          description: '与其他友好玩家社区建立长期交流与互助关系。',
        },
        {
          number: '04',
          title: '其他合作',
          en: 'OTHER',
          description: '如果你有新的想法，也欢迎直接联系我们讨论。',
        },
      ].map((item) => (
        <div key={item.number} className="bg-background p-7 lg:p-8">
          <div className="flex items-center justify-between">
            <span className="font-display text-xs text-primary">
              {item.number}
            </span>

            <span className="font-display text-[0.55rem] tracking-[0.2em] text-muted-foreground">
              {item.en}
            </span>
          </div>

          <h3 className="mt-8 font-display text-lg font-medium">
            {item.title}
          </h3>

          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  </div>

  <div className="mt-20 border-y border-border py-12 sm:flex sm:items-center sm:justify-between">
    <div>
      <span className="font-display text-[0.6rem] tracking-[0.3em] text-primary">
        CONTACT
      </span>

      <h2 className="mt-3 font-display text-xl font-medium sm:text-2xl">
        想和星际酒馆合作？
      </h2>

      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        欢迎通过 Discord 私信联系
        <span className="mx-1 font-medium text-foreground">
          姑蔑好人 · GuMieHaoRen
        </span>
        沟通合作事宜。
      </p>
    </div>

    <a
      href="https://discord.gg/starlclub"
      target="_blank"
      rel="noopener noreferrer"
      className="corner-cut mt-6 inline-flex items-center justify-center border border-foreground bg-foreground px-6 py-3 font-display text-[0.7rem] font-medium tracking-[0.08em] text-background transition-all duration-300 hover:-translate-y-0.5 hover:opacity-85 sm:mt-0"
    >
      前往 Discord
    </a>
  </div>
</section>
    </div>
  )
}