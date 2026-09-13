import {
  formatSponsorAmount,
} from '@/lib/sponsors'

type SponsorTickerItem = {
  id: string
  rank: number
  name: string
  amount: number
}

function SponsorRow({
  copy,
  sponsors,
}: {
  copy: number
  sponsors: SponsorTickerItem[]
}) {
  return (
    <div
      aria-hidden={
        copy === 1
      }
      role={
        copy === 0
          ? 'list'
          : undefined
      }
      className="flex shrink-0 items-center gap-10 pr-10"
    >
      {sponsors.map(
        (s) => (
          <div
            role={
              copy === 0
                ? 'listitem'
                : undefined
            }
            key={`${copy}-${s.id}`}
            className="flex shrink-0 items-baseline gap-3 whitespace-nowrap"
          >
            <span className="font-display text-[0.62rem] tracking-[0.24em] text-primary">
              {String(
                s.rank,
              ).padStart(
                2,
                '0',
              )}
            </span>

            <span className="text-sm font-medium text-foreground">
              {s.name}
            </span>

            <span
              aria-hidden="true"
              className="text-muted-foreground/50"
            >
              —
            </span>

            <span className="text-sm text-muted-foreground">
              {formatSponsorAmount(
                s.amount,
              )}
            </span>
          </div>
        ),
      )}
    </div>
  )
}

export function SponsorTicker({
  sponsors,
}: {
  sponsors: SponsorTickerItem[]
}) {
  if (
    sponsors.length === 0
  ) {
    return null
  }

  return (
    <div className="border-y border-border">
      <div
        className="ticker-viewport scrollbar-none [&::-webkit-scrollbar]:hidden"
        aria-label="社区赞助者名单"
      >
        <div
          className="ticker-track flex w-max items-center py-5"
          style={{
            animationDuration:
              '58s',
          }}
        >
          <SponsorRow
            copy={0}
            sponsors={
              sponsors
            }
          />

          <SponsorRow
            copy={1}
            sponsors={
              sponsors
            }
          />
        </div>
      </div>
    </div>
  )
}