import type { Metadata } from 'next'
import Image from 'next/image'
import { Diamond } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import {
  formatSponsorAmount,
  formatSponsorTotal,
} from '@/lib/sponsors'

import {
  getSponsorsFromDb,
} from '@/lib/sponsors-db'

export const metadata: Metadata = {
  title: '赞助榜 | 星际酒馆 StarClub',
  description:
    '星际酒馆 StarClub 赞助榜：感谢每一位支持 Star Citizen 华人玩家社区运营、活动与长期建设的酒友。',
}

export const dynamic =
  'force-dynamic'

export default async function SponsorsPage() {
  const sponsors =
    await getSponsorsFromDb()

  const total =
    sponsors.reduce(
      (
        sum,
        sponsor,
      ) =>
        sum +
        sponsor.amount,
      0,
    )

  const count =
    sponsors.length
  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#faf9f7] pb-24 text-[#1d1b18] lg:pb-32">
      {/* 顶部柔和金色环境光 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-155"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 65% 55% at 50% -10%, rgba(184,121,34,0.11), transparent 70%)',
        }}
      />

      {/* 左下角极淡环境光 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 35% 30% at 8% 80%, rgba(184,121,34,0.045), transparent 70%)',
        }}
      />

      {/* 酒馆 Logo 水印 */}
      <Image
        src="/images/starclub-logo.png"
        alt=""
        aria-hidden="true"
        width={520}
        height={520}
        className="pointer-events-none absolute left-1/2 top-36 h-107.5 w-107.5 -translate-x-1/2 select-none object-contain opacity-[0.025]"
      />

      {/* Hero */}
      <section className="relative border-b border-[#e8e2d8]">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-5 py-20 text-center lg:px-10 lg:py-28">
          <Reveal>
            <span className="corner-cut inline-block border border-[#b87922]/20 bg-[#b87922]/5 px-4 py-1.5 font-display text-[0.6rem] tracking-[0.3em] text-[#a66716]">
              荣誉墙 · 星际酒馆
            </span>
          </Reveal>

          <Reveal
            delay={60}
            className="mt-3"
          >
            <span className="font-display text-[0.65rem] tracking-[0.45em] text-[#a68d68]">
              HALL OF SPONSORS
            </span>
          </Reveal>

          <Reveal
            delay={100}
            className="mt-6"
          >
            <h1 className="font-display text-4xl leading-tight tracking-tight text-balance text-[#1d1b18] sm:text-5xl lg:text-6xl">
              星际酒馆赞助榜
            </h1>
          </Reveal>

          <Reveal
            delay={140}
            className="mt-5 max-w-xl"
          >
            <p className="text-sm leading-relaxed text-pretty text-[#766f65] sm:text-base">
              感谢每一位撑起这片星海的人。
            </p>
          </Reveal>

          <Reveal
            delay={180}
            className="mt-8 flex items-center gap-3"
          >
            <span
              className="h-px w-16 bg-[#b87922]/30"
              aria-hidden="true"
            />

            <Diamond
              className="size-3 text-[#b87922]"
              strokeWidth={1.5}
              aria-hidden="true"
            />

            <span
              className="h-px w-16 bg-[#b87922]/30"
              aria-hidden="true"
            />
          </Reveal>

          {/* 总数据 */}
          <Reveal
            delay={220}
            className="mt-10 flex items-stretch justify-center"
          >
            <div className="flex min-w-37.5 flex-col items-center px-8">
              <span className="font-display text-3xl tracking-tight text-[#a66716] sm:text-4xl">
                {formatSponsorTotal(
                  total,
                )}
              </span>

              <span className="mt-1.5 text-xs tracking-wide text-[#8c8478]">
                累计赞助
              </span>
            </div>

            <div
              aria-hidden="true"
              className="w-px bg-[#ded7cb]"
            />

            <div className="flex min-w-37.5 flex-col items-center px-8">
              <span className="font-display text-3xl tracking-tight text-[#a66716] sm:text-4xl">
                {count}
              </span>

              <span className="mt-1.5 text-xs tracking-wide text-[#8c8478]">
                位赞助者
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 榜单 */}
      <section className="relative mx-auto max-w-4xl px-5 pt-14 lg:px-10 lg:pt-20">
        <Reveal className="mb-6 flex items-center justify-between">
          <div>
            <span className="font-display text-[0.62rem] tracking-[0.28em] text-[#a66716]">
              SUPPORTER RANKING
            </span>

            <p className="mt-2 text-xs text-[#91897d]">
              共{' '}
              <span className="font-medium text-[#6d6357]">
                {count}
              </span>{' '}
              位赞助者
            </p>
          </div>

          <span className="hidden text-[0.6rem] tracking-[0.2em] text-[#b7afa3] sm:block">
            TOTAL CONTRIBUTION
          </span>
        </Reveal>

        <ol className="flex flex-col gap-2.5">
          {sponsors.map(
            (
              sponsor,
              i,
            ) => {
              const isTop =
                sponsor.rank ===
                1

              return (
                <Reveal
                  key={
                    sponsor.rank
                  }
                  as="li"
                  delay={
                    (i % 12) *
                    45
                  }
                >
                    <div
                      className={
                        isTop
                          ? 'group relative rounded-xl border border-[#e6e0d7] bg-white px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c05a87]/25 hover:shadow-[0_10px_30px_-22px_rgba(134,38,90,0.22)] sm:px-7'
                          : 'group rounded-xl border border-[#e6e0d7] bg-white/75 px-5 py-4 transition-all duration-300 hover:translate-x-1 hover:border-[#c9a36d]/45 hover:bg-white hover:shadow-[0_10px_30px_-22px_rgba(74,57,35,0.22)] sm:px-7'
                      }
                    >

                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                        {/* 排名 */}
                        <span
                          className={
                            isTop
                              ? 'w-7 shrink-0 font-display text-lg font-semibold text-[#a52f64]'
                              : 'w-7 shrink-0 font-display text-sm text-[#b28a4b]'
                          }
                        >
                          {String(
                            sponsor.rank,
                          ).padStart(
                            2,
                            '0',
                          )}
                        </span>

                        <span
                          aria-hidden="true"
                          className="h-8 w-px shrink-0 bg-[#ebe5dc]"
                        />

                        {/* 名字 */}
                        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <span
                            className={
                              isTop
                                ? 'truncate font-display text-base font-semibold text-[#241e20] sm:text-lg'
                                : 'truncate text-sm font-medium text-[#292622] sm:text-base'
                            }
                          >
                            {
                              sponsor.name
                            }
                          </span>

                          {sponsor.nickname && (
                            <span className="truncate text-xs text-[#9b9286]">
                              『
                              {
                                sponsor.nickname
                              }
                              』
                            </span>
                          )}

                          {sponsor.badge && (
                            <span
                              className={
                                isTop
                                  ? 'corner-cut hidden shrink-0 border border-[#b84a77]/15 bg-[#b84a77]/7 px-2.5 py-1 font-display text-[0.55rem] tracking-wider text-[#9d3262] sm:inline-flex'
                                  : 'corner-cut hidden shrink-0 border border-[#b87922]/15 bg-[#b87922]/5 px-2.5 py-1 font-display text-[0.55rem] tracking-wider text-[#a66716] sm:inline-flex'
                              }
                            >
                              {
                                sponsor.badge
                              }
                            </span>
                          )}
                        </span>
                      </div>

                      {/* 金额 */}
                      <div className="shrink-0 text-right">
                        <span
                          className={
                            isTop
                              ? 'font-display text-lg font-semibold tracking-tight text-[#a52f64] sm:text-xl'
                              : 'font-display text-sm font-medium tracking-tight text-[#9b6b20] sm:text-base'
                          }
                        >
                          {formatSponsorAmount(
                            sponsor.amount,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )
            },
          )}
        </ol>
      </section>

      <Reveal className="relative mx-auto max-w-4xl px-5 pt-16 text-center lg:px-10">
        <div className="mx-auto mb-6 h-px max-w-sm bg-linear-to-r from-transparent via-[#d8d0c4] to-transparent" />

        <p className="text-[0.65rem] tracking-[0.12em] text-[#aaa196]">
          Built by the
          community, powered
          by its supporters.
        </p>
      </Reveal>
    </div>
  )
}