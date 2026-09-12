/**
 * Single source of truth for StarClub Hall of Fame records.
 *
 * The three competitive categories (gun / ace / racing) are CHAMPIONS ONLY —
 * no runner-up or third-place data is modeled or displayed anywhere. Each
 * category tracks:
 *   - a roster of champions with their cumulative win count, a signature
 *     quote, and a record label (used on the main hall page)
 *   - a chronological edition history (used on the category detail page),
 *     each edition naming only its champion
 *
 * The `casual` category is intentionally a different shape — a flat list of
 * flexible, non-ranked community honors — and must not be forced into the
 * champion model.
 */

export type HallOfFameCategory = 'gun' | 'ace' | 'racing' | 'casual'

export const HALL_OF_FAME_CATEGORY_LABEL: Record<HallOfFameCategory, string> = {
  gun: '绝境枪王榜',
  ace: '空战英豪榜',
  racing: '逐星之翼榜',
  casual: '休闲娱乐赛事榜',
}

export const HALL_OF_FAME_CATEGORY_CODE: Record<HallOfFameCategory, string> = {
  gun: 'GUN',
  ace: 'ACE',
  racing: 'WNG',
  casual: 'CAS',
}

export const HALL_OF_FAME_CATEGORY_EN: Record<HallOfFameCategory, string> = {
  gun: 'FPS Championship',
  ace: 'Dogfight Championship',
  racing: 'Racing Championship',
  casual: 'Casual Records',
}

export const HALL_OF_FAME_CATEGORY_DESC: Record<HallOfFameCategory, string> = {
  gun: '地面 FPS 竞技赛事的历届冠军记录，累计夺冠次数越多，纪录越难以撼动。',
  ace: '空战狗斗竞技场的历届冠军记录。',
  racing: '舰船竞速赛事的历届冠军记录。',
  casual: '不追求名次的社区荣誉与趣味记录，人人皆有可能入选。',
}

/** Category icon image paths, used for the distinct visual identity of each competitive column. */
export const HALL_OF_FAME_CATEGORY_ICON: Record<
  'gun' | 'ace' | 'racing',
  string
> = {
  gun: '/images/hall-of-fame/icon-gun.png',
  ace: '/images/hall-of-fame/icon-ace.png',
  racing: '/images/hall-of-fame/icon-wing.png',
}

/** Column subheading suffix — gun tracks cumulative wins, ace/racing are still small enough to be edition-driven. */
export const HALL_OF_FAME_CATEGORY_SUBTITLE: Record<
  'gun' | 'ace' | 'racing',
  string
> = {
  gun: '累计冠军数',
  ace: '届制',
  racing: '届制',
}

/* -------------------------------------------------------------------- */
/*  Competitive categories — gun / ace / racing                          */
/* -------------------------------------------------------------------- */

export type ChampionBadge = 'record' | 'current'

export type Champion = {
  id: string
  playerName: string
  /** cumulative championship count for this category */
  count: number
  quote: string
  /** e.g. "GUN-x3", "ACE-001", "WNG-002" */
  recordLabel: string
  avatar: string
  badge?: ChampionBadge
  /** shown for ace/racing cards instead of a cumulative count, e.g. "第一届" */
  editionLabel?: string
}

export type HallOfFameEdition = {
  id: string
  edition: string
  season: string
  eventName: string
  date: string
  champion: string
  runnerUp: string
  thirdPlace: string
}

