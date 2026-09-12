import type { Metadata } from 'next'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { Reveal } from '@/components/reveal'
import Image from 'next/image'

export const metadata: Metadata = {
  title: '管理组 | 星际酒馆 StarClub',
  description:
    '认识星际酒馆 StarClub 管理团队，以及负责社区运营、活动组织、版务与新人支持的成员。',
}

const TEAM_MEMBERS = [
  {
    name: 'GuMieHaoRen',
    chineseName: '姑蔑好人',
    cnRole: '店长',
    enRole: 'Owner',
    description: '',
    image: '/images/team/gumiehaoren.png',
  },
  {
    name: 'ScarletCCC',
    cnRole: '合伙人斯卡卡',
    enRole: 'Co-owner',
    description: '早期天使投资人',
    image: '/images/team/scarletccc.png',
  },
  {
    name: 'The_Sweet',
    cnRole: '酒馆主管',
    enRole: 'Administrator',
    description: '社区总运营',
    image: '/images/team/the-sweet.png',
  },
  {
    name: 'VT7Prototype',
    cnRole: '酒馆的酒管',
    enRole: 'Moderator',
    description: '平台维护 · 活动组织 · 版务管理 · 新人接待',
    image: '/images/team/vt7prototype.png',
  },
  {
    name: 'Mizutani',
    cnRole: '酒馆的酒管',
    enRole: 'Moderator',
    description: '新人接待',
    image: '/images/team/mizutani.png',
  },
  {
    name: 'TTV550',
    cnRole: '酒馆的酒管',
    enRole: 'Moderator',
    description: '新人接待',
    image: '/images/team/ttv550.png',
  },
  {
    name: 'ChocoNoodles',
    cnRole: '酒馆的酒管',
    enRole: 'Moderator',
    description: '版务管理',
    image: '/images/team/choconoodles.png',
  },
  {
    name: 'KULAzite',
    cnRole: '酒馆的酒管',
    enRole: 'Moderator',
    description: '版务管理',
    image: '/images/team/kulazite.png',
  },
  {
    name: 'Yuri_Yu',
    cnRole: '宣传大使',
    enRole: 'Promoter',
    description: '小红书运营',
    image: '/images/team/yuri-yu.png',
  },
  {
    name: 'Lion_Shipcrasher',
    cnRole: '宣传大使',
    enRole: 'Promoter',
    description: 'Youtube · Instagram运营',
    image: '/images/team/lion-shipcrasher.png',
  },
  {
    name: 'HotPotKing',
    cnRole: '宣传大使',
    enRole: 'Promoter',
    description: 'Bilibili运营',
    image: '/images/team/hotpotking.png',
  },
{
  name: 'OrangeJuzi',
  cnRole: '宣传大使',
  enRole: 'Promoter',
  description: '抖音运营',
  image: '/images/team/orangejuzi.png',
},
{
  name: 'BidenInSpace',
  cnRole: '宣传大使',
  enRole: 'Promoter',
  description: '贴吧运营',
  image: '/images/team/bideninspace.png',
},
]

export default function TeamPage() {
  return (
    <div className="pb-24 lg:pb-32">
      <section className="relative border-b border-border">
        <div
          aria-hidden="true"
          className="hud-grid absolute inset-0 -z-10 opacity-70"
        />

        <div className="site-container py-10 lg:py-14">
          <ArchiveBreadcrumb
            items={[{ label: '首页', href: '/' }, { label: '管理组' }]}
          />

          <Reveal className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="font-display text-[0.65rem] tracking-[0.4em] text-primary">
                STARCLUB TEAM
              </span>

              <span
                className="h-px w-10 bg-primary/40"
                aria-hidden="true"
              />

              <span className="text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
                Community Staff
              </span>
            </div>

            <h1 className="max-w-3xl font-display text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
  管理组
</h1>

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              负责星际酒馆日常运营、社区秩序、活动组织、新人引导与内容维护的成员。
            </p>
          </Reveal>
        </div>
      </section>

<section className="site-container pt-12 lg:pt-16">
  <div className="mb-10 flex items-end justify-between gap-6 border-b border-border pb-5">
    <div>
      <span className="font-display text-[0.65rem] tracking-[0.3em] text-primary">
        STARCLUB LEADERSHIP
      </span>

      <h2 className="mt-3 font-display text-2xl tracking-tight sm:text-3xl">
        StarClub 星际酒馆用爱发电管理组
      </h2>
    </div>

    <span className="hidden text-xs tracking-[0.15em] text-muted-foreground lg:block">
      EST. 2024
    </span>
  </div>

  <div className="grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
    {TEAM_MEMBERS.map((member) => (
      <article key={member.name} className="group">
<div className="relative aspect-[1.45/1] overflow-hidden rounded-lg bg-[#f5f5f7]">
  <Image
    src={member.image}
    alt={member.name}
    fill
    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
    className="object-contain object-bottom transition-transform duration-500 group-hover:scale-[1.015]"
  />
</div>

        <div className="pt-3">
          <div className="flex items-baseline gap-2">
  <h3 className="font-display text-base font-semibold tracking-tight text-[#2783ad]">
    {member.name}
  </h3>

  {'chineseName' in member && member.chineseName && (
    <span className="text-xs text-muted-foreground">
      {member.chineseName}
    </span>
  )}
</div>

          <p className="mt-0.5 text-sm text-foreground">
            {member.cnRole}
          </p>

          <p className="text-sm text-muted-foreground">
            {member.enRole}
          </p>

          {member.description && (
            <p className="mt-2 text-xs leading-5 text-muted-foreground/75">
              {member.description}
            </p>
          )}
        </div>
      </article>
    ))}

{Array.from({ length: 3 }).map((_, index) => (
  <article key={`recruit-${index}`} className="group">
    <div className="relative flex aspect-[1.45/1] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border/70 bg-[#f7f7f8]">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-9 items-center justify-center rounded-full border border-border text-xl font-light text-muted-foreground/50 transition-all duration-300 group-hover:border-primary/40 group-hover:text-primary">
          +
        </span>

        <span className="font-display text-[0.58rem] tracking-[0.22em] text-muted-foreground/45">
          OPEN POSITION
        </span>
      </div>
    </div>

    <div className="pt-3">
      <h3 className="font-display text-base font-semibold tracking-tight text-[#2783ad]">
        招募中
      </h3>

      <p className="mt-0.5 text-sm text-foreground">
        见习管理
      </p>

      <p className="text-sm text-muted-foreground">
        Trial Moderator
      </p>

      <p className="mt-2 text-xs leading-5 text-muted-foreground/75">
        实习候补
      </p>
    </div>
  </article>
))}
  </div>

  <div className="mt-14 border-t border-border pt-5">
    <p className="max-w-4xl text-xs leading-6 text-muted-foreground">
      注：感谢每一位为社区用爱发电的伙伴，也欢迎更多志同道合的朋友加入星际酒馆管理团队。
      如有意向，请私聊 @姑蔑好人。
    </p>
  </div>
</section>
    </div>
  )
}