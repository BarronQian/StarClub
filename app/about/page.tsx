import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border">
        <div className="site-container py-20 lg:py-28">
          <p className="mb-4 font-display text-[0.7rem] tracking-[0.3em] text-primary">
            ABOUT STARCLUB
          </p>

          <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
            关于星际酒馆
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
            星际酒馆 StarClub 是一个面向全球华人《星际公民》玩家的独立社区，
            致力于打造自由、开放、友好的交流与组队平台。
          </p>
        </div>
      </section>

      <section className="site-container py-16 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-display text-[0.65rem] tracking-[0.25em] text-primary">
              WHO WE ARE
            </p>

            <h2 className="mt-4 font-display text-2xl font-medium sm:text-3xl">
              一个属于玩家的社区
            </h2>
          </div>

<div>
  <div className="space-y-6 text-base leading-8 text-muted-foreground">
    <p>
      星际酒馆最初由一群《星际公民》玩家共同建立，
      随着来自世界各地的玩家不断加入，逐渐发展成为一个面向全球华人玩家的交流社区。
    </p>

    <p>
      我们不以舰队、组织归属或游戏内阵营作为参与门槛。
      无论你是刚进入宇宙的萌新，还是已经探索多年的老玩家，
      都可以在这里自由交流、寻找队友、参与活动并分享自己的游戏经历。
    </p>
  </div>

  <div className="mt-10 grid grid-cols-3 border-y border-border">
    <div className="py-6">
      <p className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
        1000+
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Discord 社区成员
      </p>
    </div>

    <div className="border-x border-border px-6 py-6">
      <p className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
        300+
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        RSI ORG 成员
      </p>
    </div>

    <div className="pl-6 py-6">
      <p className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
        2024
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        EST.
      </p>
    </div>
  </div>
</div>
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="site-container py-16 lg:px-10 lg:py-24">
          <p className="font-display text-[0.65rem] tracking-[0.25em] text-primary">
            WHAT WE DO
          </p>

          <h2 className="mt-4 font-display text-2xl font-medium sm:text-3xl">
            我们在做什么
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['交流与组队', '为玩家提供稳定、开放的交流空间，寻找志同道合的队友。'],
              ['社区活动', '持续组织竞赛、大型合影、探索、教学与趣味活动。'],
              ['新人支持', '帮助新玩家熟悉游戏机制、社区工具与基础玩法。'],
              ['内容分享', '整理攻略、资讯、摄影作品与玩家创作内容。'],
            ].map(([title, description]) => (
              <div
                key={title}
                className="corner-cut border border-border bg-background p-6"
              >
                <h3 className="font-display text-lg font-medium">{title}</h3>

                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-container py-16 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="font-display text-[0.65rem] tracking-[0.25em] text-primary">
              OUR VALUES
            </p>

            <h2 className="mt-4 font-display text-2xl font-medium sm:text-3xl">
              社区理念
            </h2>
          </div>

<div className="grid gap-4 sm:grid-cols-2">
  {[
    ['自由', '不以组织归属限制玩家参与社区交流、活动与组队。'],
    ['开放', '欢迎不同玩法、不同地区与不同经验水平的玩家。'],
    ['互助', '鼓励老玩家帮助新人，让知识与经验在社区中持续传递。'],
    ['公平', '维护正常游戏环境，拒绝作弊、恶意破坏与不公平行为。'],
  ].map(([title, description]) => (
    <div
      key={title}
      className="corner-cut border border-border bg-card/40 p-6"
    >
      <div className="mb-5 h-px w-8 bg-primary/60" />

      <h3 className="font-display text-lg font-medium text-foreground">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  ))}
</div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="site-container py-16 text-center lg:py-20">
          <p className="font-display text-[0.65rem] tracking-[0.25em] text-primary">
            JOIN STARCLUB
          </p>

          <h2 className="mt-4 font-display text-3xl font-medium">
            欢迎来到星际酒馆
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            加入社区，与更多《星际公民》玩家一起探索这个不断扩展的宇宙。
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
  <Link
    href="https://discord.gg/starlclub"
    target="_blank"
    rel="noopener noreferrer"
    className="corner-cut inline-flex min-w-37.5 items-center justify-center border border-foreground bg-foreground px-6 py-3 font-display text-[0.72rem] font-medium tracking-[0.08em] text-background transition-all duration-300 hover:-translate-y-0.5 hover:opacity-85"
  >
    加入 Discord
  </Link>

  <Link
    href="https://robertsspaceindustries.com/en/orgs/STARCLUBCN"
    target="_blank"
    rel="noopener noreferrer"
    className="corner-cut inline-flex min-w-37.5 items-center justify-center border border-primary bg-background px-6 py-3 font-display text-[0.72rem] font-medium tracking-[0.08em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/5"
  >
    加入官方俱乐部 ORG
  </Link>
</div>
        </div>
      </section>
    </main>
  )
}