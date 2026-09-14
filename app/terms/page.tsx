'use client'

import { useState } from 'react'
import Link from 'next/link'

const sectionsZh = [
  {
    title: '1. 网站与社区账号',
    content: [
      'StarClub 的公开内容通常可以直接浏览。',
      '部分社区功能，例如发布动态、评论、投稿、参与社区互动、参加成员活动等，可能需要登录 StarClub 账号，并可能仅向已加入 StarClub Discord、完成相应社区认证或 RSI 玩家身份验证的成员开放。',
      'RSI 验证仅用于确认玩家身份和社区资格。StarClub 不会要求您提供 RSI 账号密码、双重验证码或恢复代码。',
      '您应妥善保护自己的账号及相关登录凭证，并对通过您的账号进行的活动承担合理责任。如发现账号被盗用、异常登录或其他安全问题，请及时联系我们。',
      'StarClub 可以基于社区安全、反滥用、账号异常、违反社区规则或其他合理原因，对相关账号采取验证、限制部分功能、暂停访问或终止社区权限等必要措施。',
      '加入 StarClub、浏览网站、创建社区账号或完成 RSI 验证本身均不需要支付费用。',
    ],
  },
  {
    title: '2. 社区规则',
    content: [
      '使用 StarClub 网站及其官方社区时，请遵守《StarClub 社区规章》。',
      'StarClub 可以对违反规则、危害社区安全或侵犯他人权益的内容采取删除、隐藏或限制访问等措施，并可根据具体情况对相关用户进行警告、限制部分功能、暂停或终止社区权限。',
    ],
  },
  {
    title: '3. 用户内容',
    content: [
      '您可以通过 StarClub 发布帖子、评论、图片、截图、攻略、赛事资料、投稿或其他社区内容。',
      '您应确保自己有权发布相关内容，并且内容不侵犯他人的著作权、商标权、隐私权、名誉权、肖像权或其他合法权益。',
      '您仍然拥有自己原创内容依法享有的权利。',
      '向 StarClub 发布或投稿内容时，您授权 StarClub 在运营、展示和维护社区所合理必要的范围内，免费存储、复制、展示、调整格式、压缩、制作缩略图，以及通过 StarClub 官方网站和官方社区渠道展示相关内容。',
      '上述授权不代表您将内容的所有权转让给 StarClub。',
      'StarClub 可以根据社区规则、安全需要、法律要求或第三方权利人的合理请求，对相关用户内容进行隐藏、限制展示或删除。',
      '如您认为网站上的内容侵犯您的合法权益，请通过 contactstarclubsc@gmail.com 联系我们。我们可能要求您提供合理必要的信息，以确认相关权利或处理请求。',
    ],
  },
  {
    title: '4. 活动与赛事',
    content: [
      'StarClub 可能举办免费的玩家活动、社区赛事及其他社区活动。',
      '具体活动或赛事的报名资格、比赛规则、成绩判定、奖励以及其他要求，以相应活动页面或官方公告公布的规则为准。',
      'StarClub 举办的活动属于玩家社区活动。除非特别明确说明，否则不属于 CIG、RSI 或其他第三方举办、认可或赞助的官方活动。',
    ],
  },
  {
    title: '5. 社区费用支持',
    content: [
      'StarClub 网站和社区不以出售访问权或会员资格盈利。',
      '社区成员可能通过 StarClub Discord 或其他由 StarClub 明确提供的方式，自愿支持服务器、域名、网站基础设施、活动、赛事奖励以及其他社区运营成本。',
      '此类支持完全自愿，不是加入社区、浏览或使用网站、创建账号、完成 RSI 验证或参加普通社区活动的条件。',
      '社区支持不构成投资、购买、订阅、股权、合伙关系或利润分配关系。',
      '在获得相关支持者同意的情况下，StarClub 可能在网站赞助榜或社区相关页面公开其社区昵称及支持金额。有关此类信息的处理方式，请参阅《StarClub 隐私政策》。',
    ],
  },
  {
    title: '6. 第三方服务',
    content: [
      'StarClub 可能使用或链接 Discord、Roberts Space Industries 以及其他第三方网站、平台或技术服务。',
      '这些服务由相应第三方独立运营，并适用其自己的服务条款和隐私政策。',
      'StarClub 不控制第三方服务的持续可用性、安全措施、内容或其独立的数据处理行为。',
    ],
  },
  {
    title: '7. 服务与免责声明',
    content: [
      'StarClub 是玩家社区。网站中的攻略、游戏数据、版本信息、玩家投稿及其他社区内容可能随着《Star Citizen》更新或其他情况发生变化。',
      '我们会尽合理努力维护网站和社区，但不保证服务永久不中断、完全无错误，也不保证所有用户内容、游戏资料或社区信息始终准确、完整或最新。',
      '您应根据实际情况自行判断社区内容是否适合您的用途。',
      'StarClub 可以因维护、安全、社区治理、技术、法律或其他合理原因修改、暂停或终止部分网站或社区功能。',
    ],
  },
  {
    title: '8. 未成年人',
    content: [
      'StarClub 不以未达到其所在地适用法律或相关第三方服务所要求最低使用年龄的儿童为主要服务对象。',
      '使用需要关联 Discord 或其他第三方账号的 StarClub 功能时，用户还应满足相应第三方服务规定的最低年龄要求。',
      '未成年人应在其所在地适用法律要求的情况下，在父母或监护人的指导和同意下使用 StarClub。',
      '如我们发现用户未达到适用的最低年龄，或在依法需要监护人授权的情况下未经适当授权向 StarClub 提供个人信息，我们可能限制或终止相关账号权限，并依法删除或处理相关信息。',
    ],
  },
  {
    title: '9. 条款修改',
    content: [
      'StarClub 可能根据网站功能、社区运营、技术变化或法律要求更新本条款。',
      '如发生重大变化，我们将通过网站、Discord 社区或其他合理方式进行通知。',
      '更新后的条款将在公布的生效日期起适用。',
    ],
  },
  {
    title: '10. 语言版本',
    content: [
      '本使用条款可能提供英文翻译，以方便国际用户阅读。',
      '如中文版本与其他语言版本之间存在解释上的差异，以中文版本为主要解释版本，但适用法律另有要求的除外。',
    ],
  },
]

