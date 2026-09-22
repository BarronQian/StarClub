export function getMarketThumbnailUrl(
  imageUrl: string | null | undefined,
) {
  if (!imageUrl) {
    return ''
  }

  // 新版市场图片：
  // .../display/1.webp
  // ↓
  // .../thumbs/1.webp
  if (imageUrl.includes('/display/')) {
    return imageUrl.replace(
      '/display/',
      '/thumbs/',
    )
  }

  // 旧版市场图片没有单独缩略图，
  // 继续使用原 URL，保证旧商单正常显示。
  return imageUrl
}

export function getMarketDisplayUrl(
  imageUrl: string | null | undefined,
) {
  return imageUrl ?? ''
}