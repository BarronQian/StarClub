import { ArrowRight } from 'lucide-react'
import { executiveHangarConfig as cfg } from '@/lib/executive-hangar-config'

const STEPS = [
  {
    index: '01',
    label: '充能阶段',
    zh: '红灯充能',
    minutes: cfg.closedMinutes,
    color: 'oklch(0.55 0.145 27)',
    desc: `五盏信号灯每 ${cfg.chargingLightInterval} 分钟依次点亮，此阶段插板无效。`,
  },
  {
    index: '02',
    label: '开放阶段',
    zh: '绿灯开启',
    minutes: cfg.openMinutes,
    color: 'oklch(0.62 0.135 150)',
    desc: `行政机库正式开放，信号灯每 ${cfg.activeLightInterval} 分钟熄灭一盏。`,
  },
  {
    index: '03',
    label: '重置阶段',
    zh: '黑区重置',
    minutes: cfg.resetMinutes,
    color: 'oklch(0.57 0.125 64)',
    desc: '死亡区生效，机库强制关闭，务必提前撤离并带走战利品。',
  },
]

export function CycleExplanation() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="font-display text-[0.58rem] tracking-[0.22em] text-primary">
          行政机库运行周期
        </span>

        <h2 className="font-display text-xl tracking-tight text-foreground">
          周期结构
        </h2>
      </div>

      <ol className="grid gap-3 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <li
            key={s.index}
            className="relative"
          >
            <div className="corner-cut relative h-full overflow-hidden border border-border/80 bg-background px-5 py-5">
              {/* 顶部阶段灯条 */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background: s.color,
                  boxShadow: `0 0 12px color-mix(in oklab, ${s.color} 55%, transparent)`,
                }}
              />

              {/* 背景微光 */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full opacity-[0.07] blur-3xl"
                style={{
                  background: s.color,
                }}
              />

              <div className="relative flex h-full flex-col">
                {/* 编号 + 状态灯 */}
                <div className="mb-5 flex items-start justify-between">
                  <span className="font-display text-4xl leading-none tabular-nums tracking-tight text-foreground/15 sm:text-5xl">
                    {s.index}
                  </span>

                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-full"
                      style={{
                        background: s.color,
                        boxShadow: `0 0 9px color-mix(in oklab, ${s.color} 70%, transparent)`,
                      }}
                    />

                    <span
                      className="font-display text-[0.56rem] tracking-[0.16em]"
                      style={{
                        color: s.color,
                      }}
                    >
                      {s.label}
                    </span>
                  </span>
                </div>

                {/* 阶段名称 */}
                <div className="flex items-end justify-between gap-4">
                  <span className="font-display text-base tracking-tight text-foreground">
                    {s.zh}
                  </span>

                  <span className="font-display text-[0.62rem] tabular-nums tracking-[0.12em] text-muted-foreground">
                    {s.minutes} 分钟
                  </span>
                </div>

                {/* 小型灯轨 */}
                <div className="my-4 flex gap-1">
                  {Array.from({ length: 8 }).map(
                    (_, lightIndex) => (
                      <span
                        key={lightIndex}
                        aria-hidden="true"
                        className="h-1 flex-1 rounded-full"
                        style={{
                          background:
                            lightIndex < 5
                              ? s.color
                              : 'color-mix(in oklab, currentColor 10%, transparent)',
                          opacity:
                            lightIndex < 5
                              ? 0.65
                              : 0.4,
                        }}
                      />
                    ),
                  )}
                </div>

                <p className="mt-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            </div>

            {/* 桌面阶段连接箭头 */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2.75 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background p-1 lg:flex"
              >
                <ArrowRight
                  className="size-3 text-muted-foreground"
                  strokeWidth={1.5}
                />
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}