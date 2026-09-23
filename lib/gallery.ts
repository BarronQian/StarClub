/**
 * Single source of truth for StarClub community gallery photography. The
 * homepage Community Gallery section and the full /gallery page both read
 * from this one array — never duplicate it.
 */
export type GalleryCategory =
  | 'landscape'
  | 'ship'
  | 'portrait'
  | 'event'
  | 'combat'
  | 'racing'
  | 'fun'
  | 'art'
  | 'other'

export type GallerySort = 'latest' | 'popular'

export type GalleryShot = {
  id?: number

  /**
   * 兼容旧 Gallery 数据。
   * 新数据仍保留 src，默认指向 display 图。
   */
  src: string

  /**
   * 上传时保留的原始高清图片。
   */
  originalSrc?: string

  /**
   * Lightbox / 大图浏览使用的展示版本。
   * 默认最长边 2200px。
   */
  displaySrc?: string

  /**
   * Gallery 瀑布流 / Mosaic 使用的缩略图。
   * 默认最长边 800px。
   */
  thumbnailSrc?: string

  alt: string
  caption: string
  author: string
  authorUrl?: string

  profileId?: string
  profileSlug?: string
  profileMatch?: 'manual' | 'automatic'

  category: GalleryCategory

  /** 原始图片尺寸，用于计算布局比例。 */
  width: number

  /** 原始图片尺寸，用于计算布局比例。 */
  height: number

  /** width / height */
  aspectRatio: number

  publishedAt: string
  likes: number
  wide?: boolean
}

