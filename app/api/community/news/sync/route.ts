import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { translateScNews } from '@/lib/sc-news-translation'

const RSI_BASE =
  'https://robertsspaceindustries.com'

const RSI_NEWS_URL =
  `${RSI_BASE}/en/comm-link`

type NewsCard = {
  url: string
  title: string
  summary: string | null
  postedText: string | null
  imageUrl: string | null
}

function getAdminSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      'Missing Supabase server environment variables'
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
    }
  )
}

function decodeHtml(
  value: string
) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripHtml(
  value: string
) {
  return decodeHtml(
    value.replace(
      /<[^>]*>/g,
      ' '
    )
  )
}

function normalizeUrl(
  value: string
) {
  let url =
    decodeHtml(value)

  if (
    url.startsWith('//')
  ) {
    url =
      `https:${url}`
  } else if (
    url.startsWith('/')
  ) {
    url =
      `${RSI_BASE}${url}`
  }

  return url
}

function normalizeImage(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return null
  }

  const image =
    decodeHtml(value)

  if (
    image.startsWith('//')
  ) {
    return `https:${image}`
  }

  if (
    image.startsWith('/')
  ) {
    return `${RSI_BASE}${image}`
  }

  return image
}

function parseRelativePostedTime(
  value: string | null
) {
  if (!value) {
    return null
  }

  const text =
    value
      .replace(
        /^Posted:\s*/i,
        ''
      )
      .trim()

  const now =
    new Date()

  if (
    /^just now$/i.test(text)
  ) {
    return now.toISOString()
  }

  if (
    /^an?\s+minute\s+ago$/i.test(
      text
    )
  ) {
    now.setMinutes(
      now.getMinutes() - 1
    )

    return now.toISOString()
  }

  if (
    /^an?\s+hour\s+ago$/i.test(
      text
    )
  ) {
    now.setHours(
      now.getHours() - 1
    )

    return now.toISOString()
  }

  if (
    /^yesterday$/i.test(text)
  ) {
    now.setDate(
      now.getDate() - 1
    )

    return now.toISOString()
  }

  const match =
    text.match(
      /^(\d+)\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months)\s+ago$/i
    )

  if (!match) {
    return null
  }

  const amount =
    Number(match[1])

  const unit =
    match[2].toLowerCase()

  if (
    unit === 'minute' ||
    unit === 'minutes'
  ) {
    now.setMinutes(
      now.getMinutes() -
        amount
    )
  } else if (
    unit === 'hour' ||
    unit === 'hours'
  ) {
    now.setHours(
      now.getHours() -
        amount
    )
  } else if (
    unit === 'day' ||
    unit === 'days'
  ) {
    now.setDate(
      now.getDate() -
        amount
    )
  } else if (
    unit === 'week' ||
    unit === 'weeks'
  ) {
    now.setDate(
      now.getDate() -
        amount * 7
    )
  } else if (
    unit === 'month' ||
    unit === 'months'
  ) {
    now.setMonth(
      now.getMonth() -
        amount
    )
  }

  return now.toISOString()
}

function getMetaContent(
  html: string,
  key: string
) {
  const escaped =
    key.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    )

  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
      'i'
    ),
  ]

  for (
    const pattern of patterns
  ) {
    const match =
      html.match(pattern)

    if (match?.[1]) {
      return decodeHtml(
        match[1]
      )
    }
  }

  return null
}

