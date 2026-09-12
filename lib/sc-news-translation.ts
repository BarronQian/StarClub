type TranslationResult = {
  title_zh: string
  summary_zh: string | null
}

function getOpenAIKey() {
  const key =
    process.env.OPENAI_API_KEY

  if (!key) {
    throw new Error(
      'Missing OPENAI_API_KEY'
    )
  }

  return key
}

export async function translateScNews(
  title: string,
  summary: string | null
): Promise<TranslationResult> {
  const apiKey =
    getOpenAIKey()

  const input = `
你是一名《星际公民 Star Citizen》中文社区资讯翻译。

请把下面的 RSI 官方新闻翻译成自然、简洁、准确的简体中文。

要求：
1. 不要自行增加原文没有的信息。
2. Star Citizen 固定翻译为「星际公民」。
3. 人名、舰船名、地点名、版本号、活动名等专有名词，在没有可靠中文译名时保留英文。
4. 标题要像中文游戏资讯标题，不要生硬直译。
5. 摘要保持原意，不需要扩写。
6. 不要使用 Markdown。
7. 只返回 JSON，不要返回其他文字。

返回格式：
{
  "title_zh": "中文标题",
  "summary_zh": "中文摘要"
}

英文标题：
${title}

英文摘要：
${summary ?? ''}
`.trim()

  const response =
    await fetch(
      'https://api.openai.com/v1/responses',
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          model:
            'gpt-5.6-luna',

          input,

          reasoning: {
            effort: 'none',
          },

          max_output_tokens:
            600,
        }),
      }
    )

  const data =
    await response.json()

  if (!response.ok) {
    console.error(
      'OpenAI translation error:',
      data
    )

    throw new Error(
      `OpenAI request failed: ${response.status}`
    )
  }

  let outputText = ''

  if (
    Array.isArray(data.output)
  ) {
    for (
      const outputItem of
        data.output
    ) {
      if (
        !Array.isArray(
          outputItem?.content
        )
      ) {
        continue
      }

      for (
        const contentItem of
          outputItem.content
      ) {
        if (
          contentItem?.type ===
            'output_text' &&
          typeof contentItem.text ===
            'string'
        ) {
          outputText +=
            contentItem.text
        }
      }
    }
  }

  if (!outputText) {
    throw new Error(
      'OpenAI returned empty translation'
    )
  }

  const cleaned =
    outputText
      .replace(
        /^```json\s*/i,
        ''
      )
      .replace(
        /^```\s*/,
        ''
      )
      .replace(
        /\s*```$/,
        ''
      )
      .trim()

  const parsed =
    JSON.parse(
      cleaned
    )

  const titleZh =
    typeof parsed.title_zh ===
      'string'
      ? parsed.title_zh.trim()
      : ''

  const summaryZh =
    typeof parsed.summary_zh ===
      'string'
      ? parsed.summary_zh.trim()
      : null

  if (!titleZh) {
    throw new Error(
      'Translation title is empty'
    )
  }

  return {
    title_zh:
      titleZh,

    summary_zh:
      summaryZh || null,
  }
}