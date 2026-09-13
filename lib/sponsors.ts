export type Sponsor = {
  rank: number
  name: string
  nickname?: string | null
  badge?: string | null
  amount: number
}

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

export function formatSponsorTotal(
  total: number,
): string {
  return `$${Math.round(
    total,
  ).toLocaleString(
    'en-US',
  )}`
}