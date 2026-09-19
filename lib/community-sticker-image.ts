export const STICKER_MAX_EDGE = 800
export const STICKER_WEBP_QUALITY = 0.85

export type StickerImageInfo = {
  width: number
  height: number
  fileSize: number
}

export type OptimizedSticker = {
  blob: Blob
  width: number
  height: number
  fileSize: number
}

function loadImage(
  file: File,
): Promise<HTMLImageElement> {
  return new Promise(
    (resolve, reject) => {
      const objectUrl =
        URL.createObjectURL(file)

      const image =
        new Image()

      image.onload = () => {
        URL.revokeObjectURL(
          objectUrl,
        )

        resolve(image)
      }

      image.onerror = () => {
        URL.revokeObjectURL(
          objectUrl,
        )

        reject(
          new Error(
            '无法读取图片',
          ),
        )
      }

      image.src = objectUrl
    },
  )
}

export async function getStickerImageInfo(
  file: File,
): Promise<StickerImageInfo> {
  const image =
    await loadImage(file)

  return {
    width:
      image.naturalWidth,
    height:
      image.naturalHeight,
    fileSize:
      file.size,
  }
}

export async function optimizeStickerImage(
  file: File,
): Promise<OptimizedSticker> {
  const image =
    await loadImage(file)

  const originalWidth =
    image.naturalWidth

  const originalHeight =
    image.naturalHeight

  if (
    originalWidth <= 0 ||
    originalHeight <= 0
  ) {
    throw new Error(
      '图片尺寸无效',
    )
  }

  /*
   * 800px 是最大边，
   * 不是强制尺寸。
   *
   * 小图绝不放大。
   */
  const scale =
    Math.min(
      1,
      STICKER_MAX_EDGE /
        Math.max(
          originalWidth,
          originalHeight,
        ),
    )

  const targetWidth =
    Math.max(
      1,
      Math.round(
        originalWidth *
          scale,
      ),
    )

  const targetHeight =
    Math.max(
      1,
      Math.round(
        originalHeight *
          scale,
      ),
    )

  const canvas =
    document.createElement(
      'canvas',
    )

  canvas.width =
    targetWidth

  canvas.height =
    targetHeight

  const context =
    canvas.getContext('2d')

  if (!context) {
    throw new Error(
      '浏览器无法处理图片',
    )
  }

  context.imageSmoothingEnabled =
    true

  context.imageSmoothingQuality =
    'high'

  /*
   * 始终按原始比例绘制。
   * 不裁切、不拉伸。
   */
  context.drawImage(
    image,
    0,
    0,
    targetWidth,
    targetHeight,
  )

  const blob =
    await new Promise<Blob>(
      (
        resolve,
        reject,
      ) => {
        canvas.toBlob(
          (result) => {
            if (!result) {
              reject(
                new Error(
                  '生成 WebP 失败',
                ),
              )

              return
            }

            resolve(result)
          },
          'image/webp',
          STICKER_WEBP_QUALITY,
        )
      },
    )

  return {
    blob,
    width:
      targetWidth,
    height:
      targetHeight,
    fileSize:
      blob.size,
  }
}