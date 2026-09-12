export type ArchivePhoto = {
  src: string
  alt: string
  caption?: string
  /** Panoramic shots span the full grid width. */
  wide?: boolean
  /** Intrinsic pixel size, so photos render uncropped at their original ratio. */
  width?: number
  height?: number
}

/**
 * One dated occurrence inside an album. Albums are recurring events, so each
 * run gets its own block: 第 N 期 + 日期 + 当期合影.
 */
export type ArchiveSession = {
  slug: string
  /** 期号, e.g. 第 1 期 */
  label: string
  /** 举办日期, e.g. 2026.03.14 — leave undefined to render 日期待填写 */
  date?: string
  /** Optional per-run subtitle, e.g. 首次通关 */
  title?: string
  note?: string
  captains?: string[]
  videoUrl?: string
  videoEmbedUrl?: string
videos?: {
  title: string
  platform: 'youtube' | 'bilibili'
  embedUrl: string
}[]
  /** Empty frames rendered after `photos`, reserving room for uploads. */
  reservedSlots: number
  photos: ArchivePhoto[]
}

export type ArchiveAlbum = {
  slug: string
  title: string
  en: string
  summary: string
  place?: string
  cover?: string
  sessions: ArchiveSession[]
}

export type ArchiveCategory = {
  slug: string
  index: string
  title: string
  en: string
  summary: string
  cover?: string
  albums: ArchiveAlbum[]
}

/** Two blank dated runs, used to scaffold albums that have no photos yet. */
function blankSessions(count = 2, slots = 4): ArchiveSession[] {
  return Array.from({ length: count }, (_, i) => ({
    slug: `session-${i + 1}`,
    label: `第 ${i + 1} 期`,
    reservedSlots: slots,
    photos: [],
  }))
}

