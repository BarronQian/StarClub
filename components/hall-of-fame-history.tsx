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
                <div className="grid w-full grid-cols-3 gap-3 sm:w-125 lg:w-135">
                  {/* 冠军 */}
                  <div className="flex min-w-0 flex-col items-center text-center">
                    <div className="mb-1.5 flex items-center justify-center gap-1.5">
                      <span
                        className="text-sm leading-none"
                        aria-hidden="true"
                      >
                        🥇
                      </span>

                      <span className="text-[0.58rem] tracking-[0.16em] text-muted-foreground uppercase">
                        冠军
                      </span>
                    </div>

                    <span
                      title={edition.champion}
                      className="w-full truncate px-1 font-display text-[0.95rem] font-medium leading-tight text-foreground lg:text-base"
                    >
                      {edition.champion}
                    </span>
                  </div>

                  {/* 亚军 */}
                  <div className="flex min-w-0 flex-col items-center text-center">
                    <div className="mb-1.5 flex items-center justify-center gap-1.5">
                      <span
                        className="text-sm leading-none"
                        aria-hidden="true"
                      >
                        🥈
                      </span>

                      <span className="text-[0.58rem] tracking-[0.16em] text-muted-foreground uppercase">
                        亚军
                      </span>
                    </div>

                    <span
                      title={edition.runnerUp}
                      className="w-full truncate px-1 font-display text-[0.95rem] font-medium leading-tight text-foreground lg:text-base"
                    >
                      {edition.runnerUp}
                    </span>
                  </div>

                  {/* 季军 */}
                  <div className="flex min-w-0 flex-col items-center text-center">
                    <div className="mb-1.5 flex items-center justify-center gap-1.5">
                      <span
                        className="text-sm leading-none"
                        aria-hidden="true"
                      >
                        🥉
                      </span>

                      <span className="text-[0.58rem] tracking-[0.16em] text-muted-foreground uppercase">
                        季军
                      </span>
                    </div>

                    <span
                      title={edition.thirdPlace}
                      className="w-full truncate px-1 font-display text-[0.95rem] font-medium leading-tight text-foreground lg:text-base"
                    >
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
