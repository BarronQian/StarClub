import { ArrowRight } from 'lucide-react'
import { executiveHangarConfig as cfg } from '@/lib/executive-hangar-config'

const STEPS = [
  {
    index: '01',
    en: 'CHARGING',
    zh: '红灯充能',
    minutes: cfg.closedMinutes,
    tone: 'text-[oklch(0.55_0.145_27)]',
    desc: `五盏信号灯每 ${cfg.chargingLightInterval} 分钟依次点亮，此阶段插板无效。`,
  },
  {
    index: '02',
    en: 'ACTIVE',
    zh: '绿灯开启',
    minutes: cfg.openMinutes,
    tone: 'text-[oklch(0.62_0.135_150)]',
    desc: `Executive Hangar 开放，信号灯每 ${cfg.activeLightInterval} 分钟熄灭一盏。`,
  },
  {
    index: '03',
    en: 'RESET',
    zh: '黑区重置',
    minutes: cfg.resetMinutes,
    tone: 'text-primary',
    desc: '死亡区生效，机库强制关闭，务必提前撤离并带走战利品。',
  },
]

export function CycleExplanation() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="font-display text-[0.58rem] tracking-[0.3em] text-primary">
          HOW THE CYCLE WORKS
        </span>
        <h2 className="font-display text-xl tracking-tight text-foreground">
          周期结构
        </h2>
      </div>

      <ol className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-0">
        {STEPS.map((s, i) => (
          <li
            key={s.index}
            className="flex flex-1 items-start gap-5 lg:items-stretch"
          >
            <div className="flex flex-1 flex-col gap-3 lg:pr-8">
              <span className="font-display text-4xl leading-none tabular-nums tracking-tight text-foreground/15 sm:text-5xl">
                {s.index}
              </span>
              <div className="flex flex-col gap-1">
                <span
                  className={`font-display text-[0.6rem] tracking-[0.28em] ${s.tone}`}
                >
                  {s.en}
                </span>
                <span className="flex items-baseline gap-3">
                  <span className="font-display text-base tracking-tight text-foreground">
                    {s.zh}
                  </span>
                  <span className="font-display text-[0.62rem] tabular-nums tracking-[0.2em] text-muted-foreground">
                    {s.minutes} MIN
                  </span>
                </span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight
                className="mt-6 size-4 shrink-0 text-border lg:mt-14 lg:mr-8"
                strokeWidth={1.4}
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
