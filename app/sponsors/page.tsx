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

import {
  getSponsorGiftsFromDb,
} from '@/lib/sponsor-gifts-db'

import {
  SponsorGiftWall,
} from '@/components/sponsor-gift-wall'

export const metadata: Metadata = {
  title: '赞助榜 | 星际酒馆 StarClub',
  description:
    '星际酒馆 StarClub 赞助榜：感谢每一位支持 Star Citizen 华人玩家社区运营、活动与长期建设的酒友。',
}

export const dynamic =
  'force-dynamic'

export default async function SponsorsPage() {
  const [
    sponsors,
    gifts,
  ] = await Promise.all([
    getSponsorsFromDb(),
    getSponsorGiftsFromDb(),
  ])

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
                累计礼物参考价值
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

{/* 社区赞助记录弹幕墙 */}
<section className="relative pt-12 lg:pt-16">
  <Reveal className="mx-auto mb-7 max-w-4xl px-5 lg:px-10">
    <div className="flex items-end justify-between gap-6">
      <div>
        <span className="font-display text-[0.62rem] tracking-[0.28em] text-[#a66716]">
          COMMUNITY GIFT ARCHIVE
        </span>

        <h2 className="mt-2 font-display text-2xl tracking-tight text-[#2a2621] sm:text-3xl">
          每一份来自酒友的支持
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#8c8478]">
          记录社区活动中，由酒友直接赠送给获奖者与参与者的礼物。
        </p>
      </div>

      <span className="hidden shrink-0 text-[0.58rem] tracking-[0.18em] text-[#b7afa3] sm:block">
        {gifts.length} GIFT RECORDS
      </span>
    </div>
  </Reveal>

  <SponsorGiftWall
    gifts={gifts}
  />
</section>
  
  {/* 社区赞助说明 */}
<Reveal className="relative mx-auto max-w-4xl px-5 pt-12 lg:px-10 lg:pt-16">
  <div className="rounded-2xl border border-[#e4ded4] bg-white/60 px-6 py-6 sm:px-8 sm:py-7">
    <span className="font-display text-[0.58rem] tracking-[0.26em] text-[#a66716]">
      COMMUNITY GIFT NOTICE
    </span>

    <h2 className="mt-2 font-display text-lg text-[#2a2621]">
      社区赞助与礼物说明
    </h2>

    <div className="mt-4 space-y-3 text-xs leading-6 text-[#81796e] sm:text-sm sm:leading-7">
      <p>
        本页面记录的赞助均为社区酒友自愿提供的
        <strong className="font-medium text-[#5f574d]">
          非现金礼物赞助
        </strong>
        。赞助者使用其个人账号直接将礼物赠送至获奖者或接收者账号，星际酒馆及管理组不代收、不保管、不转交任何赞助资金或礼物。
      </p>

      <p>
        礼物完成赠送后，不支持通过星际酒馆要求撤回、退还或退款。因账号、赠送、领取或其他相关问题产生的争议，由赠送人与接收人自行处理，星际酒馆及管理组不承担相关赠送或交易责任。
      </p>

      <p>
        网站展示的累计金额仅用于记录社区赞助礼物的
        <strong className="font-medium text-[#5f574d]">
          参考价值
        </strong>
        ，不代表星际酒馆收到相应现金。任何赞助金额、次数或礼物价值均不会赋予赞助者任何管理权限、社区职务、活动优势、决策权、特殊待遇或其他利益。
      </p>
    </div>
  </div>
</Reveal>

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