export const ARCHIVE: ArchiveCategory[] = [
  {
    slug: 'community',
    index: '01',
    title: '社区大型集体合影',
    en: 'Community Gatherings',
    summary: '百人规模的社区集体合影，通常在重要节点或周年活动时组织。',
    cover: '/images/archive/community-gatherings/community-gatherings-cover.jpg',
    albums: [
      {
        slug: 'hundred-crew',
        title: '百人大合影',
        en: 'The Hundred Celebration',
        summary:
          '为纪念星际酒馆 Discord 社区突破 1000 人而举办的百人合影活动，分旅行者酒吧、星枪 MAX 包机与舰队大集结三个阶段。',
        place: '奥里森 · 旅行者酒吧',
        cover: '/images/hc-voyager-bonfire.jpg',
        sessions: [
          {
            slug: 'voyager-bar',
            label: '第一阶段',
            date: '2026.07.11',
            title: '旅行者酒吧合影',
            note: '全员在 Voyager Bar 集结，主厅篝火、三包厢与露台同时开放。',
            reservedSlots: 0,
            photos: [
              {
                src: '/images/hc-voyager-bonfire.jpg',
                width: 3840,
                height: 1778,
                alt: '上百名玩家围坐在酒馆主厅篝火四周合影，地面有红色酒馆标志',
                caption: '主厅篝火大合影',
                wide: true,
              },
              {
                src: '/images/hc-voyager-exterior.jpg',
                width: 3440,
                height: 968,
                alt: 'Voyager Bar 建筑外观，玩家们沿平台栏杆一字排开',
                caption: 'VOYAGER BAR 外景列队',
                wide: true,
              },
              {
                src: '/images/hc-voyager-terrace-wide.jpg',
                width: 3440,
                height: 968,
                alt: '樱花树与粉色天空下的酒馆露台全景，人群聚集在吧台四周',
                caption: '露台全景',
                wide: true,
              },
              {
                src: '/images/hc-voyager-terrace-top.jpg',
                width: 3840,
                height: 2160,
                alt: '从高处俯视酒馆露台，玩家们散布在泳池与吧台之间',
                caption: '露台俯视',
                wide: true,
              },
              {
                src: '/images/hc-voyager-booths.jpg',
                width: 3440,
                height: 968,
                alt: '霓虹粉色灯光下的三个包厢座满玩家',
                caption: '三包厢满座',
                wide: true,
              },
              {
                src: '/images/hc-voyager-escalator.jpg',
                width: 3840,
                height: 2160,
                alt: '玩家们站满中央中庭的双向自动扶梯与二层栏杆',
                caption: '中庭扶梯列队',
                wide: true,
              },
              {
                src: '/images/hc-voyager-booth-flex.png',
                width: 1080,
                height: 1440,
                alt: '一名玩家站在包厢桌上展示肌肉，周围玩家围观',
                caption: '包厢即兴表演',
              },
            ],
          },
          {
            slug: 'starlancer-max',
            label: '第二阶段',
            date: '2026.07.11',
            title: '星航星枪 MAX 客机',
            note: '转场 AEROVIEW 机库，全员登上 MISC Starlancer MAX 包机起飞。',
            reservedSlots: 0,
            photos: [
              {
                src: '/images/hc-max-hangar-wide.jpg',
                width: 3840,
                height: 1495,
                alt: '玩家们在机库中沿 MISC Starlancer MAX 客机机身一字列队',
                caption: '机库检阅列队 · AEROVIEW HANGARS',
                wide: true,
              },
              {
                src: '/images/hc-max-engine.jpg',
                width: 3840,
                height: 2160,
                alt: 'Starlancer MAX 引擎特写，玩家们在登机坡道下集合',
                caption: '登机前 · 引擎特写',
                wide: true,
              },
              {
                src: '/images/hc-max-cabin-aisle.png',
                width: 1672,
                height: 941,
                alt: '昏暗客舱走道，两侧座椅坐满玩家，尽头是舱门',
                caption: '客舱走道',
              },
              {
                src: '/images/hc-max-meal-service.jpg',
                width: 2880,
                height: 2160,
                alt: '空乘推着餐车走过客舱，玩家们坐在座位上等待',
                caption: '机上餐车服务',
              },
              {
                src: '/images/hc-max-inflight.jpg',
                width: 3840,
                height: 2160,
                alt: '飞行中的客舱侧面剖视，玩家们坐在发光座椅上',
                caption: '巡航中的客舱',
                wide: true,
              },
              {
                src: '/images/hc-max-quantum.jpg',
                width: 5160,
                height: 1452,
                alt: '量子跃迁中的蓝色光带划过客舱，玩家们坐在座位上',
                caption: '量子跃迁',
                wide: true,
              },
            ],
          },
          {
            slug: 'fleet-assembly',
            label: '第三阶段',
            date: '2026.07.11',
            title: '舰队大集结合影',
            note: '全员各自登舰，在行星轨道上完成舰队编队与群飞。',

            videos: [
  {
    title: 'YouTube 版',
    platform: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/ZPE0ktyQL5k',
  },
  {
    title: 'Bilibili 版',
    platform: 'bilibili',
    embedUrl: 'https://player.bilibili.com/player.html?bvid=BV1YEgz6ZE65&page=1',
  },
  {
    title: 'B站第一人称版',
    platform: 'bilibili',
    embedUrl: 'https://player.bilibili.com/player.html?bvid=BV1fENv6yEJh&page=1',
  },
],

            reservedSlots: 0,
            photos: [
              {
                src: '/images/hc-fleet-orbit.jpg',
                width: 3840,
                height: 2160,
                alt: '数十艘飞船在橙色行星上空排成密集编队',
                caption: '轨道编队俯视',
                wide: true,
              },
              {
                src: '/images/hc-fleet-sunward.jpg',
                width: 2560,
                height: 1440,
                alt: '舰队朝着恒星方向群飞，引擎蓝光在深空中排成长队',
                caption: '朝阳群飞',
                wide: true,
              },
            ],
          },
        ],
      },
      {
        slug: 'defensecon',
        title: 'Defenson Con 德雷克展大合影',
        en: 'Defenson Con · Drake Expo',
        summary:
          '德雷克展会现场的全部社区集体合影——红毯列队、主舞台、EVERYDAY HEROES 休息区、飞行甲板与带 ID 的全员大合影。',
        place: 'Defenson Con · 德雷克展馆',
        cover: '/images/archive-defensecon.jpg',
        sessions: [
          {
            slug: 'expo-day',
            label: '第 1 期',
            date: '2026.05.23',
            title: '德雷克展全员合影',
            note: '从红毯列队到主舞台、休息区与飞行甲板，德雷克展当天的全部集体合影，最后一张带全员 ID。',
            reservedSlots: 0,
            photos: [
              {
                src: '/images/archive-defensecon.jpg',
                width: 3699,
                height: 2160,
                alt: '玩家们在德雷克展馆红毯两侧列队，头顶悬吊着橙色德雷克运输舰',
                caption: '红毯列队 · DRAKE 主展台',
                wide: true,
              },
              {
                src: '/images/archive-defensecon-fireworks-aisle.jpg',
                width: 3840,
                height: 2160,
                alt: '红毯两侧列队的玩家，展馆内焰火与火柱升起，悬吊运输舰下方是 Railen 展台',
                caption: '焰火开场 · Railen 展台',
                wide: true,
              },
              {
                src: '/images/archive-defensecon-ironclad.jpg',
                width: 3763,
                height: 2117,
                alt: 'Ironclad Assault 主舞台，玩家们站在悬吊运输舰上方的平台，右侧火柱喷发',
                caption: 'Ironclad Assault 主舞台',
                wide: true,
              },
              {
                src: '/images/archive-defensecon-stage-banners.jpg',
                width: 3376,
                height: 1899,
                alt: '玩家们在红色 DRAKE 立体字与 DEFENSECON 竖幅之间列队、跪坐与卧姿合影',
                caption: '主舞台大合影 · DEFENSECON 2956',
                wide: true,
              },
              {
                src: '/images/archive-defensecon-everyday-heroes.jpg',
                width: 3625,
                height: 2039,
                alt: '玩家们围坐在橙色沙发区，背景是金色 EVERYDAY HEROES 立体字',
                caption: 'EVERYDAY HEROES 休息区',
                wide: true,
              },
              {
                src: '/images/archive-defensecon-mural-wall.jpg',
                width: 3833,
                height: 1874,
                alt: '玩家们沿着 DRAKE F*CK YEAH 巨幅涂鸦墙一字排开合影',
                caption: 'DRAKE F*CK YEAH 涂鸦墙',
                wide: true,
              },
              {
                src: '/images/archive-defensecon-billboard-row.jpg',
                width: 3688,
                height: 2075,
                alt: '昏暗展厅内，玩家们在巨幅德雷克宣传灯箱前排成一列长队合影',
                caption: '灯箱长廊列队',
                wide: true,
              },
              {
                src: '/images/archive-defensecon-hologram.jpg',
                width: 3840,
                height: 2160,
                alt: '玩家们在飞行甲板上合影，背景是巨大的蓝色全息舰船投影',
                caption: '飞行甲板 · 全息舰船',
                wide: true,
              },
              {
                src: '/images/archive-defensecon-deck.jpg',
                width: 3707,
                height: 2085,
                alt: '从舰船机翼间望向跑道，玩家们聚集在 DEFENSECON 2956 地贴上，天空中是蓝色全息巨舰',
                caption: '跑道集结 · DEFENSECON 2956',
                wide: true,
              },
              {
                src: '/images/archive-defensecon-nametags.jpg',
                width: 3114,
                height: 1023,
                alt: '红色 DRAKE 立体字前的全员大合影，每位玩家头顶显示 ID 名牌与距离',
                caption: '全员 ID 大合影',
                wide: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'starclub-original',
    index: '02',
    title: '酒馆自定义集体活动合影',
    en: 'StarClub Originals',
    summary:
      '由星际酒馆自己策划的原创活动——大逃杀搜打撤、鱿鱼游戏、伊德里斯CF运输船、拳皇、爆破模式等，玩法与规则都由社区自定。',
    cover: '/images/archive/starclub-originals/starclub-originals-cover.jpg',
albums: [
  {
  slug: 'demolition',
  title: '爆破模式',
  en: 'Demolition',
  summary: '星际酒馆自定义爆破模式活动集体合影。',
  cover: '/images/archive/starclub-originals/demolition/demolition-cover.jpg',
  sessions: [
    {
      slug: 'session-01',
      label: '第1期',
      date: '2026.08.03',
      title: '活动预告拍摄',
      reservedSlots: 0,
      photos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
        src: `/images/archive/starclub-originals/demolition/session-01/2026-08-03-${n}.jpg`,
        width: 2560,
        height: 1440,
        alt: `爆破模式 第1期 ${n}`,
        caption: `第1期 · ${n}`,
        wide: true,
      })),
    },
    {
      slug: 'session-02',
      label: '第2期',
      date: '2026.08.08',
      title: '正式活动',
      reservedSlots: 0,
      photos: [1, 2, 3].map((n) => ({
        src: `/images/archive/starclub-originals/demolition/session-02/2026-08-08-${n}.jpg`,
        width: 2560,
        height: 1440,
        alt: `爆破模式 第2期 ${n}`,
        caption: `第2期 · ${n}`,
        wide: true,
      })),
    },
  ],
},

  {
    slug: 'k-o-f',
    title: '拳皇争霸赛',
    en: 'King of Fighters',
    summary: '星际酒馆致敬拳皇游戏争霸赛活动集体合影。',
cover: '/images/archive/starclub-originals/k-o-f/k-o-f-cover.jpg',
sessions: [
  {
    slug: 'session-01',
    label: '第1期',
    date: '2025.10.20',
    title: '货C空中平台拳皇争霸赛',
    reservedSlots: 0,
    photos: Array.from({ length: 18 }, (_, i) => i + 1).map((n) => ({
      src: `/images/archive/starclub-originals/k-o-f/session-01/2025-10-20-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `拳皇争霸赛 第1期 ${n}`,
      caption: `第1期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-02',
    label: '第2期',
    date: '2026.06.13',
    title: '奥里森擂台拳皇争霸赛',

    videos: [
      {
        title: 'Bilibili 版',
        platform: 'bilibili',
        embedUrl: 'https://player.bilibili.com/player.html?bvid=BV1AT7u63ET2&page=1&autoplay=0&danmaku=0',
      },
    ],

    reservedSlots: 0,
    photos: Array.from({ length: 9 }, (_, i) => i + 1).map((n) => ({
      src: `/images/archive/starclub-originals/k-o-f/session-02/2026-06-13-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `拳皇争霸赛 第2期 ${n}`,
      caption: `第2期 · ${n}`,
      wide: true,
    })),
  },
],
  },

{
  slug: 'battle-royal-game',
  title: '大逃杀搜打撤',
  en: 'Battle Royale',
  summary: '星际酒馆自定义大逃杀搜打撤活动集体合影。',
  cover: '/images/archive/starclub-originals/battle-royal-game/battle-royal-game-cover.jpg',
  sessions: [
    {
      slug: 'session-01',
      label: '第1期',
      date: '2026.06.06',

      videos: [
        {
          title: 'YouTube 版',
          platform: 'youtube',
          embedUrl: 'https://www.youtube.com/embed/2oVgfF91F2Y',
        },
        {
          title: 'Bilibili 版',
          platform: 'bilibili',
          embedUrl: 'https://player.bilibili.com/player.html?bvid=BV1cx776cEjx&page=1&autoplay=0&danmaku=0',
        },
      ],

      reservedSlots: 0,
      photos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((n) => ({
        src: `/images/archive/starclub-originals/battle-royal-game/session-01/2026-06-06-${n}.jpg`,
        width: 2560,
        height: 1440,
        alt: `大逃杀搜打撤 第1期 ${n}`,
        caption: `第1期 · ${n}`,
        wide: true,
      })),
    },
  ],
},

{
  slug: 'idris-cf',
  title: '伊德里斯运输船',
  en: 'Idris Transport',
  summary: '星际酒馆致敬CF运输船地图伊德里斯运输船活动集体合影。',
  cover: '/images/archive/starclub-originals/idris-cf/idris-cf-cover.jpg',
  sessions: [
    {
      slug: 'session-01',
      label: '第1期',
      date: '2025.10.11',

      videos: [
        {
          title: '在星际公民里玩穿越火线运输船地图？只有你想不到的玩法，没有我们做不到的玩法。',
          platform: 'bilibili',
          embedUrl: 'https://player.bilibili.com/player.html?bvid=BV1FG2MBgEdB&page=1&autoplay=0&danmaku=0',
        },
      ],

      reservedSlots: 0,
      photos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((n) => ({
        src: `/images/archive/starclub-originals/idris-cf/2025-10-11-${n}.jpg`,
        width: 2560,
        height: 1440,
        alt: `伊德里斯运输船 第1期 ${n}`,
        caption: `第1期 · ${n}`,
        wide: true,
      })),
    },
  ],
},

  {
    slug: 'squid-game',
    title: '鱿鱼游戏',
    en: 'Squid Game',
    summary: '星际酒馆致敬鱿鱼游戏影视活动集体合影。',
    cover: '/images/archive/starclub-originals/squid-game/session-01/2025-06-07-1.jpg',
    sessions: [
      {
        slug: 'session-01',
        label: '第1期',
        date: '2025.06.07',

        videos: [
  {
    title: '在星际公民里玩“八爪鱼游戏”，这也行？百分之五十五还原！',
    platform: 'bilibili',
    embedUrl: 'https://player.bilibili.com/player.html?bvid=BV18XNszQEr9&page=1&autoplay=0&danmaku=0',
  },
],

        reservedSlots: 0,
        photos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((n) => ({
          src: `/images/archive/starclub-originals/squid-game/session-01/2025-06-07-${n}.jpg`,
          width: 2560,
          height: 1440,
          alt: `鱿鱼游戏 第1期 ${n}`,
          caption: `第1期 · ${n}`,
          wide: true,
        })),
      },
    ],
  },

  {
  slug: 'ski-adventure',
  title: '滑雪大冒险',
  en: 'Ski Adventure',
  summary: '星际酒馆滑雪主题娱乐活动集体合影。',
  cover: '/images/archive/starclub-originals/ski-adventure/ski-adventure-cover.jpg',
  sessions: [
    {
      slug: 'session-01',
      label: '第1期',
      date: '2025.04.18',
      
      videos: [
  {
    title: '什么？沙发桌子也能用来滑雪？这玩的是星际公民吗？',
    platform: 'bilibili',
    embedUrl: 'https://player.bilibili.com/player.html?bvid=BV1ct5xzcES7&page=1&autoplay=0&danmaku=0',
  },
],

      reservedSlots: 0,
      photos: Array.from({ length: 15 }, (_, i) => i + 1).map((n) => ({
        src: `/images/archive/starclub-originals/ski-adventure/session-01/2025-04-18-${n}.jpg`,
        width: 2560,
        height: 1440,
        alt: `滑雪大冒险 第1期 ${n}`,
        caption: `第1期 · ${n}`,
        wide: true,
      })),
    },
  ],
},

  {
    slug: 'sightseeing-tours',
    title: '观光旅游',
    en: 'Sightseeing & Tours',
    summary: '酒馆特色观光旅游活动集体合影。',
    cover: '/images/archive/starclub-originals/sightseeing-tours/session-02/2025-12-03-1.jpg',
    sessions: [
      {
        slug: 'session-01',
        label: '第1期',
        date: '2025.04.16',
        videos: [
  {
    title: '用货船做露天星际酒馆，带着客户们环太空旅行',
    platform: 'bilibili',
    embedUrl: 'https://player.bilibili.com/player.html?bvid=BV1vKLszJEKA&page=1&autoplay=0&danmaku=0',
  },
],
        reservedSlots: 0,
        photos: [1, 2, 3, 4, 5, 6].map((n) => ({
          src: `/images/archive/starclub-originals/sightseeing-tours/session-01/2025-04-16-${n}.jpg`,
          width: 2560,
          height: 1440,
          alt: `观光旅游 第1期 ${n}`,
          caption: `第1期 · ${n}`,
          wide: true,
        })),
      },
      {
        slug: 'session-02',
        label: '第2期',
        date: '2025.12.03',
        reservedSlots: 0,
        photos: [1, 2, 3, 4, 5, 6].map((n) => ({
          src: `/images/archive/starclub-originals/sightseeing-tours/session-02/2025-12-03-${n}.jpg`,
          width: 2560,
          height: 1440,
          alt: `观光旅游 第2期 ${n}`,
          caption: `第2期 · ${n}`,
          wide: true,
        })),
      },
    ],
  },

  {
    slug: 'b-t-r',
    title: '奥里森 BTR',
    en: 'Orison BTR',
    summary: '奥里森 Buggy-Track-Racing赛事活动集体合影。',
    cover: '/images/archive/starclub-originals/b-t-r/b-t-r-cover.jpg',
    sessions: [
      {
        slug: 'session-01',
        label: '第1期',
        date: '2025.04.11',
        
        videos: [
    {
      title: '奥里森 BUGGY 赛道比赛',
      platform: 'bilibili',
      embedUrl: 'https://player.bilibili.com/player.html?bvid=BV1p3onYLExr&page=1&autoplay=0&danmaku=0',
    },
    {
      title: '赛后田径比赛娱乐活动',
      platform: 'bilibili',
      embedUrl: 'https://player.bilibili.com/player.html?bvid=BV1AnoPYNEoj&page=1&autoplay=0&danmaku=0',
    },
  ],
  
        reservedSlots: 0,
        photos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((n) => ({
          src: `/images/archive/starclub-originals/b-t-r/session-01/2025-04-11-${n}.jpg`,
          width: 2560,
          height: 1440,
          alt: `奥里森 BTR 第1期 ${n}`,
          caption: `第1期 · ${n}`,
          wide: true,
        })),
      },
    ],
  },

  {
    slug: 'pirates',
    title: '海盗玩法',
    en: 'Pirate Operations',
    summary: '星际酒馆海盗主题玩法集体活动合影。',
    cover: '/images/archive/starclub-originals/pirates/pirates-cover.jpg',
    sessions: [
      {
        slug: 'session-01',
        label: '第1期',
        date: '2025.03.03',
        reservedSlots: 0,
        photos: [1, 2].map((n) => ({
          src: `/images/archive/starclub-originals/pirates/session-01/2025-03-03-${n}.jpg`,
          width: 2560,
          height: 1440,
          alt: `海盗玩法 第1期 ${n}`,
          caption: `第1期 · ${n}`,
          wide: true,
        })),
      },
      {
        slug: 'session-02',
        label: '第2期',
        date: '2025.03.04',
        videoEmbedUrl: 'https://player.bilibili.com/player.html?bvid=BV1YJRwYgEoo&page=1&autoplay=0&danmaku=0',
        reservedSlots: 0,
        photos: [1, 2].map((n) => ({
          src: `/images/archive/starclub-originals/pirates/session-02/2025-03-04-${n}.jpg`,
          width: 2560,
          height: 1440,
          alt: `海盗玩法 第2期 ${n}`,
          caption: `第2期 · ${n}`,
          wide: true,
        })),
      },
    ],
  },

  {
    slug: 'kill-kopions',
    title: '猎杀洞穴 Kopion 大活动',
    en: 'Kopion Hunt',
    summary: '洞穴 Kopion 猎杀主题集体活动合影。',
    cover: '/images/archive/starclub-originals/kill-kopions/session-02/2024-11-24-1.jpg',
    sessions: [
      {
        slug: 'session-01',
        label: '第1期',
        date: '2024.06.06',
        reservedSlots: 0,
        photos: [1, 2, 3, 4].map((n) => ({
          src: `/images/archive/starclub-originals/kill-kopions/session-01/2024-06-06-${n}.jpg`,
          width: 2560,
          height: 1440,
          alt: `猎杀洞穴 Kopion 大活动 第1期 ${n}`,
          caption: `第1期 · ${n}`,
          wide: true,
        })),
      },
      {
        slug: 'session-02',
        label: '第2期',
        date: '2024.11.24',
        reservedSlots: 0,
        photos: [1, 2].map((n) => ({
          src: `/images/archive/starclub-originals/kill-kopions/session-02/2024-11-24-${n}.jpg`,
          width: 2560,
          height: 1440,
          alt: `猎杀洞穴 Kopion 大活动 第2期 ${n}`,
          caption: `第2期 · ${n}`,
          wide: true,
        })),
      },
    ],
  },
],
  },
  {
    slug: 'sandbox',
    index: '03',
    title: '沙盒副本集体合影',
    en: 'Sandbox Instances',
    summary:
      '各类沙盒副本开始前和结束后的收官合影，按副本地点归档，每个副本内部再按开荒场次与时间分开。',
    cover: '/images/archive/sandbox-instances/sandbox-instances-cover.jpg',
    albums: [
      {
        slug: 'contested-zone',
        title: '争夺区行政机库',
        en: 'Contested Zone · PYAM Executive Hangar',
        summary: '派罗争夺区和焰联行政机库合影。',
        place: '派罗争夺区 · 行政机库',
        cover: '/images/archive/sandbox-instances/executive-hangar/cz-pyamhangar-cover.jpg',
        sessions: [
  {
    slug: 'session-01',
    label: '第1期',
    date: '2024.12.06',
    reservedSlots: 0,
    photos: [
      {
        src: '/images/archive/sandbox-instances/executive-hangar/session-01/2024-12-06.jpg',
        width: 2560,
        height: 1440,
        alt: '争夺区行政机库 第1期',
        caption: '第1期',
        wide: true,
      },
    ],
  },
  {
    slug: 'session-02',
    label: '第2期',
    date: '2024.12.13',
    reservedSlots: 0,
    photos: [
      {
        src: '/images/archive/sandbox-instances/executive-hangar/session-02/2024-12-13-1.jpg',
        width: 2560,
        height: 1440,
        alt: '争夺区行政机库 第2期',
        caption: '第2期',
        wide: true,
      },
      {
        src: '/images/archive/sandbox-instances/executive-hangar/session-02/2024-12-13-2.jpg',
        width: 2560,
        height: 1440,
        alt: '争夺区行政机库 第2期',
        caption: '第2期',
        wide: true,
      },
    ],
  },
  {
    slug: 'session-03',
    label: '第3期',
    date: '2024.12.23',
    reservedSlots: 0,
    photos: [
      {
        src: '/images/archive/sandbox-instances/executive-hangar/session-03/2024-12-23-1.jpg',
        width: 2560,
        height: 1440,
        alt: '争夺区行政机库 第3期',
        caption: '第3期',
        wide: true,
      },
      {
        src: '/images/archive/sandbox-instances/executive-hangar/session-03/2024-12-23-2.jpg',
        width: 2560,
        height: 1440,
        alt: '争夺区行政机库 第3期',
        caption: '第3期',
        wide: true,
      },
      {
        src: '/images/archive/sandbox-instances/executive-hangar/session-03/2024-12-23-3.jpg',
        width: 2560,
        height: 1440,
        alt: '争夺区行政机库 第3期',
        caption: '第3期',
        wide: true,
      },
    ],
  },
  {
    slug: 'session-04',
    label: '第4期',
    date: '2025.01.06',
    reservedSlots: 0,
    photos: [
      {
        src: '/images/archive/sandbox-instances/executive-hangar/session-04/2025-01-06-1.jpg',
        width: 2560,
        height: 1440,
        alt: '争夺区行政机库 第4期',
        caption: '第4期',
        wide: true,
      },
      {
        src: '/images/archive/sandbox-instances/executive-hangar/session-04/2025-01-06-2.jpg',
        width: 2560,
        height: 1440,
        alt: '争夺区行政机库 第4期',
        caption: '第4期',
        wide: true,
      },
    ],
  },
  {
    slug: 'session-05',
    label: '第5期',
    date: '2025.01.07',
    reservedSlots: 0,
    photos: [
      {
        src: '/images/archive/sandbox-instances/executive-hangar/session-05/2025-01-07-1.jpg',
        width: 2560,
        height: 1440,
        alt: '争夺区行政机库 第5期',
        caption: '第5期',
        wide: true,
      },
      {
        src: '/images/archive/sandbox-instances/executive-hangar/session-05/2025-01-07-2.jpg',
        width: 2560,
        height: 1440,
        alt: '争夺区行政机库 第5期',
        caption: '第5期',
        wide: true,
      },
    ],
  },
  {
    slug: 'session-06',
    label: '第6期',
    date: '2025.01.10',
    reservedSlots: 0,
    photos: [
      {
        src: '/images/archive/sandbox-instances/executive-hangar/session-06/2025-01-10-1.jpg',
        width: 2560,
        height: 1440,
        alt: '争夺区行政机库 第6期',
        caption: '第6期',
        wide: true,
      },
      {
        src: '/images/archive/sandbox-instances/executive-hangar/session-06/2025-01-10-2.jpg',
        width: 2560,
        height: 1440,
        alt: '争夺区行政机库 第6期',
        caption: '第6期',
        wide: true,
      },
    ],
  },
  {
    slug: 'session-07',
    label: '第7期',
    date: '2025.01.12',
    reservedSlots: 0,
    photos: [1, 2, 3, 4].map((n) => ({
      src: `/images/archive/sandbox-instances/executive-hangar/session-07/2025-01-12-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `争夺区行政机库 第7期 ${n}`,
      caption: `第7期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-08',
    label: '第8期',
    date: '2025.01.15',
    reservedSlots: 0,
    photos: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
      src: `/images/archive/sandbox-instances/executive-hangar/session-08/2025-01-15-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `争夺区行政机库 第8期 ${n}`,
      caption: `第8期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-09',
    label: '第9期',
    date: '2025.01.18',
    reservedSlots: 0,
    photos: [1, 2].map((n) => ({
      src: `/images/archive/sandbox-instances/executive-hangar/session-09/2025-01-18-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `争夺区行政机库 第9期 ${n}`,
      caption: `第9期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-10',
    label: '第10期',
    date: '2025.01.21',
    reservedSlots: 0,
    photos: [1, 2].map((n) => ({
      src: `/images/archive/sandbox-instances/executive-hangar/session-10/2025-01-21-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `争夺区行政机库 第10期 ${n}`,
      caption: `第10期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-11',
    label: '第11期',
    date: '2025.03.21',
    title: '榴弹炮男团炸翻争夺区',

videos: [
  {
    title: '《榴弹炮男团》炸翻死局争夺区',
    platform: 'bilibili',
    embedUrl: 'https://player.bilibili.com/player.html?bvid=BV15UokY8E46&page=1&autoplay=0&danmaku=0',
  },
],
    reservedSlots: 0,
    photos: [1, 2, 3, 4, 5].map((n) => ({
      src: `/images/archive/sandbox-instances/executive-hangar/session-11/2025-03-21-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `争夺区行政机库 第11期 ${n}`,
      caption: `第11期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-12',
    label: '第12期',
    date: '2025.04.02',
    reservedSlots: 0,
    photos: [1, 2].map((n) => ({
      src: `/images/archive/sandbox-instances/executive-hangar/session-12/2025-04-02-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `争夺区行政机库 第12期 ${n}`,
      caption: `第12期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-13',
    label: '第13期',
    date: '2025.04.30',
    reservedSlots: 0,
    photos: [1, 2].map((n) => ({
      src: `/images/archive/sandbox-instances/executive-hangar/session-13/2025-04-30-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `争夺区行政机库 第13期 ${n}`,
      caption: `第13期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-14',
    label: '第14期',
    date: '2025.05.27',
    reservedSlots: 0,
    photos: [1, 2].map((n) => ({
      src: `/images/archive/sandbox-instances/executive-hangar/session-14/2025-05-27-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `争夺区行政机库 第14期 ${n}`,
      caption: `第14期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-15',
    label: '第15期',
    date: '2025.05.28',
    reservedSlots: 0,
    photos: [1, 2].map((n) => ({
      src: `/images/archive/sandbox-instances/executive-hangar/session-15/2025-05-28-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `争夺区行政机库 第15期 ${n}`,
      caption: `第15期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-16',
    label: '第16期',
    date: '2025.05.29',
    reservedSlots: 0,
    photos: [1, 2].map((n) => ({
      src: `/images/archive/sandbox-instances/executive-hangar/session-16/2025-05-29-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `争夺区行政机库 第16期 ${n}`,
      caption: `第16期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-17',
    label: '第17期',
    date: '2025.05.30',
    reservedSlots: 0,
    photos: [1, 2, 3, 4].map((n) => ({
      src: `/images/archive/sandbox-instances/executive-hangar/session-17/2025-05-30-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `争夺区行政机库 第17期 ${n}`,
      caption: `第17期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-18',
    label: '第18期',
    date: '2025.09.10',
    reservedSlots: 0,
    photos: [1, 2].map((n) => ({
      src: `/images/archive/sandbox-instances/executive-hangar/session-18/2025-09-10-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `争夺区行政机库 第18期 ${n}`,
      caption: `第18期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-19',
    label: '第19期',
    date: '2025.09.27',
    reservedSlots: 0,
    photos: [1, 2].map((n) => ({
      src: `/images/archive/sandbox-instances/executive-hangar/session-19/2025-09-27-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `争夺区行政机库 第19期 ${n}`,
      caption: `第19期 · ${n}`,
      wide: true,
    })),
  },
],
      },
      {
        slug: 'laser-alightment',
        title: '激光校准站',
        en: 'Laser Alightment Station',
        summary: '激光校准站集体活动合影。',
        place: '斯坦顿激光校准站',
        cover: '/images/archive/sandbox-instances/laser-alignment/laser-alignment-cover.jpg',
        sessions: blankSessions(2),
      },
      {
        slug: 'storm-breaker',
        title: '风暴突袭者',
        en: 'Storm Breaker',
        summary: '风暴突袭者集体活动合影。',
        place: '派罗I拉撒路复合体',
        cover: '/images/archive/sandbox-instances/storm-breaker/storm-breaker-cover.jpg',
sessions: [
  {
    slug: 'session-01',
    label: '第1期',
    date: '2025.06.19',
    videoUrl: 'https://www.bilibili.com/video/BV1My3czaEe6/',
    reservedSlots: 0,
    photos: [1, 2, 3].map((n) => ({
      src: `/images/archive/sandbox-instances/storm-breaker/session-01/2025-06-19-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `风暴突袭者 第1期 ${n}`,
      caption: `第1期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-02',
    label: '第2期',
    date: '2025.06.27',
    videoEmbedUrl: 'https://player.bilibili.com/player.html?bvid=BV1DGuMzUEdG&page=1&high_quality=1&danmaku=0&autoplay=0',
    reservedSlots: 0,
    photos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) => ({
      src: `/images/archive/sandbox-instances/storm-breaker/session-02/2025-06-27-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `风暴突袭者 第2期 ${n}`,
      caption: `第2期 · ${n}`,
      wide: true,
    })),
  },
],
      },
      {
        slug: 'asd-onyx',
        title: 'ASD 玛瑙设施',
        en: 'ASD Onyx Facility',
        summary: 'ASD 玛瑙设施集体活动合影。',
        place: 'ASD 玛瑙设施',
        cover: '/images/archive/sandbox-instances/asd-onyx/asd-onyx-cover.jpg',
        sessions: [
  {
    slug: 'session-01',
    label: '第1期',
    date: '2025.10.16',
    reservedSlots: 0,
    photos: [1, 2].map((n) => ({
      src: `/images/archive/sandbox-instances/asd-onyx/session-01/2025-10-16-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `ASD 玛瑙设施 第1期 ${n}`,
      caption: `第1期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-02',
    label: '第2期',
    date: '',
    reservedSlots: 4,
    photos: [],
  },
],
      },
      {
        slug: 'tsg',
        title: '战术打击群 TSG',
        en: 'Tactical Strike Group',
        summary: '战术打击群 TSG 集体活动合影。',
        place: 'QV 空间站',
        cover: '/images/archive/sandbox-instances/tsg/tsg-cover.jpg',
        sessions: [
  {
    slug: 'session-01',
    label: '第1期',
    date: '2026.05.15',
    reservedSlots: 0,
    photos: [1, 2, 3, 4, 5].map((n) => ({
      src: `/images/archive/sandbox-instances/tsg/session-01/2026-05-15-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `战术打击群 TSG 第1期 ${n}`,
      caption: `第1期 · ${n}`,
      wide: true,
    })),
  },
  {
    slug: 'session-02',
    label: '第2期',
    date: '2026.05.30',
    reservedSlots: 0,
    photos: [1, 2].map((n) => ({
      src: `/images/archive/sandbox-instances/tsg/session-02/2026-05-30-${n}.jpg`,
      width: 2560,
      height: 1440,
      alt: `战术打击群 TSG 第2期 ${n}`,
      caption: `第2期 · ${n}`,
      wide: true,
    })),
  },
  {
  slug: 'session-03',
  label: '第3期',
  date: '2026.06.26',
  reservedSlots: 0,
  photos: [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    src: `/images/archive/sandbox-instances/tsg/session-03/2026-06-26-${n}.jpg`,
    width: 2560,
    height: 1440,
    alt: `战术打击群 TSG 第3期 ${n}`,
    caption: `第3期 · ${n}`,
    wide: true,
  })),
},
{
  slug: 'session-04',
  label: '第4期',
  date: '2026.08.22',
  reservedSlots: 0,
  photos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
    src: `/images/archive/sandbox-instances/tsg/session-04/2026-08-22-${n}.jpg`,
    width: 2560,
    height: 1440,
    alt: `战术打击群 TSG 第4期 ${n}`,
    caption: `第4期 · ${n}`,
    wide: true,
  })),
},
],
      },
    ],
  },
  {
    slug: 'fleet-formations',
    index: '04',
    title: '飞船群飞合影',
    en: 'Fleet Formations',
    summary: '各类飞船集结、编队飞行、低空飞行与主题群飞活动合影',
    cover: '/images/archive/ships-flights/ships-flights-cover.jpg',
    albums: [
      {
  slug: 'railen',
  title: 'Railen 锐伦群飞',
  en: 'Fleet Formations · Railen',
  summary: 'Railen 锐伦编队飞行与集体合影。',
  cover: '/images/archive/ships-flights/railen-group-flight/railen-group-flight-cover.jpg',
  sessions: [
    {
      slug: 'session-01',
      label: '第1期',
      date: '2025.06.22',
      reservedSlots: 0,
      photos: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
        src: `/images/archive/ships-flights/railen-group-flight/session-01/2025-06-22-${n}.jpg`,
        width: 2560,
        height: 1440,
        alt: `Railen 锐伦群飞 第1期 ${n}`,
        caption: `第1期 · ${n}`,
        wide: true,
      })),
    },
  ],
  },

  {
  slug: 'perseus',
  title: '英仙座群飞',
  en: 'Fleet Formations · Perseus',
  summary: '英仙座编队飞行与集体合影。',
  cover: '/images/archive/ships-flights/perseus-group-fly/perseus-group-flight-cover.jpg',
  sessions: [
    {
      slug: 'session-01',
      label: '第1期',
      date: '2025.11.19',
      reservedSlots: 0,
      photos: [1, 2, 3, 4, 5, 6, 7].map((n) => ({
        src: `/images/archive/ships-flights/perseus-group-fly/session-01/2025-11-19-${n}.jpg`,
        width: 2560,
        height: 1440,
        alt: `英仙座群飞 第1期 ${n}`,
        caption: `第1期 · ${n}`,
        wide: true,
      })),
    },
  ],
},

{
  slug: 'idris',
  title: '伊德里斯群飞',
  en: 'Fleet Formations · Idris',
  summary: '伊德里斯编队飞行与集体合影。',
  cover: '/images/archive/ships-flights/idris-group-fly/idris-group-flight-cover.jpg',
  sessions: [
    {
      slug: 'session-01',
      label: '第1期',
      date: '2025.05.15',
      reservedSlots: 0,
      photos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => ({
        src: `/images/archive/ships-flights/idris-group-fly/session-01/2025-05-15-${n}.jpg`,
        width: 2560,
        height: 1440,
        alt: `伊德里斯群飞 第1期 ${n}`,
        caption: `第1期 · ${n}`,
        wide: true,
      })),
    },
    {
      slug: 'session-02',
      label: '第2期',
      date: '2025.05.31',
      reservedSlots: 0,
      photos: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
        src: `/images/archive/ships-flights/idris-group-fly/session-02/2025-05-31-${n}.jpg`,
        width: 2560,
        height: 1440,
        alt: `伊德里斯群飞 第2期 ${n}`,
        caption: `第2期 · ${n}`,
        wide: true,
      })),
    },
  ],
},

