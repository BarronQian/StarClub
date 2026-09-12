export type DiscordIdentityCategory =
  | '管理类'
  | '赞助或支持类'
  | '硬核实力 Pro 类'
  | '赛事冠军类'
  | '玩法专精类'
  | '社区贡献类'
  | '酒馆 ORG 类'

export const DISCORD_ROLE_IDENTITIES = [
  // =========================================================
  // 管理类
  // =========================================================

  {
    id: '1228925186850553876',
    name: '酒馆店长',
    logo: '/images/roles/owner.png',
    category: '管理类',
    description:
      '星际酒馆店长 Owner，星际酒馆的拥有者和最高执行者。',
  },

  {
    id: '1325335802678476858',
    name: '合伙人',
    logo: '/images/roles/co-owner.png',
    category: '管理类',
    description:
      '酒馆最早期支持者与天使投资人专属 Tag。',
  },

  {
    id: '1437571047384809522',
    name: '酒馆主管',
    logo: '/images/roles/admin.png',
    category: '管理类',
    description:
      '酒馆 Discord 最高管理权限，负责 Discord 服务器整体各方面运营与管理，需要担任过酒管职务。',
  },

  {
    id: '1377550973475491871',
    name: '酒馆酒管',
    logo: '/images/roles/moderator.png',
    category: '管理类',
    description:
      '负责频道秩序、内容整理、美化、资讯翻译与社区互动，回应群友问题和诉求。',
  },

  {
    id: '1341932086449143809',
    name: '宣传大使',
    logo: '/images/roles/promoter.png',
    category: '管理类',
    description:
      '在 B站、微博、小红书、抖音、YouTube、Instagram 等平台运营星际酒馆官方账号，或宣传星际酒馆并附带 Discord 邀请链接。',
  },

  {
    id: '1512400290811351080',
    name: '见习管理',
    logo: '/images/roles/trial-mod.png',
    category: '管理类',
    description:
      '星际酒馆管理组试用期身份，通过试用与审核后可转为正式管理身份。',
  },

  // =========================================================
  // 赞助或支持类
  // =========================================================

  {
    id: '1526721609249984592',
    name: '赞助大亨',
    logo: '/images/roles/sponsor.png',
    category: '赞助或支持类',
    description:
      '累计赞助星际酒馆用于社区活动的现金或礼物价值达到 1000 美元后获得。',
  },

  {
    id: '938563257004871691',
    name: '金主Booster',
    logo: '/images/roles/booster.png',
    category: '赞助或支持类',
    description:
      'Discord Server Booster 专属赞助身份 Tag。',
  },

  {
    id: '1434713036140056616',
    name: '资深贵宾VIP',
    logo: '/images/roles/vip.png',
    category: '赞助或支持类',
    description:
      '在酒馆驻留满一年，长期支持星际酒馆，在酒馆官网 ORG 内且设置为主 ORG，并在服务器文字、语音及社区活动中长期保持活跃。',
  },

  {
    id: '1525562377372696606',
    name: 'The 1000',
    logo: '/images/roles/the-1000.png',
    category: '赞助或支持类',
    description:
      '参加星际酒馆 Discord 1000 人里程碑百人大合影活动获得的纪念绝版 Tag。',
  },

  // =========================================================
  // 硬核实力 Pro 类
  // =========================================================

  {
    id: '1449522647791567041',
    name: '维克洛肝帝',
    logo: '/images/roles/wikelo-king.png',
    category: '硬核实力 Pro 类',
    description:
      '维克洛声望满级，收集大量维克洛装备与舰船，并主要通过自己的游戏内游玩获取。',
  },

  {
    id: '1336561684105662465',
    name: '焰联行政王',
    logo: '/images/roles/pyam-king.png',
    category: '硬核实力 Pro 类',
    description:
      '行政机库 8 艘飞船全收集，可单刷争夺区集齐 7 张卡并单人开启行政机库，同时长期无私帮助酒馆群友开启行政机库，并具备优秀的步战与空战水平。',
  },

  {
    id: '1394014491842187414',
    name: '顶级大氪户',
    logo: '/images/roles/legatus.png',
    category: '硬核实力 Pro 类',
    description:
      '拥有 Legatus Mega Pack「船齐霸业」大完美包。',
  },

  {
    id: '1529921456266285157',
    name: '尊贵氪户',
    logo: '/images/roles/praetorian.png',
    category: '硬核实力 Pro 类',
    description:
      '拥有 Praetorian Pack 小完美包。',
  },

  {
    id: '1508163491276783626',
    name: '奥丁舰长',
    logo: '/images/roles/odin-captain.png',
    category: '硬核实力 Pro 类',
    description:
      'Odin「奥丁」战巡拥有者专属身份。',
  },

  // =========================================================
  // 赛事冠军类
  // =========================================================

  {
    id: '1385845696254574673',
    name: '绝境枪王',
    logo: '/images/roles/gun-king.png',
    category: '赛事冠军类',
    description:
      '星际酒馆「绝境枪王杯」FPS 个人赛冠军，代表顶级 FPS 战斗技术。',
  },

  {
    id: '1390222777709236244',
    name: '空战英豪',
    logo: '/images/roles/ace-pilot.png',
    category: '赛事冠军类',
    description:
      '社区狗斗空战高手、顶尖舰队王牌飞行员或星际酒馆「空战英豪」狗斗赛事冠军。',
  },

  {
    id: '1411118851697021008',
    name: '逐星之翼',
    logo: '/images/roles/racing-wing.png',
    category: '赛事冠军类',
    description:
      '星际酒馆竞速赛事冠军，代表顶级飞船驾驶与竞速技术。',
  },

  {
    id: '1514020667970945145',
    name: '第一届 · 奥里森 BTR 比赛车王',
    logo: '/images/roles/btr-racing.png',
    category: '赛事冠军类',
    description:
      '在星际酒馆第一届奥里森 BTR 比赛中获得第一名。',
  },

  {
    id: '1544568169979449355',
    name: '第一届 · 鱿鱼游戏最终存活者',
    logo: '/images/roles/squid-game.png',
    category: '赛事冠军类',
    description:
      '在星际酒馆第一届鱿鱼游戏比赛中成为最终存活者。',
  },

  {
    id: '1511472891202502666',
    name: '第一届 · 大逃杀比赛冠军队',
    logo: '/images/roles/battle-royale.png',
    category: '赛事冠军类',
    description:
      '在星际酒馆第一届大逃杀比赛中作为最终存活并成功撤离的冠军队伍成员获得。首届冠军队伍：巴奴火锅队。',
  },

  {
    id: '1514142645503397888',
    name: '第一届 · 奥里森拳皇争霸赛拳皇',
    logo: '/images/roles/king-of-fighters.png',
    category: '赛事冠军类',
    description:
      '在星际酒馆第一届奥里森拳皇争霸赛中击败所有对手并获得冠军。',
  },

  // =========================================================
  // 玩法专精类
  // =========================================================

  {
    id: '1422871294613000343',
    name: '打捞专家',
    logo: '/images/roles/salvage.png',
    category: '玩法专精类',
    description:
      '热爱并精通打捞玩法，长期分享打捞攻略与经验。',
  },

  {
    id: '1435052912920236173',
    name: '黄金矿工',
    logo: '/images/roles/miner.png',
    category: '玩法专精类',
    description:
      '热爱并精通挖矿玩法，长期分享挖矿攻略与经验。',
  },

  {
    id: '1435055737297436673',
    name: '物流巨头',
    logo: '/images/roles/logistics.png',
    category: '玩法专精类',
    description:
      '热爱并精通跑商、快递等物流玩法，长期分享跑商物流攻略与经验。',
  },

  {
    id: '1515815065633423481',
    name: '探索大师',
    logo: '/images/roles/explorer.png',
    category: '玩法专精类',
    description:
      '热爱并精通探索、旅游玩法，长期分享旅游截图与探索经验。',
  },

  {
    id: '1411249684814626816',
    name: '铁血赏金',
    logo: '/images/roles/bounty-hunter.png',
    category: '玩法专精类',
    description:
      '热衷赏金玩法，并长期在星际酒馆社区展示与分享赏金战绩。',
  },

  // =========================================================
  // 社区贡献类
  // =========================================================

  {
    id: '1517640125285138554',
    name: '社区明星',
    logo: '/images/roles/community-star.png',
    category: '社区贡献类',
    description:
      '授予在《星际公民》社区拥有较高知名度与影响力的创作者、攻略作者、主播、工具作者、社区组织者及中立平台负责人。',
  },

  {
    id: '1367474822526926868',
    name: '星际摄影师',
    logo: '/images/roles/photographer.png',
    category: '社区贡献类',
    description:
      '精美截图入选酒馆 Discord 精美截图频道 15 次，或在 Community Hub 获得 Staff Pick 10 次。',
  },

  {
    id: '1507796946088362024',
    name: 'CIG官方',
    logo: '/images/roles/cig.png',
    category: '社区贡献类',
    description:
      'Cloud Imperium Games / Roberts Space Industries 官方工作人员身份。',
  },

  {
    id: '1370507905912275026',
    name: '鳄梨Evocati',
    logo: '/images/roles/evocati.png',
    category: '社区贡献类',
    description:
      'Star Citizen Evocati 测试成员身份。',
  },

  {
    id: '1532451790602375300',
    name: '汉化组',
    logo: '/images/roles/localization.png',
    category: '社区贡献类',
    description:
      '《星际公民》官方或中文社区汉化工作的贡献者身份。',
  },

  // =========================================================
  // 酒馆 ORG 类
  // =========================================================

  {
    id: '1515926369844985937',
    name: 'SOG_A',
    logo: '/images/roles/sog-a.png',
    category: '酒馆 ORG 类',
    description:
      '星际酒馆特别行动组 SOG 空战小队成员身份。',
  },

  {
    id: '1515926925015781516',
    name: 'SOG_G',
    logo: '/images/roles/sog-g.png',
    category: '酒馆 ORG 类',
    description:
      '星际酒馆特别行动组 SOG 步战小队成员身份。',
  },
] as const satisfies ReadonlyArray<{
  id: string
  name: string
  logo: string
  category: DiscordIdentityCategory
  description: string
}>