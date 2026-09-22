'use client'

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  X,
} from 'lucide-react'

type MarketRulesDialogProps = {
  open: boolean
  onClose: () => void
  onAccept: () => void
}

export function MarketRulesDialog({
  open,
  onClose,
  onAccept,
}: MarketRulesDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-120 flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border/60 bg-background shadow-[0_28px_100px_rgba(0,0,0,0.28)]">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/60 px-6 py-5 sm:px-7">
          <div className="flex min-w-0 gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
              <FileText className="size-5" />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight">
                星际酒馆玩家市场交易规则
              </h2>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                发布交易前，请阅读并确认以下市场规则。
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable rules */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-7">
          <div className="space-y-7 text-[13px] leading-6 text-muted-foreground">
            <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />

                <p>
                  星际酒馆玩家市场是面向社区成员提供的《Star Citizen》
                  游戏内玩家交易信息发布与沟通平台。平台提供商单展示、
                  交易申请、沟通、确认及评价等社区功能。发布商单即表示你已阅读、
                  理解并同意遵守以下规则。
                </p>
              </div>
            </div>

            <RuleSection
              number="01"
              title="商单发布规范"
            >
              <Rule>
                发布者应如实填写交易类型、物品名称、数量、品质、价格、
                交易地点及其他必要信息，不得故意发布虚假、错误、误导性
                或与实际交易内容明显不符的信息。
              </Rule>

              <Rule>
                商品图片应与交易内容相关，不得使用具有欺骗性、
                与商品无关或违反社区规则的图片及内容。
              </Rule>

              <Rule>
                禁止大量重复发布相同或高度相似的商单进行刷屏。
                已经失效、售罄或不再进行的交易，请及时结束商单。
              </Rule>

              <Rule>
                禁止发布外挂、作弊工具、漏洞利用服务，以及其他违反
                星际酒馆社区规则或游戏相关规定的内容。
              </Rule>

              <Rule>
                玩家市场原则上用于《Star Citizen》游戏相关玩家交易。
                禁止利用市场进行未经允许的广告、引流、诈骗或其他与正常
                玩家交易无关的行为。
              </Rule>
            </RuleSection>

            <RuleSection
              number="02"
              title="交易申请与处理"
            >
              <Rule>
                玩家提交交易申请后，交易进入 Pending（等待处理）状态，
                商单发布者可以接受或拒绝该交易申请。
              </Rule>

              <Rule>
                Pending 状态的交易申请如果连续
                <Strong> 7 天 </Strong>
                未被处理，系统将自动取消该申请。
              </Rule>

              <Rule>
                商单发布者接受申请后，交易进入 Accepted（进行中）状态。
                Accepted 状态超过
                <Strong> 7 天 </Strong>
                仍未完成，系统将自动取消该笔交易。
              </Rule>

              <Rule>
                Pending、Accepted、Declined 或 Cancelled
                均不属于成功成交，也不会重置商单的 30 天活跃期限。
              </Rule>
            </RuleSection>

            <RuleSection
              number="03"
              title="交易完成确认"
            >
              <Rule>
                游戏内实际交易完成后，交易双方应按照市场交易流程完成确认。
              </Rule>

              <Rule>
                只有达到系统规定的完成条件后，该笔交易才会进入
                Completed（已完成）状态，并被认定为成功成交。
              </Rule>

              <Rule>
                只有 Completed 状态的交易会计入有效成交记录，
                并用于交易历史、商单活跃期限及相关市场数据。
              </Rule>

              <Rule>
                请在确认游戏内物品、数量、价格以及双方约定内容已经实际完成后
                再进行完成确认。请勿在实际交易尚未完成时提前确认。
              </Rule>
            </RuleSection>

            <RuleSection
              number="04"
              title="商单有效期与自动清理"
            >
              <div className="mb-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                <div className="flex gap-3">
                  <Clock3 className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />

                  <p className="text-foreground/80">
                    请特别注意：市场商单存在自动过期机制，
                    长期没有成功成交的商单不会永久保留。
                  </p>
                </div>
              </div>

              <Rule>
                新发布的商单从
                <Strong> 发布时间 </Strong>
                开始计算活跃期限。
              </Rule>

              <Rule>
                如果商单发布后连续
                <Strong> 30 天 </Strong>
                从未产生任何 Completed 成交记录，
                系统将自动永久清理该商单。
              </Rule>

              <Rule>
                对于从未成功成交的过期商单，系统可能同时清理其商品图片、
                已失效交易申请、普通交易消息及其他无需长期保存的数据。
              </Rule>

              <Rule>
                如果商单曾经产生至少一笔 Completed 成交，
                商单的 30 天活跃期限将从
                <Strong> 最近一次成功成交时间 </Strong>
                重新计算。
              </Rule>

              <Rule>
                曾经成功成交的商单，如果连续
                <Strong> 30 天 </Strong>
                没有新的成功成交，系统将自动下架；
                已经产生的有效成交历史仍会继续保留。
              </Rule>
            </RuleSection>

            <RuleSection
              number="05"
              title="交易安全与玩家责任"
            >
              <Rule>
                星际酒馆玩家市场提供社区交易信息发布、沟通和记录功能，
                实际游戏内交易仍由交易双方自行完成。
              </Rule>

              <Rule>
                交易双方应自行核对交易对象、物品、数量、品质、价格、
                交易地点及游戏内实际交付情况。
              </Rule>

              <Rule>
                请勿向其他玩家提供账号密码、验证码、登录凭证或其他
                敏感账户信息。
              </Rule>

              <Rule>
                对明显异常、存在欺诈嫌疑或违反社区规则的交易，
                请立即停止交易，并通过玩家市场举报功能联系管理组。
              </Rule>

              <Rule>
                因游戏版本更新、服务器异常、游戏 BUG、物品状态变化
                或其他游戏机制导致的问题，应根据实际情况由交易双方进行沟通处理。
              </Rule>
            </RuleSection>

            <RuleSection
              number="06"
              title="违规商单与社区管理"
            >
              <Rule>
                管理组有权对涉嫌诈骗、虚假信息、恶意刷屏、骚扰、
                违规引流、外挂作弊相关内容及其他违反社区规则的商单进行处理。
              </Rule>

              <Rule>
                根据违规情况，管理组可以采取删除商单、限制玩家市场功能，
                或按照星际酒馆社区规则进行进一步处理。
              </Rule>

              <Rule>
                发生交易争议时，管理组可根据平台内能够核实的交易记录、
                聊天记录、举报信息及其他相关材料协助进行处理。
              </Rule>

              <Rule>
                恶意滥用举报功能、伪造交易证据或利用市场功能骚扰其他成员，
                同样可能受到市场功能限制或其他社区处理。
              </Rule>
            </RuleSection>

            <RuleSection
              number="07"
              title="发布确认"
            >
              <Rule>
                点击下方「我已阅读并同意」后，即表示你已经阅读并理解上述
                玩家市场规则，并同意在使用星际酒馆玩家市场期间遵守相关规定。
              </Rule>
            </RuleSection>

            <div className="flex gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

              <p>
                市场规则可能根据社区运营、游戏机制及市场功能调整进行更新。
                发布交易时请以当前显示的规则为准。
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur sm:px-7">
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-full border border-border/70 px-5 text-sm font-medium transition-colors hover:bg-muted"
            >
              取消
            </button>

            <button
              type="button"
              onClick={onAccept}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <CheckCircle2 className="size-4" />
              我已阅读并同意
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RuleSection({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-[10px] font-semibold tabular-nums tracking-[0.14em] text-muted-foreground/50">
          {number}
        </span>

        <h3 className="text-sm font-semibold text-foreground">
          {title}
        </h3>
      </div>

      <div className="space-y-2.5">
        {children}
      </div>
    </section>
  )
}

function Rule({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-[9px] size-1 shrink-0 rounded-full bg-foreground/35" />

      <p>{children}</p>
    </div>
  )
}

function Strong({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <span className="font-semibold text-foreground">
      {children}
    </span>
  )
}