import Link from 'next/link'

import {
  Reveal,
} from '@/components/reveal'

import {
  SectionHeading,
} from '@/components/section-heading'

import {
  SponsorTicker,
} from '@/components/sponsor-ticker'

import {
  formatSponsorTotal,
} from '@/lib/sponsors'

import {
  getSponsorsFromDb,
} from '@/lib/sponsors-db'

const ENTRIES = [
  {
    eyebrow:
      'HALL OF SPONSORS',
    title:
      '星际酒馆赞助榜',
    desc:
      '感谢每一位帮助社区持续运营、举办活动并支持奖励计划的酒友。',
    ctaLabel:
      '查看完整赞助榜',
    href:
      '/sponsors',
  },
  {
    eyebrow:
      'HALL OF FAME',
    title:
      '星际酒馆名人堂',
    desc:
      '记录赛事冠军、竞技荣誉与属于酒馆社区的历史时刻。',
    ctaLabel:
      '进入名人堂',
    href:
      '/hall-of-fame',
  },
] as const

function SupportEntry({
  entry,
}: {
  entry:
    (typeof ENTRIES)[number]
}) {
  return (
    <Reveal className="flex flex-col gap-4">
      <span className="font-display text-[0.62rem] tracking-[0.32em] text-primary">
        {entry.eyebrow}
      </span>

      <h3 className="font-display text-xl tracking-tight text-foreground sm:text-2xl">
        {entry.title}
      </h3>

      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        {entry.desc}
      </p>

      <Link
        href={entry.href}
        className="group mt-1 inline-flex w-fit items-center gap-2 rounded-sm text-sm text-foreground transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="border-b border-primary/50 pb-0.5 transition-colors duration-200 group-hover:border-primary">
          {entry.ctaLabel}
        </span>

        <span
          aria-hidden="true"
          className="text-primary transition-transform duration-200 group-hover:translate-x-0.5"
        >
          ↗
        </span>
      </Link>
    </Reveal>
  )
}

export async function CommunitySupport() {
  const sponsors =
    await getSponsorsFromDb()

  const sponsorCount =
    sponsors.length

  const sponsorTotal =
    sponsors.reduce(
      (
        sum,
        sponsor,
      ) =>
        sum +
        sponsor.amount,
      0,
    )

  const HONORS = [
    {
      value:
        formatSponsorTotal(
          sponsorTotal,
        ),
      label:
        '累计赞助',
      en:
        'TOTAL SUPPORT',
    },
    {
      value:
        String(
          sponsorCount,
        ),
      label:
        '社区赞助者',
      en:
        'SPONSORS',
    },
    {
      value:
        '1000+',
      label:
        '社区成员',
      en:
        'MEMBERS',
    },
  ] as const

  return (
    <section
      id="community-support"
      className="relative border-t border-border py-20 lg:py-32"
    >
      <div className="site-container">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <SectionHeading
            index="04"
            eyebrow="Community Support"
            title="让每一次远航，都有人同行。"
            description="感谢每一位支持星际酒馆社区运营、活动、奖励与长期建设的酒友。"
          />

          <Reveal
            delay={140}
            className="grid grid-cols-[1.6fr_1fr_1fr] gap-12 border-t border-border pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10"
          >
            {HONORS.map(
              (
                honor,
              ) => (
                <div
                  key={
                    honor.en
                  }
                  className="flex flex-col gap-2"
                >
                  <span className="font-display whitespace-nowrap text-2xl tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                    {
                      honor.value
                    }
                  </span>

                  <span className="text-xs text-foreground/80 sm:text-sm">
                    {
                      honor.label
                    }
                  </span>

                  <span className="font-display text-[0.55rem] tracking-[0.26em] text-muted-foreground">
                    {
                      honor.en
                    }
                  </span>
                </div>
              ),
            )}
          </Reveal>
        </div>

        <Reveal
          delay={200}
          className="mt-14 lg:mt-20"
        >
          <SponsorTicker
            sponsors={
              sponsors
            }
          />
        </Reveal>

        <div className="mt-14 grid gap-10 border-t border-border pt-12 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-border lg:mt-20 lg:pt-14">
          <div className="sm:pr-10 lg:pr-14">
            <SupportEntry
              entry={
                ENTRIES[0]
              }
            />
          </div>

          <div className="sm:pl-10 lg:pl-14">
            <SupportEntry
              entry={
                ENTRIES[1]
              }
            />
          </div>
        </div>
      </div>
    </section>
  )
}