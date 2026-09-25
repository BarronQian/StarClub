export type ArchiveImageVariant = {
  blob: Blob
  width: number
  height: number
}

export type ArchiveImageResult = {
  originalWidth: number
  originalHeight: number

  /**
   * true = 原图尺寸较小，不再生成有损 Display。
   * 上传时让 display_url 直接使用 original_url。
   */
  useOriginalAsDisplay: boolean

  display: ArchiveImageVariant | null
  thumbnail: ArchiveImageVariant
}

type ResizeOptions = {
  maxEdge: number
  quality: number
}

async function loadImage(
  file: File,
): Promise<HTMLImageElement> {
  const objectUrl =
    URL.createObjectURL(file)

  try {
    const image = new Image()

    await new Promise<void>(
      (resolve, reject) => {
        image.onload = () => resolve()

        image.onerror = () =>
          reject(
            new Error(
              '无法读取图片',
            ),
          )

        image.src = objectUrl
      },
    )

    return image
  } finally {
    URL.revokeObjectURL(
      objectUrl,
    )
  }
}

async function resizeToWebp(
  image: HTMLImageElement,
  options: ResizeOptions,
): Promise<ArchiveImageVariant> {
  const originalWidth =
    image.naturalWidth

  const originalHeight =
    image.naturalHeight

  if (
    !originalWidth ||
    !originalHeight
  ) {
    throw new Error(
      '无法获取图片尺寸',
    )
  }

  const longestEdge = Math.max(
    originalWidth,
    originalHeight,
  )

  const scale = Math.min(
    1,
    options.maxEdge /
      longestEdge,
  )

  const width = Math.max(
    1,
    Math.round(
      originalWidth * scale,
    ),
  )

  const height = Math.max(
    1,
    Math.round(
      originalHeight * scale,
    ),
  )

  const canvas =
    document.createElement(
      'canvas',
    )

  canvas.width = width
  canvas.height = height

  const context =
    canvas.getContext('2d')

  if (!context) {
    throw new Error(
      '无法创建图片处理画布',
    )
  }

  context.imageSmoothingEnabled =
    true

  context.imageSmoothingQuality =
    'high'

  context.drawImage(
    image,
    0,
    0,
    width,
    height,
  )

  const blob =
    await new Promise<Blob>(
      (resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (!result) {
              reject(
                new Error(
                  '图片压缩失败',
                ),
              )

              return
            }

            resolve(result)
          },
          'image/webp',
          options.quality,
        )
      },
    )

  return {
    blob,
    width,
    height,
  }
}

export async function prepareArchiveImage(
  file: File,
): Promise<ArchiveImageResult> {
  const image =
    await loadImage(file)

  const originalWidth =
    image.naturalWidth

  const originalHeight =
    image.naturalHeight

  if (
    !originalWidth ||
    !originalHeight
  ) {
    throw new Error(
      '无法获取图片尺寸',
    )
  }

  const longestEdge = Math.max(
    originalWidth,
    originalHeight,
  )

  /*
   * 低清保护：
   *
   * 最长边 < 1200px
   * 不再生成 Display WebP。
   *
   * 后续上传时：
   * display_url = original_url
   *
   * 避免已经比较模糊的历史图片
   * 再经历一次有损压缩。
   */
  const useOriginalAsDisplay =
    longestEdge < 1200

  let display:
    | ArchiveImageVariant
    | null = null

  if (!useOriginalAsDisplay) {
    /*
     * 1200–2200px：
     * 不缩尺寸，只做高质量 WebP。
     *
     * >2200px：
     * 缩至最长边 2200px。
     *
     * 两种情况统一使用较高的
     * 0.90 quality，优先保护合影细节。
     */
    display =
      await resizeToWebp(
        image,
        {
          maxEdge: 2200,
          quality: 0.9,
        },
      )
  }

  /*
   * Thumbnail 只用于：
   * - Archive 卡片
   * - 后台预览
   * - 小尺寸列表
   *
   * 不用于大图查看。
   */
  const thumbnail =
    await resizeToWebp(
      image,
      {
        maxEdge: 800,
        quality: 0.82,
      },
    )

  return {
    originalWidth,
    originalHeight,
    useOriginalAsDisplay,
    display,
    thumbnail,
  }
}