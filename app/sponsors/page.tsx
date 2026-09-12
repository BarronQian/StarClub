import type { Metadata } from 'next'
import Image from 'next/image'
import { Diamond } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import {
  SPONSORS,
  formatSponsorAmount,
  formatSponsorTotal,
  getSponsorCount,
  getSponsorTotal,
} from '@/lib/sponsors'

export const metadata: Metadata = {
  title: '赞助榜 | 星际酒馆 StarClub',
  description:
    '星际酒馆 StarClub 赞助榜：感谢每一位支持 Star Citizen 华人玩家社区运营、活动与长期建设的酒友。',
}

export default function SponsorsPage() {
  const total = getSponsorTotal()
  const count = getSponsorCount()

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#0b0906] pb-24 text-[#f2e6cf] lg:pb-32">
      {/* ambient gold glow + emblem watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-168"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(201,162,57,0.22), transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 40% 35% at 8% 90%, rgba(201,162,57,0.08), transparent 70%)',
        }}
      />
      <Image
        src="/images/starclub-logo.png"
        alt=""
        aria-hidden="true"
        width={520}
        height={520}
        className="pointer-events-none absolute left-1/2 top-40 -z-10 h-120 w-120 -translate-x-1/2 select-none opacity-[0.05]"
      />

      <section className="relative">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-5 py-20 text-center lg:px-10 lg:py-28">
          <Reveal>
            <span className="corner-cut inline-block border border-[#c9a239]/30 bg-[#c9a239]/10 px-4 py-1.5 font-display text-[0.6rem] tracking-[0.3em] text-[#e4c766]">
              荣誉墙 · 星际酒馆
            </span>
          </Reveal>
          <Reveal delay={60} className="mt-3">
            <span className="font-display text-[0.65rem] tracking-[0.45em] text-[#c9a239]/70">
              HALL OF SPONSORS
            </span>
          </Reveal>
          <Reveal delay={100} className="mt-6">
            <h1 className="font-display text-4xl leading-tight tracking-tight text-balance text-[#f6ecd4] sm:text-5xl lg:text-6xl">
              星际酒馆赞助榜
            </h1>
          </Reveal>
          <Reveal delay={140} className="mt-5 max-w-xl">
            <p className="text-sm leading-relaxed text-pretty text-[#c9bda0] sm:text-base">
              感谢每一位撑起这片星海的人。
            </p>
          </Reveal>
          <Reveal delay={180} className="mt-8 flex items-center gap-3">
            <span
              className="h-px w-16 bg-[#c9a239]/40"
              aria-hidden="true"
            />
            <Diamond
              className="size-3 text-[#c9a239]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span
              className="h-px w-16 bg-[#c9a239]/40"
              aria-hidden="true"
            />
          </Reveal>

          <Reveal
            delay={220}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-14 gap-y-6"
          >
            <div className="flex flex-col items-center gap-1.5">
              <span className="font-display text-3xl tracking-tight text-[#e4c766] sm:text-4xl">
                {formatSponsorTotal(total)}
              </span>
              <span className="text-xs text-[#c9bda0]">累计赞助</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="font-display text-3xl tracking-tight text-[#e4c766] sm:text-4xl">
                {count}
              </span>
              <span className="text-xs text-[#c9bda0]">位赞助者</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl px-5 pt-4 lg:px-10 lg:pt-8">
        <Reveal className="mb-6 text-xs tracking-widest text-[#c9bda0]/70">
          共 <span className="text-[#e4c766]">{count}</span> 位赞助者
        </Reveal>
        <ol className="flex flex-col gap-3">
          {SPONSORS.map((sponsor, i) => {
            const isTop = sponsor.rank === 1
            return (
              <Reveal key={sponsor.rank} as="li" delay={(i % 12) * 45}>
                <div
                  className={
                    isTop
                      ? 'corner-cut flex items-center justify-between gap-4 border border-[#e879f9]/50 bg-linear-to-r from-[#7c1d6f] via-[#9f1239] to-[#c2410c] px-5 py-4 shadow-[0_0_45px_-12px_rgba(232,121,249,0.45)] sm:px-7 sm:py-5'
                      : 'corner-cut flex items-center justify-between gap-4 border border-[#c9a239]/15 bg-[#151109]/70 px-5 py-3.5 transition-colors hover:border-[#c9a239]/35 sm:px-7'
                  }
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span
                      className={
                        isTop
                          ? 'w-6 shrink-0 font-display text-base font-bold text-[#fbcfe8]'
                          : 'w-6 shrink-0 font-display text-sm text-[#c9a239]'
                      }
                    >
                      {sponsor.rank}
                    </span>
                    <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                      <span
                        className={
                          isTop
                            ? 'truncate font-display text-base font-bold text-white sm:text-lg'
                            : 'truncate text-sm font-medium text-[#f2e6cf] sm:text-base'
                        }
                      >
                        {sponsor.name}
                      </span>
                      {sponsor.nickname && (
                        <span className="truncate text-xs text-[#c9bda0]">
                          『{sponsor.nickname}』
                        </span>
                      )}
                    </span>
                    {sponsor.badge && (
                      <span className="corner-cut hidden shrink-0 items-center gap-1 bg-white/15 px-2.5 py-0.5 font-display text-[0.6rem] tracking-widest text-white sm:inline-flex">
                        + {sponsor.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={
                      isTop
                        ? 'shrink-0 font-display text-lg font-bold text-white sm:text-xl'
                        : 'shrink-0 font-display text-sm font-medium text-[#e4c766] sm:text-base'
                    }
                  >
                    {formatSponsorAmount(sponsor.amount)}
                  </span>
                </div>
              </Reveal>
            )
          })}
        </ol>
      </section>

      <Reveal className="relative mx-auto max-w-4xl px-5 pt-16 text-center lg:px-10">
        <p className="text-xs tracking-[0.08em] text-[#c9bda0]/60">
          Built by the community, powered by its supporters.
        </p>
      </Reveal>
    </div>
  )
}
