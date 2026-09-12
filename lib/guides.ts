export type GuideCategory =
  | '萌新入门'
  | 'FPS单兵战斗'
  | '飞船空战'
  | '舰船武器组件'
  | '单兵武器装备'
  | '经济 / 赚钱'
  | '探索 / 旅游'
  | '沙盒活动'
  | '限时活动'
  | '维克洛商店'
  | '舰船升级CCU'
  | '其他'

  export const GUIDE_TAGS: Record<GuideCategory, string[]> = {
  '萌新入门': [
    '基础操作',
    '出生点',
    '导航 / 星图',
    '物品管理',
    '医疗',
    '组队',
    '保险 / 索赔',
    '萌新赚钱',
    '性能设置',
    '其他',

  ],

  'FPS单兵战斗': [
    'FPS基础',
    'PvE',
    'PvP',
    '地堡',
    '争夺区',
    '地面战',
    '医疗救援',
    '战斗技巧',
    '其他',
  ],

  '飞船空战': [
    '飞行基础',
    '起飞 / 降落',
    '狗斗',
    'PvE空战',
    'PvP空战',
    '导弹',
    '能量管理',
    '其他',
  ],

  '舰船武器组件': [
    '舰船介绍',
    '舰船对比',
    '武器配装',
    '组件配装',
    '工程玩法',
    '其他',
  ],

  '单兵武器装备': [
    '枪械',
    '重武器',
    '近战武器',
    '护甲装备',
    '医疗装备',
    '工具',
    '其他',
  ],

  '经济 / 赚钱': [
    '跑商',
    '采矿',
    '打捞',
    '加油',
    '赏金',
    '雇佣兵',
    '打劫',
    '拾荒',
    '乞讨',
    '其他赚钱门路',
  ],

  '探索 / 旅游': [
    '城市',
    '空间站',
    '隐藏地点',
    '景点',
    '旅游路线',
    '摄影地点',
    '其他',
  ],

  '沙盒活动': [
    '争夺区行政机库',
    '校准与采矿',
    '风暴突袭者',
    'ASD玛瑙设施',
    '剜度科技走私者',
    'QV碎石者',
    'TSG战术打击群',
    'SoO奥里森之围',
  ],

  '限时活动': [
    '异种威胁：超速协议',
    '补给与灭亡',
    '第二人生资源动员',
    '边境战士终章',
    '援助联盟',
  ],

  '维克洛商店': [
    '入门指南',
    '商店位置',
    '任务总览',
    '材料获取',
    '舰船兑换',
    '武器兑换',
    '护甲兑换',
    '其他',
  ],

  '舰船升级CCU': [
    'CCU入门',
    'WB CCU推荐',
    'CCU链子',
    '其他',
  ],

  '其他': [
    'BUG规避',
    '游戏设置',
    '性能优化',
    '社区资源',
    '其他',
  ],
}

export type GuideType =
  | 'article'
  | 'video'
  | 'discord'
  | 'external'

export type Guide = {
  id: string
  title: string
  description: string
  category: GuideCategory
  tags?: string[]
  type: GuideType
  href: string
  videoUrl?: string
  date?: string
  author?: string
  creator?: string
  image?: string
  original?: boolean
}

export const GUIDES: Guide[] = [
  {
  id: 'armor-codex',
  title: '星际公民特色护甲图鉴',
  description:
    '收录《星际公民》中具有特色外观、特殊获取方式及收藏价值的护甲系列，整理护甲外观、名称、来源与获取方式。',
  category: '单兵武器装备',
  tags: ['护甲装备'],
  type: 'article',
  href: '/guides/armor-codex',
  author: 'GuMieHaoRen「姑蔑好人」',
  image: '/images/guides/armor/palatino-armor-cover.jpg',
  original: true,
},

{
  id: 'money-making-4-8-2',
  title: '4.8.2 零比特保姆级赚钱教学全流程',
  description:
    '从零开始的赚钱流程教学，帮助玩家快速了解 4.8.2 版本的赚钱思路与完整操作流程。',
  category: '经济 / 赚钱',
  tags: ['其他赚钱门路'],
  type: 'video',
  href: '/guides/videos/money-making-4-8-2',
  videoUrl: 'https://www.bilibili.com/video/BV1rn746sEnG/',
  creator: '星际酒馆 StarClub',
  author: 'HotpotKing「火锅」',
  image: '/images/guides/videos/money-making-4-8-2.jpg',
  original: true,
},
{
  id: 'laser-alignment-guide-4-8-2',
  title: '4.8.2 校准站开矿教学全流程',
  description:
    '校准站开矿玩法完整流程教学，整理进入方式、流程与关键步骤。',
  category: '沙盒活动',
  tags: ['校准与采矿'],
  type: 'video',
  href: '/guides/videos/laser-alignment-guide-4-8-2',
  videoUrl: 'https://www.bilibili.com/video/BV187T56kErR/',
  creator: '星际酒馆 StarClub',
  author: 'HotpotKing「火锅」',
  image: '/images/guides/videos/laser-alignment-4-8-2.jpg',
  original: true,
},
{
  id: 'jump-town-loot-route',
  title: '跃动小镇搜刮路线指南',
  description:
    '跃动小镇探索与搜刮路线指南，帮助玩家快速熟悉区域路线与物资点位。',
  category: '探索 / 旅游',
  tags: ['隐藏地点'],
  type: 'video',
  href: '/guides/videos/jump-town-loot-route',
  videoUrl: 'https://www.bilibili.com/video/BV1tdTY6bEWc/',
  creator: '星际酒馆 StarClub',
  author: 'HotpotKing「火锅」',
  image: '/images/guides/videos/jump-town-loot-route.jpg',
  original: true,
},
{
  id: 'stanton-shopping-route-guide',
  title: '斯坦顿4大主城，飞船、配件、武器商店路线指南',
  description:
    '整理斯坦顿四大主城的飞船、舰船配件与武器商店路线，方便玩家快速找到需要购买的内容。',
  category: '萌新入门',
  tags: ['导航 / 星图'],
  type: 'video',
  href: '/guides/videos/stanton-shopping-route-guide',
  videoUrl: 'https://www.bilibili.com/video/BV1eLTD6DE3q/',
  creator: '星际酒馆 StarClub',
  author: 'HotpotKing「火锅」',
  image: '/images/guides/videos/stanton-shopping-guide.jpg',
  original: true,
},
{
  id: 'cq7-review',
  title: '新武器 CQ7 武器测评及配件推荐',
  description:
    'CQ7 武器实战测评与配件推荐，介绍武器表现、适用场景与搭配思路。',
  category: '单兵武器装备',
  tags: ['枪械'],
  type: 'video',
  href: '/guides/videos/cq7-review',
  videoUrl: 'https://www.bilibili.com/video/BV1GWKx65EZb/',
  creator: '星际酒馆 StarClub',
  author: 'HotpotKing「火锅」',
  image: '/images/guides/videos/cq7-review.jpg',
  original: true,
},
{
  id: 'star-citizen-fleet-overview',
  title: '星际公民全舰船总览图',
  description:
    '汇总《星际公民》各大厂商舰船与载具，方便快速查看不同舰船的外观、体型与厂商分布。',
  category: '舰船武器组件',
  tags: ['舰船介绍'],
  type: 'article',
  href: '/guides/star-citizen-fleet-overview',
  author: 'MR-STEVEN',
  image: '/images/guides/ships/star-citizen-fleet-overview.jpg',
  original: true,
},
]