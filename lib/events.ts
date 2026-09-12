/**
 * Single source of truth for StarClub community events. The homepage
 * Featured Events section, the /events index, and /events/[slug] detail
 * pages all read from this one array — never duplicate it.
 */
export type EventStatus = 'open' | 'upcoming' | 'ongoing' | 'ended'

export type EventCategory =
  | 'activity'
  | 'competition'
  | 'teaching'
  | 'group-photo'
  | 'other'
export type EventSubcategory =
  | 'sandbox'
  | 'limited-time'
  | 'ship-flight'
  | 'custom'
  | 'community'
  | 'other'

export type EventSeries =
  | 'gun-king'
  | 'air-combat-ace'
  | 'star-wing'
  | 'casual-competition'
  | 'other'

  export type EventSandboxType =
  | 'executive-hangar'
  | 'asd-onyx'
  | 'laser-alignment'
  | 'storm-breaker'
  | 'tsg'
  | 'other'

  export type EventCustomTag =
  | 'casual'
  | 'air-combat'
  | 'fps'
  | 'entertainment'
  | 'racing'
  | 'tribute'
  | 'other'

export type EventTag =
  | 'casual'
  | 'air-combat'
  | 'fps'
  | 'entertainment'
  | 'racing'
  | 'crossover'
  | 'pve'
  | 'vehicle'
  | 'other'

export type EventItem = {
  slug: string
  /** Short Chinese tag rendered on cards, e.g. 赛事 / 教学 / 活动. */
  tag: string
  title: string
  subtitle?: string
  date: string
  timezone?: string
  startTimes?: string[]
  location: string
  category: EventCategory
  subcategory?: EventSubcategory
  series?: EventSeries
  sandboxType?: EventSandboxType
  customTags?: EventCustomTag[]
  tags?: EventTag[]
  status: EventStatus
  image: string
  alt: string
  /** Short description used on cards. */
  description: string
  /** Longer body copy used on the detail page. */
  details?: string
  rules?: string[]
  rewards?: string[]
  slots?: string
  discordUrl?: string
  /** Related archive gallery, if this event has a photo record. */
  archiveHref?: string
  /** Shown on the homepage Featured Events section, in array order. */
  featuredOnHome?: boolean
}