{
  slug: 'low-fly',
  title: '飞船低飞',
  en: 'Fleet Formations · Low Fly',
  summary: '飞船低空编队飞行与集体合影。',
  cover: '/images/archive/ships-flights/low-fly/low-fly-cover.jpg',
  sessions: [
    {
      slug: 'session-01',
      label: '第1期',
      date: '2025.09.06',
      reservedSlots: 0,
      photos: [1, 2, 3].map((n) => ({
        src: `/images/archive/ships-flights/low-fly/session-01/2025-09-06-${n}.jpg`,
        width: 2560,
        height: 1440,
        alt: `飞船低飞 第1期 ${n}`,
        caption: `第1期 · ${n}`,
        wide: true,
      })),
    },
  ],
},
{
  slug: 'wikelo-polaris',
  title: '维克洛北极星合影',
  en: 'Fleet Formations · Wikelo Polaris',
  summary: '维克洛北极星集结与主题合影。',
  cover: '/images/archive/ships-flights/wikelo-polaris/wikelo-polaris-cover.jpg',
  sessions: [
    {
      slug: 'mizutani-polaris',
      label: '第1期',
      date: '2025.04.22',
      captains: ['Mizutani'],
      reservedSlots: 0,
      photos: [1, 2, 3, 4, 5].map((n) => ({
        src: `/images/archive/ships-flights/wikelo-polaris/mizutani-polaris/2025-04-22-${n}.jpg`,
        width: 2560,
        height: 1440,
        alt: `维克洛北极星合影 第1期 ${n}`,
        caption: `第1期 · ${n}`,
        wide: true,
      })),
    },
    {
      slug: 'furysoulfy-polaris',
      label: '第2期',
      date: '2025.04.26',
      captains: ['Furysoulfy', 'Mizutani'],
      reservedSlots: 0,
      photos: [1, 2, 3, 4].map((n) => ({
        src: `/images/archive/ships-flights/wikelo-polaris/furysoulfy-polaris/2025-04-26-${n}.jpg`,
        width: 2560,
        height: 1440,
        alt: `维克洛北极星合影 第2期 ${n}`,
        caption: `第2期 · ${n}`,
        wide: true,
      })),
    },
  ],
},
    ],
  },
  {
    slug: 'limited-time',
    index: '05',
    title: '限时活动集体合影',
    en: 'Limited-Time Events',
    summary: '官方限时活动期间的社区集体行动合影，按活动届次与日期分开归档。',
    cover: '/images/archive/limited-time-events/limited-time-events-cover.jpg',
    albums: [
{
  slug: 'supply-or-die',
  title: 'Supply or Die',
  en: 'Supply or Die',
  summary: 'Supply or Die 限时活动期间的补给行动与集体合影。',
  place: 'Supply or Die 活动区',
  cover: '/images/archive/limited-time-events/supply-or-die/supply-or-die-cover.jpg',

  sessions: [
    {
      slug: 'session-01',
      label: '第1期',
      date: '2025.02.15',
      title: 'PTU测试服测试合照',
      reservedSlots: 0,

      photos: Array.from({ length: 3 }, (_, i) => i + 1).map((n) => ({
        src: `/images/archive/limited-time-events/supply-or-die/session-01/2025-02-15-${n}.jpg`,
        width: 2560,
        height: 1440,
        alt: `Supply or Die 第1期 ${n}`,
        caption: `第1期 · ${n}`,
        wide: true,
      })),
    },

    {
      slug: 'session-02',
      label: '第2期',
      date: '2025.02.28',

      videos: [
        {
          title: '“补给或灭亡”活动，我们选择地面站PVP任务，钱不钱的无所谓，要的就是爽！',
          platform: 'bilibili',
          embedUrl: 'https://player.bilibili.com/player.html?bvid=BV1WD9eYLEBj&page=1&autoplay=0&danmaku=0',
        },
      ],

      reservedSlots: 0,

      photos: Array.from({ length: 9 }, (_, i) => i + 1).map((n) => ({
        src: `/images/archive/limited-time-events/supply-or-die/session-02/2025-02-28-${n}.jpg`,
        width: 2560,
        height: 1440,
        alt: `Supply or Die 第2期 ${n}`,
        caption: `第2期 · ${n}`,
        wide: true,
      })),
    },
  ],
},
    ],
  },
]

export function getCategory(slug: string) {
  return ARCHIVE.find((c) => c.slug === slug)
}

export function getAlbum(categorySlug: string, albumSlug: string) {
  const category = getCategory(categorySlug)
  if (!category) return undefined
  const album = category.albums.find((a) => a.slug === albumSlug)
  if (!album) return undefined
  return { category, album }
}

export function countAlbumPhotos(album: ArchiveAlbum) {
  return album.sessions.reduce((sum, s) => sum + s.photos.length, 0)
}

export function countPhotos(category: ArchiveCategory) {
  return category.albums.reduce((sum, a) => sum + countAlbumPhotos(a), 0)
}