/** Champion rosters, already sorted for main-page display. */
export const CHAMPIONS: Record<'gun' | 'ace' | 'racing', Champion[]> = {
  gun: [
    {
      id: 'gun-mue1syse',
      playerName: 'Mue1syse',
      count: 3,
      quote: '冠军留言还没想好',
      recordLabel: 'GUN-x3',
      avatar: '/images/hall-of-fame/champion-mue1syse.png',
      badge: 'record',
    },
    {
      id: 'gun-ilqwqli',
      playerName: 'ilQwQli',
      count: 3,
      quote: '咕咕嘎嘎',
      recordLabel: 'GUN-x3',
      avatar: '/images/hall-of-fame/champion-ilqwqli.png',
      badge: 'record',
    },
    {
      id: 'gun-hitotsuyanagi',
      playerName: 'Hitotsuyanagi',
      count: 2,
      quote: '不打头算马枪',
      recordLabel: 'GUN-x2',
      avatar: '/images/hall-of-fame/champion-hitotsuyanagi.png',
    },
    {
      id: 'gun-eternityfiee',
      playerName: 'EternityFiee',
      count: 1,
      quote: 'Walk quiet, strike loud. In the black, skill writes my name.',
      recordLabel: 'GUN-x1',
      avatar: '/images/hall-of-fame/champion-eternityfiee.png',
    },
  ],
ace: [
  {
    id: 'ace-coolapple-pie',
    playerName: 'coolapple-pie',
    count: 1,
    quote: 'justaimbetter',
    recordLabel: 'ACE-001',
    avatar: '/images/hall-of-fame/champion-coolapple-pie.png',
    badge: 'current',
    editionLabel: '第一届',
  },
],
racing: [
  {
    id: 'wng-ilqwqli',
    playerName: 'ilQwQli',
    count: 1,
    quote: '咕咕嘎嘎',
    recordLabel: 'WNG-003',
    avatar: '/images/hall-of-fame/champion-ilqwqli.png',
    badge: 'current',
    editionLabel: '第三届',
  },
  {
    id: 'wng-inorath',
    playerName: 'Inorath',
    count: 1,
    quote: '以想要被爱的方式，去给予爱',
    recordLabel: 'WNG-002',
    avatar: '/images/hall-of-fame/champion-inorath.png',
    editionLabel: '第二届',
  },
  {
    id: 'wng-marcuscx6',
    playerName: 'marcuscx6',
    count: 1,
    quote: '弯道快才是真的快 直线谁不会加油',
    recordLabel: 'WNG-001',
    avatar: '/images/hall-of-fame/champion-marcuscx6.png',
    editionLabel: '第一届',
  },
],
}

/** Chronological edition history — champions only, no runner-up or third place. */
export const HALL_OF_FAME_EDITIONS: Record<
  'gun' | 'ace' | 'racing',
  HallOfFameEdition[]
> = {
gun: [
  {
    id: 'gun-9',
    edition: '第九届',
    season: '2956',
    eventName: '绝境枪王 Gun Rush 赛',
    date: '2026.08.09',
    champion: 'Hitotsuyanagi',
    runnerUp: 'HotpotKing',
    thirdPlace: 'marcuscx6',
  },
  {
    id: 'gun-8',
    edition: '第八届',
    season: '2956',
    eventName: '绝境枪王 Gun Rush 赛',
    date: '2026.06.14',
    champion: 'ilQwQli',
    runnerUp: 'HotpotKing',
    thirdPlace: 'Mchoo',
  },
  {
    id: 'gun-7',
    edition: '第七届',
    season: '2956',
    eventName: '绝境枪王 Gun Rush 赛',
    date: '2026.04.19',
    champion: 'ilQwQli',
    runnerUp: 'Hitotsuyanagi',
    thirdPlace: 'rirakanau',
  },
  {
    id: 'gun-6',
    edition: '第六届',
    season: '2956',
    eventName: '绝境枪王 Gun Rush 赛',
    date: '2026.02.22',
    champion: 'Hitotsuyanagi',
    runnerUp: 'Meteor_OwO',
    thirdPlace: 'Inorath',
  },
  {
    id: 'gun-5',
    edition: '第五届',
    season: '2955',
    eventName: '绝境枪王 Gun Rush 赛',
    date: '2025.12.06',
    champion: 'ilQwQli',
    runnerUp: 'Hitotsuyanagi',
    thirdPlace: 'Silvertrap',
  },
  {
    id: 'gun-4',
    edition: '第四届',
    season: '2955',
    eventName: '绝境枪王 Gun Rush 赛',
    date: '2025.10.11',
    champion: 'Mue1syse',
    runnerUp: 'LeeoDD',
    thirdPlace: 'Mchoo',
  },
  {
    id: 'gun-3',
    edition: '第三届',
    season: '2955',
    eventName: '绝境枪王 Gun Rush 赛',
    date: '2025.08.02',
    champion: 'EternityFiee',
    runnerUp: 'GuMieHaoRen',
    thirdPlace: 'Just1nXie',
  },
  {
    id: 'gun-2',
    edition: '第二届',
    season: '2955',
    eventName: '绝境枪王 Gun Rush 赛',
    date: '2025.06.07',
    champion: 'Mue1syse',
    runnerUp: 'Mchoo',
    thirdPlace: 'Btxiaocui',
  },
  {
    id: 'gun-1',
    edition: '第一届',
    season: '2955',
    eventName: '绝境枪王 Gun Rush 赛',
    date: '2025.03.15',
    champion: 'Mue1syse',
    runnerUp: 'DiamondForce',
    thirdPlace: 'Mchoo',
  },
],
ace: [
  {
    id: 'ace-1',
    edition: '第一届',
    season: '2956',
    eventName: '空战英豪狗斗争霸赛',
    date: '2026.08.06',
    champion: 'coolapple-pie',
    runnerUp: 'Yie',
    thirdPlace: 'ilQwQli',
  },
],
  racing: [
    {
      id: 'racing-3',
      edition: '第三届',
      season: '2956',
      eventName: '逐星之翼飞船竞速赛',
      date: '2026.09.08',
      champion: 'ilQwQli',
      runnerUp: 'marcuscx6',
      thirdPlace: 'ChocoNoodles',
    },
    {
      id: 'racing-2',
      edition: '第二届',
      season: '2955',
      eventName: '逐星之翼飞船竞速赛',
      date: '2025.10.04',
      champion: 'Inorath',
      runnerUp: 'marcuscx6',
      thirdPlace: 'EternityFiee',
    },
    {
      id: 'racing-1',
      edition: '第一届',
      season: '2955',
      eventName: '逐星之翼飞船竞速赛',
      date: '2025.08.30',
      champion: 'marcuscx6',
      runnerUp: 'Inorath',
      thirdPlace: 'godoil',
    },
  ],
}