export const EVENTS: EventItem[] = [
    {
    slug: 'dogfight-class-3',
    tag: '教学',
    title: '空战讲堂第三期',
    subtitle: '导师：Kumamoto_Bear',
    date: '待定',
    timezone: 'UTC+8',
    location: '竞技场指挥官 · 自由飞行',
    category: 'teaching',
    status: 'upcoming',
    image: '/images/events/dogfight-class.jpg',
    alt: '空战讲堂中的飞船狗斗训练',
    description: '导师：Kumamoto_Bear。面向萌新与进阶玩家的空战狗斗教学，从基础理论、飞行机动到实战狗斗思路与现场演示。',
    details:
      '本期导师：Kumamoto_Bear\n覆盖基础机动、能量管理与 1v1 狗斗节奏控制\n安排自由对练环节，实时指出错误\n欢迎新手与进阶玩家一同报名。',
    rules: ['报名后请提前进入 Arena Commander Free Fly 模式待命', '课程分理论讲解与实战对练两个环节'],
    slots: '0 / ∞ 席位',
    discordUrl: 'https://discord.com/invite/starclub',
    featuredOnHome: true,
  },

{
  slug: 'star-racing-cup-3',
  tag: '逐星之翼',
  title: '逐星之翼杯 · 第三届',
  subtitle: 'StarClub Racing Championship',
  date: '2026.08.30',
startTimes: [
  '2026-08-31T03:00:00Z',
],
  location: '竞技场指挥官 · 经典竞速',
  category: 'competition',
  series: 'star-wing',
  status: 'open',

  image: '/images/events/star-wing.jpg',
  alt: '星际酒馆逐星之翼杯第三届',

  description:
    '星际酒馆第三届「逐星之翼」竞速赛事，参赛选手将在 Arena Commander 竞速模式中展开对决，争夺本届逐星之翼冠军。',

  details:
    '本届赛事采用 Arena Commander 竞速模式进行比赛，参赛选手通过赛道竞速展开对决，最终决出第三届「逐星之翼」冠军。',

  rewards: [
    '冠军：LTI Basher ×1 +「逐星之翼」专属荣誉 Tag + 永久列入「酒馆名人堂 · 逐星之翼榜」',
    '亚军：LTI 月度包 ×1',
    '季军：飞船皮肤 ×1',
  ],

  archiveHref: '/hall-of-fame',
  featuredOnHome: true,
},

{
  slug: 'soo-speedrun-squad',
  tag: '休闲娱乐赛事',
  title: '奥里森之围最速小队挑战赛',
  subtitle: 'Siege of Orison Speedrun Challenge',
  date: '2026.08.26 开始，为期一个月',
  location: '十字军 · 奥里森',
  category: 'competition',
  series: 'casual-competition',
  status: 'ongoing',

  image: '/images/events/soo-speedrun-squad.jpg',
  alt: '星际酒馆奥里森之围最速小队挑战赛',

  description:
    'Alpha 4.10 LIVE 开启后，四人固定小队挑战奥里森之围最快通关纪录，在挑战期内不断刷新成绩，争夺星际酒馆最速小队称号。',

  details:
    '挑战期内，各小队可报名参加奥里森之围最速通关挑战。所有有效成绩将进入「星际酒馆 · 奥里森最速小队挑战榜」，每支队伍最多拥有 4 次正式挑战机会，并取其中最快成绩作为最终纪录。',

  rules: [
    '每队固定 4 人，可自定义队名',
    '队伍成员发生变动后视为新队伍，需更名并重新计算成绩',
    '每支队伍最多拥有 4 次正式挑战机会，取最快成绩上榜',
    '正式挑战前需提前联系管理组确认挑战时间',
    '挑战期间 4 名成员须全程处于星际酒馆 Discord 语音频道',
    '至少 1 名队员须全程共享屏幕，供管理组确认挑战过程',
    '严禁使用外挂、作弊或利用 BUG / 漏洞获得优势',
    '违规成绩将作废，严重违规者取消挑战资格',
  ],

  rewards: [
    '冠军队伍 4 名成员每人获得 SteelTek 月度包 ×1（$30 Warbond）',
    '4 名成员获得专属绝版 TAG「奥里森之围最速小队」',
    '冠军队伍进入星际酒馆名人堂 · 休闲娱乐赛事榜',
  ],

  slots: '4 人 / 队',

  // 如果你已经有 Discord 报名帖，就放这里
  // discordUrl: '你的 Discord 活动链接',

  featuredOnHome: true,
},

{
  slug: 'dogfight-class-1',
  tag: '空战讲堂',
  title: '星际酒馆 · 空战讲堂第一期',
  subtitle: '空战狗斗基础教学',
  date: '2026.08.09',
  startTimes: ['2026-08-10T02:00:00Z'],
  location: '星际酒馆 · PU 集体活动',
  category: 'teaching',
  status: 'ended',
  image: '/images/events/dogfight-class.jpg',
  alt: '星际酒馆空战讲堂第一期',
  description:
    '导师：Yie。面向萌新与进阶玩家的空战狗斗教学，从基础理论、飞行机动到实战狗斗思路与现场演示。',
  details:
    '本期导师：Yie\n覆盖基础机动、能量管理与 1v1 狗斗节奏控制\n安排自由对练环节，实时指出错误\n欢迎新手与进阶玩家一同报名。',
},

{
  slug: 'dogfight-class-2',
  tag: '空战讲堂',
  title: '星际酒馆 · 空战讲堂第二期',
  subtitle: '空战狗斗基础教学',
  date: '2026.08.14',
  startTimes: ['2026-08-14T12:00:00Z'],
  location: '竞技场指挥官 · 自由飞行',
  category: 'teaching',
  status: 'ended',
  image: '/images/events/dogfight-class.jpg',
  alt: '星际酒馆空战讲堂第二期',
  description:
    '导师：Coolapple-pie。面向萌新与进阶玩家的空战狗斗教学，从基础理论、飞行机动到实战狗斗思路与现场演示。',
  details:
    '本期导师：Coolapple-pie\n覆盖基础机动、能量管理与 1v1 狗斗节奏控制\n安排自由对练环节，实时指出错误\n欢迎新手与进阶玩家一同报名。',
},

{
  slug: 'the-hundred-gathering',
  tag: '大合影',
  title: '千人服务器纪念 · 百人大合影',
  subtitle: 'StarClub 1000 Members Celebration',
  date: '2026.07.11',
startTimes: [
  '2026-07-12T01:00:00Z',
],
  location: '十字军 · 奥里森',
  category: 'group-photo',
  status: 'ended',

  image: '/images/events/thousand-member-group-photo.jpg',
  alt: '星际酒馆千人服务器纪念百人大合影',

  description:
    '为纪念星际酒馆 Discord 突破 1000 人举办的大型社区庆典与百人大合影活动。',

  details:
    '星际酒馆在达成 Discord 1000 人里程碑后举办大型社区庆典，酒友们在奥里森集合并完成百人大合影，随后参与飞船集结、群飞、地面活动等多个庆典环节，共同留下属于星际酒馆的重要社区纪念。',

  archiveHref: '/archive/community/hundred-crew',

  featuredOnHome: false,
},

  {
  slug: 'defensecon-group-photo',
  tag: '大合影',
  title: 'DefenseCon 德雷克展大合影',
  subtitle: 'DefenseCon Group Photo',
  date: '2026.05.22',
  startTimes: [
    '2026-05-23T01:00:00Z',
  ],
  location: '十字军 · 奥里森',
  category: 'group-photo',
  status: 'ended',

  image: '/images/events/defensecon-group-photo.jpg',
  alt: '星际酒馆 DefenseCon 德雷克展大合影',

  description:
    'DefenseCon 期间，星际酒馆组织酒友集体参加德雷克展，并举行社区大合影，记录属于酒馆玩家们的 DefenseCon 时刻。',

  details:
    '活动期间，酒友们统一集合前往 DefenseCon 展区，在德雷克星际的舰船与展区内共同参观、交流并完成集体合影。活动照片现已收录至星际酒馆合影档案。',

  archiveHref: '/archive/community/defensecon',
},

{
  slug: 'gun-king-cup-7',
  tag: '绝境枪王',
  title: '绝境枪王争霸赛 · 第七届',
  subtitle: 'StarClub Gun King Championship',
  date: '2026.01.16',
startTimes: [
  '2026-01-17T02:00:00Z',
],
  location: '竞技场指挥官 · Gun Rush枪战冲刺',
  category: 'competition',
  series: 'gun-king',
  status: 'ended',

  image: '/images/events/gun-king.jpg',
  alt: '星际酒馆绝境枪王争霸赛',

  description:
    '星际酒馆第七届绝境枪王争霸赛，参赛选手通过 Arena Commander Gun Rush 模式进行 1v1 对决，争夺本届「绝境枪王」。',

  details:
    '本届赛事采用 Arena Commander Gun Rush 模式进行 1v1 对决，参赛选手通过淘汰赛逐轮晋级，最终决出第七届绝境枪王。',

  rules: [
    '比赛采用 Arena Commander Gun Rush 模式',
    '比赛形式为 1v1',
    '采用淘汰晋级赛制',
    '率先将武器推进至刀阶段的选手获胜',
    '参赛双方其中一方尽量开启屏幕共享，方便管理组裁判观战',
    '如条件不支持屏幕共享，则由双方共同确认并汇报比赛过程与结果',
  ],

  rewards: [
    '冠军：官网现金护甲包 Shadow Gild Bundle + 专属荣誉炫彩 Tag「绝境枪王」+ 永久列入「酒馆枪王榜」',
    '亚军：官网现金套装 Star Kitten Racing Gear Pack',
    '季军：官网现金皮肤 Wolf Allegro Paint',
    '参与奖：1000万 aUEC',
  ],

  archiveHref: '/hall-of-fame',
  featuredOnHome: false,
},

{
  slug: 'gun-king-cup-6',
  tag: '绝境枪王',
  title: '绝境枪王争霸赛 · 第六届',
  subtitle: 'StarClub Gun King Championship',
  date: '2025.11.28',
startTimes: [
  '2025-11-29T02:00:00Z',
],
  location: '竞技场指挥官 · Gun Rush枪战冲刺',
  category: 'competition',
  series: 'gun-king',
  status: 'ended',

  image: '/images/events/gun-king.jpg',
  alt: '星际酒馆绝境枪王争霸赛',

  description:
    '星际酒馆第六届绝境枪王争霸赛，参赛选手通过 Arena Commander Gun Rush 模式进行 1v1 对决，争夺本届「绝境枪王」。',

  details:
    '本届赛事采用 Arena Commander Gun Rush 模式进行 1v1 对决，参赛选手通过淘汰赛逐轮晋级，最终决出第六届绝境枪王。',

  rules: [
    '比赛采用 Arena Commander Gun Rush 模式',
    '比赛形式为 1v1',
    '采用淘汰晋级赛制',
    '率先将武器推进至刀阶段的选手获胜',
    '参赛双方其中一方尽量开启屏幕共享，方便管理组裁判观战',
    '如条件不支持屏幕共享，则由双方共同确认并汇报比赛过程与结果',
  ],

  rewards: [
    '冠军：1000万 aUEC + R97 “Righteous” 稀有皮肤霰弹枪 + 专属荣誉炫彩 Tag「绝境枪王」+ 永久列入「酒馆枪王榜」',
    '亚军：600万 aUEC',
    '季军：300万 aUEC',
    '参与奖：100万 aUEC',
  ],

  archiveHref: '/hall-of-fame',
  featuredOnHome: false,
},

{
  slug: 'perseus-first-flight-iae2955',
  tag: '活动',
  title: 'IAE 2955 英仙座首航集结活动',
  subtitle: 'Perseus First Flight Gathering',
  date: '2025.11.19',
startTimes: [
  '2025-11-20T02:00:00Z',
],

  location: '斯坦顿 · 赫斯顿与十字军之间深空',

  category: 'activity',
  subcategory: 'ship-flight',
  status: 'ended',

  image: '/images/events/perseus.jpg',
  alt: '星际酒馆 IAE 2955 英仙座首航集结活动',

  description:
    '为庆祝 RSI Perseus 英仙座正式进入游戏，星际酒馆组织英仙座舰队进行首次大型集结、展示与群飞活动。',

  details:
    '参与酒友驾驶 Perseus 在 Stanton 星系集结，完成大型舰队展示、集体合影、编队飞行与量子航行，共同记录英仙座正式进入游戏后的首次酒馆大型舰队活动。',

  archiveHref: '/archive/fleet-formations/perseus',

  featuredOnHome: false,
},

{
  slug: 'king-of-fighters-platform-2025',
  tag: '休闲娱乐赛事',
  title: '空中平台拳皇争霸赛',
  subtitle: 'King of Fighters Platform Battle',
  date: '2025.10.25',
  startTimes: [
    '2025-10-26T01:30:00Z',
  ],

  location: '微科星 · 货C运平台',

  category: 'competition',
  series: 'casual-competition',
  status: 'ended',

  image: '/images/events/k-o-f.jpg',
  alt: '星际酒馆空中平台拳皇争霸赛',

  description:
    '星际酒馆组织的近身格斗娱乐赛事，参赛酒友在高空货运平台展开无枪械团队对抗。',

  details:
    '参赛者仅穿基础服装与飞行头盔，在 MicroTech 高空 C 类货运平台展开近身格斗对抗。比赛禁止使用枪械武器，通过拳击与近战方式决出胜负。',

  rules: [
    '比赛在高空 C 类货运平台进行',
    '参赛者仅穿基础服装与飞行头盔',
    '禁止使用枪械武器',
    '通过拳击及近身格斗进行对抗',
    '比赛期间须服从管理组与裁判安排',
  ],

  archiveHref: '/archive/starclub-original/k-o-f',

  featuredOnHome: false,
},

{
  slug: 'idris-crossfire-cargo-ship',
  tag: '活动',
  title: '伊德里斯 × 穿越火线运输船 FPS 团队竞技赛',
  subtitle: 'CrossFire Cargo Ship · Team Deathmatch',
  date: '2025.10.11',
  startTimes: [
    '2025-10-12T01:30:00Z',
  ],

  location: '深空 · 伊德里斯护卫舰',

  category: 'activity',
  subcategory: 'custom',
  customTags: ['fps', 'entertainment', 'tribute'],
  status: 'ended',

  image: '/images/events/idris-cf.jpg',
  alt: '星际酒馆 伊德里斯 穿越火线运输船 FPS 团队竞技赛',

  description:
    '以《穿越火线》经典运输船地图为灵感，利用 伊德里斯 舰内机库打造大型多人 FPS 团队竞技玩法。',

  details:
    '星际酒馆利用 伊德里斯 舰内空间还原运输船式 FPS 对抗体验，参与酒友分为两支队伍，在限定区域内进行团队竞技，并通过自定义复活与装备规则构建完整的多人对抗玩法。',

  rules: [
    '参与玩家分为两支队伍进行 FPS 团队对抗',
    '比赛区域限定在 伊德里斯 指定舰内空间',
    '按照活动规则进行复活与重新投入战斗',
    '使用活动规定的武器与装备',
    '比赛期间须服从管理组与裁判安排',
  ],

  archiveHref: '/archive/starclub-original/idris-cf',

  featuredOnHome: false,
},

{
  slug: 'asd-onyx-operation-2025-09',
  tag: '活动',
  title: 'ASD 玛瑙设施集体大行动',
  subtitle: 'ASD Onyx Facility Operation',
  date: '2025.09.19',
  startTimes: [
    '2025-09-20T01:00:00Z',
  ],

  location: '斯坦顿 · ASD 玛瑙设施',

  category: 'activity',
  subcategory: 'sandbox',
  sandboxType: 'asd-onyx',
  status: 'ended',

  image: '/images/events/asd.jpg',
  alt: '星际酒馆 ASD 玛瑙设施集体大行动',

  description:
    '星际酒馆组织酒友集体进入 ASD 玛瑙设施展开多人行动，推进设施任务、收集材料并获取相关装备与资源。',

  details:
    '参与酒友统一集结后进入 ASD 玛瑙设施，以多人协作方式推进区域任务与战斗内容，在探索设施的同时收集任务材料与相关资源。',

  featuredOnHome: false,
},

{
  slug: 'gun-king-cup-5',
  tag: '绝境枪王',
  title: '绝境枪王争霸赛 · 第五届',
  subtitle: 'StarClub Gun King Championship',
  date: '2025.10.18',
startTimes: [
  '2025-10-19T01:00:00Z',
],
  location: '竞技场指挥官 · Gun Rush枪战冲刺',
  category: 'competition',
  series: 'gun-king',
  status: 'ended',

  image: '/images/events/gun-king.jpg',
  alt: '星际酒馆绝境枪王争霸赛',

  description:
    '星际酒馆第五届绝境枪王争霸赛，参赛选手通过 Arena Commander Gun Rush 模式进行 1v1 对决，争夺本届「绝境枪王」。',

  details:
    '本届赛事采用 Arena Commander Gun Rush 模式进行 1v1 对决，参赛选手通过淘汰赛逐轮晋级，最终决出第五届绝境枪王。',

  rules: [
    '比赛采用 Arena Commander Gun Rush 模式',
    '比赛形式为 1v1',
    '采用淘汰晋级赛制',
    '率先将武器推进至刀阶段的选手获胜',
    '参赛双方其中一方尽量开启屏幕共享，方便管理组裁判观战',
    '如条件不支持屏幕共享，则由双方共同确认并汇报比赛过程与结果',
  ],

  rewards: [
    '冠军：1000万 aUEC + 专属荣誉炫彩 Tag「绝境枪王」+ 永久列入「酒馆枪王榜」',
  ],

  archiveHref: '/hall-of-fame',
  featuredOnHome: false,
},

{
  slug: 'star-racing-cup-2',
  tag: '逐星之翼',
  title: '逐星之翼杯 · 第二届',
  subtitle: 'StarClub Racing Championship',
  date: '2025.10.04',
startTimes: [
  '2025-10-05T01:30:00Z',
],
  location: '竞技场指挥官 · 经典竞速',
  category: 'competition',
  series: 'star-wing',
  status: 'ended',

  image: '/images/events/star-wing.jpg',
  alt: '星际酒馆逐星之翼杯第二届',

  description:
    '星际酒馆第二届「逐星之翼」竞速赛事，参赛选手在 Arena Commander Classic Race 模式中展开竞速对决，争夺本届逐星之翼冠军。',

  details:
    '本届赛事采用 Arena Commander Classic Race 模式进行比赛，参赛选手通过赛道竞速展开对决，最终决出第二届「逐星之翼」冠军。',

  rewards: [
    '冠军：1000万 aUEC +「逐星之翼」专属荣誉炫彩 Tag + 永久列入「酒馆名人堂 · 逐星之翼榜」',
  ],

  archiveHref: '/hall-of-fame',
  featuredOnHome: false,
},

{
  slug: 'gun-king-cup-4',
  tag: '绝境枪王',
  title: '绝境枪王争霸赛 · 第四届',
  subtitle: 'StarClub Gun King Championship',
  date: '2025.09.20',
startTimes: [
  '2025-09-21T01:00:00Z',
],
  location: '竞技场指挥官 · Gun Rush枪战冲刺',
  category: 'competition',
  series: 'gun-king',
  status: 'ended',

  image: '/images/events/gun-king.jpg',
  alt: '星际酒馆绝境枪王争霸赛',

  description:
    '星际酒馆第四届绝境枪王争霸赛，参赛选手通过 Arena Commander Gun Rush 模式进行 1v1 对决，争夺本届「绝境枪王」。',

  details:
    '本届赛事采用 Arena Commander Gun Rush 模式进行 1v1 对决，参赛选手通过淘汰赛逐轮晋级，最终决出第四届绝境枪王。',

  rules: [
    '比赛采用 Arena Commander Gun Rush 模式',
    '比赛形式为 1v1',
    '采用淘汰晋级赛制',
    '率先将武器推进至刀阶段的选手获胜',
    '参赛双方其中一方尽量开启屏幕共享，方便管理组裁判观战',
    '如条件不支持屏幕共享，则由双方共同确认并汇报比赛过程与结果',
  ],

  rewards: [
    '冠军：专属荣誉炫彩 Tag「绝境枪王」+ 永久列入「酒馆枪王榜」',
  ],

  archiveHref: '/hall-of-fame',
  featuredOnHome: false,
},

{
  slug: 'star-racing-cup-1',
  tag: '逐星之翼',
  title: '逐星之翼杯 · 第一届',
  subtitle: 'StarClub Racing Championship',
  date: '2025.08.30',
startTimes: [
  '2025-08-31T01:00:00Z',
],
  location: '竞技场指挥官 · 经典竞速',
  category: 'competition',
  series: 'star-wing',
  status: 'ended',

  image: '/images/events/star-wing.jpg',
  alt: '星际酒馆逐星之翼杯第一届',

  description:
    '星际酒馆第一届「逐星之翼」竞速赛事，参赛选手在 Arena Commander Classic Race 模式中展开竞速对决，争夺首届逐星之翼冠军。',

  details:
    '作为星际酒馆「逐星之翼」系列赛事的首届比赛，本届赛事采用 Arena Commander Classic Race 模式进行竞速对决，最终决出首位「逐星之翼」冠军。',

  rewards: [
    '冠军：「逐星之翼」专属荣誉炫彩 Tag + 永久列入「酒馆名人堂 · 逐星之翼榜」',
  ],

  archiveHref: '/hall-of-fame',
  featuredOnHome: false,
},

{
  slug: 'gun-king-cup-3',
  tag: '绝境枪王',
  title: '绝境枪王争霸赛 · 第三届',
  subtitle: 'StarClub Gun King Championship',
  date: '2025.08.22',
startTimes: [
  '2025-08-23T01:00:00Z',
],
  location: '竞技场指挥官 · Gun Rush枪战冲刺',
  category: 'competition',
  series: 'gun-king',
  status: 'ended',

  image: '/images/events/gun-king.jpg',
  alt: '星际酒馆绝境枪王争霸赛',

  description:
    '星际酒馆第三届绝境枪王争霸赛，参赛选手通过 Arena Commander Gun Rush 模式进行 1v1 对决，争夺本届「绝境枪王」。',

  details:
    '本届赛事采用 Arena Commander Gun Rush 模式进行 1v1 对决，参赛选手通过淘汰赛逐轮晋级，最终决出第三届绝境枪王。',

  rules: [
    '比赛采用 Arena Commander Gun Rush 模式',
    '比赛形式为 1v1',
    '采用淘汰晋级赛制',
    '率先将武器推进至刀阶段的选手获胜',
    '参赛双方其中一方尽量开启屏幕共享，方便管理组裁判观战',
    '如条件不支持屏幕共享，则由双方共同确认并汇报比赛过程与结果',
  ],

  rewards: [
    '冠军：专属荣誉炫彩 Tag「绝境枪王」+ 永久列入「酒馆枪王榜」',
  ],

  archiveHref: '/hall-of-fame',
  featuredOnHome: false,
},

{
  slug: 'gun-king-cup-2',
  tag: '绝境枪王',
  title: '绝境枪王争霸赛 · 第二届',
  subtitle: 'StarClub Gun King Championship',
  date: '2025.07.25',
startTimes: [
  '2025-07-26T01:00:00Z',
],
  location: '竞技场指挥官 · Gun Rush枪战冲刺',
  category: 'competition',
  series: 'gun-king',
  status: 'ended',

  image: '/images/events/gun-king.jpg',
  alt: '星际酒馆绝境枪王争霸赛',

  description:
    '星际酒馆第二届绝境枪王争霸赛，参赛选手通过 Arena Commander Gun Rush 模式进行 1v1 对决，争夺本届「绝境枪王」。',

  details:
    '本届赛事采用 Arena Commander Gun Rush 模式进行 1v1 对决，参赛选手通过淘汰赛逐轮晋级，最终决出第二届绝境枪王。',

  rules: [
    '比赛采用 Arena Commander Gun Rush 模式',
    '比赛形式为 1v1',
    '采用淘汰晋级赛制',
    '率先将武器推进至刀阶段的选手获胜',
    '参赛双方其中一方尽量开启屏幕共享，方便管理组裁判观战',
    '如条件不支持屏幕共享，则由双方共同确认并汇报比赛过程与结果',
  ],

  rewards: [
    '冠军：专属荣誉炫彩 Tag「绝境枪王」+ 永久列入「酒馆枪王榜」',
  ],

  archiveHref: '/hall-of-fame',
  featuredOnHome: false,
},

{
  slug: 'gun-king-cup-1',
  tag: '绝境枪王',
  title: '绝境枪王争霸赛 · 第一届',
  subtitle: 'StarClub Gun King Championship',
  date: '2025.06.21',
startTimes: [
  '2025-06-22T01:00:00Z',
],
  location: '竞技场指挥官 · Gun Rush枪战冲刺',
  category: 'competition',
  series: 'gun-king',
  status: 'ended',

  image: '/images/events/gun-king.jpg',
  alt: '星际酒馆绝境枪王争霸赛',

  description:
    '星际酒馆第一届绝境枪王争霸赛，参赛选手通过 Arena Commander Gun Rush 模式进行 1v1 对决，争夺首届「绝境枪王」。',

  details:
    '作为星际酒馆「绝境枪王」系列赛事的首届比赛，本届赛事采用 Arena Commander Gun Rush 模式进行 1v1 对决，参赛选手通过淘汰赛逐轮晋级，最终决出首位绝境枪王。',

  rules: [
    '比赛采用 Arena Commander Gun Rush 模式',
    '比赛形式为 1v1',
    '采用淘汰晋级赛制',
    '率先将武器推进至刀阶段的选手获胜',
    '参赛双方其中一方尽量开启屏幕共享，方便管理组裁判观战',
    '如条件不支持屏幕共享，则由双方共同确认并汇报比赛过程与结果',
  ],

  rewards: [
    '冠军：专属荣誉炫彩 Tag「绝境枪王」+ 永久列入「酒馆枪王榜」',
  ],

  archiveHref: '/hall-of-fame',
  featuredOnHome: false,
},

{
  slug: 'air-combat-ace-cup-1',
  tag: '空战英豪',
  title: '空战英豪争霸赛 · 第一届',
  subtitle: 'StarClub Air Combat Championship',
  date: '2026.07.27',
startTimes: [
  '2026-07-28T01:00:00Z',
],
  location: '竞技场指挥官 · 自由飞行',
  category: 'competition',
  series: 'air-combat-ace',
  status: 'ended',

  image: '/images/events/air-combat-ace.jpg',
  alt: '星际酒馆空战英豪争霸赛第一届',

  description:
    '星际酒馆第一届「空战英豪」空战赛事，参赛飞行员通过 1v1 空战对决展开较量，争夺首届「空战英豪」冠军。',

  details:
    '作为星际酒馆「空战英豪」系列赛事的首届比赛，参赛飞行员通过 1v1 对决逐轮晋级，最终决出首位「空战英豪」冠军。',

  rules: [
    '比赛形式为 1v1 空战对决',
    '采用淘汰晋级赛制',
    '参赛选手按照赛事安排进入指定对局',
    '比赛期间须遵守赛事规则及管理组裁判安排',
  ],

  rewards: [
    '冠军：LTI F7A Hornet Mk II ×1 +「空战英豪」荣誉 Tag + 永久列入「星际酒馆空战英豪榜」',
    '亚军：LTI Basher ×1',
    '季军：月度订阅礼包（Monthly Subscription）×1',
  ],

  archiveHref: '/hall-of-fame',
  featuredOnHome: false,
},

{
  slug: 'idris-hide-and-seek-2025',
  tag: '活动',
  title: 'Idris 躲猫猫集体活动',
  subtitle: 'Idris Hide & Seek',
  date: '2025.09.13',
  startTimes: [
    '2025-09-14T01:30:00Z',
  ],

  location: '伊德里斯护卫舰',

  category: 'activity',
  subcategory: 'custom',
  customTags: ['casual', 'fps', 'entertainment'],
  status: 'ended',

  image: '/images/events/idris-hide-and-seek.jpg',
  alt: '星际酒馆 Idris 躲猫猫集体活动',

  description:
    '以 Idris 庞大的舰内空间作为躲猫猫场地，由猎人搜索隐藏在舰内各处的酒友，展开大型多人娱乐活动。',

  details:
    '活动在 Idris 舰内进行。一名玩家担任猎人，其余参与者作为躲藏者分散隐藏在舰内不同区域，通过 Idris 复杂的内部结构展开搜索与躲藏对抗。',

  rules: [
    '一名玩家担任猎人，其余玩家作为躲藏者',
    '猎人可按照活动规定携带枪械进行搜索',
    '躲藏者统一穿着基础白色服装',
    '躲藏者仅允许携带小刀',
    '所有参与者须在规定的 Idris 舰内区域进行活动',
  ],

  featuredOnHome: false,
},

{
  slug: 'pyro-contested-zone-revisit-2025',
  tag: '活动',
  title: '重温派罗争夺区集体活动',
  subtitle: 'Pyro Contested Zone Revisit',
  date: '2025.09.10',
  startTimes: [
    '2025-09-11T01:30:00Z',
  ],

  location: '派罗 · 三大争夺区',

  category: 'activity',
  subcategory: 'sandbox',
  sandboxType: 'executive-hangar',
  status: 'ended',

  image: '/images/events/cz-pyamhangar.jpg',
  alt: '星际酒馆重温派罗争夺区集体活动',

  description:
    '星际酒馆组织酒友重返派罗争夺区，组队推进争夺区战斗内容并再次体验行政机库相关沙盒玩法。',

  details:
    '参与酒友在 Checkmate 死局空间站集合后统一进入派罗争夺区，按照队伍安排推进区域战斗与目标点，并围绕争夺区及行政机库相关内容展开多人协同行动。',

  archiveHref: '/archive/sandbox/contested-zone',

  featuredOnHome: false,
},

{
  slug: 'low-fly-2025',
  tag: '活动',
  title: 'Low-Fly 星球地表战机低飞',
  subtitle: 'Planetary Low-Flying Formation',
  date: '2025.09.06',
  startTimes: [
    '2025-09-07T05:00:00Z',
  ],

  location: '斯坦顿星球地表',

  category: 'activity',
  subcategory: 'ship-flight',
  status: 'ended',

  image: '/images/events/low-fly.jpg',
  alt: '星际酒馆 Low-Fly 星球地表战机低飞活动',

  description:
    '星际酒馆组织酒友驾驶战机进行地表超低空飞行，在多个星球与卫星之间展开低飞与编队活动。',

  details:
    '参与酒友驾驶战机集体出发，前往 Stanton 星系多个不同环境的星球与卫星进行地表超低空飞行。活动路线包含 Daymar、Yela、Aberdeen、Wala、Lyria 与 MicroTech，在不同地貌环境中体验高速贴地飞行与多人编队。',

  archiveHref: '/archive/fleet-formations/low-fly',

  featuredOnHome: false,
},

{
  slug: '890-jump-open-air-club',
  tag: '活动',
  title: '890 游轮露天休闲旅游会所',
  subtitle: '890 Jump Open-Air Club',
  date: '2025.07.05',
  startTimes: [
    '2025-07-06T01:00:00Z',
  ],

  location: 'Pyro · Bloom · Orbituary',

  category: 'activity',
  subcategory: 'custom',
  customTags: ['casual', 'entertainment'],
  status: 'ended',

  image: '/images/events/890-jump-open-air-club.jpg',
  alt: '星际酒馆 890 Jump 露天休闲旅游会所',

  description:
    '星际酒馆利用 890 Jump 打造大型露天休闲会所，组织酒友进行观光、聚会、交流与集体合影。',

  details:
    '参与酒友在 890 Jump 集合，利用开放式机库甲板作为大型休闲区域，在 Pyro 展开集体观光与娱乐活动。酒友们可以在舰上自由交流、聚会，并共同完成活动合影。',

  featuredOnHome: false,
},

{
  slug: 'ikti-geo-apex-worm-hunt',
  tag: '活动',
  title: '机甲空降 · 群殴 APEX 沙虫',
  subtitle: 'IKTI GEO · APEX Worm Hunt',
  date: '2025.06.27',
  startTimes: [
    '2025-06-28T01:00:00Z',
  ],

  location: '派罗 · 盛放星 · 拉撒路凤凰站 II',

  category: 'activity',
  subcategory: 'sandbox',
  sandboxType: 'storm-breaker',
  status: 'ended',

  image: '/images/events/storm-breaker.jpg',
  alt: '星际酒馆机甲空降群殴 APEX 沙虫活动',

  description:
    '星际酒馆组织酒友集体驾驶 IKTI GEO 机甲空降 Lazarus Phoenix II，挑战风暴突袭者沙盒玩法中的 APEX 沙虫。',

  details:
    '参与酒友统一集结后携带 IKTI GEO 机甲前往 Lazarus Phoenix II，通过多人协作挑战 APEX 沙虫，在大型地面战斗中体验风暴突袭者沙盒玩法。',

  archiveHref: '/archive/sandbox/storm-breaker',

  featuredOnHome: false,
},

{
  slug: 'squid-game-special-2025',
  tag: '活动',
  title: '鱿鱼游戏特别场',
  subtitle: 'Squid Game · 123 木头人',
  date: '2025.06.07',
  startTimes: [
    '2025-06-08T01:00:00Z',
  ],

  location: '派罗 I · Rustville 锈迹镇',

  category: 'competition',
  series: 'casual-competition',
  status: 'ended',

  image: '/images/events/squid-game.jpg',
  alt: '星际酒馆鱿鱼游戏特别场',

  description:
    '以《鱿鱼游戏》经典玩法为灵感打造的星际酒馆大型自定义娱乐活动，在 Pyro I 锈迹镇展开多人挑战。',

  details:
    '参与酒友在 Pyro I 的 Rustville 锈迹镇集合，通过《星际公民》的开放世界机制体验以「123 木头人」为核心的主题玩法，并在主要活动结束后继续进行竞速、拳击等娱乐项目。',

  rules: [
    '参与者按照活动组织统一进入指定区域',
    '主要玩法以「123 木头人」规则进行',
    '参与者须按照主持人与管理组指令行动',
    '违反当前回合规则的玩家将被淘汰',
    '主活动结束后可继续参加竞速、拳击等娱乐项目',
  ],

  archiveHref: '/archive/starclub-original/squid-game',

  featuredOnHome: false,
},

{
  slug: 'idris-group-flight-2025',
  tag: '活动',
  title: 'Idris 护卫舰集体群飞',
  subtitle: 'Idris Fleet Formation Flight',
  date: '2025.05.31',
  startTimes: [
    '2025-06-01T04:00:00Z',
  ],

  location: '斯坦顿-派罗',

  category: 'activity',
  subcategory: 'ship-flight',
  status: 'ended',

  image: '/images/events/idris.jpg',
  alt: '星际酒馆 Idris 护卫舰集体群飞活动',

  description:
    '星际酒馆组织多艘 Idris 护卫舰进行大型舰队集结、群飞与跨星系航行活动。',

  details:
    '参与酒友驾驶多艘 Idris 在 Everus Harbor 集结，完成舰队展示与集体合影后统一出发，通过编队飞行、量子航行与跨虫洞移动前往 Pyro，并最终抵达 Orbituary。',

  archiveHref: '/archive/fleet-formations/idris',

  featuredOnHome: false,
},

{
  slug: 'idris-first-flight-2025',
  tag: '活动',
  title: 'Idris 护卫舰首飞',
  subtitle: 'Idris First Flight',
  date: '2025.05.15',
  startTimes: [
    '2025-05-16T01:00:00Z',
  ],

  location: '斯坦顿深空',

  category: 'activity',
  subcategory: 'ship-flight',
  status: 'ended',

  image: '/images/events/idris.jpg',
  alt: '星际酒馆 Idris 护卫舰首飞活动',

  description:
    '星际酒馆组织的 Idris 护卫舰首飞活动，两艘 Idris 首次集结，共同进行展示、飞行与合影。',

  details:
    '两艘 Idris 护卫舰完成集结后进行首次联合飞行，并组织参与酒友进行舰队展示与集体合影，记录 Idris 正式进入酒馆大型舰队活动的重要时刻。',

  archiveHref: '/archive/fleet-formations/idris',

  featuredOnHome: false,
},

{
  slug: 'gun-king-cup-9',
  tag: '绝境枪王',
  title: '绝境枪王争霸赛 · 第九届',
  subtitle: 'StarClub Gun King Championship',
  date: '2026.07.25',
startTimes: [
  '2026-07-26T01:00:00Z',
],
  location: '竞技场指挥官 · Gun Rush枪战冲刺',
  category: 'competition',
  series: 'gun-king',
  status: 'ended',

  image: '/images/events/gun-king.jpg',
  alt: '星际酒馆绝境枪王争霸赛',

  description:
    '星际酒馆第九届绝境枪王争霸赛，参赛选手通过 Arena Commander Gun Rush 模式进行 1v1 对决，争夺本届「绝境枪王」。',

  details:
    '本届赛事采用 Arena Commander Gun Rush 模式进行 1v1 对决，并划分北美赛区与亚欧澳赛区。各赛区通过 BO1 晋级赛决出冠军，两大赛区冠军最终进行 BO3 1v1 总决赛，决出第九届绝境枪王。',

  rules: [
    '比赛采用 Arena Commander Gun Rush 模式',
    '比赛形式为 1v1',
    '北美赛区与亚欧澳赛区分别进行 BO1 晋级赛',
    '率先将武器推进至刀阶段的选手获胜',
    '两大赛区冠军进行 BO3 最终对决',
    '参赛双方其中一方尽量开启屏幕共享，方便管理组裁判观战',
    '如条件不支持屏幕共享，则由双方共同确认并汇报比赛过程与结果',
  ],

  rewards: [
    '冠军：官网现金护甲包 Goldsmith Bundle + 专属荣誉炫彩 Tag「绝境枪王」+ 永久列入「酒馆枪王榜」',
    "亚军：官网现金套装 RRS Morozov-SH 'Aftershock' Armor Set",
    '季军：官网现金包 Companion Kit',
    '殿军：官网现金包 PSX Pistol Case',
  ],

  archiveHref: '/hall-of-fame',
  featuredOnHome: false,
},

{
  slug: 'gun-king-cup-8',
  tag: '绝境枪王',
  title: '绝境枪王争霸赛 · 第八届',
  subtitle: 'StarClub Gun King Championship',
  date: '2026.05.30',
startTimes: [
  '2026-05-31T01:00:00Z',
],
  location: '竞技场指挥官 · Gun Rush枪战冲刺',
  category: 'competition',
  series: 'gun-king',
  status: 'ended',

  image: '/images/events/gun-king.jpg',
  alt: '星际酒馆绝境枪王争霸赛',

  description:
    '星际酒馆第八届绝境枪王争霸赛，参赛选手通过 Arena Commander Gun Rush 模式进行 1v1 对决，争夺本届「绝境枪王」。',

  details:
    '本届赛事采用 Arena Commander Gun Rush 模式进行 1v1 对决，参赛选手通过淘汰赛逐轮晋级，最终决出第八届绝境枪王。',

  rules: [
    '比赛采用 Arena Commander Gun Rush 模式',
    '比赛形式为 1v1',
    '采用淘汰晋级赛制',
    '率先将武器推进至刀阶段的选手获胜',
    '参赛双方其中一方尽量开启屏幕共享，方便管理组裁判观战',
    '如条件不支持屏幕共享，则由双方共同确认并汇报比赛过程与结果',
  ],

  rewards: [
    '冠军：官网现金护甲包 Redline Bundle + 专属荣誉炫彩 Tag「绝境枪王」+ 永久列入「酒馆枪王榜」',
    "亚军：官网现金套装 Contractor's Kit",
    '季军：官网现金皮肤包 "Igniter" Lightning Bolt Co. Weapons Pack',
  ],

  archiveHref: '/hall-of-fame',
  featuredOnHome: false,
},

{
  slug: 'onyx-yormandi-hunt-2025',
  tag: '活动',
  title: 'Onyx Site B · Yormandi 狩猎行动',
  subtitle: 'ASD Onyx · Yormandi Hunt',
  date: '2025.10.16',
startTimes: [
  '2025-10-17T01:00:00Z',
],

  location: '斯坦顿 · ASD 玛瑙设施',

  category: 'activity',
  subcategory: 'sandbox',
  sandboxType: 'asd-onyx',
  status: 'ended',

  image: '/images/events/asd.jpg',
  alt: '星际酒馆 Onyx Site B Yormandi 狩猎行动',

  description:
    '星际酒馆组织酒友集体前往 Onyx Site B 展开 Yormandi 狩猎行动，在 ASD 玛瑙设施区域进行多人协作探索与战斗。',

  details:
    '参与酒友统一组队前往 Onyx Site B，在玛瑙设施区域搜寻并狩猎 Yormandi，通过多人协作完成行动，并在活动结束后进行集体合影留念。',

  archiveHref: '/archive/sandbox/asd-onyx',

  featuredOnHome: false,
},

{
  slug: 'btr-2025',
  tag: '活动',
  title: 'BTR 集体活动',
  subtitle: 'StarClub BTR',
  date: '2025.04.11',
  startTimes: [
    '2025-04-12T01:00:00Z',
  ],

  location: '斯坦顿 · 奥里森 · 愿景中心',

  category: 'competition',
  series: 'casual-competition',
  status: 'ended',

  image: '/images/events/b-t-r.jpg',
  alt: '星际酒馆 BTR 集体活动',

  description:
    '星际酒馆组织的大型 BTR 自定义集体活动，通过多人协作与自定义规则体验酒馆原创玩法。',

  details:
    '参与酒友统一集结并按照活动规则进行 BTR 多人自定义玩法，在《星际公民》的开放世界中展开大型集体娱乐活动。',

  archiveHref: '/archive/starclub-original/b-t-r',

  featuredOnHome: false,
},

{
  slug: 'battle-royale-2025',
  tag: '活动',
  title: '大逃杀集体活动',
  subtitle: 'StarClub Battle Royale',
  date: '2026.06.06',
  startTimes: [
    '2026-06-07T01:00:00Z',
  ],

  location: '派罗 I · Rustville 锈迹镇',

  category: 'competition',
  series: 'casual-competition',
  status: 'ended',

  image: '/images/events/battle-royal.jpg',
  alt: '星际酒馆大逃杀集体活动',

  description:
    '以 Battle Royale 生存竞技为核心设计的星际酒馆大型自定义多人活动，参与酒友通过搜集装备、战斗与生存争夺最终胜利。',

  details:
    '参与酒友按照活动规则进入指定区域，在有限资源与持续对抗的环境中搜集装备、与其他玩家交战并尽可能生存到最后，通过《星际公民》的开放世界机制体验酒馆自定义大逃杀玩法。',

  rules: [
    '参与者按照活动安排统一进入指定区域',
    '玩家需要自行搜集可用装备与资源',
    '活动过程中允许玩家之间进行 FPS 对抗',
    '被淘汰后不得重新返回当局比赛',
    '最终存活的玩家或队伍获得胜利',
  ],
  
  rewards: [
  '成功获胜吃鸡的小队成员，每人获得绝版荣誉 Tag「第一届吃鸡冠军」',
],

  archiveHref: '/archive/starclub-original/battle-royal-game',

  featuredOnHome: false,
},

{
  slug: 'demolition',
  tag: '自定义玩法',
  title: '爆破模式',
  subtitle: 'StarClub Demolition',
  date: '2026.08.08',
startTimes: [
  '2026-08-09T01:00:00Z',
],
  location: '派罗 IV · Sacren’s Plot',
  category: 'activity',
  subcategory: 'custom',
  customTags: ['fps', 'entertainment', 'tribute'],
  status: 'ended',

  image: '/images/events/demolition.jpg',
  alt: '星际酒馆爆破模式集体活动',

  description:
    '以经典爆破玩法为灵感打造的星际酒馆自定义 FPS 团队对抗活动，双方围绕 S10 航弹目标展开攻防。',

  details:
    '活动在 Pyro IV 的 Sacren’s Plot 举行，玩家分为进攻方与防守方。防守方负责守卫目标区域，进攻方则需要突破防线并完成 S10 航弹目标。通过《星际公民》的开放世界机制，将传统爆破模式搬进游戏宇宙。',

  rules: [
    '玩家分为进攻方与防守方进行团队对抗',
    '防守方人数为 1 队，进攻方人数约为防守方的 1.5 倍',
    '进攻方围绕 S10 航弹目标完成进攻任务',
    '活动期间禁止使用坦克',
    '玩家死亡后不得重新返回战场',
    '双方需按照活动组织与裁判安排进行行动',
  ],

  archiveHref: '/archive/starclub-original/demolition',

  featuredOnHome: false,
},

{
  slug: 'pirates-2025',
  tag: '活动',
  title: '海盗主题集体活动',
  subtitle: 'StarClub Pirates',
  date: '2025.03.03',
  startTimes: [
    '2025-03-04T02:00:00Z',
  ],

  location: '派罗深空',

  category: 'activity',
  subcategory: 'custom',
  customTags: ['fps', 'entertainment'],
  status: 'ended',

  image: '/images/events/pirates.jpg',
  alt: '星际酒馆海盗主题集体活动',

  description:
    '以星际海盗为主题的酒馆大型多人自定义活动，参与酒友组成海盗阵营，在宇宙中展开集体行动。',

  details:
    '参与酒友以海盗主题进行统一集结，通过多人协作、舰船行动与 FPS 战斗体验《星际公民》中的海盗玩法，并记录酒馆早期大型主题活动。',

  archiveHref: '/archive/starclub-original/pirates',

  featuredOnHome: false,
},

{
  slug: 'ski-adventure-2025',
  tag: '活动',
  title: '星际酒馆滑雪集体活动',
  subtitle: 'StarClub Ski Adventure',
  date: '2025.04.18',
  startTimes: [
    '2025-04-19T01:00:00Z',
  ],

  location: '斯坦顿 · 微科',

  category: 'activity',
  subcategory: 'custom',
  customTags: ['casual', 'entertainment'],
  status: 'ended',

  image: '/images/events/ski-adventure.jpg',
  alt: '星际酒馆滑雪集体活动',

  description:
    '星际酒馆组织酒友前往 MicroTech 雪山区域，利用游戏中的地形与载具体验多人滑雪主题娱乐活动。',

  details:
    '参与酒友在 MicroTech 集合后前往雪山区域，通过雪地地形展开集体滑雪、娱乐与合影，在《星际公民》的开放世界中体验不同于常规战斗与任务的休闲玩法。',

  archiveHref: '/archive/starclub-original/ski-adventure',

  featuredOnHome: false,
},

{
  slug: 'hull-c-sightseeing-tour-2025-04-16',
  tag: '活动',
  title: 'Hull-C 观光旅游 · 第一期',
  subtitle: 'Hull-C Sightseeing Tour',
  date: '2025.04.16',
  startTimes: [
    '2025-04-17T01:00:00Z',
  ],

  location: '斯坦顿',

  category: 'activity',
  subcategory: 'custom',
  customTags: ['casual', 'entertainment'],
  status: 'ended',

  image: '/images/events/sightseeing-tour.jpg',
  alt: '星际酒馆 Hull-C 观光旅游第一期',

  description:
    '星际酒馆 Hull-C 观光旅游系列第一期，利用大型货船打造露天星际酒馆，带领酒友展开多人太空旅行。',

  details:
    '参与酒友搭乘 Hull-C 集体出发，将大型货船作为移动式露天星际酒馆，在旅途中进行观光、交流、娱乐与集体合影，共同体验大型多人星际旅行。',

  archiveHref: '/archive/starclub-original/sightseeing-tours',

  featuredOnHome: false,
},

{
  slug: 'hull-c-sightseeing-tour-2025-12-03',
  tag: '活动',
  title: 'Hull-C 观光旅游 · 第二期',
  subtitle: 'Hull-C Sightseeing Tour',
  date: '2025.12.03',
  startTimes: [
    '2025-12-04T02:00:00Z',
  ],

  location: '斯坦顿',

  category: 'activity',
  subcategory: 'custom',
  customTags: ['casual', 'entertainment'],
  status: 'ended',

  image: '/images/events/sightseeing-tour.jpg',
  alt: '星际酒馆 Hull-C 观光旅游第二期',

  description:
    '星际酒馆 Hull-C 观光旅游系列第二期，再次以大型货船作为移动式星际酒馆，带领酒友展开集体太空旅行。',

  details:
    '延续第一期 Hull-C 露天星际酒馆的玩法，参与酒友搭乘 Hull-C 集体出发，在宇宙中进行观光、交流、娱乐与合影。',

  archiveHref: '/archive/starclub-original/sightseeing-tours',

  featuredOnHome: false,
},

{
  slug: 'kopion-hunt-2024-06-06',
  tag: '活动',
  title: '寇骈犬猎杀集体活动 · 第一期',
  subtitle: 'Kopion Hunt',
  date: '2024.06.06',
  startTimes: [
    '2024-06-07T01:00:00Z',
  ],

  location: '斯坦顿',

  category: 'activity',
  subcategory: 'custom',
  customTags: ['casual', 'entertainment'],
  status: 'ended',

  image: '/images/events/kill-kopions.jpg',
  alt: '星际酒馆寇骈犬猎杀集体活动第一期',

  description:
    '星际酒馆组织酒友展开寇骈犬猎杀行动，集体前往野外寻找并猎杀 Kopion。',

  details:
    '参与酒友统一集结后前往野外区域搜索寇骈犬，通过多人协作展开猎杀与探索，并进行集体合影，体验《星际公民》中的野生生物玩法。',

  archiveHref: '/archive/starclub-original/kill-kopions',

  featuredOnHome: false,
},

{
  slug: 'kopion-hunt-2024-11-24',
  tag: '活动',
  title: '寇骈犬猎杀集体活动 · 第二期',
  subtitle: 'Kopion Hunt',
  date: '2024.11.24',
  startTimes: [
    '2024-11-25T02:00:00Z',
  ],

  location: '斯坦顿',

  category: 'activity',
  subcategory: 'custom',
  customTags: ['casual', 'entertainment'],
  status: 'ended',

  image: '/images/events/kill-kopions.jpg',
  alt: '星际酒馆寇骈犬猎杀集体活动第二期',

  description:
    '星际酒馆寇骈犬猎杀系列第二期，组织酒友再次集结前往野外区域寻找并猎杀 Kopion。',

  details:
    '参与酒友统一集结后前往野外区域搜索寇骈犬，通过多人协作展开猎杀、探索与集体行动，共同体验《星际公民》中的野生生物玩法。',

  archiveHref: '/archive/starclub-original/kill-kopions',

  featuredOnHome: false,
},

{
  slug: 'tsg-2026-05-15',
  tag: '战术打击群 TSG',
  title: '战术打击群 TSG · 第一期',
  subtitle: 'Tactical Strike Group',
  date: '2026.05.15',
  startTimes: [
  '2026-05-16T01:00:00Z',
],
  location: '尼克斯 · 列夫斯基',
  category: 'activity',
  subcategory: 'sandbox',
  sandboxType: 'tsg',
  status: 'ended',

  image: '/images/events/tsg.jpg',
  alt: '星际酒馆战术打击群 TSG 第一期',

  description:
    '星际酒馆第一期战术打击群 TSG 集体活动，酒友们在 Levski 集合并组队完成 TSG 任务，共同获取任务奖励与随机蓝图掉落。',

  details:
    '作为星际酒馆 TSG 系列的第一期集体活动，参与玩家在 Nyx 星系 Levski 集合，跟随队伍完成 TSG 战术打击群任务，在多人协同作战的同时获取任务奖励，并有机会获得多种稀有装备及蓝图。',

  rules: [
    '集合地点：尼克斯 · 列夫斯基',
    '跟随活动队伍统一行动并完成 TSG 战术打击群任务',
    '适合希望体验 TSG、获取稀有蓝图及提升多人战斗经验的玩家',
  ],

  rewards: [
    '随机获取各种尺寸 Military A 级发电机蓝图',
    '随机获取各种尺寸 Omnisky Cannons 蓝图',
    '随机获取多种颜色竞速飞行服',
    '随机获取多种颜色竞速头盔',
    '随机获取 Crossbow 十字弩蓝图（两种配色）',
  ],

  archiveHref: '/archive/sandbox/tsg',

  featuredOnHome: false,
},

{
  slug: 'tsg-2026-05-30',
  tag: '战术打击群 TSG',
  title: '战术打击群 TSG · 第二期',
  subtitle: 'Tactical Strike Group',
  date: '2026.05.30',
  startTimes: [
  '2026-05-31T01:00:00Z',
],
  location: '尼克斯 · 列夫斯基',
  category: 'activity',
  subcategory: 'sandbox',
  sandboxType: 'tsg',
  status: 'ended',

  image: '/images/events/tsg.jpg',
  alt: '星际酒馆战术打击群 TSG 第二期',

  description:
    '星际酒馆第二期战术打击群 TSG 集体活动，酒友们在 Levski 集合并组队完成 TSG 任务，共同获取任务奖励与随机蓝图掉落。',

  details:
    '本次为星际酒馆 TSG 系列第二期集体活动，参与玩家在 Nyx 星系 Levski 集合，跟随队伍完成 TSG 战术打击群任务，在多人协同作战的同时获取任务奖励，并有机会获得多种稀有装备及蓝图。',

  rules: [
    '集合地点：Nyx 星系 · Levski',
    '跟随活动队伍统一行动并完成 TSG 战术打击群任务',
    '适合希望体验 TSG、获取稀有蓝图及提升多人战斗经验的玩家',
  ],

  rewards: [
    '随机获取各种尺寸 Military A 级发电机蓝图',
    '随机获取各种尺寸 Omnisky Cannons 蓝图',
    '随机获取多种颜色竞速飞行服',
    '随机获取多种颜色竞速头盔',
    '随机获取 Crossbow 十字弩蓝图（两种配色）',
  ],

  archiveHref: '/archive/sandbox/tsg',

  featuredOnHome: false,
},

{
  slug: 'tsg-2026-06-26',
  tag: '战术打击群 TSG',
  title: '战术打击群 TSG · 第三期',
  subtitle: 'Tactical Strike Group',
  date: '2026.06.26',
startTimes: [
  '2026-06-27T01:00:00Z',
],
  location: '尼克斯 · 列夫斯基',
  category: 'activity',
  subcategory: 'sandbox',
  sandboxType: 'tsg',
  status: 'ended',

  image: '/images/events/tsg.jpg',
  alt: '星际酒馆战术打击群 TSG 第三期',

  description:
    '星际酒馆第三期战术打击群 TSG 集体活动，酒友们在 Levski 集合并组队完成 TSG 任务，共同获取任务奖励与随机蓝图掉落。',

  details:
    '本期活动在 Nyx 星系 Levski 集合。参与玩家跟随队伍完成 TSG 战术打击群任务，在多人协同作战的同时获取任务奖励，并有机会获得多种稀有装备及蓝图。',

  rules: [
    '集合地点：Nyx 星系 · Levski',
    '跟随活动队伍统一行动并完成 TSG 战术打击群任务',
    '适合希望体验 TSG、获取稀有蓝图及提升多人战斗经验的玩家',
  ],

  rewards: [
    '随机获取各种尺寸 Military A 级发电机蓝图',
    '随机获取各种尺寸 Omnisky Cannons 蓝图',
    '随机获取多种颜色竞速飞行服',
    '随机获取多种颜色竞速头盔',
    '随机获取 Crossbow 十字弩蓝图（两种配色）',
  ],

  archiveHref: '/archive/sandbox/tsg',

  featuredOnHome: false,
},

{
  slug: 'tsg-2026-08-22',
  tag: '战术打击群 TSG',
  title: '战术打击群 TSG · 第四期',
  subtitle: 'Tactical Strike Group',
  date: '2026.08.22',
startTimes: [
  '2026-08-22T20:00:00Z',
  '2026-08-23T02:00:00Z',
],
  location: '尼克斯 · 列夫斯基',
  category: 'activity',
  subcategory: 'sandbox',
  sandboxType: 'tsg',
  status: 'ended',

  image: '/images/events/tsg.jpg',
  alt: '星际酒馆战术打击群 TSG 第四期',

  description:
    '星际酒馆第四期战术打击群 TSG 集体活动，同一天安排两个场次，方便欧洲、亚洲、澳洲及北美不同时区的酒友参与。',

  details:
    '本期 TSG 在 Nyx 星系 Levski 集合，共安排两个活动场次。第一场为太平洋时间 13:00，更适合欧洲与北美时区；第二场为太平洋时间 19:00，更适合亚洲、澳洲与北美时区。参与玩家将跟随队伍完成 TSG 战术打击群任务，共同获取任务奖励并尝试获得随机稀有蓝图掉落。',

  rules: [
    '第一场：2026.08.22 · 13:00 PT，欧洲 / 北美时区友好',
    '第二场：2026.08.22 · 19:00 PT，亚洲 / 澳洲 / 北美时区友好',
    '集合地点：Nyx 星系 · Levski',
    '活动期间跟随队伍统一行动并完成 TSG 战术打击群任务',
    '适合首次体验 TSG、刷稀有蓝图、提升战斗经验以及参与多人组队的玩家',
  ],

  rewards: [
    '随机获取各种尺寸 Military A 级发电机蓝图',
    '随机获取各种尺寸 Omnisky Cannons 蓝图',
    '随机获取多种颜色竞速飞行服',
    '随机获取多种颜色竞速头盔',
    '随机获取 Crossbow 十字弩蓝图（两种配色）',
  ],

  archiveHref: '/archive/sandbox/tsg',

  featuredOnHome: false,
},

{
  slug: 'grenade-launcher-contested-zone-2025',
  tag: '活动',
  title: '榴弹发射器争夺区集体活动',
  subtitle: 'Contested Zone · Grenade Launcher',
  date: '2025.03.21',
  startTimes: [
    '2025-03-22T01:00:00Z',
  ],

  location: '派罗 · 争夺区',

  category: 'activity',
  subcategory: 'sandbox',
  sandboxType: 'executive-hangar',
  status: 'ended',

  image: '/images/events/cz-pyamhangar.jpg',
  alt: '星际酒馆榴弹发射器争夺区集体活动',

  description:
    '星际酒馆组织酒友集体挑战 Pyro 争夺区，以获取争夺区内的稀有榴弹发射器为主要目标。',

  details:
    '参与酒友统一集结后进入 Pyro 争夺区，通过多人协作完成区域探索、战斗与相关目标，并获取争夺区中的稀有榴弹发射器奖励。',

  archiveHref: '/archive/sandbox/contested-zone',

  featuredOnHome: false,
},

{
  slug: 'new-player-sponsorship-2026-01',
  tag: '社区福利',
  title: '萌新行政机库资助计划 · 第一期',
  subtitle: 'StarClub New Player Sponsorship Program',
  date: '2026.08.15',
  location: '派罗 · 轨道争夺区 · 行政机库',
  category: 'other',
  status: 'ended',

  image: '/images/events/new-player-sponsorship-2026-01.jpg',
  alt: '星际酒馆萌新行政机库资助计划第一期',

  description:
    '面向刚入坑《星际公民》的萌新玩家提供行政机库飞船资助，由 Furysoulfy 独家赞助。',

  details:
    '星际酒馆首期萌新资助计划旨在帮助刚进入《星际公民》的新人更快获得属于自己的高级飞船。符合资格的萌新玩家参与资助活动后，由 Furysoulfy 带队前往 Pyro 行政机库开启奖励并领取飞船。',

  rules: [
    '账号创建时间不超过 3 个月',
    '已加入星际酒馆官方 ORG',
    '免费周结束后仍拥有可进入游戏的游戏 Package',
    '不符合参与资格或免费周结束后无法进入游戏者取消资助资格',
  ],

  rewards: [
    '铁砧 F7A 大黄蜂 Mk II 行政版',
    '铁砧 F8C 闪电 行政版',
    '德雷克 海盗船 行政版',
    '德雷克 黑弯刀 行政版',
    'Gatac 希伦（Syulen）行政版',
    '未来 守护者 MX「维克洛战争特别版」',
    'RSI 流星 行政版',
    'RSI 天蝎座「维克洛战争特别版」',
  ],

  slots: '8 人',

  featuredOnHome: false,
},
]

/** Events shown in the homepage Featured Events section, in array order. */
export function getHomeFeaturedEvents(): EventItem[] {
  return EVENTS.filter((e) => e.featuredOnHome)
}

export function getEvent(slug: string): EventItem | undefined {
  return EVENTS.find((e) => e.slug === slug)
}

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  open: '报名中',
  upcoming: '即将开始',
  ongoing: '进行中',
  ended: '已结束',
}

export const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = {
  activity: '活动',
  competition: '赛事',
  teaching: '教学',
  'group-photo': '大合影',
  other: '其他',
}