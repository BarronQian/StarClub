import type { Metadata } from 'next'
import Image from 'next/image'
import { Diamond } from 'lucide-react'

import { Reveal } from '@/components/reveal'
import { SponsorGiftWall } from '@/components/sponsor-gift-wall'

import {
  formatSponsorTotal,
} from '@/lib/sponsors'

import {
  getSponsorsFromDb,
} from '@/lib/sponsors-db'

import {
  getSponsorGiftsFromDb,
} from '@/lib/sponsor-gifts-db'

export const metadata: Metadata = {
  title: '赞助纪念墙 | 星际酒馆 StarClub',
  description:
    '星际酒馆 StarClub 社区赞助纪念墙，记录酒友为社区活动、赛事与参与者提供的礼物赞助与支持。',
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
    <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#faf9f7] text-[#1d1b18] transition-colors dark:bg-[#2b2825] dark:text-[#eee9e3]">

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
        width={360}
        height={360}
        className="pointer-events-none absolute left-1/2 top-12 h-80 w-80 -translate-x-1/2 select-none object-contain opacity-[0.025]"
      />

      {/* Hero */}
      <section className="relative border-b border-[#e8e2d8] dark:border-white/8">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-5 py-4 text-center sm:py-5 lg:px-10 lg:py-5">

          <Reveal delay={60}>
            <span className="font-display text-[0.65rem] tracking-[0.45em] text-[#a68d68]">
              STARCLUB SUPPORT ARCHIVE
            </span>
          </Reveal>

          <Reveal
            delay={100}
            className="mt-1.5"
          >
            <h1 className="font-display text-3xl leading-tight tracking-tight text-balance text-[#1d1b18] dark:text-[#f2ede7] sm:text-4xl lg:text-[2.6rem]">
              星际酒馆赞助纪念墙
            </h1>
          </Reveal>

          <Reveal
            delay={140}
            className="mt-1.5 max-w-xl"
          >
            <p className="text-sm leading-relaxed text-pretty text-[#766f65] dark:text-[#aaa39b] sm:text-base">
              感谢每一位撑起这片星海的人。
            </p>
          </Reveal>

          <Reveal
            delay={180}
            className="mt-3 flex items-center gap-3"
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
            className="mt-3 flex items-stretch justify-center"
          >
            <div className="flex min-w-37.5 flex-col items-center px-8">
              <span className="font-display text-2xl tracking-tight text-[#a66716] sm:text-3xl">
                {formatSponsorTotal(
                  total,
                )}
              </span>

              <span className="mt-1.5 text-xs tracking-wide text-[#8c8478] dark:text-[#aaa39b]">
                累计礼物参考价值
              </span>
            </div>

            <div
              aria-hidden="true"
              className="w-px bg-[#ded7cb] dark:bg-white/12"
            />

            <div className="flex min-w-37.5 flex-col items-center px-8">
              <span className="font-display text-2xl tracking-tight text-[#a66716] sm:text-3xl">
                {count}
              </span>

              <span className="mt-1.5 text-xs tracking-wide text-[#8c8478] dark:text-[#aaa39b]">
                位赞助者
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 社区赞助记录弹幕墙 */}
      <section className="relative pt-4 lg:pt-5">
        <Reveal className="mx-auto mb-3 max-w-6xl px-5 lg:px-10">
          <div className="flex items-end justify-between gap-6">

            <div>
              <span className="font-display text-[0.62rem] tracking-[0.28em] text-[#a66716]">
                COMMUNITY GIFT ARCHIVE
              </span>

              <h2 className="mt-1 font-display text-lg tracking-tight text-[#2a2621] dark:text-[#eee9e3] sm:text-xl">
                每一份来自酒友的支持
              </h2>

              <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#8c8478] dark:text-[#aaa39b]">
                记录社区活动中，由酒友直接赠送给获奖者与参与者的礼物。
              </p>
            </div>

            <span className="hidden shrink-0 text-[0.58rem] tracking-[0.18em] text-[#b7afa3] dark:text-[#8f8982] sm:block">
              {gifts.length} GIFT RECORDS
            </span>

          </div>
        </Reveal>

        <SponsorGiftWall
          gifts={gifts}
        />
      </section>

      {/* 社区赞助说明 */}
      <Reveal className="relative border-t border-[#e4ded4] bg-[#faf9f7] transition-colors dark:border-white/8 dark:bg-[#2b2825]">
        <section className="mx-auto max-w-6xl px-5 py-10 lg:px-10 lg:py-12">

          <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-14">

            {/* 左侧标题 */}
            <div>
              <span className="font-display text-[0.58rem] tracking-[0.28em] text-[#a66716]">
                COMMUNITY GIFT NOTICE
              </span>

              <h2 className="mt-2 font-display text-xl tracking-tight text-[#2a2621] dark:text-[#eee9e3] sm:text-2xl">
                社区赞助与礼物说明
              </h2>

              <p className="mt-3 max-w-55 text-xs leading-5 text-[#8c8478] dark:text-[#aaa39b]">
                关于社区礼物赞助、参考价值与责任范围的说明。
              </p>

              <div className="mt-5 h-px w-12 bg-[#b87922]/35" />
            </div>

            {/* 右侧说明 */}
            <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">

              {/* 01 */}
              <div className="border-t border-[#ded8cf] pt-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="font-display text-[0.58rem] tracking-[0.2em] text-[#a66716]">
                    01
                  </span>

                  <span className="text-[0.58rem] tracking-[0.18em] text-[#aaa196] dark:text-[#8f8982]">
                    DIRECT GIFT
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-semibold text-[#3b352e] dark:text-[#e6e0d9]">
                  礼物由赞助者直接赠送
                </h3>

                <p className="mt-2 text-xs leading-5.5 text-[#81796e] dark:text-[#aaa39b]">
                  赞助内容可能包含通过 Star Citizen 官网以现金购买的数字商品，
                  但赞助者不会向星际酒馆或管理组支付、转交现金。
                  礼物均由赞助者使用个人账号直接赠送给获奖者或接收者，
                  星际酒馆及管理组不代收、不保管、不转交相关资金或礼物。
                </p>
              </div>

              {/* 02 */}
              <div className="border-t border-[#ded8cf] pt-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="font-display text-[0.58rem] tracking-[0.2em] text-[#a66716]">
                    02
                  </span>

                  <span className="text-[0.58rem] tracking-[0.18em] text-[#aaa196] dark:text-[#8f8982]">
                    FINAL GIFT
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-semibold text-[#3b352e] dark:text-[#e6e0d9]">
                  赠送完成后不经酒馆退还
                </h3>

                <p className="mt-2 text-xs leading-5.5 text-[#81796e] dark:text-[#aaa39b]">
                  礼物完成赠送后，不支持通过星际酒馆要求撤回、退还或退款。
                  因账号、赠送或领取产生的问题，由赠送人与接收人自行处理，
                  星际酒馆及管理组不承担相关赠送或交易责任。
                </p>
              </div>

              {/* 03 */}
              <div className="border-t border-[#ded8cf] pt-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="font-display text-[0.58rem] tracking-[0.2em] text-[#a66716]">
                    03
                  </span>

                  <span className="text-[0.58rem] tracking-[0.18em] text-[#aaa196] dark:text-[#8f8982]">
                    REFERENCE VALUE
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-semibold text-[#3b352e] dark:text-[#e6e0d9]">
                  金额仅代表礼物参考价值
                </h3>

                <p className="mt-2 text-xs leading-5.5 text-[#81796e] dark:text-[#aaa39b]">
                  页面展示的累计金额仅用于记录赞助礼物的购买价格或参考价值，
                  不代表星际酒馆或管理组实际收到相应现金，
                  也不代表投资、入股、会员费用或任何社区权益。
                </p>
              </div>

              {/* 04 */}
              <div className="border-t border-[#ded8cf] pt-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="font-display text-[0.58rem] tracking-[0.2em] text-[#a66716]">
                    04
                  </span>

                  <span className="text-[0.58rem] tracking-[0.18em] text-[#aaa196] dark:text-[#8f8982]">
                    NO PRIVILEGES
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-semibold text-[#3b352e] dark:text-[#e6e0d9]">
                  赞助不产生任何社区特权
                </h3>

                <p className="mt-2 text-xs leading-5.5 text-[#81796e] dark:text-[#aaa39b]">
                  任何赞助金额、次数或礼物价值均不会赋予赞助者管理权限、
                  社区职务、活动优势、决策权、特殊待遇或其他利益。
                </p>
              </div>

            </div>
          </div>

          {/* 底部社区标语 */}
          <div className="mt-9 border-t border-[#e4ded4] pt-5 text-center dark:border-white/8">
            <p className="text-[0.6rem] tracking-[0.14em] text-[#aaa196] dark:text-[#817b75]">
              Built by the community, powered by its supporters.
            </p>
          </div>

        </section>
      </Reveal>

    </div>
  )
}