export const GALLERY: GalleryShot[] = [
  {
    src: '/images/gallery-seraphine-station.png',
    alt: '从飞船舷窗眺望 Seraphine Station 空间站',
    caption: 'Seraphine Station',
    author: '@OrangeJuzi',
    category: 'landscape',
    width: 3840,
    height: 2160,
    aspectRatio: 3840 / 2160,
    publishedAt: '2026-06-02',
    likes: 142,
    wide: true,
  },
  {
    src: '/images/gallery-icarus.png',
    alt: '太空中的伊卡洛斯空间站与周围星球景观',
    caption: '伊卡洛斯',
    author: '@Yukika',
    category: 'landscape',
    width: 2560,
    height: 1440,
    aspectRatio: 2560 / 1440,
    publishedAt: '2026-05-14',
    likes: 118,
    wide: true,
  },
  {
    src: '/images/gallery-exploration.png',
    alt: '夕阳下探索未知星球地表的飞船',
    caption: '探索无限',
    author: '@shanhe0504',
    category: 'ship',
    width: 2547,
    height: 1025,
    aspectRatio: 2547 / 1025,
    publishedAt: '2026-04-28',
    likes: 96,
    wide: true,
  },
  {
    src: '/images/gallery-terminator-line.jpg',
    alt: '从太空俯瞰星球昼夜交界的晨昏线',
    caption: '晨昏线',
    author: '@Walkertian',
    category: 'landscape',
    width: 2560,
    height: 1440,
    aspectRatio: 2560 / 1440,
    publishedAt: '2026-03-19',
    likes: 87,
  },
  {
    src: '/images/gallery-yela.png',
    alt: '从太空俯瞰耶拉星球及其地表景观',
    caption: '行星耶拉',
    author: '@shanhe0504',
    category: 'landscape',
    width: 2547,
    height: 682,
    aspectRatio: 2547 / 682,
    publishedAt: '2026-02-08',
    likes: 74,
  },
  {
    src: '/images/gallery-2.png',
    alt: '星际公民社区摄影作品二',
    caption: '甲板上的身影',
    author: '@Lapernum',
    category: 'portrait',
    width: 1024,
    height: 1024,
    aspectRatio: 1,
    publishedAt: '2025-08-17',
    likes: 63,
  },
  {
    src: '/images/gallery-who-am-i.png',
    alt: '飘浮在黑暗中的宇航员，周围环绕着发光的头盔与椅子',
    caption: '我是谁',
    author: '@shanhe0504',
    category: 'art',
    width: 2484,
    height: 964,
    aspectRatio: 2484 / 964,
    publishedAt: '2026-08-16',
    likes: 121,
    wide: true,
  },
  {
    src: '/images/gallery-halo-eclipse.jpg',
    alt: '飞船剪影穿越星云中的日食光环',
    caption: '光环',
    author: '@DougAgger',
    category: 'landscape',
    width: 2560,
    height: 1440,
    aspectRatio: 2560 / 1440,
    publishedAt: '2026-08-13',
    likes: 108,
  },
  {
    src: '/images/gallery-soul-leaves-body.png',
    alt: '幽灵般的身影站在漂浮的宇航员上方，四周是教室座椅',
    caption: '魂灵出窍',
    author: '@shanhe0504',
    category: 'art',
    width: 1280,
    height: 1835,
    aspectRatio: 1280 / 1835,
    publishedAt: '2026-08-12',
    likes: 95,
  },
  {
    src: '/images/gallery-favorite-runabout.png',
    alt: '黑白条纹涂装的 Drake 飞船停在雾气弥漫的红花森林中',
    caption: '最喜欢的代步船',
    author: '@The_Sweet',
    category: 'ship',
    width: 2510,
    height: 1440,
    aspectRatio: 2510 / 1440,
    publishedAt: '2026-08-12',
    likes: 77,
  },
  {
    src: '/images/gallery-convoy-assault.jpg',
    alt: '车队沿峡谷小路穿行发起护航突袭行动',
    caption: 'Operation Convoy Assault',
    author: '@GuMieHaoRen',
    category: 'event',
    width: 3840,
    height: 2160,
    aspectRatio: 3840 / 2160,
    publishedAt: '2026-08-08',
    likes: 84,
    wide: true,
  },
  {
    src: '/images/gallery-cruising.jpg',
    alt: '驾驶舱内的飞行员肖像，舷窗外可见一架战机伴飞',
    caption: '正在巡航中',
    author: '@shanhe0504',
    category: 'portrait',
    width: 2547,
    height: 1428,
    aspectRatio: 2547 / 1428,
    publishedAt: '2026-08-03',
    likes: 112,
  },
  {
    src: '/images/gallery-falling-in-neon.jpg',
    alt: '宇航员从高楼边缘坠落，下方是霓虹闪烁的赛博朋克城市',
    caption: '霓虹中坠落',
    author: '@Lapernum',
    category: 'art',
    width: 1620,
    height: 2160,
    aspectRatio: 1620 / 2160,
    publishedAt: '2026-08-02',
    likes: 133,
  },
  {
    src: '/images/gallery-ghost.png',
    alt: '深蓝色房间内，一具身影漂浮在会议桌与椅子上方',
    caption: '幽魂',
    author: '@shanhe0504',
    category: 'art',
    width: 1462,
    height: 1103,
    aspectRatio: 1462 / 1103,
    publishedAt: '2026-08-05',
    likes: 68,
  },
  {
    src: '/images/gallery-shattered-faith.jpg',
    alt: '夕阳下十字形残骸的剪影矗立在荒原上',
    caption: '破碎信仰',
    author: '@shanhe0504',
    category: 'landscape',
    width: 2517,
    height: 996,
    aspectRatio: 2517 / 996,
    publishedAt: '2026-07-28',
    likes: 91,
    wide: true,
  },
  {
    src: '/images/gallery-arrived-at-pyro.jpg',
    alt: '巨大的废弃空间站悬浮在行星上空，标注着派罗星系坐标',
    caption: '今天我们来到了派罗',
    author: '@OrangeJuzi',
    category: 'landscape',
    width: 3840,
    height: 2160,
    aspectRatio: 3840 / 2160,
    publishedAt: '2026-07-28',
    likes: 105,
    wide: true,
  },
  {
    src: '/images/gallery-checkmate-station.png',
    alt: '死局空间站笼罩在星云与阴影中，画面右侧标注站名',
    caption: '死局空间站',
    author: '@shanhe0504',
    category: 'landscape',
    width: 1683,
    height: 947,
    aspectRatio: 1683 / 947,
    publishedAt: '2026-07-28',
    likes: 79,
  },
  {
    src: '/images/gallery-summit-of-the-world.jpg',
    alt: '俯瞰赛博朋克城市的竖幅视角，宇航员趴在天台边缘',
    caption: '世界之巅',
    author: '@Lapernum',
    category: 'landscape',
    width: 2160,
    height: 2880,
    aspectRatio: 2160 / 2880,
    publishedAt: '2026-07-27',
    likes: 98,
  },
  {
    src: '/images/gallery-unknown.png',
    alt: '宇航员悬浮在结构梁之间的黑暗空间站内部',
    caption: '未知',
    author: '@shanhe0504',
    category: 'art',
    width: 2505,
    height: 994,
    aspectRatio: 2505 / 994,
    publishedAt: '2026-07-24',
    likes: 72,
    wide: true,
  },
  {
    src: '/images/gallery-trapped-bird-desert.jpg',
    alt: '荒漠中由集装箱搭成的门形结构，一架紫色飞船卡在其中',
    caption: '被困住的鸟1',
    author: '@shanhe0504',
    category: 'ship',
    width: 2515,
    height: 888,
    aspectRatio: 2515 / 888,
    publishedAt: '2026-07-20',
    likes: 86,
    wide: true,
  },
  {
    src: '/images/gallery-ironclad-at-sunset.jpg',
    alt: '夕阳下停靠在冰原上的舰船剪影',
    caption: '夕阳下的铁甲',
    author: '@shanhe0504',
    category: 'ship',
    width: 1830,
    height: 1281,
    aspectRatio: 1830 / 1281,
    publishedAt: '2026-07-19',
    likes: 65,
  },
  {
    src: '/images/gallery-gatling-fire.png',
    alt: '士兵在沙漠中向远方开火，身后是悬停的运输舰',
    caption: '加特林射击',
    author: '@shanhe0504',
    category: 'combat',
    width: 2560,
    height: 1011,
    aspectRatio: 2560 / 1011,
    publishedAt: '2026-07-17',
    likes: 88,
    wide: true,
  },
  {
    src: '/images/gallery-caught-a-big-fish.jpg',
    alt: '冰原海面上，机甲操作员用光缆牵引出水中的巨型飞船',
    caption: '钓到一条大鱼',
    author: '@Lapernum',
    category: 'fun',
    width: 6880,
    height: 1935,
    aspectRatio: 6880 / 1935,
    publishedAt: '2026-07-17',
    likes: 146,
    wide: true,
  },
  {
    src: '/images/gallery-gazing-afar.jpg',
    alt: '士兵站在着陆舰旁凝望远处的山脊落日',
    caption: '远眺',
    author: '@azeromike',
    category: 'event',
    width: 1920,
    height: 1080,
    aspectRatio: 1920 / 1080,
    publishedAt: '2026-07-16',
    likes: 59,
  },
]

