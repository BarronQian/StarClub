import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import {
  CHAMPIONS,
  HALL_OF_FAME_CATEGORY_ICON,
  HALL_OF_FAME_CATEGORY_LABEL,
  HALL_OF_FAME_CATEGORY_SUBTITLE,
  type Champion,
} from '@/lib/hall-of-fame'

type CompetitiveCategory = 'gun' | 'ace' | 'racing'

/** Per-category visual identity — colors are intentionally distinct from the site's global 3-color system, matching the approved ceremonial reference design for this page only. */
const THEME: Record<
  CompetitiveCategory,
  {
    code: string
    border: string
    borderGradient: string
    headerGradient: string
    accent: string
    glow: string
    tagBg: string
    tagGradient: string
    tagText: string
  }
> = {
gun: {
  code: 'GUN',
  border: '#ff0000',
  borderGradient: 'linear-gradient(180deg, #00ffff 0%, #ff0000 100%)',
  headerGradient: 'linear-gradient(120deg, rgba(0,255,255,0.20), rgba(255,0,0,0.18))',
  accent: '#ff0000',
  glow: '0 0 55px -18px rgba(255,0,0,0.5)',
  tagBg: 'rgba(255,0,0,0.14)',
  tagGradient: 'linear-gradient(90deg, #00ffff 0%, #ff0000 100%)',
  tagText: '#111827',
},

ace: {
  code: 'ACE',
  border: '#00285b',
  borderGradient: 'linear-gradient(180deg, #6babff 0%, #00285b 100%)',
  headerGradient: 'linear-gradient(120deg, rgba(107,171,255,0.24), rgba(0,40,91,0.18))',
  accent: '#00285b',
  glow: '0 0 55px -18px rgba(0,40,91,0.5)',
  tagBg: 'rgba(107,171,255,0.14)',
  tagGradient: 'linear-gradient(90deg, #6babff 0%, #00285b 100%)',
  tagText: '#111827',
},

racing: {
  code: 'WNG',
  border: '#fff12b',
  borderGradient: 'linear-gradient(180deg, #00a1ff 0%, #fff12b 100%)',
  headerGradient: 'linear-gradient(120deg, rgba(0,161,255,0.20), rgba(255,241,43,0.18))',
  accent: '#00a1ff',
  glow: '0 0 55px -18px rgba(0,161,255,0.5)',
  tagBg: 'rgba(0,161,255,0.14)',
  tagGradient: 'linear-gradient(90deg, #00a1ff 0%, #fff12b 100%)',
  tagText: '#111827',
},
}

function ChampionCard({
  champion,
  category,
  theme,
}: {
  champion: Champion
  category: CompetitiveCategory
  theme: (typeof THEME)[CompetitiveCategory]
}) {
  return (
    <div className="corner-cut relative flex flex-col gap-3 border border-border bg-background p-4">
      {(champion.editionLabel || champion.badge) && (
        <div className="flex items-center justify-between gap-2">
          {champion.editionLabel ? (
            <span className="font-display text-[0.58rem] tracking-[0.2em] text-muted-foreground">
              {champion.editionLabel}
            </span>
          ) : (
            <span />
          )}
          {champion.badge && (
            <span
              className="corner-cut px-2 py-0.5 font-display text-[0.55rem] tracking-[0.15em]"
              style={{
                backgroundColor: theme.tagBg,
                color: theme.tagText,
              }}
            >
              {champion.badge === 'record' ? '纪录保持' : '现任冠军'}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border sm:size-16">
          <Image
            src={champion.avatar || '/placeholder.svg'}
            alt={`${champion.playerName} 头像`}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate font-display text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {champion.playerName}
          </span>
          {champion.quote && (
            <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              「{champion.quote}」
            </span>
          )}
        </div>
        {category === 'gun' && (
          <div className="flex shrink-0 flex-col items-center gap-0.5 pl-1">
            <span
              className="font-display text-2xl font-bold leading-none"
              style={{ color: theme.accent }}
            >
              {champion.count}
            </span>
            <span className="text-[0.55rem] text-muted-foreground">冠</span>
          </div>
        )}
      </div>

      <span className="font-display text-[0.55rem] tracking-[0.24em] text-muted-foreground">
        {champion.recordLabel}
      </span>
    </div>
  )
}

export function HallOfFameColumn({
  category,
  delay,
}: {
  category: CompetitiveCategory
  delay?: number
}) {
  const theme = THEME[category]
  const champions = CHAMPIONS[category]

  return (
    <Reveal delay={delay} className="h-full">
      <div
        className="corner-cut h-full p-0.5"
        style={{
  background: theme.borderGradient,
  boxShadow: theme.glow,
}}
      >
        <div className="corner-cut flex h-full flex-col bg-background">
        <div
          className="relative flex items-start justify-between gap-3 px-5 py-5"
          style={{ backgroundImage: theme.headerGradient }}
        >
          <div className="flex flex-col gap-2">
            <span
              className="corner-cut inline-block w-fit px-2 py-0.5 font-display text-[0.6rem] font-bold tracking-[0.2em]"
              style={{ background: theme.tagGradient, color: theme.tagText }}
            >
              {theme.code}
            </span>
            <h3 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {HALL_OF_FAME_CATEGORY_LABEL[category]}
            </h3>
            <span className="text-[0.7rem] text-muted-foreground">
              {champions.length} 人 · {HALL_OF_FAME_CATEGORY_SUBTITLE[category]}
            </span>
          </div>
          <div className="relative size-14 shrink-0 opacity-90 sm:size-16">
            <Image
              src={HALL_OF_FAME_CATEGORY_ICON[category] || '/placeholder.svg'}
              alt=""
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
          {champions.map((champion) => (
            <ChampionCard
              key={champion.id}
              champion={champion}
              category={category}
              theme={theme}
            />
          ))}
        </div>

        <Link
          href={`/hall-of-fame/${category}`}
          className="group flex items-center justify-center gap-2 border-t border-border px-5 py-3 font-display text-[0.62rem] tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
        >
          查看历届记录
          <ArrowRight
            className="size-3 transition-transform group-hover:translate-x-0.5"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </Link>
      </div>
      </div>
    </Reveal>
  )
}
