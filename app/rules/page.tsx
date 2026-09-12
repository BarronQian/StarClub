import type { Metadata } from 'next'
import { ArchiveBreadcrumb } from '@/components/archive-breadcrumb'
import { Reveal } from '@/components/reveal'

export const metadata: Metadata = {
  title: '社区规章 | 星际酒馆 StarClub',
  description:
    '星际酒馆 StarClub 社区规章与行为准则。',
}

export default function RulesPage() {
  return (
    <div className="pb-24 lg:pb-32">
      <section className="relative border-b border-border">
        <div
          aria-hidden="true"
          className="hud-grid absolute inset-0 -z-10 opacity-70"
        />

        <div className="site-container py-16 lg:py-24">
          <ArchiveBreadcrumb
            items={[{ label: '首页', href: '/' }, { label: '社区规章' }]}
          />

          <Reveal className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="font-display text-[0.65rem] tracking-[0.4em] text-primary">
                COMMUNITY RULES
              </span>

              <span
                className="h-px w-10 bg-primary/40"
                aria-hidden="true"
              />

              <span className="text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
                StarClub Guidelines
              </span>
            </div>

            <h1 className="max-w-3xl font-display text-4xl leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
              社区规章
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              为所有酒友提供一个自由、友好、有秩序的交流环境。
              加入并使用星际酒馆社区即代表你同意遵守以下规则。
            </p>
          </Reveal>
        </div>
      </section>

<section className="site-container pt-16 lg:pt-24">
  <div className="mx-auto max-w-4xl">
    <div className="divide-y divide-border border-y border-border">
      {[
        {
          number: '01',
          title: '中立立场',
          en: 'Neutral Stance',
          zh: '本平台独立中立运营，不隶属任何舰队或组织，也不强制成员加入任何舰队或组织。',
          enText:
            'This community operates independently and neutrally and is not affiliated with any fleet or organization, nor is membership in any org required.',
        },
        {
          number: '02',
          title: '昵称规范',
          en: 'Nickname Policy',
          zh: '请将服务器昵称修改为游戏内 Handle Name，7天未改名将限制权限。',
          enText:
            'Please set your nickname to your in-game Handle Name; members who fail to comply within 7 days may lose access.',
        },
        {
          number: '03',
          title: '社交规范',
          en: 'Social Conduct',
          zh: '请尊重所有成员，禁止骚扰、辱骂、人身攻击、引战、歧视及任何破坏社区氛围的行为。',
          enText:
            'Treat all members with respect; harassment, insults, personal attacks, discrimination, trolling, and other toxic behavior are prohibited.',
        },
        {
          number: '04',
          title: '零容忍政策',
          en: 'Zero-Tolerance Policy',
          zh: '严禁外挂、作弊、利用漏洞牟利、RMT以及任何违反游戏公平性的行为，违规者将被立即移出并视情况向CIG举报。',
          enText:
            'Cheating, exploiting, RMT, and any unfair gameplay practices are strictly forbidden and may result in immediate removal and reporting to CIG.',
        },
        {
          number: '05',
          title: '频道规范',
          en: 'Channel Usage',
          zh: '请按照频道主题发言，攻略、BUG反馈及专题讨论请使用对应频道或论坛帖。',
          enText:
            'Keep discussions relevant to the channel topic and use the appropriate channels or forum posts for guides, bug reports, and organized discussions.',
        },
        {
          number: '06',
          title: '其他规定',
          en: 'Additional Rules',
          zh: '禁止刷屏、广告、未授权推广、盗版、仇恨内容及非指定频道的NSFW内容，并请遵守Discord社区准则与服务条款。',
          enText:
            "Spam, advertising, unauthorized promotion, piracy, hate content, and NSFW content outside designated channels are prohibited, and all members must follow Discord's Community Guidelines and Terms of Service.",
        },
      ].map((rule) => (
        <div
          key={rule.number}
          className="grid gap-5 py-8 sm:grid-cols-[80px_1fr] lg:py-10"
        >
          <div className="font-display text-sm tracking-[0.2em] text-primary">
            {rule.number}
          </div>

          <div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-display text-xl font-medium text-foreground">
                {rule.title}
              </h2>

              <span className="text-xs tracking-[0.12em] text-muted-foreground">
                {rule.en}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-foreground/80 sm:text-base">
              {rule.zh}
            </p>

            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {rule.enText}
            </p>
          </div>
        </div>
      ))}
    </div>

    <div className="mt-12 grid gap-4 md:grid-cols-2">
      <div className="corner-cut border border-border bg-card/40 p-6 sm:p-8">
        <span className="font-display text-[0.62rem] tracking-[0.25em] text-primary">
          ENFORCEMENT
        </span>

        <h2 className="mt-3 font-display text-xl font-medium">
          违规处理
        </h2>

        <p className="mt-4 text-sm leading-7 text-foreground/80">
          违反规则可能导致警告、禁言、限制权限、移出服务器或永久封禁。
        </p>

        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Violations may result in warnings, timeouts, restricted access,
          removal from the server, or permanent bans.
        </p>
      </div>

      <div className="corner-cut border border-border bg-card/40 p-6 sm:p-8">
        <span className="font-display text-[0.62rem] tracking-[0.25em] text-primary">
          THANK YOU
        </span>

        <h2 className="mt-3 font-display text-xl font-medium">
          感谢配合
        </h2>

        <p className="mt-4 text-sm leading-7 text-foreground/80">
          感谢您与我们一起维护安全、友好、公平且自由的星际酒馆社区。
        </p>

        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Thank you for helping us maintain a safe, friendly, fair, and
          welcoming Starclub community.
        </p>
      </div>
    </div>
  </div>
</section>

    </div>
  )
}