/**
 * Single source of truth for StarClub sponsor data. Every surface that shows
 * sponsor names, totals, or counts (homepage ticker, homepage stats,
 * /sponsors leaderboard) reads from this one array — never duplicate it.
 */
export type Sponsor = {
  rank: number
  name: string
  /** Chinese community nickname, shown alongside the handle where available. */
  nickname?: string
  /** Special milestone label for the top sponsor, e.g. "赞助大亨". */
  badge?: string
  /** Always a number (USD), never a pre-formatted string. */
  amount: number
}

export const SPONSORS: Sponsor[] = [
  {
    rank: 1,
    name: 'BTxiaocui',
    nickname: '崔少',
    badge: '赞助大亨',
    amount: 644.97,
  },
  {
    rank: 2,
    name: 'ScarletCCC',
    nickname: '斯卡卡',
    amount: 500,
  },
  {
    rank: 3,
    name: 'Furinlada',
    nickname: '拉达',
    amount: 450,
  },
  {
    rank: 4,
    name: 'The_Sweet',
    nickname: '甜总',
    amount: 405.7,
  },
  {
    rank: 5,
    name: 'ChocoNoodles',
    nickname: '巧克力面',
    amount: 385,
  },
  {
    rank: 6,
    name: 'Godoil',
    nickname: '神油',
    amount: 345,
  },
  {
    rank: 7,
    name: 'Lion_Shipcrasher',
    nickname: '狮王',
    amount: 295,
  },
  {
    rank: 8,
    name: 'OrangeJuzi',
    nickname: '橘子',
    amount: 165,
  },
  {
    rank: 9,
    name: 'KULAzite',
    amount: 100,
  },
  {
    rank: 10,
    name: 'Yuri_Yu',
    nickname: 'YY',
    amount: 55,
  },
  {
    rank: 11,
    name: 'ARX_93',
    amount: 55,
  },
  {
    rank: 12,
    name: 'Lapernum',
    nickname: '拉邦那',
    amount: 52,
  },
  {
    rank: 13,
    name: 'BidenInSpace',
    nickname: '拜登',
    amount: 45,
  },
  {
    rank: 14,
    name: 'Lastweek7',
    amount: 45,
  },
  {
    rank: 15,
    name: 'Hitotsuyanagi',
    amount: 30,
  },
  {
    rank: 16,
    name: 'HotpotKing',
    nickname: '火锅',
    amount: 22.17,
  },
  {
    rank: 17,
    name: 'Linkzone',
    amount: 15,
  },
  {
    rank: 18,
    name: 'ASRC_WWW',
    amount: 10,
  },
  {
    rank: 19,
    name: 'Sleepmita',
    nickname: '米塔',
    amount: 9,
  },
  {
    rank: 20,
    name: 'Inorath',
    nickname: '小i',
    amount: 9,
  },
]

/** Sum of every sponsor's contribution, as a raw number. */
export function getSponsorTotal(): number {
  return SPONSORS.reduce(
    (sum, sponsor) =>
      sum + sponsor.amount,
    0,
  )
}

/** Total sponsor count. */
export function getSponsorCount(): number {
  return SPONSORS.length
}

/** Format a single sponsor's amount, e.g. 1000 -> "$1,000.00". */
export function formatSponsorAmount(
  amount: number,
): string {
  return `$${amount.toLocaleString(
    'en-US',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`
}

/** Format the rounded running total, e.g. 4594.87 -> "$4,595". */
export function formatSponsorTotal(
  total: number,
): string {
  return `$${Math.round(
    total,
  ).toLocaleString('en-US')}`
}
