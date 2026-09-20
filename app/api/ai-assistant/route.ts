import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

import {
  STARCLUB_KNOWLEDGE,
} from '@/lib/ai-assistant-knowledge'

export const dynamic =
  'force-dynamic'

export const revalidate = 0

const DAILY_LIMIT = 20
const MAX_MESSAGE_LENGTH = 300

const OPENAI_MODEL =
  'gpt-5.4-mini'

const SYSTEM_PROMPT = `
你是星际酒馆 StarClub 官方网站的智能助手。

你的英文名字是 Chris Robots。
你的中文昵称是“小萝卜”。

【身份】

- 默认使用简体中文回答。
- 用户使用英文时，可以使用英文回答。
- 语气友好、自然、简洁。
- 用户可以称呼你为 Chris Robots、Chris 或小萝卜。
- 你是星际酒馆的网站 AI 助手，不是真人管理员。
- 不要冒充 CIG、Cloud Imperium Games 或 Star Citizen 官方工作人员。

【知识使用规则】

下面提供的“星际酒馆知识库”是回答星际酒馆内部问题时的主要依据。

如果用户询问：
- 星际酒馆
- StarClub
- 官网功能
- Discord
- ORG
- 社区规则
- 玩家市场
- 社区影廊
- 活动
- 萌新帮助
- 名人堂
- 网站工具
- Handle 验证

应优先依据知识库回答。

如果知识库没有提供某项星际酒馆内部信息：
不要凭模型自身知识补全或猜测。

可以直接告诉用户目前无法确认，并引导用户查看对应页面或联系管理组。

不要虚构：
- 网站功能
- URL
- Discord 频道
- 社区成员
- 管理人员
- 活动时间
- 活动奖励
- 用户账号信息
- 市场商品
- 内部规则

【Star Citizen】

对于一般性的 Star Citizen 问题，可以使用你的通用知识回答。

但是 Star Citizen 持续更新。

涉及当前版本、当前活动、舰船价格、实时游戏机制等可能变化的信息，如果无法确认是否仍然有效，应明确说明信息可能已经发生变化，不要把旧信息描述成当前确定事实。

【回答风格】

这是网站客服聊天窗口，不是长篇文章生成器。

- 简单问题直接回答。
- 通常控制在 1～4 个短段落。
- 没必要时不要使用长列表。
- 不要每次回复都重新介绍自己。
- 不要为了显得完整而加入与问题无关的信息。
- 用户追问上一句话时，应结合提供给你的最近聊天记录理解上下文。

--------------------
星际酒馆知识库
--------------------

${STARCLUB_KNOWLEDGE}

--------------------
知识库结束
--------------------
`.trim()

function getAdminSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      'Missing Supabase server environment variables',
    )
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

function getOpenAIKey() {
  const key =
    process.env.OPENAI_API_KEY

  if (!key) {
    throw new Error(
      'Missing OPENAI_API_KEY',
    )
  }

  return key
}

type UsageResult = {
  allowed: boolean
  remaining: number
  used: number
}

type RefundResult = {
  remaining: number
  used: number
}

type ChatHistoryMessage = {
  role:
    | 'user'
    | 'assistant'

  content: string
}

type OpenAIResponse = {
  status?: string

  output_text?: string

  output?: Array<{
    type?: string
    content?: Array<{
      type?: string
      text?: string
    }>
  }>

  error?: {
    message?: string
  }
}

function getResponseText(
  data: OpenAIResponse,
) {
  if (
    typeof data.output_text ===
      'string' &&
    data.output_text.trim()
  ) {
    return data.output_text.trim()
  }

  const parts: string[] = []

  for (
    const item of
      data.output ?? []
  ) {
    if (
      item.type !== 'message'
    ) {
      continue
    }

    for (
      const content of
        item.content ?? []
    ) {
      if (
        content.type ===
          'output_text' &&
        typeof content.text ===
          'string' &&
        content.text.trim()
      ) {
        parts.push(
          content.text.trim(),
        )
      }
    }
  }

  return parts
    .join('\n')
    .trim()
}

async function refundUsage(
  supabase: ReturnType<
    typeof getAdminSupabase
  >,
  userId: string,
) {
  try {
    const {
      data,
      error,
    } =
      await supabase.rpc(
        'refund_ai_assistant_usage',
        {
          p_user_id:
            userId,
        },
      )

    if (error) {
      console.error(
        'Failed to refund AI usage:',
        error,
      )

      return null
    }

    const row =
      Array.isArray(data)
        ? (
            data[0] as
              | RefundResult
              | undefined
          )
        : null

    return row ?? null
  } catch (error) {
    console.error(
      'AI usage refund error:',
      error,
    )

    return null
  }
}

export async function POST(
  request: NextRequest,
) {
  let reservedUserId:
    string | null = null

  let supabase:
    ReturnType<
      typeof getAdminSupabase
    > | null = null

  try {
    /*
     * 1. 验证登录
     */
    const authorization =
      request.headers.get(
        'authorization',
      )

    if (
      !authorization?.startsWith(
        'Bearer ',
      )
    ) {
      return NextResponse.json(
        {
          error:
            '请先登录星际酒馆官网后使用酒馆智能助手',
        },
        {
          status: 401,
        },
      )
    }

    const accessToken =
      authorization.slice(7)

    supabase =
      getAdminSupabase()

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await supabase.auth.getUser(
        accessToken,
      )

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            '登录状态已失效，请重新登录',
        },
        {
          status: 401,
        },
      )
    }

    /*
     * 2. 验证问题内容
     */
    let body:
      Record<string, unknown>

    try {
      body =
        await request.json()
    } catch {
      return NextResponse.json(
        {
          error:
            '请求内容格式错误',
        },
        {
          status: 400,
        },
      )
    }

    const message =
      typeof body.message ===
        'string'
        ? body.message.trim()
        : ''

    const rawHistory =
  Array.isArray(
    body.history,
  )
    ? body.history
    : []