/** Championship counts (first-place finishes only), sorted descending — used on the category detail page. */
export function getChampionshipCounts(
  category: 'gun' | 'ace' | 'racing',
): { playerName: string; count: number }[] {
  return CHAMPIONS[category]
    .map((c) => ({ playerName: c.playerName, count: c.count }))
    .sort((a, b) => b.count - a.count)
}

/** Most recent edition of a competitive category, for main-page panel previews. */
export function getLatestEdition(
  category: 'gun' | 'ace' | 'racing',
): HallOfFameEdition {
  return HALL_OF_FAME_EDITIONS[category][0]
}

/** Number of distinct champions in a competitive category. */
export function getChampionCount(category: 'gun' | 'ace' | 'racing'): number {
  return CHAMPIONS[category].length
}

/* -------------------------------------------------------------------- */
/*  Casual category — flexible, non-ranked honors                       */
/* -------------------------------------------------------------------- */

export type CasualHonor = {
  id: string
  /** e.g. "第一届" */
  edition: string
  /** the honor's own title, e.g. "奥里森 BTR 比赛车王" — every entry can be a different kind of award */
  awardTitle: string
  /** holder name or team name */
  holder: string
  quote?: string
  avatar: string
  eventLogo?: string
}

export const CASUAL_HONORS: CasualHonor[] = [
  {
    id: 'casual-mizutani',
    edition: '第一届',
    awardTitle: '奥里森 BTR 比赛车王',
    holder: 'Mizutani',
    quote: '“车技不好逃不出监狱的”',
    avatar: '/images/hall-of-fame/casual-mizutani.png',
    eventLogo: '/images/hall-of-fame/casual/btr-racing.png',
  },
  {
    id: 'casual-1sgt-pepper',
    edition: '第一届',
    awardTitle: '鱿鱼游戏最终存活者',
    holder: '1Sgt_Pepper',
    quote: '“失踪ing”',
    avatar: '/images/hall-of-fame/casual-1sgt-pepper.png',
    eventLogo: '/images/hall-of-fame/casual/squid-game.png',
  },
  {
    id: 'casual-banu-hotpot',
    edition: '第一届',
    awardTitle: '大逃杀比赛撤离队伍',
    holder: '巴奴火锅队',
    quote: '“不吃火锅浑身难受”',
    avatar: '/images/hall-of-fame/casual-banu-hotpot.png',
    eventLogo: '/images/hall-of-fame/casual/battle-royale.png',
  },
  {
    id: 'casual-combostar',
    edition: '第一届',
    awardTitle: '奥里森拳皇争霸赛拳皇',
    holder: 'Combostar',
    quote: '“力大砖飞”',
    avatar: '/images/hall-of-fame/casual-combostar.png',
    eventLogo: '/images/hall-of-fame/casual/king-of-fighters.png',
  },
]

/* -------------------------------------------------------------------- */
/*  Shared helpers                                                       */
/* -------------------------------------------------------------------- */

export const HALL_OF_FAME_CATEGORIES: HallOfFameCategory[] = [
  'gun',
  'ace',
  'racing',
  'casual',
]

/** Total number of records in a category, for the main-page panel summary. */
export function getRecordCount(category: HallOfFameCategory): number {
  if (category === 'casual') return CASUAL_HONORS.length
  return CHAMPIONS[category].length
}
