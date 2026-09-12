import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { DISCORD_URL, ORG_URL, EXTERNAL } from '@/lib/links'
import { HeroCarousel } from '@/components/hero-carousel'

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-20 lg:pt-28">
      <div
        aria-hidden="true"
        className="hud-grid absolute inset-0"
        style={{
          maskImage: 'linear-gradient(to bottom, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-5 text-center lg:px-10">
        <p className="mt-4 font-display text-[0.62rem] tracking-[0.36em] text-primary">
          EST. 2024 · 全球华人社区
        </p>

        <h1 className="mt-6 flex flex-col items-center">
          <span className="font-display text-[3rem] leading-[0.92] tracking-[0.02em] sm:text-7xl lg:text-8xl">
            STARCLUB
          </span>
          <span className="mt-4 text-2xl font-medium tracking-[0.24em] text-foreground/80 sm:text-4xl lg:mt-6">
            星际酒馆
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground lg:text-xl">
          汇聚全球华人玩家，构筑自由、多元、充满活力的《星际公民》社区。
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href={DISCORD_URL}
            {...EXTERNAL}
           className="pill group inline-flex min-h-14 items-center justify-center gap-2 bg-primary px-8 py-4 font-display text-xs tracking-[0.22em] text-primary-foreground shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_18px_36px_rgba(0,0,0,0.22)] active:translate-y-0 active:scale-[0.99]"
          >
              <Image
    src="/images/discord-logo-wh.png"
    alt=""
    width={20}
    height={20}
    className="shrink-0 object-contain"
  />
            加入 DISCORD
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
<a
  href={ORG_URL}
  {...EXTERNAL}
  className="pill inline-flex min-w-55 min-h-14 items-center justify-center gap-2 border border-primary bg-background px-6 py-4 font-display text-xs tracking-[0.22em] text-foreground shadow-[0_8px_20px_rgba(0,0,0,0.10)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:bg-primary/5 hover:shadow-[0_16px_32px_rgba(0,0,0,0.16)] active:translate-y-0 active:scale-[0.99]"
>
  <Image
    src="/images/starclub-logo-gold.png"
    alt=""
    width={22}
    height={22}
    className="shrink-0 object-contain"
  />
  加入官方俱乐部 ORG
</a>
        </div>
      </div>

      {/* 百人合影 — the community itself as the hero image */}
      <HeroCarousel />
    </section>
  )
}