const history:
  ChatHistoryMessage[] =
  rawHistory
    .slice(-6)
    .flatMap(
      (item) => {
        if (
          !item ||
          typeof item !==
            'object'
        ) {
          return []
        }

        const record =
          item as
            Record<
              string,
              unknown
            >

        const role =
          record.role

        const content =
          typeof record.content ===
            'string'
            ? record.content
                .trim()
                .slice(
                  0,
                  1000,
                )
            : ''

        if (
          (
            role !==
              'user' &&
            role !==
              'assistant'
          ) ||
          !content
        ) {
          return []
        }

        return [
          {
            role,
            content,
          } as ChatHistoryMessage,
        ]
      },
    )

    if (!message) {
      return NextResponse.json(
        {
          error:
            '请输入要询问的内容',
        },
        {
          status: 400,
        },
      )
    }

    if (
      message.length >
      MAX_MESSAGE_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `单次提问不能超过 ${MAX_MESSAGE_LENGTH} 个字符`,
        },
        {
          status: 400,
        },
      )
    }

    /*
     * 3. 原子扣除今天 1 次额度
     */
    const {
      data:
        usageData,
      error:
        usageError,
    } =
      await supabase.rpc(
        'consume_ai_assistant_usage',
        {
          p_user_id:
            user.id,

          p_daily_limit:
            DAILY_LIMIT,
        },
      )

    if (usageError) {
      console.error(
        'Failed to consume AI usage:',
        usageError,
      )

      return NextResponse.json(
        {
          error:
            '读取今日使用次数失败，请稍后再试',
        },
        {
          status: 500,
        },
      )
    }

    const usage =
      Array.isArray(
        usageData,
      )
        ? (
            usageData[0] as
              | UsageResult
              | undefined
          )
        : undefined

    if (!usage) {
      console.error(
        'Missing AI usage result',
        usageData,
      )

      return NextResponse.json(
        {
          error:
            '读取今日使用次数失败，请稍后再试',
        },
        {
          status: 500,
        },
      )
    }

    if (
      usage.allowed !== true
    ) {
      return NextResponse.json(
        {
          error:
            '今天的小萝卜使用次数已经用完啦，明天再来找我吧。',
          remaining: 0,
        },
        {
          status: 429,
        },
      )
    }

    /*
     * 从这里开始已经扣了 1 次。
     * 如果后面的 OpenAI 请求失败，
     * catch 中会自动退款。
     */
    reservedUserId =
      user.id

    /*
     * 4. 请求 OpenAI
     */
    const controller =
      new AbortController()

    const timeout =
      setTimeout(
        () => {
          controller.abort()
        },
        30000,
      )

    let openAIResponse:
      Response

    try {
      openAIResponse =
        await fetch(
          'https://api.openai.com/v1/responses',
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${getOpenAIKey()}`,

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                model:
                  OPENAI_MODEL,

                instructions:
                  SYSTEM_PROMPT,

                  input: [
                    ...history.map(
                      (item) => ({
                        role:
                          item.role,

                        content:
                          item.content,
                      }),
                    ),

                    {
                      role: 'user',
                      content:
                        message,
                    },
                  ],

                reasoning: {
                  effort:
                    'none',
                },

                max_output_tokens:
                  400,

                store:
                  false,
              }),

            signal:
              controller.signal,
          },
        )
    } finally {
      clearTimeout(
        timeout,
      )
    }

    const openAIData =
      await openAIResponse.json() as
        OpenAIResponse

    if (
      !openAIResponse.ok
    ) {
      console.error(
        'OpenAI API error:',
        openAIResponse.status,
        openAIData.error,
      )

      throw new Error(
        openAIData.error
          ?.message ||
          'OpenAI request failed',
      )
    }

    /*
     * 5. 读取 AI 回复
     */
    const reply =
      getResponseText(
        openAIData,
      )

    if (!reply) {
      console.error(
        'OpenAI returned no text:',
        openAIData,
      )

      throw new Error(
        'OpenAI returned empty response',
      )
    }

    /*
     * 已经成功得到回答，
     * 这一次正式计入额度。
     */
    reservedUserId =
      null

    return NextResponse.json(
      {
        reply,

        remaining:
          usage.remaining,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      },
    )
  } catch (error) {
    console.error(
      'AI assistant API error:',
      error,
    )

    /*
     * 如果已经扣过次数，
     * 但 OpenAI 没有成功返回答案，
     * 自动退回一次。
     */
    let refundedRemaining:
      number | undefined

    if (
      reservedUserId &&
      supabase
    ) {
      const refund =
        await refundUsage(
          supabase,
          reservedUserId,
        )

      if (refund) {
        refundedRemaining =
          refund.remaining
      }
    }

    return NextResponse.json(
      {
        error:
          '小萝卜暂时无法回答，请稍后再试。',

        ...(typeof refundedRemaining ===
        'number'
          ? {
              remaining:
                refundedRemaining,
            }
          : {}),
      },
      {
        status: 500,
      },
    )
  }
}