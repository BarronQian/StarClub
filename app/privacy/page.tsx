'use client'

import { useState } from 'react'
import Link from 'next/link'

const sectionsZh = [
  {
    title: '1. 我们收集的信息',
    content: [
      '根据您使用的功能，我们可能处理以下类型的信息。',
      '账号与社区信息：包括用户名及头像、Discord 用户名、User ID 及社区成员状态、Star Citizen / RSI Handle、RSI 玩家身份验证状态、电子邮箱或其他账号识别信息。',
      '星际酒馆 StarClub 的 RSI 验证仅用于确认玩家身份和社区资格。我们不会要求或保存您的 RSI 密码、双重验证码或恢复代码。',
      '您主动提供的内容：包括帖子、评论、截图、图片、攻略、赛事报名资料、队伍名称、比赛成绩、投稿以及您主动发送给我们的其他内容。',
      '您主动公开发布的内容可能被其他互联网用户看到。',
      '技术与安全信息：为维持网站运行、安全及防止滥用，我们或为星际酒馆 StarClub 提供基础设施的服务商可能自动处理 IP 地址、浏览器和设备信息、访问时间、登录记录、安全日志、网络请求以及类似技术信息。',
      '社区支持信息：如果您通过星际酒馆 StarClub 提供的方式自愿支持社区，我们可能记录您的社区昵称、支持金额以及管理相关支持记录所必要的信息。',
      '如果实际付款由第三方平台处理，星际酒馆 StarClub 不会因此获得您的完整银行卡号、信用卡安全码或银行密码。',
    ],
  },
  {
    title: '2. 我们为什么使用这些信息',
    content: [
      '我们主要将上述信息用于创建、认证和管理社区账号；验证 Discord 与 RSI 玩家身份；提供发帖、评论、点赞、投稿及其他社区互动功能；提供图片上传、社区展示和相关内容功能；举办活动、赛事并记录相关成绩；管理社区权限及执行社区规则；展示经相关用户同意公开的社区赞助信息；防止欺诈、垃圾信息、账号滥用及网络攻击；调查和处理举报、投诉、安全事件及用户请求；维护、分析和改进网站及相关服务；以及履行适用的法律义务。',
      '星际酒馆 StarClub 不出售用户个人信息。',
    ],
  },
  {
    title: '3. 哪些信息可能公开',
    content: [
      '根据您使用的功能和主动选择，以下信息可能公开显示：社区用户名或 RSI Handle、头像、您主动发布的帖子、评论、图片、截图、攻略或投稿、活动队伍、赛事参与情况及比赛成绩、名人堂及其他社区荣誉记录，以及经您同意公开的社区支持者昵称及支持金额。',
      '您主动发布到公开社区区域的信息可能被任何能够访问相关页面的互联网用户查看。',
      '对于依法需要取得单独同意才能公开的个人信息，我们将在适用情况下取得相应同意。',
    ],
  },
  {
    title: '4. Discord、RSI 和其他第三方服务',
    content: [
      '星际酒馆 StarClub 使用 Discord 进行社区交流，并可能使用 Discord 提供的账号或社区信息实现成员身份关联及相关社区功能。',
      '星际酒馆 StarClub 可能通过 Roberts Space Industries（RSI）的公开玩家资料或其他验证方式确认 Star Citizen 玩家身份。',
      'Discord、Roberts Space Industries 以及星际酒馆 StarClub 网站链接或使用的其他第三方服务均由相应第三方独立运营，并拥有各自的服务条款和隐私政策。',
      '星际酒馆 StarClub 仅处理提供相关社区功能所合理需要的信息。',
      '当您直接访问或使用第三方服务时，该第三方如何处理您的信息由其自己的隐私政策和相关条款决定。',
    ],
  },
  {
    title: '5. 数据存储、服务提供商与境外处理',
    content: [
      '星际酒馆 StarClub 的网站、数据库及相关技术服务主要部署于美国或由境外技术服务商提供。',
      '因此，中国境内及其他地区的用户访问网站、注册或使用星际酒馆 StarClub 账号及相关社区功能时，相关个人信息可能被传输至用户所在地以外的国家或地区并在那里进行处理或存储。',
      '星际酒馆 StarClub 使用 Vercel 提供网站部署、托管、内容分发及相关基础设施服务。在提供这些服务的过程中，相关基础设施可能处理 IP 地址、访问请求、浏览器或设备信息、访问时间、网络日志及其他提供和保护网站所必要的技术信息。',
      '星际酒馆 StarClub 使用 Supabase 提供数据库、文件存储、身份认证及相关后端基础设施服务。根据您使用的星际酒馆 StarClub 功能，账号资料、社区内容、图片、认证状态及其他相关数据可能通过 Supabase 提供的基础设施进行存储和处理。',
      '星际酒馆 StarClub 使用 Discord 提供社区交流及部分社区身份关联功能。Discord 对其自身服务中的数据处理适用其自己的隐私政策及服务条款。',
      '星际酒馆 StarClub 还可能根据网站功能及运营需要使用其他必要的技术服务提供商。',
      '如果服务提供商或数据处理方式发生对用户隐私具有重大影响的变化，我们将相应更新本隐私政策。',
    ],
  },
  {
    title: '6. 信息保存期限',
    content: [
      '我们仅在实现相关用途所合理必要的期限内保存个人信息。',
      '一般情况下，账号资料在账号存续及提供相关服务所必要的期间保存；用户内容保存至用户删除、星际酒馆 StarClub 根据社区规则删除或相关功能终止；一般技术和安全日志原则上不会超过安全、故障排查及运营所合理必要的期限；活动、赛事、投诉、争议或安全事件资料可以在处理相关事项所必要的期限内保存；法律要求我们保留的信息，可以在法律规定的期限内保存。',
      '账号注销后，不再需要的信息将根据适用法律删除或匿名化，但法律要求继续保存、维护社区安全记录或仍处于合理备份周期中的信息除外。',
    ],
  },
  {
    title: '7. 您的隐私权利',
    content: [
      '根据您所在地适用法律以及具体情况，您可以联系我们请求查询我们持有的与您有关的个人信息、更正不准确的个人信息、删除符合条件的个人信息、删除自己发布的内容、撤回此前给予的相关同意、停止公开展示符合条件的个人信息、注销星际酒馆 StarClub 账号，或询问我们如何处理您的个人信息。',
      '为了保护账号及个人信息安全，我们可能在处理请求前进行合理的身份核实。',
      '部分请求可能受到适用法律允许的例外情况限制。',
    ],
  },
  {
    title: '8. 未成年人',
    content: [
      '星际酒馆 StarClub 不以未达到其所在地适用法律或相关第三方服务所要求最低使用年龄的儿童为主要服务对象。',
      '对于依法需要父母或监护人同意才能处理个人信息的未成年人，我们仅会在取得适当授权或存在其他合法依据的情况下处理相关信息。',
      '如果我们发现未经必要授权而收集了未成年人的个人信息，我们将根据适用法律采取限制处理、删除或其他必要措施。',
      '父母或监护人如认为未成年人向星际酒馆 StarClub 提供了不应提供的个人信息，可以通过 contactstarclubsc@gmail.com 联系我们。',
    ],
  },
  {
    title: '9. 信息安全',
    content: [
      '我们采取与星际酒馆 StarClub 社区规模、技术环境及数据风险相适应的合理安全措施，包括访问权限控制、身份认证、数据传输保护、日志记录以及必要的技术维护。',
      '只有因社区运营、管理、安全或技术维护具有合理需要的人员才应获得相应的数据访问权限。',
      '但是，任何互联网服务均无法保证绝对安全。',
      '如果发生个人信息安全事件，我们将根据事件性质和适用法律采取合理必要的调查、控制、修复及通知措施。',
    ],
  },
  {
    title: '10. Cookies 与类似技术',
    content: [
      '星际酒馆 StarClub 及为网站提供基础设施的服务商可能使用 Cookies、本地存储或类似技术，以维持登录状态、保存必要的网站设置、提供安全功能以及保障网站正常运行。',
      '某些第三方服务也可能根据其自身政策使用相关技术。',
      '如果未来星际酒馆 StarClub 引入用于广告、跨网站行为追踪或其他需要额外披露或同意的技术，我们将根据实际情况更新本隐私政策，并在适用法律要求时提供相应选择。',
    ],
  },
  {
    title: '11. 本政策的更新',
    content: [
      '星际酒馆 StarClub 可能根据网站功能、技术架构、服务提供商、社区运营或法律要求更新本隐私政策。',
      '如果发生重大变化，我们将通过网站、星际酒馆 StarClub Discord 社区或其他合理方式进行通知。',
      '更新后的隐私政策将在公布的生效日期起适用。',
    ],
  },
  {
    title: '12. 语言版本',
    content: [
      '本隐私政策提供英文翻译，以方便国际用户阅读。',
      '如中文版本与其他语言版本之间存在解释上的差异，以中文版本为主要解释版本，但适用法律另有要求的除外。',
    ],
  },
]

