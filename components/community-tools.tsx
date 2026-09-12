'use client'

import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToolCategory =
  | 'ships'
  | 'fps'
  | 'trade'
  | 'hangar'
  | 'character'
  | 'exploration'
  | 'resources'

type CommunityTool = {
  name: string
  en?: string
  description: string
  url: string
  categories: ToolCategory[]
}

const categories: {
  id: 'all' | ToolCategory
  label: string
}[] = [
  { id: 'all', label: '全部' },
  { id: 'ships', label: '舰船与载具' },
  { id: 'fps', label: '单兵装备' },
  { id: 'trade', label: '贸易与经济' },
  { id: 'hangar', label: '机库与 CCU' },
  { id: 'character', label: '角色与外观' },
  { id: 'exploration', label: '地图与探索' },
  { id: 'resources', label: '资料与辅助' },
]

const categoryLabels: Record<ToolCategory, string> = {
  ships: '舰船与载具',
  fps: '单兵装备',
  trade: '贸易与经济',
  hangar: '机库与 CCU',
  character: '角色与外观',
  exploration: '地图与探索',
  resources: '资料与辅助',
}

const communityTools: CommunityTool[] = [
  {
    name: 'SPViewer',
    description: '飞船与载具性能数据库，可查询燃料、续航、组件、电容、推进器等详细参数。',
    url: 'https://www.spviewer.eu/',
    categories: ['ships'],
  },
  {
    name: 'Erkul DPS Calculator',
    description: '舰船配装、DPS、护盾、电容、量子引擎与组件性能规划工具。',
    url: 'https://erkul.games/calculator',
    categories: ['ships'],
  },
  {
    name: 'Cornerstone',
    description: '查询游戏内物品、单兵装备、舰船组件、购买地点、价格与库存。',
    url: 'https://finder.cstone.space/',
    categories: ['ships', 'fps', 'resources'],
  },
  {
    name: '星际寻物',
    description: '支持中文查询游戏内可购买物品、飞船与价格信息。',
    url: 'https://finder.grakeinterplanetary.com/',
    categories: ['ships', 'fps', 'resources'],
  },
  {
    name: 'HangarLink',
    description: '读取并可视化 RSI 机库中的舰船、载具、CCU、Buyback、Pledge 与 LTI 信息。',
    url: 'https://hangar.link/',
    categories: ['hangar', 'ships'],
  },
  {
    name: 'CCU Game',
    description: '舰船升级链与 CCU 规划工具，可辅助寻找更合理的升级路线。',
    url: 'https://ccugame.app/',
    categories: ['hangar', 'ships'],
  },
  {
    name: 'Cargo Grid Viewer',
    description: '3D 舰船货物网格工具，可用于规划不同货箱在货舱中的摆放方式。',
    url: 'https://sc-cargo.space/#/v1/viewer',
    categories: ['ships', 'trade'],
  },
  {
    name: 'SC Dressing Room',
    description: '角色服装、护甲与穿搭预览数据库，可自由搭配并查看获取方式。',
    url: 'https://scdressingroom.gamers-fix.com/',
    categories: ['character', 'fps'],
  },
  {
    name: 'Star Citizen Characters',
    description: '社区角色外观分享与角色文件下载平台，可浏览和分享自定义角色。',
    url: 'https://www.star-citizen-characters.com/',
    categories: ['character'],
  },
  {
    name: 'UEXCorp',
    description: '综合贸易、商品价格、采矿、玩家市场、舰船和装备信息的社区工具。',
    url: 'https://uexcorp.space/',
    categories: ['trade', 'ships', 'fps', 'resources'],
  },
  {
    name: 'SC Trade Tools',
    description: '贸易路线优化、商品数据库与地点信息查询工具。',
    url: 'https://www.sc-trade.tools/home',
    categories: ['trade', 'resources'],
  },
  {
    name: 'VerseGuide',
    description: '游戏内地点搜索、旅行规划与探索指南，支持 Stanton 和 Pyro 等区域。',
    url: 'https://verseguide.com/',
    categories: ['exploration', 'resources'],
  },
  {
    name: 'VerseTime',
    description: '查询《星际公民》各地点昼夜状态、日出日落时间与太阳高度等信息。',
    url: 'https://dydrmr.github.io/VerseTime/',
    categories: ['exploration', 'resources'],
  },
  {
    name: 'Star Citizen Tools',
    description: '大型社区百科数据库，涵盖舰船、载具、武器、护甲、地点、NPC、任务和版本资料。',
    url: 'https://starcitizen.tools/',
    categories: ['ships', 'fps', 'exploration', 'resources'],
  },
  {
    name: '星际公民中文百科',
    description: '面向中文玩家的《星际公民》百科资料站，涵盖舰船、装备、地点与游戏机制。',
    url: 'https://citizenwiki.cn/',
    categories: ['ships', 'fps', 'exploration', 'resources'],
  },
  {
    name: 'Star Citizen Wikipedia',
    description: 'Wikipedia 上的《星际公民》资料页，适合了解游戏历史、开发背景与项目概况。',
    url: 'https://en.wikipedia.org/wiki/Star_Citizen',
    categories: ['resources'],
  },
  {
    name: 'SCM Blueprint',
    description: '4.9 制造系统的蓝图、材料、制造站与生产链查询工具，支持中文。',
    url: 'https://scm.flowcld.com/tools/blueprint',
    categories: ['resources'],
  },
  {
    name: 'SCCrafter',
    description: '英文版制造与蓝图查询工具。',
    url: 'https://www.sccrafter.com/',
    categories: ['resources'],
  },
  {
    name: 'SC汉化盒子',
    description: '中文本地化辅助工具，提供汉化安装、诊断、分流下载、网站汉化和服务器状态等功能。',
    url: 'https://apps.microsoft.com/detail/9nf3swfwnkl1',
    categories: ['resources'],
  },
  {
  name: 'Star Citizen Blueprint Finder',
  description: '制造与蓝图查询工具，可查询武器、护甲、舰船组件等蓝图，以及所需材料、任务和获取路线。',
  url: 'https://citizen-starter-guide.com/star-citizen-blueprint-finder/',
  categories: ['ships', 'fps', 'resources'],
},
{
  name: 'SCDB.SPACE',
  description: '综合游戏数据库，可查询舰船、组件、武器、护甲、服装、涂装以及购买地点与价格。',
  url: 'https://scdb.space/',
  categories: ['ships', 'fps', 'resources'],
},
{
  name: 'SChaulers',
  description: '面向货运与贸易玩家的路线规划和运输管理工具，支持贸易路线、舰队与运输记录等功能。',
  url: 'https://schaulers.com/',
  categories: ['trade', 'ships'],
},
{
  name: 'SC Toolbox',
  description: '社区综合工具箱，集合舰船配装、采矿、货运与战斗等多种实用辅助工具。',
  url: 'https://sc-toolbox.com/',
  categories: ['ships', 'resources'],
},
]

