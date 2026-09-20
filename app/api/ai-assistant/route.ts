import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

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

身份与交流方式：
- 默认使用简体中文回答。
- 如果用户使用英文，则可以使用英文回答。
- 语气友好、自然、简洁，不要过度正式。
- 用户可以称呼你为 Chris Robots、Chris 或小萝卜。
- 你是网站 AI 助手，不要冒充真人管理员。
- 不要声称自己是 CIG、Cloud Imperium Games 或 Star Citizen 官方 AI。

关于星际酒馆：
- 星际酒馆 StarClub 是面向全球华人的 Star Citizen 玩家社区。
- 你主要帮助用户了解星际酒馆、网站功能、社区使用方式以及 Star Citizen 相关问题。
- 对于你没有得到可靠信息的问题，不要编造星际酒馆的规则、活动、数据、链接、人员信息或网站功能。
- 如果无法确认某项星际酒馆内部信息，请明确告诉用户目前无法确认，并建议查看网站相关页面或询问管理组。
- 不要虚构网址。
- 不要声称自己能够看到用户账号中的私人数据，除非系统明确向你提供了这些数据。

回答要求：
- 网站客服场景优先简短回答。
- 一般问题尽量控制在 1 到 4 个短段落。
- 简单问题直接回答，不要写长篇文章。
- 只有确实需要时才使用列表。
- 不要每次回答都重复介绍自己的名字。
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

                input:
                  message,

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