const sectionsEn = [
  {
    title: '1. Website and Community Accounts',
    content: [
      'Most public content on StarClub may be viewed without an account.',
      'Certain community features, including posting, commenting, submitting content, participating in community interactions, and joining member activities, may require a StarClub account and may be limited to users who have joined the StarClub Discord community, completed applicable community verification, or verified their RSI player identity.',
      'RSI verification is used solely to confirm player identity and community eligibility. StarClub will never ask for your RSI account password, two-factor authentication codes, or recovery codes.',
      'You are responsible for taking reasonable measures to protect your account and login credentials. If you become aware of unauthorized access, suspicious activity, or another security issue involving your account, please contact us.',
      'For community safety, anti-abuse purposes, suspicious account activity, violations of community rules, or other reasonable grounds, StarClub may require additional verification, restrict certain features, suspend access, or terminate community privileges.',
      'Joining StarClub, browsing the website, creating a community account, or completing RSI verification does not itself require payment.',
    ],
  },
  {
    title: '2. Community Rules',
    content: [
      'When using the StarClub website and its official community spaces, you must comply with the StarClub Community Rules.',
      'StarClub may remove, hide, or restrict access to content that violates community rules, threatens community safety, or infringes the rights of others. Depending on the circumstances, StarClub may also issue warnings, restrict features, suspend access, or terminate community privileges.',
    ],
  },
  {
    title: '3. User Content',
    content: [
      'You may submit or publish posts, comments, images, screenshots, guides, event or competition materials, submissions, and other community content through StarClub.',
      'You are responsible for ensuring that you have the right to publish such content and that it does not infringe the copyright, trademark, privacy, publicity, reputation, image rights, or other legal rights of others.',
      'You retain the rights you legally hold in your original content.',
      "By publishing or submitting content to StarClub, you grant StarClub a royalty-free permission, to the extent reasonably necessary to operate, display, and maintain the community, to store, reproduce, display, format, compress, create thumbnails from, and display such content through StarClub's official website and community channels.",
      'This permission does not transfer ownership of your content to StarClub.',
      'StarClub may hide, restrict, or remove user content when reasonably necessary to enforce community rules, protect community safety, comply with applicable law, or respond to a reasonable request from a third-party rights holder.',
      'If you believe content available through StarClub infringes your legal rights, please contact us at contactstarclubsc@gmail.com.',
    ],
  },
  {
    title: '4. Events and Competitions',
    content: [
      'StarClub may organize free player events, community competitions, and other community activities.',
      'Eligibility requirements, competition rules, result determinations, prizes, and other requirements are governed by the rules published on the relevant event page or in the applicable official announcement.',
      'Unless expressly stated otherwise, StarClub events are not official events organized, endorsed, or sponsored by CIG, RSI, or any other third party.',
    ],
  },
  {
    title: '5. Voluntary Community Support',
    content: [
      'StarClub does not operate its website or community by selling access rights or community membership.',
      'Community members may voluntarily provide financial support through methods made available by StarClub to help cover server costs, domains, website infrastructure, community events, competition prizes, and other operating expenses.',
      'Such support is entirely voluntary and is not a condition of joining the community, using the website, creating an account, completing RSI verification, or participating in ordinary community activities.',
      'Community support does not constitute an investment, purchase, subscription, equity interest, partnership, or profit-sharing arrangement.',
      'With the relevant supporter’s consent, StarClub may publicly display their community nickname and support amount on the sponsor leaderboard or related community pages.',
    ],
  },
  {
    title: '6. Third-Party Services',
    content: [
      'StarClub may use or provide links to Discord, Roberts Space Industries, and other third-party websites, platforms, or technology services.',
      'These services are independently operated and are subject to their own terms of service and privacy policies.',
      'StarClub does not control the continued availability, security practices, content, or independent data-processing practices of third-party services.',
    ],
  },
  {
    title: '7. Service and Disclaimer',
    content: [
      'StarClub is a player community. Guides, game data, version information, user submissions, and other community content may change as Star Citizen is updated or as circumstances change.',
      'We make reasonable efforts to maintain the website and community, but we do not guarantee uninterrupted or error-free service, nor do we guarantee that all user content, game information, or community information will always be accurate, complete, or current.',
      'You should use your own judgment when determining whether community content is appropriate for your particular purposes.',
      'StarClub may modify, suspend, or discontinue portions of the website or community for maintenance, security, community governance, technical, legal, or other reasonable reasons.',
    ],
  },
  {
    title: '8. Minors',
    content: [
      'StarClub is not primarily directed to children who have not reached the minimum age required by applicable law in their place of residence or by relevant third-party services.',
      'When a StarClub feature requires linking to Discord or another third-party account, users must also satisfy the minimum age requirements applicable to that service.',
      'Where required by applicable law, minors should use StarClub only with the guidance and consent of a parent or legal guardian.',
      'If we learn that a user does not meet an applicable minimum-age requirement, or has provided personal information without required parental or guardian authorization, we may restrict or terminate the relevant account privileges and delete or otherwise process the information as required by applicable law.',
    ],
  },
  {
    title: '9. Changes to These Terms',
    content: [
      'StarClub may update these Terms to reflect changes to website functionality, community operations, technology, or legal requirements.',
      'If we make material changes, we will provide reasonable notice through the website, the StarClub Discord community, or another appropriate method.',
      'Updated Terms will apply from the stated effective date.',
    ],
  },
  {
    title: '10. Language Versions',
    content: [
      'An English translation of these Terms is provided for the convenience of international users.',
      'In the event of any inconsistency in interpretation between the Chinese version and another language version, the Chinese version will serve as the primary version, except where otherwise required by applicable law.',
    ],
  },
]

