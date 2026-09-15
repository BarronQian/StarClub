import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  GitBranch,
} from 'lucide-react'

export const metadata: Metadata = {
  title: '网站更新日志 | 星际酒馆 StarClub',
  description:
    '记录星际酒馆 StarClub 官网的重要版本更新、功能迭代与平台发展。',
}

const releases = [
  {
    version: 'v1.6',
    date: '2026.09',
    title: 'Public Beta',
    status: 'CURRENT',
    description:
      'StarClub 官网进入公开测试阶段，社区、个人主页、市场与后台管理系统进一步完善。',
    changes: [
      '社区动态、评论、点赞、关注与消息通知系统完善',
      '个人主页、访客留言与最近访客体验优化',
      'StarClub 玩家市场交易流程与举报系统完善',
      'Owner / Admin 管理权限与社区处罚系统完善',
      '最新资讯管理与社区资讯展示优化',
      '社区动态 Deep Link 与页面交互体验优化',
      '全站 UI、移动端与公开测试前稳定性优化',
    ],
  },
  {
    version: 'v1.5',
    date: '2026.09',
    title: 'Account & Moderation',
    description:
      '建立完整的 StarClub 账户体系与社区管理能力。',
    changes: [
      'Discord OAuth 账户登录',
      'StarClub 账户中心',
      'Owner / Admin 权限体系',
      '社区临时禁言与社区封禁',
      '市场封禁与全站封禁',
      '社区内容管理与后台用户管理',
      '举报处理与管理操作记录流程完善',
    ],
  },
  {
    version: 'v1.4',
    date: '2026.09',
    title: 'StarClub Market',
    description:
      '上线面向 Star Citizen 玩家之间交流交易信息的 StarClub 市场。',
    changes: [
      '玩家商单发布与管理',
      '商品分类与搜索筛选',
      '交易请求系统',
      '交易双方私有聊天',
      '交易完成与评价系统',
      '商单举报与证据上传',
      '市场后台审核与处罚工具',
    ],
  },
  {
    version: 'v1.3',
    date: '2026.09',
    title: 'Guides & CMS',
    description:
      '攻略系统升级为可持续维护的内容管理平台。',
    changes: [
      '攻略 CMS 后台管理系统',
      '文章、视频与外部资源攻略',
      '攻略封面与正文图片上传',
      '分类与自定义标签系统',
      '攻略排序与精选功能',
      'Armor Codex 装甲图鉴数据化',
      'Bilibili 与 YouTube 视频嵌入',
    ],
  },
  {
    version: 'v1.2',
    date: '2026.09',
    title: 'Community',
    description:
      'StarClub 官网从内容网站扩展为拥有玩家互动能力的社区平台。',
    changes: [
      '社区动态发布系统',
      '评论与回复',
      '点赞与关注',
      '社区消息通知',
      '玩家个人主页',
      'Discord 身份关联',
      '访客留言与最近访客',
      '社区管理工具',
    ],
  },
  {
    version: 'v1.1',
    date: '2026.08',
    title: 'Gallery',
    description:
      '重新设计 StarClub 影廊，为社区截图与大型活动建立长期档案。',
    changes: [
      'Gallery 数据库化',
      'Justified Row 自适应影廊布局',
      '图片 Lightbox 浏览',
      '摄影作者与作者主页链接',
      '月份与分类浏览',
      '活动专题与多期 Session',
      '影廊后台上传与管理',
      '主页 Community Gallery 联动',
    ],
  },
  {
    version: 'v1.0',
    date: '2026.08',
    title: 'StarClub Website',
    description:
      '星际酒馆 StarClub 官方网站正式建立。',
    changes: [
      'StarClub 官方网站基础架构上线',
      '主页与社区介绍',
      '活动展示',
      '社区集体合影档案',
      'Star Citizen 中文攻略',
      '实用工具页面',
      '名人堂与社区荣誉展示',
      '赞助榜与社区支持展示',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-background pt-28 pb-24">
      <div className="site-container">
        <div className="mx-auto max-w-5xl">

          {/* Header */}
          <section className="border-b border-border pb-12">
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              返回首页
            </Link>

            <div className="flex items-center gap-2 text-primary">
              <GitBranch className="size-4" />

              <span className="font-display text-[0.65rem] tracking-[0.28em]">
                STARCLUB CHANGELOG
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              网站更新日志
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">
              记录星际酒馆 StarClub 官网从建立至今的重要版本更新、
              功能迭代与平台发展。
            </p>
          </section>

          {/* Releases */}
          <section className="mt-14">
            <div className="relative">

              <div className="absolute bottom-0 left-1.25 top-2 w-px bg-border" />

              <div className="space-y-16">
                {releases.map((release) => (
                  <article
                    key={release.version}
                    className="relative pl-10"
                  >
                    <div className="absolute left-0 top-2 size-2.75 rounded-full border-2 border-primary bg-background" />

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-display text-sm tracking-[0.16em] text-primary">
                        {release.version}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {release.date}
                      </span>

                      {release.status && (
                        <span className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 font-display text-[0.55rem] tracking-[0.16em] text-primary">
                          {release.status}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                      {release.title}
                    </h2>

                    <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                      {release.description}
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {release.changes.map((change) => (
                        <div
                          key={change}
                          className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
                        >
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />

                          <span className="text-sm leading-6 text-foreground/80">
                            {change}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Creator */}
          <section className="mt-20 border-t border-border pt-10">
            <p className="font-display text-[0.6rem] tracking-[0.25em] text-primary">
              WEBSITE CREATOR
            </p>

            <p className="mt-3 text-lg font-medium">
              GuMieHaoRen · 姑蔑好人
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Founder & Website Designer / Developer of StarClub
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}