const sectionsEn = [
  {
    title: '1. Information We Process',
    content: [
      'Depending on the features you use, we may process account and community information, content you provide, technical and security information, and community support information.',
      'Account and community information may include your username, profile image, Discord username and User ID, community membership status, Star Citizen / RSI Handle, RSI player verification status, email address, or other account identifiers.',
      'RSI verification is used solely to confirm player identity and community eligibility. StarClub will not request or store your RSI password, two-factor authentication codes, or recovery codes.',
      'Content you provide may include posts, comments, screenshots, images, guides, event registration information, team names, competition results, submissions, and other information you voluntarily provide.',
      'Content that you choose to publish publicly may be visible to other internet users.',
      'To operate and protect the website and prevent abuse, StarClub or service providers supporting our infrastructure may automatically process information such as IP addresses, browser and device information, access times, login records, security logs, network requests, and similar technical information.',
      'If you voluntarily provide financial support to the StarClub community, we may record your community nickname, support amount, and information reasonably necessary to administer related support records.',
      'Where payments are processed by a third-party payment provider, StarClub does not receive your complete payment card number, card security code, or online banking password merely as a result of that transaction.',
    ],
  },
  {
    title: '2. How We Use Information',
    content: [
      'We use information to create, authenticate, and administer community accounts; verify Discord and RSI player identities; provide posting, commenting, liking, submission, image-uploading, and other community features; organize events and competitions; manage permissions and enforce community rules; display community-support information where the relevant user has agreed to publication; prevent fraud, spam, account abuse, and cyberattacks; investigate reports, complaints, and security incidents; maintain and improve the website; and comply with applicable legal obligations.',
      'StarClub does not sell users’ personal information.',
    ],
  },
  {
    title: '3. Information That May Be Public',
    content: [
      'Depending on the features you use and the choices you make, publicly displayed information may include your community username or RSI Handle, profile image, content you choose to publish, event participation and competition results, Hall of Fame or other community achievement records, and community supporter nicknames and support amounts where you have agreed to publication.',
      'Information that you intentionally publish in a public area of the community may be visible to any internet user who can access the relevant page.',
      'Where applicable law requires separate consent before particular personal information is publicly disclosed, we will obtain such consent where required.',
    ],
  },
  {
    title: '4. Discord, RSI, and Other Third-Party Services',
    content: [
      'StarClub uses Discord for community communication and may use account or community information made available through Discord to associate users with their community membership and provide related features.',
      'StarClub may use publicly available Roberts Space Industries (RSI) player information or other verification methods to confirm a user’s Star Citizen player identity.',
      'Discord, Roberts Space Industries, and other third-party services used or linked by StarClub are independently operated and maintain their own terms of service and privacy policies.',
      'StarClub processes only information reasonably necessary to provide the relevant community functionality.',
      'When you directly access or use a third-party service, that third party’s processing of your information is governed by its own privacy policy and applicable terms.',
    ],
  },
  {
    title: '5. Data Storage, Service Providers, and International Processing',
    content: [
      'The StarClub website, databases, and related technology services are primarily hosted in the United States or provided by service providers operating outside some users’ countries of residence.',
      'Accordingly, personal information relating to users in China or other jurisdictions may be transferred to, processed in, or stored in countries or regions outside the user’s place of residence.',
      'StarClub uses Vercel for website deployment, hosting, content delivery, and related infrastructure. Relevant infrastructure may process IP addresses, access requests, browser or device information, access times, network logs, and other technical information necessary to provide and protect the website.',
      'StarClub uses Supabase for database, file storage, authentication, and related backend infrastructure. Depending on the StarClub features you use, account information, community content, images, verification status, and other relevant information may be stored or processed using Supabase infrastructure.',
      'StarClub uses Discord for community communication and certain community identity-association features. Discord’s processing of information through its own services is governed by its own privacy policy and terms.',
      'StarClub may use additional technology service providers where reasonably necessary to operate website or community functionality.',
      'If changes to our service providers or processing practices materially affect user privacy, we will update this Privacy Policy as appropriate.',
    ],
  },
  {
    title: '6. Data Retention',
    content: [
      'We retain personal information only for as long as reasonably necessary for the purposes for which it is processed.',
      'Generally, account information is retained while the account remains active and for as long as reasonably necessary to provide related services; user content is retained until deleted by the user, removed by StarClub under applicable community rules, or the relevant feature is discontinued; ordinary technical and security logs are retained only for as long as reasonably necessary for security, troubleshooting, and operational purposes; records relating to events, complaints, disputes, or security incidents may be retained for as long as reasonably necessary; and information that we are legally required to retain may be kept for the period required by applicable law.',
      'After an account is closed, information that is no longer necessary will be deleted or anonymized as appropriate under applicable law, except where continued retention is legally required, reasonably necessary for community safety records, or temporarily maintained in backup systems.',
    ],
  },
  {
    title: '7. Your Privacy Rights',
    content: [
      'Depending on applicable law in your place of residence and the circumstances of your request, you may contact us to request access to personal information relating to you, correction of inaccurate personal information, deletion of eligible personal information, deletion of content that you have posted, withdrawal of applicable consent, removal of eligible information from public display, closure of your StarClub account, or information about how we process your personal information.',
      'To protect account and personal information security, we may take reasonable steps to verify your identity before processing a request.',
      'Certain requests may be subject to exceptions permitted by applicable law.',
    ],
  },
  {
    title: '8. Minors',
    content: [
      'StarClub is not primarily directed to children who have not reached the minimum age required by applicable law in their place of residence or by relevant third-party services.',
      'Where applicable law requires parental or guardian consent before processing a minor’s personal information, we will process such information only with appropriate authorization or another lawful basis.',
      'If we learn that we have collected a minor’s personal information without authorization required by applicable law, we will take appropriate steps to restrict processing, delete the information, or otherwise address the matter as required.',
      'Parents or legal guardians who believe that a minor has provided personal information to StarClub that should not have been provided may contact us at contactstarclubsc@gmail.com.',
    ],
  },
  {
    title: '9. Information Security',
    content: [
      'We use reasonable security measures appropriate to the size of the StarClub community, our technical environment, and the risks associated with the information we process.',
      'Access to relevant data should be limited to individuals who reasonably require it for community operations, administration, security, or technical maintenance.',
      'However, no internet-based service can guarantee absolute security.',
      'If a personal information security incident occurs, we will take reasonable and appropriate steps to investigate, contain, remediate, and provide notifications where required by applicable law.',
    ],
  },
  {
    title: '10. Cookies and Similar Technologies',
    content: [
      'StarClub and service providers supporting the website may use cookies, local storage, or similar technologies to maintain login sessions, remember necessary website settings, provide security functionality, and keep the website operating properly.',
      'Certain third-party services may also use similar technologies in accordance with their own policies.',
      'If StarClub later introduces advertising, cross-site behavioral tracking, or other technologies requiring additional disclosure or consent, we will update this Privacy Policy and provide appropriate choices where required by applicable law.',
    ],
  },
  {
    title: '11. Changes to This Privacy Policy',
    content: [
      'StarClub may update this Privacy Policy to reflect changes in website functionality, technical architecture, service providers, community operations, or legal requirements.',
      'If we make material changes, we will provide reasonable notice through the website, the StarClub Discord community, or another appropriate method.',
      'The updated Privacy Policy will apply from its stated effective date.',
    ],
  },
  {
    title: '12. Language Versions',
    content: [
      'An English translation of this Privacy Policy is provided for the convenience of international users.',
      'In the event of any inconsistency in interpretation between the Chinese version and another language version, the Chinese version will serve as the primary version, except where otherwise required by applicable law.',
    ],
  },
]

