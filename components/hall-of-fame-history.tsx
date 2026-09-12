import { Reveal } from '@/components/reveal'
import {
  getChampionshipCounts,
  type HallOfFameEdition,
} from '@/lib/hall-of-fame'

export function HallOfFameHistory({
  editions,
  category,
}: {
  editions: HallOfFameEdition[]
  category: 'gun' | 'ace' | 'racing'
}) {
  const counts = getChampionshipCounts(category)

  return (
    <div className="flex flex-col gap-16 lg:gap-20">
      <div>
        <h2 className="font-display text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
          历届记录 · 冠军
        </h2>
        <ol className="mt-6 flex flex-col divide-y divide-border border-y border-border">
          {editions.map((edition, i) => (
            <Reveal
              key={edition.id}
              as="li"
              delay={(i % 10) * 60}
              className="flex flex-col gap-4 py-6 sm:flex-row sm:items-baseline sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="font-display text-[0.6rem] tracking-[0.24em] text-primary">
                  {edition.edition} · {edition.season}
                </span>
                <span className="text-sm text-foreground/80">
                  {edition.eventName}
                </span>
                <span className="text-[0.68rem] text-muted-foreground">
                  {edition.date}
                </span>
              </div>
<div className="grid grid-cols-3 gap-8 sm:min-w-[420px]">
  <div className="flex flex-col gap-1 sm:items-end">
    <span className="text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase">
      冠军
    </span>
    <span className="font-display text-lg font-medium text-foreground">
      {edition.champion}
    </span>
  </div>

  <div className="flex flex-col gap-1 sm:items-end">
    <span className="text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase">
      亚军
    </span>
    <span className="font-display text-lg font-medium text-foreground">
      {edition.runnerUp}
    </span>
  </div>

  <div className="flex flex-col gap-1 sm:items-end">
    <span className="text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase">
      季军
    </span>
    <span className="font-display text-lg font-medium text-foreground">
      {edition.thirdPlace}
    </span>
  </div>
</div>
            </Reveal>
          ))}
        </ol>
      </div>

      <div>
        <h2 className="font-display text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
          冠军次数统计
        </h2>
        <ul className="mt-6 flex flex-col divide-y divide-border border-y border-border">
          {counts.map((entry, i) => (
            <Reveal
              key={entry.playerName}
              as="li"
              delay={(i % 10) * 50}
              className="flex items-center justify-between gap-4 py-3.5"
            >
              <span className="text-sm text-foreground">{entry.playerName}</span>
              <span className="font-display text-sm tracking-tight text-primary">
                {entry.count} 次
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </div>
  )
}
