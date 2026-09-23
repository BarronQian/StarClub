export type GalleryImageVariant = {
  blob: Blob
  width: number
  height: number
}

type GalleryImageOptions = {
  maxEdge: number
  quality: number
}

async function loadImage(
  file: File,
): Promise<HTMLImageElement> {
  const objectUrl =
    URL.createObjectURL(file)

  try {
    const image =
      new Image()

    image.decoding = 'async'

    await new Promise<void>(
      (resolve, reject) => {
        image.onload = () =>
          resolve()

        image.onerror = () =>
          reject(
            new Error(
              '图片读取失败',
            ),
          )

        image.src =
          objectUrl
      },
    )

    return image
  } finally {
    URL.revokeObjectURL(
      objectUrl,
    )
  }
}

function getTargetSize(
  width: number,
  height: number,
  maxEdge: number,
) {
  const longest =
    Math.max(
      width,
      height,
    )

  if (
    longest <= maxEdge
  ) {
    return {
      width,
      height,
    }
  }

  const scale =
    maxEdge / longest

  return {
    width:
      Math.max(
        1,
        Math.round(
          width * scale,
        ),
      ),

    height:
      Math.max(
        1,
        Math.round(
          height * scale,
        ),
      ),
  }
}

async function canvasToWebp(
  canvas: HTMLCanvasElement,
  quality: number,
) {
  return new Promise<Blob>(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                '图片压缩失败',
              ),
            )

            return
          }

          resolve(blob)
        },
        'image/webp',
        quality,
      )
    },
  )
}

async function createVariant(
  image: HTMLImageElement,
  options: GalleryImageOptions,
): Promise<GalleryImageVariant> {
  const size =
    getTargetSize(
      image.naturalWidth,
      image.naturalHeight,
      options.maxEdge,
    )

  const canvas =
    document.createElement(
      'canvas',
    )

  canvas.width =
    size.width

  canvas.height =
    size.height

  const context =
    canvas.getContext(
      '2d',
    )

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
    size.width,
    size.height,
  )

  const blob =
    await canvasToWebp(
      canvas,
      options.quality,
    )

  return {
    blob,
    width:
      size.width,
    height:
      size.height,
  }
}

export async function createGalleryImageVariants(
  file: File,
) {
  const image =
    await loadImage(file)

  const display =
    await createVariant(
      image,
      {
        maxEdge: 2200,
        quality: 0.82,
      },
    )

  const thumbnail =
    await createVariant(
      image,
      {
        maxEdge: 800,
        quality: 0.76,
      },
    )

  return {
    original: file,

    originalWidth:
      image.naturalWidth,

    originalHeight:
      image.naturalHeight,

    display,

    thumbnail,
  }
}