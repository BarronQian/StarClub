import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Reveal } from '@/components/reveal'

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="pt-24 lg:pt-28">
        <section className="relative">
          <div
            aria-hidden="true"
            className="hud-grid absolute inset-0 -z-10 opacity-70"
          />
          <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 py-24 text-center lg:px-10">
            <Reveal className="flex flex-col items-center gap-5">
              <div className="flex items-center gap-3">
                <span className="font-display text-[0.65rem] tracking-[0.4em] text-primary">
                  404
                </span>
                <span className="h-px w-10 bg-primary/40" aria-hidden="true" />
                <span className="text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
                  Lost in the &apos;Verse
                </span>
              </div>
              <h1 className="font-display text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
                航线不存在
              </h1>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                你访问的坐标可能已经失效，或从未存在。
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/"
                  className="pill bg-primary px-6 py-3 font-display text-[0.68rem] tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-85"
                >
                  返回主页
                </Link>
                <Link
                  href="/events"
                  className="pill border border-border px-6 py-3 font-display text-[0.68rem] tracking-[0.22em] text-foreground transition-colors hover:border-primary/50"
                >
                  查看活动
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