export default function PrivacyPage() {
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
            LEGAL
          </p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {isZh ? '隐私政策' : 'Privacy Policy'}
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
                ? '星际酒馆 StarClub（以下简称“StarClub”）重视用户隐私。本隐私政策说明我们在您访问星际酒馆 StarClub 网站、使用社区账号及相关功能时，如何收集、使用、存储、公开和保护您的个人信息。'
                : '星际酒馆 StarClub (“StarClub,” “we,” “us,” or “our”) respects the privacy of its users. This Privacy Policy explains how we collect, use, store, disclose, and protect personal information when you visit the StarClub website or use StarClub accounts and related community features.'}
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
              {isZh ? '13. 联系我们' : '13. Contact Us'}
            </h2>

            <div className="space-y-3 text-[15px] leading-8 text-[#554e45] sm:text-base">
              <p>
                {isZh
                  ? '关于隐私、个人信息删除、账号注销或其他数据问题，请联系：'
                  : 'For questions or requests concerning privacy, deletion of personal information, account closure, or other data matters, please contact:'}
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

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[#e4dfd6] pt-8 text-sm text-[#8a8176]">
          <Link
            href="/"
            className="transition hover:text-[#1d1b18]"
          >
            ← {isZh ? '返回星际酒馆 StarClub' : 'Back to StarClub'}
          </Link>

          <Link
            href="/terms"
            className="transition hover:text-[#1d1b18]"
          >
            {isZh ? '查看使用条款 →' : 'Terms of Use →'}
          </Link>
        </div>
      </div>
    </main>
  )
}