export function CommunityTools() {
  const [activeCategory, setActiveCategory] =
    useState<'all' | ToolCategory>('all')

  const filteredTools =
    activeCategory === 'all'
      ? communityTools
      : communityTools.filter((tool) =>
          tool.categories.includes(activeCategory),
        )

  return (
    <section className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 lg:px-10">
      <div className="border-t border-border pt-16">
        <div className="flex items-center gap-4">
          <span className="font-display text-[0.65rem] tracking-[0.3em] text-primary">
            COMMUNITY RESOURCES
          </span>
          <span className="h-px w-10 bg-primary/30" />
          <span className="font-display text-[0.65rem] tracking-[0.3em] text-muted-foreground">
            THIRD-PARTY TOOLS
          </span>
        </div>

        <h2 className="mt-5 font-display text-3xl tracking-tight text-foreground">
          社区工具推荐
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          收录《星际公民》玩家社区开发和维护的实用网站与应用，涵盖舰船数据、单兵装备、贸易、机库管理、角色外观与游戏资料等。
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'rounded-full border px-4 py-2 text-xs transition-all',
                activeCategory === category.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div
  key={activeCategory}
  className="mt-8 grid animate-in fade-in slide-in-from-bottom-2 gap-4 duration-300 md:grid-cols-2 lg:grid-cols-3"
>
  {filteredTools.map((tool) => (
            <a
              key={tool.name}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
             className="group relative flex min-h-[230px] flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.10),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <ArrowUpRight className="absolute right-5 top-5 z-10 size-4 translate-y-1 text-muted-foreground/25 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0 group-hover:text-primary group-hover:opacity-100" />

              <div className="relative z-10 flex flex-wrap gap-1.5 pr-7">
                {tool.categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-primary/8 px-2.5 py-1 text-[0.6rem] tracking-[0.08em] text-primary"
                  >
                    {categoryLabels[category]}
                  </span>
                ))}
              </div>

              <h3 className="relative z-10 mt-5 font-display text-xl text-foreground">
                {tool.name}
              </h3>

              <p className="relative z-10 mt-3 text-sm leading-relaxed text-muted-foreground">
                {tool.description}
              </p>

              <span className="relative z-10 mt-auto flex items-center gap-2 pt-6 text-xs text-primary">
                访问网站
                <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-[0.68rem] leading-relaxed text-muted-foreground/70">
          第三方工具由各自开发者或社区独立维护，星际酒馆仅提供信息整理与导航，不代表与其存在官方合作或背书关系。
        </p>
      </div>
    </section>
  )
}