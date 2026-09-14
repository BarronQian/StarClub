export function getVideoEmbedUrl(
  url: string,
) {
  const value =
    url.trim()

  if (!value) {
    return null
  }

  // Bilibili
  const bilibiliMatch =
    value.match(
      /\/video\/(BV[a-zA-Z0-9]+)/,
    )

  if (bilibiliMatch) {
    const bvid =
      bilibiliMatch[1]

    return {
      provider:
        'bilibili' as const,

      embedUrl:
        `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0&autoplay=0`,
    }
  }

  // YouTube:
  // youtube.com/watch?v=
  const youtubeWatch =
    value.match(
      /[?&]v=([a-zA-Z0-9_-]{6,})/,
    )

  if (youtubeWatch) {
    return {
      provider:
        'youtube' as const,

      embedUrl:
        `https://www.youtube.com/embed/${youtubeWatch[1]}?autoplay=0`,
    }
  }

  // youtu.be/xxxx
  const youtubeShort =
    value.match(
      /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    )

  if (youtubeShort) {
    return {
      provider:
        'youtube' as const,

      embedUrl:
        `https://www.youtube.com/embed/${youtubeShort[1]}?autoplay=0`,
    }
  }

  // youtube.com/shorts/xxxx
  const youtubeShorts =
    value.match(
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
    )

  if (youtubeShorts) {
    return {
      provider:
        'youtube' as const,

      embedUrl:
        `https://www.youtube.com/embed/${youtubeShorts[1]}?autoplay=0`,
    }
  }

  // 已经是 embed 链接
  if (
    value.includes(
      'youtube.com/embed/',
    ) ||
    value.includes(
      'player.bilibili.com/player.html',
    )
  ) {
    return {
      provider:
        value.includes(
          'bilibili',
        )
          ? ('bilibili' as const)
          : ('youtube' as const),

      embedUrl:
        value,
    }
  }

  return null
}