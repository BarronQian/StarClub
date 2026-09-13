import type { Metadata } from 'next'
import { Reveal } from '@/components/reveal'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { ExecutiveHangarTool } from '@/components/executive-hangar/executive-hangar-tool'
import { CycleExplanation } from '@/components/executive-hangar/cycle-explanation'
import { executiveHangarConfig as cfg } from '@/lib/executive-hangar-config'
import { createAdminClient } from '@/lib/supabase-admin'

export const metadata: Metadata = {
  title: '行政机库计时器 Executive Hangar Timer · 星际酒馆 StarClub',
  description:
    'Star Citizen 派罗行政机库（PYAM-EXHANG）实时计时器：185 分钟全服同步周期，实时追踪灯光状态、下一开放窗口与后续循环，支持时区切换、Discord 时间戳与手动校准。',
}

const META = ['PYRO SYSTEM', 'LIVE SYNC', `${cfg.cycleMinutes} MIN CYCLE`]

export const dynamic = 'force-dynamic'

export default async function ExecutiveHangarPage() {
  let globalAnchor =
    cfg.anchorTime

  try {
    const supabase =
      createAdminClient()

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'executive_hangar_config',
        )
        .select(
          'anchor_time',
        )
        .eq(
          'id',
          1,
        )
        .maybeSingle()

    if (
      !error &&
      data?.anchor_time
    ) {
      globalAnchor =
        data.anchor_time
    }

    if (error) {
      console.error(
        'Failed to load executive hangar global anchor:',
        error,
      )
    }
  } catch (error) {
    console.error(
      'Executive hangar global anchor fallback:',
      error,
    )
  }
  return (
    <div className="pb-24 lg:pb-32">
      <section className="pyro-atmosphere relative border-b border-border">
        <div
          aria-hidden="true"
          className="hud-grid absolute inset-0 -z-10 opacity-60"
        />
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-10 lg:py-16">
          <ArchiveBreadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '实用工具', href: '/tools' },
              { label: '行政机库计时器' },
            ]}
          />
          <Reveal className="mt-7 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="font-display text-[0.6rem] tracking-[0.34em] text-primary">
                  EXHANG
                </span>
                <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
                <span className="text-[0.6rem] tracking-[0.3em] text-muted-foreground uppercase">
                  Executive Hangar Timer
                </span>
              </div>
              <h1 className="max-w-2xl font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
                行政机库计时器
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                派罗 PYAM-EXHANG 行政机库以约 {cfg.cycleMinutes}{' '}
                分钟为一个循环周期。
                <br className="hidden sm:block" />
                实时追踪灯光状态、下一开放窗口与后续循环。
              </p>
            </div>
            <ul className="flex flex-wrap gap-x-8 gap-y-2 lg:flex-col lg:items-end lg:gap-y-2.5">
              {META.map((item) => (
                <li
                  key={item}
                  className="text-[0.58rem] tracking-[0.26em] text-muted-foreground uppercase"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 pt-10 lg:px-10 lg:pt-14">
        <div
          aria-hidden="true"
          className="hud-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-105 opacity-40"
        />
        <Reveal>
        <ExecutiveHangarTool
          globalAnchor={
            globalAnchor
          }
        />
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-14 lg:px-10 lg:pt-20">
        <Reveal>
          <CycleExplanation />
        </Reveal>
        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          周期时长为社区长期观测结果。服务器重启或版本更新后基准时间可能漂移，若与游戏内实际灯位不符，请使用上方
          ADVANCED / TIMER CALIBRATION 重新校准。
        </p>
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[0.55rem] tracking-[0.24em] text-muted-foreground/70 uppercase">
          <span>{cfg.location}</span>
          <span>StarClub Tool System</span>
          <span>Live Cycle Calculation</span>
          <span>Local Clock · UTC Sync</span>
        </div>
      </section>
    </div>
  )
}