export default function TermsPage() {
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')

  const isZh = language === 'zh'
  const sections = isZh ? sectionsZh : sectionsEn

  return (
    <main className="min-h-screen bg-[#faf9f7] text-[#1d1b18]">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <div className="mb-14 border-b border-[#e4dfd6] pb-10">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-5">
            <Link
              href="/"
              className="text-xs font-medium uppercase tracking-[0.22em] text-[#857b6d] transition hover:text-[#1d1b18]"
            >
              星际酒馆 StarClub
            </Link>

            <div className="flex rounded-full border border-[#ded8ce] bg-white p-1">
              <button
                type="button"
                onClick={() => setLanguage('zh')}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  isZh
                    ? 'bg-[#1d1b18] text-white'
                    : 'text-[#766d61] hover:text-[#1d1b18]'
                }`}
              >
                中文
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  !isZh
                    ? 'bg-[#1d1b18] text-white'
                    : 'text-[#766d61] hover:text-[#1d1b18]'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#ad8d5d]">
            {isZh ? 'LEGAL' : 'LEGAL'}
          </p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {isZh ? '使用条款' : 'Terms of Use'}
          </h1>

          <p className="mt-4 text-sm text-[#81776a]">
            {isZh
              ? '最后更新：2026 年 9 月'
              : 'Last Updated: September 2026'}
          </p>
        </div>

        <div className="space-y-12">
          <section className="space-y-5 text-[15px] leading-8 text-[#4e4840] sm:text-base">
            <p>
              {isZh
                ? '欢迎使用 星际酒馆 StarClub（以下简称“StarClub”）。'
                : 'Welcome to StarClub.'}
            </p>

            <p>
              {isZh
                ? 'StarClub 是一个由玩家运营的、非商业性质的《Star Citizen》非官方中文玩家社区。本网站及 StarClub 社区与 Cloud Imperium Games、Roberts Space Industries 及其关联公司不存在隶属、代理或官方背书关系。'
                : 'StarClub is a player-operated, non-commercial, unofficial Chinese-language community for Star Citizen players. The StarClub website and community are not affiliated with, operated by, acting as an agent of, or officially endorsed by Cloud Imperium Games, Roberts Space Industries, or their affiliates.'}
            </p>

            <p>
              {isZh
                ? '使用 StarClub 即表示您同意本使用条款及适用于相关社区功能的《StarClub 社区规章》。'
                : 'By using StarClub, you agree to these Terms of Use and the StarClub Community Rules applicable to the relevant community features.'}
            </p>
          </section>

          {sections.map((section) => (
            <section
              key={section.title}
              className="border-t border-[#e8e3db] pt-9"
            >
              <h2 className="mb-5 text-xl font-semibold tracking-tight sm:text-2xl">
                {section.title}
              </h2>

              <div className="space-y-4 text-[15px] leading-8 text-[#554e45] sm:text-base">
                {section.content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <section className="border-t border-[#e8e3db] pt-9">
            <h2 className="mb-5 text-xl font-semibold tracking-tight sm:text-2xl">
              {isZh ? '11. 联系我们' : '11. Contact Us'}
            </h2>

            <div className="space-y-3 text-[15px] leading-8 text-[#554e45] sm:text-base">
              <p>
                {isZh
                  ? '如对本条款、账号、内容或社区管理有任何问题，请联系：'
                  : 'If you have questions regarding these Terms, your account, content, or community administration, please contact:'}
              </p>

              <p className="font-medium text-[#1d1b18]">
                星际酒馆 StarClub
                <br />
                <a
                  href="mailto:contactstarclubsc@gmail.com"
                  className="underline decoration-[#c7a46a]/60 underline-offset-4 transition hover:decoration-[#c7a46a]"
                >
                  contactstarclubsc@gmail.com
                </a>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-16 border-t border-[#e4dfd6] pt-8 text-sm text-[#8a8176]">
          <Link
            href="/"
            className="transition hover:text-[#1d1b18]"
          >
            ← {isZh ? '返回 StarClub' : 'Back to StarClub'}
          </Link>
        </div>
      </div>
    </main>
  )
}