/**
 * The 5 most recently published shots, for the homepage teaser. Purely
 * derived from `publishedAt` — adding a newer shot to `GALLERY` above
 * automatically surfaces it here with no other edits required.
 */
export function getFeaturedGallery(): GalleryShot[] {
  return getSortedGallery(GALLERY, 'latest').slice(0, 8)
}

/**
 * Formats a shot's author for display, normalizing the leading `@` (in case
 * a future entry omits it) and falling back to a placeholder for shots with
 * no author on file instead of rendering a blank line.
 */
export function getDisplayAuthor(shot: GalleryShot): string {
  const author = shot.author?.trim()
  if (!author) return '未知作者'
  return author.startsWith('@') ? author : `@${author}`
}

export const GALLERY_CATEGORY_LABEL: Record<GalleryCategory, string> = {
  landscape: '风景',
  ship: '飞船',
  portrait: '人物',
  event: '活动',
  combat: '战斗',
  racing: '竞速',
  fun: '欢乐时刻',
  art: '同人创作',
  other: '其他',
}

/** Sort shots by most recently published or most liked. */
export function getSortedGallery(
  shots: GalleryShot[],
  sort: GallerySort,
): GalleryShot[] {
  const copy = [...shots]
  if (sort === 'popular') {
    return copy.sort((a, b) => b.likes - a.likes)
  }
  return copy.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
}

export type GalleryMonthGroup = {
  key: string
  year: string
  month: string
  shots: GalleryShot[]
}

/** Groups shots by year/month, assuming they're already sorted by publishedAt desc. */
export function groupGalleryByMonth(shots: GalleryShot[]): GalleryMonthGroup[] {
  const groups = new Map<string, GalleryMonthGroup>()

  for (const shot of shots) {
    // Parse the `YYYY-MM-DD` string directly instead of `new Date(...)`.
    // `new Date('2026-07-28')` parses as UTC midnight, and reading it back
    // with `getFullYear()`/`getMonth()` uses the *local* timezone — so the
    // server (UTC) and a client browser in another timezone can disagree
    // on the month for dates near a boundary, causing a hydration mismatch.
    const [year, month] = shot.publishedAt.split('-')
    const key = `${year}-${month}`
    if (!groups.has(key)) {
      groups.set(key, { key, year, month, shots: [] })
    }
    groups.get(key)!.shots.push(shot)
  }

  return Array.from(groups.values())
}

/**
 * Clamps a shot's real aspect ratio into a display-friendly range so the grid
 * stays tidy while still respecting the photo's actual shape — a square shot
 * renders near-square, a panoramic banner renders wide, instead of every card
 * being force-cropped into the same fixed box.
 */
export function getCardAspectRatio(shot: GalleryShot): number {
  const MIN_RATIO = 0.78
  const MAX_RATIO = 2.3
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, shot.aspectRatio))
}

/** Categories that have at least one published shot, in a stable display order. */
export function getUsedGalleryCategories(shots: GalleryShot[]): GalleryCategory[] {
  const order: GalleryCategory[] = [
    'landscape',
    'ship',
    'portrait',
    'event',
    'combat',
    'racing',
    'fun',
    'art',
    'other',
  ]
  const present = new Set(shots.map((s) => s.category))
  return order.filter((category) => present.has(category))
}