function extractBackgroundImage(
  html: string
) {
  const match =
    html.match(
      /background-image\s*:\s*url\((["']?)(.*?)\1\)/i
    )

  if (!match?.[2]) {
    return null
  }

  return normalizeImage(
    match[2]
  )
}

/*
  根据 RSI 当前真实 HTML：

  <a class="content-block2 ..."
     href="/comm-link/...">

    <div class="background"
      style="background-image:url(...)">
    </div>

    <div class="title">
      ...
    </div>

    <div class="time_ago">
      Posted:
      <span class="value">
        1 day ago
      </span>
    </div>

    <div class="section">
      <p>...</p>
    </div>
  </a>
*/
function getNewsCards(
  html: string
) {
  const cards:
    NewsCard[] = []

  const seen =
    new Set<string>()

  /*
    RSI 每张卡片是一个完整 <a ...>...</a>
  */
  const cardRegex =
    /<a\b[^>]*class=["'][^"']*\bcontent-block2\b[^"']*["'][^>]*href=["']([^"']*\/comm-link\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi

  let match:
    RegExpExecArray | null

  while (
    (match =
      cardRegex.exec(html)) !==
    null
  ) {
    const href =
      normalizeUrl(
        match[1]
      )

    const cardHtml =
      match[2]

    if (
      !href.startsWith(
        `${RSI_BASE}/`
      )
    ) {
      continue
    }

    if (
      href.includes('/rss')
    ) {
      continue
    }

    if (
      seen.has(href)
    ) {
      continue
    }

    /*
      标题
    */
    const titleMatch =
      cardHtml.match(
        /<div[^>]*class=["'][^"']*\btitle\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
      )

    const title =
      titleMatch?.[1]
        ? stripHtml(
            titleMatch[1]
          )
        : ''

    if (
      !title ||
      title.length < 3
    ) {
      continue
    }

    /*
      Posted 时间
    */
    const postedMatch =
      cardHtml.match(
        /<div[^>]*class=["'][^"']*\btime_ago\b[^"']*["'][^>]*>[\s\S]*?<span[^>]*class=["'][^"']*\bvalue\b[^"']*["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/div>/i
      )

    const postedText =
      postedMatch?.[1]
        ? stripHtml(
            postedMatch[1]
          )
        : null

    /*
      官方摘要
    */
      let summary:
        string | null = null

      /*
        RSI 的摘要位于 section 内，
        但 section 内部存在嵌套 div。

        因此不能直接用 </div>
        判断 section 的结束位置。

        直接从 section 开始位置向后寻找
        第一段 <p>...</p>。
      */
      const sectionStart =
        cardHtml.search(
          /<div[^>]*class=["'][^"']*\bsection\b[^"']*["'][^>]*>/i
        )

      if (
        sectionStart !== -1
      ) {
        const sectionHtml =
          cardHtml.slice(
            sectionStart
          )

        const paragraphMatch =
          sectionHtml.match(
            /<p[^>]*>([\s\S]*?)<\/p>/i
          )

        if (
          paragraphMatch?.[1]
        ) {
          const text =
            stripHtml(
              paragraphMatch[1]
            )

          if (
            text.length >= 10
          ) {
            summary = text
          }
        }
      }

      /*
        部分 RSI 卡片没有 <p>，
        摘要会直接存在 .text 容器里。
      */
      if (!summary) {
        const textStart =
          cardHtml.search(
            /<div[^>]*class=["'][^"']*\btext\b[^"']*["'][^>]*>/i
          )

        if (
          textStart !== -1
        ) {
          const textHtml =
            cardHtml.slice(
              textStart
            )

          const endMatch =
            textHtml.search(
              /<div[^>]*class=["'][^"']*corner-bottom-right/i
            )

          const rawText =
            endMatch > 0
              ? textHtml.slice(
                  0,
                  endMatch
                )
              : textHtml

          const text =
            stripHtml(
              rawText
            )

          if (
            text.length >= 10
          ) {
            summary = text
          }
        }
      }

    /*
      封面图
    */
    const imageUrl =
      extractBackgroundImage(
        cardHtml
      )

    seen.add(href)

    cards.push({
      url: href,
      title,
      summary,
      postedText,
      imageUrl,
    })

    if (
      cards.length >= 10
    ) {
      break
    }
  }

  return cards
}

/*
  文章页只负责兜底：
  如果列表卡片没有封面或标题，
  再从 og metadata 补。
*/
async function fetchArticleFallback(
  url: string
) {
  const response =
    await fetch(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 StarClub-NewsBot/1.0',

          Accept:
            'text/html,application/xhtml+xml',
        },

        cache: 'no-store',
      }
    )

  if (!response.ok) {
    return {
      title: '',
      imageUrl: null,
    }
  }

  const html =
    await response.text()

  const title =
    stripHtml(
      getMetaContent(
        html,
        'og:title'
      ) ||
        html.match(
          /<title[^>]*>([\s\S]*?)<\/title>/i
        )?.[1] ||
        ''
    )

  const imageUrl =
    normalizeImage(
      getMetaContent(
        html,
        'og:image'
      )
    )

  return {
    title,
    imageUrl,
  }
}

export async function POST() {
  try {
    /*
      1. 抓 RSI Comm-Link
    */

    const listResponse =
      await fetch(
        RSI_NEWS_URL,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 StarClub-NewsBot/1.0',

            Accept:
              'text/html,application/xhtml+xml',
          },

          cache: 'no-store',
        }
      )

    if (
      !listResponse.ok
    ) {
      throw new Error(
        `RSI request failed: ${listResponse.status}`
      )
    }

    const html =
      await listResponse.text()

    /*
      2. 直接解析 RSI 新闻卡片
    */

    const cards =
      getNewsCards(
        html
      )

    if (
      cards.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            '没有解析到 RSI 资讯卡片',
        },
        {
          status: 502,
        }
      )
    }

    const supabase =
      getAdminSupabase()

    let inserted = 0
    let updated = 0
    let failed = 0

    let missingPublishedAt = 0
    let missingSummary = 0
    let missingImage = 0

    /*
      3. 写入数据库
    */

    for (
      const card of cards
    ) {
      try {
        let finalTitle =
          card.title

        let finalImage =
          card.imageUrl

        /*
          理论上列表卡片就够了。
          只有缺数据时才访问文章页。
        */
        if (
          !finalTitle ||
          !finalImage
        ) {
          const fallback =
            await fetchArticleFallback(
              card.url
            )

          if (
            !finalTitle
          ) {
            finalTitle =
              fallback.title
          }

          if (
            !finalImage
          ) {
            finalImage =
              fallback.imageUrl
          }
        }

        if (
          !finalTitle
        ) {
          failed += 1
          continue
        }

        const publishedAt =
          parseRelativePostedTime(
            card.postedText
          )

        if (
          !publishedAt
        ) {
          missingPublishedAt += 1
        }

        if (
          !card.summary
        ) {
          missingSummary += 1
        }

        if (
          !finalImage
        ) {
          missingImage += 1
        }

        /*
          查现有数据
        */

        const {
          data: existing,
          error:
            existingError,
        } = await supabase
          .from('sc_news')
          .select(`
            id,
            published_at,
            summary_original,
            image_url
          `)
          .eq(
            'source_url',
            card.url
          )
          .maybeSingle()

        if (
          existingError
        ) {
          console.error(
            'Failed to check existing news:',
            existingError
          )

          failed += 1
          continue
        }

        /*
          这里的原则：

          新解析到的真实列表数据优先。

          如果偶尔某篇没解析出来，
          就保留数据库原数据，
          不要乱覆盖。
        */

        const finalPublishedAt =
          publishedAt ||
          existing?.published_at ||
          new Date().toISOString()

        const finalSummary =
          card.summary ||
          existing?.summary_original ||
          null

        const finalImageUrl =
          finalImage ||
          existing?.image_url ||
          null

        const newsData = {
          source: 'RSI',

          source_type:
            'official',

          title_original:
            finalTitle,

          summary_original:
            finalSummary,

          source_url:
            card.url,

          image_url:
            finalImageUrl,

          published_at:
            finalPublishedAt,

          fetched_at:
            new Date().toISOString(),
        }

        /*
          UPDATE
        */

        if (existing) {
          const {
            error:
              updateError,
          } = await supabase
            .from('sc_news')
            .update(
              newsData
            )
            .eq(
              'id',
              existing.id
            )

          if (
            updateError
          ) {
            console.error(
              'Failed to update news:',
            updateError
            )

            failed += 1
            continue
          }

          updated += 1
          continue
        }

        /*
          INSERT
        */

        const {
          error:
            insertError,
        } = await supabase
          .from('sc_news')
          .insert(
            newsData
          )

        if (
          insertError
        ) {
          console.error(
            'Failed to insert news:',
            insertError
          )

          failed += 1
          continue
        }

        inserted += 1

        /*
          新文章插入成功后，
          自动生成中文标题和摘要。

          翻译失败不会影响英文新闻本身，
          下次仍可通过 translate API 补翻。
        */
        try {
          const translation =
            await translateScNews(
              finalTitle,
              finalSummary
            )

          const {
            error:
              translationUpdateError,
          } = await supabase
            .from('sc_news')
            .update({
              title_zh:
                translation.title_zh,

              summary_zh:
                translation.summary_zh,
            })
            .eq(
              'source_url',
              card.url
            )

          if (
            translationUpdateError
          ) {
            console.error(
              'Failed to save news translation:',
              translationUpdateError
            )
          }
        } catch (error) {
          console.error(
            `Failed to translate new article ${card.url}:`,
            error
          )
        }
      } catch (error) {
        console.error(
          `Failed to sync article ${card.url}:`,
          error
        )

        failed += 1
      }
    }

    return NextResponse.json({
      success: true,

      found:
        cards.length,

      inserted,

      updated,

      failed,

      diagnostics: {
        missingPublishedAt,
        missingSummary,
        missingImage,
      },

      sample:
        cards.slice(0, 3),
    })
  } catch (error) {
    console.error(
      'RSI news sync error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '同步 RSI 资讯失败',
      },
      {
        status: 500,
      }
    )
  }
}