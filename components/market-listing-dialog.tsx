'use client'

import {
  ImagePlus,
  Loader2,
  Trash2,
  X,
} from 'lucide-react'
import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  getSupabaseBrowser,
} from '@/lib/supabase-browser'
import {
  getMarketPlace,
  getMarketRegion,
  getMarketSystem,
  MARKET_LOCATIONS,
} from '@/lib/market-locations'
import {
  ARMOR_PARTS,
  ARMOR_WEIGHTS,
  MARKET_CATEGORIES,
  buildArmorSubcategory,
  getArmorPart,
  getMarketCategory,
} from '@/lib/market-categories'

type MarketListingDialogProps = {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

type SelectedImage = {
  id: string
  file: File
  previewUrl: string
}

const MAX_IMAGES = 4

const TYPE_OPTIONS = [
  {
    value: 'wts',
    label: '出售 WTS',
  },
  {
    value: 'wtb',
    label: '求购 WTB',
  },
  {
    value: 'wtt',
    label: '交换 WTT',
  },
]

function createImageId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

async function compressImage(
  file: File,
): Promise<File> {
  const image =
    document.createElement(
      'img',
    )

  const objectUrl =
    URL.createObjectURL(file)

  try {
    await new Promise<void>(
      (
        resolve,
        reject,
      ) => {
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

    const maxSide = 2200

    const scale =
      Math.min(
        1,
        maxSide /
          Math.max(
            image.naturalWidth,
            image.naturalHeight,
          ),
      )

    const width =
      Math.max(
        1,
        Math.round(
          image.naturalWidth *
            scale,
        ),
      )

    const height =
      Math.max(
        1,
        Math.round(
          image.naturalHeight *
            scale,
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
        '图片处理失败',
      )
    }

    context.drawImage(
      image,
      0,
      0,
      width,
      height,
    )

    const blob =
      await new Promise<Blob | null>(
        (resolve) => {
          canvas.toBlob(
            resolve,
            'image/webp',
            0.82,
          )
        },
      )

    if (!blob) {
      throw new Error(
        '图片压缩失败',
      )
    }

    const baseName =
      file.name.replace(
        /\.[^.]+$/,
        '',
      )

    return new File(
      [
        blob,
      ],
      `${baseName}.webp`,
      {
        type: 'image/webp',
      },
    )
  } finally {
    URL.revokeObjectURL(
      objectUrl,
    )
  }
}

async function readJsonSafely(
  response: Response,
) {
  const text =
    await response.text()

  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(
      response.ok
        ? '服务器返回了无法识别的数据'
        : `服务器返回异常（${response.status}），请稍后重试`,
    )
  }
}

export function MarketListingDialog({
  open,
  onClose,
  onCreated,
}: MarketListingDialogProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    )

  const [
    listingType,
    setListingType,
  ] = useState('wts')

  const [
    category,
    setCategory,
  ] = useState('other')

  const [
  subcategory,
  setSubcategory,
] = useState('')

const [
  armorPart,
  setArmorPart,
] = useState('')

const [
  armorWeight,
  setArmorWeight,
] = useState('')

  const [
    title,
    setTitle,
  ] = useState('')

  const [
    description,
    setDescription,
  ] = useState('')

  const [
    priceUec,
    setPriceUec,
  ] = useState('')

  const [
    quantity,
    setQuantity,
  ] = useState('1')

  const [
    quality,
    setQuality,
  ] = useState('')

  const [
    starSystem,
    setStarSystem,
  ] = useState('')

  const [
    planetarySystem,
    setPlanetarySystem,
  ] = useState('')

  const [
    locationCode,
    setLocationCode,
  ] = useState('')

  const [
    customLocation,
    setCustomLocation,
  ] = useState('')

  const selectedCategory =
  useMemo(
    () =>
      getMarketCategory(
        category,
      ),
    [category],
  )

const selectedArmorPart =
  useMemo(
    () =>
      getArmorPart(
        armorPart,
      ),
    [armorPart],
  )

const resolvedSubcategory =
  useMemo(() => {
    if (category !== 'armor') {
      return subcategory
    }

    if (!armorPart) {
      return ''
    }

    return buildArmorSubcategory(
      armorPart,
      armorWeight,
    )
  }, [
    category,
    subcategory,
    armorPart,
    armorWeight,
  ])

  const selectedSystem =
  useMemo(
    () =>
      getMarketSystem(
        starSystem,
      ),
    [starSystem],
  )

const selectedRegion =
  useMemo(
    () =>
      getMarketRegion(
        starSystem,
        planetarySystem,
      ),
    [
      starSystem,
      planetarySystem,
    ],
  )

const selectedPlace =
  useMemo(
    () =>
      getMarketPlace(
        starSystem,
        planetarySystem,
        locationCode,
      ),
    [
      starSystem,
      planetarySystem,
      locationCode,
    ],
  )

const isCustomLocation =
  locationCode === 'other'

  const [
    negotiable,
    setNegotiable,
  ] = useState(false)

  const [
    offeredItem,
    setOfferedItem,
  ] = useState('')

  const [
    wantedItem,
    setWantedItem,
  ] = useState('')

  const [
    selectedImages,
    setSelectedImages,
  ] = useState<
    SelectedImage[]
  >([])

  const [
    submitting,
    setSubmitting,
  ] = useState(false)

  const [
    uploadProgressText,
    setUploadProgressText,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  const canAddImages =
    selectedImages.length <
    MAX_IMAGES

  const remainingImageSlots =
    useMemo(
      () =>
        MAX_IMAGES -
        selectedImages.length,
      [selectedImages.length],
    )

  useEffect(() => {
    if (!open) return

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
          'Escape' &&
        !submitting
      ) {
        onClose()
      }
    }

    document.addEventListener(
      'keydown',
      handleEscape,
    )

    document.body.style.overflow =
      'hidden'

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape,
      )

      document.body.style.overflow =
        ''
    }
  }, [
    open,
    onClose,
    submitting,
  ])

  useEffect(() => {
    return () => {
      for (
        const image of
        selectedImages
      ) {
        URL.revokeObjectURL(
          image.previewUrl,
        )
      }
    }
  }, [selectedImages])

  if (!open) {
    return null
  }

  function resetForm() {
    for (
      const image of
      selectedImages
    ) {
      URL.revokeObjectURL(
        image.previewUrl,
      )
    }

    setListingType('wts')
    setCategory('other')
    setSubcategory('')
    setArmorPart('')
    setArmorWeight('')
    setTitle('')
    setDescription('')
    setPriceUec('')
    setQuantity('1')
    setQuality('')
    setStarSystem('')
    setPlanetarySystem('')
    setLocationCode('')
    setCustomLocation('')
    setNegotiable(false)
    setOfferedItem('')
    setWantedItem('')
    setSelectedImages([])
    setError('')
    setUploadProgressText('')
  }

  function removeImage(
    id: string,
  ) {
    setSelectedImages(
      (
        current,
      ) => {
        const target =
          current.find(
            (image) =>
              image.id === id,
          )

        if (target) {
          URL.revokeObjectURL(
            target.previewUrl,
          )
        }

        return current.filter(
          (image) =>
            image.id !== id,
        )
      },
    )
  }

  function handleImageSelection(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const files =
      Array.from(
        event.target.files ??
          [],
      )

    event.target.value = ''

    if (
      files.length === 0
    ) {
      return
    }

    setError('')

    const allowedFiles =
      files.filter(
        (file) =>
          [
            'image/jpeg',
            'image/png',
            'image/webp',
          ].includes(
            file.type,
          ),
      )

    if (
      allowedFiles.length !==
      files.length
    ) {
      setError(
        '仅支持 JPG、PNG 和 WebP 图片',
      )
    }

    const filesToAdd =
      allowedFiles.slice(
        0,
        remainingImageSlots,
      )

    if (
      filesToAdd.length === 0
    ) {
      return
    }

    const nextImages =
      filesToAdd.map(
        (file) => ({
          id: createImageId(),
          file,
          previewUrl:
            URL.createObjectURL(
              file,
            ),
        }),
      )

    setSelectedImages(
      (
        current,
      ) => [
        ...current,
        ...nextImages,
      ],
    )

    if (
      allowedFiles.length >
      remainingImageSlots
    ) {
      setError(
        '每个交易最多上传 4 张图片',
      )
    }
  }

  async function uploadImages(
    userId: string,
  ) {
    if (
      selectedImages.length ===
      0
    ) {
      return []
    }

    const supabase =
      getSupabaseBrowser()

    const batchId =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`

    const urls: string[] = []

    for (
      let index = 0;
      index <
      selectedImages.length;
      index += 1
    ) {
      setUploadProgressText(
        `正在处理图片 ${index + 1}/${selectedImages.length}`,
      )

      const compressedFile =
        await compressImage(
          selectedImages[
            index
          ].file,
        )

      if (
        compressedFile.size >
        5 *
          1024 *
          1024
      ) {
        throw new Error(
          `第 ${index + 1} 张图片压缩后仍超过 5 MB`,
        )
      }

      const path =
        `${userId}/${batchId}/${index + 1}.webp`

      setUploadProgressText(
        `正在上传图片 ${index + 1}/${selectedImages.length}`,
      )

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            'market-listings',
          )
          .upload(
            path,
            compressedFile,
            {
              contentType:
                'image/webp',
              upsert: false,
            },
          )

      if (uploadError) {
        throw new Error(
          `第 ${index + 1} 张图片上传失败：${uploadError.message}`,
        )
      }

      const {
        data:
          publicUrlData,
      } =
        supabase.storage
          .from(
            'market-listings',
          )
          .getPublicUrl(
            path,
          )

      urls.push(
        publicUrlData.publicUrl,
      )
    }

    return urls
  }

  async function submitListing() {
    if (submitting) {
      return
    }

    setError('')
    setUploadProgressText('')

    if (
      title.trim().length <
      2
    ) {
      setError(
        '请输入至少 2 个字符的标题',
      )
      return
    }

    if (
      listingType ===
        'wtt' &&
      !offeredItem.trim()
    ) {
      setError(
        '交换交易请填写「我提供」',
      )
      return
    }

    if (
      listingType ===
        'wtt' &&
      !wantedItem.trim()
    ) {
      setError(
        '交换交易请填写「我想换」',
      )
      return
    }

        let parsedPrice:
      number | null = null

    if (
      listingType !== 'wtt' &&
      priceUec.trim()
    ) {
      if (
        !/^\d+$/.test(
          priceUec.trim(),
        )
      ) {
        setError(
          '价格只能填写整数',
        )
        return
      }

      const value =
        Number(
          priceUec.trim(),
        )

      if (
        !Number.isSafeInteger(
          value,
        ) ||
        value < 0
      ) {
        setError(
          '价格金额过大，请输入较小的 aUEC 金额',
        )
        return
      }

      parsedPrice = value
    }
    
    if (!category) {
      setError(
        '请选择商品分类',
      )
      return
    }

    if (
      category === 'armor'
    ) {
      if (!armorPart) {
        setError(
          '请选择护甲部位',
        )
        return
      }

      if (
        selectedArmorPart
          ?.hasWeight &&
        !armorWeight
      ) {
        setError(
          '请选择护甲等级',
        )
        return
      }

      if (!resolvedSubcategory) {
        setError(
          '护甲分类无效',
        )
        return
      }
    } else if (!subcategory) {
      setError(
        '请选择二级分类',
      )
      return
    }

    if (!starSystem) {
  setError(
    '请选择交易所在星系',
  )
  return
}

if (!planetarySystem) {
  setError(
    '请选择交易区域',
  )
  return
}

if (!locationCode) {
  setError(
    '请选择交易地点',
  )
  return
}

if (
  isCustomLocation &&
  !customLocation.trim()
) {
  setError(
    '请输入具体交易地点',
  )
  return
}

if (
  !isCustomLocation &&
  !selectedPlace
) {
  setError(
    '交易地点无效，请重新选择',
  )
  return
}

const locationLabel =
  isCustomLocation
    ? customLocation.trim()
    : selectedPlace!.nameZh ===
        selectedPlace!.nameEn
      ? selectedPlace!.nameEn
      : `${selectedPlace!.nameZh} / ${selectedPlace!.nameEn}`

    setSubmitting(true)

    try {
      const supabase =
        getSupabaseBrowser()

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession()

      if (!session) {
        throw new Error(
          '请先登录后发布交易',
        )
      }

      const imageUrls =
        await uploadImages(
          session.user.id,
        )

      setUploadProgressText(
        '正在发布交易……',
      )

      const response =
        await fetch(
          '/api/market/listings',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
              Authorization:
                `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              listingType,
              category,
              subcategory:
                resolvedSubcategory,
              title:
                title.trim(),
              description:
                description.trim(),
                priceUec:
                  parsedPrice,
              quantity:
                Number(
                  quantity,
                ),
              quality:
                quality.trim()
                  ? Number(
                      quality,
                    )
                  : null,
              starSystem,
              planetarySystem,
              locationCode,
              location: locationLabel,
              negotiable,
              offeredItem:
                offeredItem.trim() ||
                null,
              wantedItem:
                wantedItem.trim() ||
                null,
              imageUrls,
            }),
          },
        )

        const data =
          await readJsonSafely(
            response,
          )

      if (!response.ok) {
        throw new Error(
          data.error ??
            '发布交易失败',
        )
      }

      resetForm()
      onClose()
      onCreated?.()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '发布交易失败',
      )
    } finally {
      setSubmitting(false)
      setUploadProgressText('')
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-6 py-5 backdrop-blur">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              STARCLUB MARKET
            </div>

            <h2 className="mt-1 text-xl font-semibold">
              发布交易
            </h2>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-7 p-6">
          <div>
            <div className="mb-3 text-sm font-medium">
              交易类型
            </div>

            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map(
                (option) => (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    onClick={() =>
                      setListingType(
                        option.value,
                      )
                    }
                    className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                      listingType ===
                      option.value
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {
                      option.label
                    }
                  </button>
                ),
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              分类
            </label>

            <select
              value={category}
              onChange={(event) => {
                const nextCategory =
                  event.target.value

                setCategory(
                  nextCategory,
                )

                setSubcategory('')
                setArmorPart('')
                setArmorWeight('')
              }}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
            >
              {MARKET_CATEGORIES.map(
                (option) => (
                  <option
                    key={
                      option.code
                    }
                    value={
                      option.code
                    }
                  >
                    {option.nameZh} / {option.nameEn}
                  </option>
                ),
              )}
            </select>

            {category !== 'armor' &&
              selectedCategory && (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium">
                    二级分类
                  </label>

                  <select
                    value={
                      subcategory
                    }
                    onChange={(
                      event,
                    ) =>
                      setSubcategory(
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
                  >
                    <option value="">
                      请选择二级分类
                    </option>

                    {selectedCategory.subcategories.map(
                      (option) => (
                        <option
                          key={
                            option.code
                          }
                          value={
                            option.code
                          }
                        >
                          {option.nameZh} / {option.nameEn}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              )}

            {category === 'armor' && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    护甲部位
                  </label>

                  <select
                    value={
                      armorPart
                    }
                    onChange={(
                      event,
                    ) => {
                      const nextPart =
                        event.target.value

                      setArmorPart(
                        nextPart,
                      )

                      const part =
                        ARMOR_PARTS.find(
                          (item) =>
                            item.code ===
                            nextPart,
                        )

                      if (
                        !part?.hasWeight
                      ) {
                        setArmorWeight(
                          '',
                        )
                      }
                    }}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
                  >
                    <option value="">
                      请选择护甲部位
                    </option>

                    {ARMOR_PARTS.map(
                      (part) => (
                        <option
                          key={
                            part.code
                          }
                          value={
                            part.code
                          }
                        >
                          {part.nameZh} / {part.nameEn}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {selectedArmorPart?.hasWeight && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      护甲等级
                    </label>

                    <select
                      value={
                        armorWeight
                      }
                      onChange={(
                        event,
                      ) =>
                        setArmorWeight(
                          event.target.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
                    >
                      <option value="">
                        请选择护甲等级
                      </option>

                      {ARMOR_WEIGHTS.map(
                        (weight) => (
                          <option
                            key={
                              weight.code
                            }
                            value={
                              weight.code
                            }
                          >
                            {weight.nameZh} / {weight.nameEn}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              商品标题
            </label>

            <input
              value={title}
              onChange={(
                event,
              ) =>
                setTitle(
                  event.target
                    .value,
                )
              }
              maxLength={120}
              placeholder="例如：Geist Armor ASD Edition Set"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <label className="text-sm font-medium">
                商品图片
              </label>

              <span className="text-xs text-muted-foreground">
                {selectedImages.length}
                /4
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={
                handleImageSelection
              }
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {selectedImages.map(
                (
                  image,
                  index,
                ) => (
                  <div
                    key={
                      image.id
                    }
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <img
                      src={
                        image.previewUrl
                      }
                      alt={`商品图片 ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    {index ===
                      0 && (
                      <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
                        封面
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={
                        submitting
                      }
                      onClick={() =>
                        removeImage(
                          image.id,
                        )
                      }
                      className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ),
              )}

              {canAddImages && (
                <button
                  type="button"
                  disabled={
                    submitting
                  }
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                >
                  <ImagePlus className="size-5" />

                  <span className="text-xs">
                    添加图片
                  </span>
                </button>
              )}
            </div>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              最多上传 4 张，第一张将作为商品封面。支持 JPG、PNG、WebP，上传时会自动压缩。
            </p>
          </div>

          {listingType !==
            'wtt' && (
            <div>
              <label className="mb-2 block text-sm font-medium">
                价格
              </label>

              <div className="relative">
                <input
                  value={
                    priceUec
                  }
                  onChange={(
                    event,
                  ) =>
                    setPriceUec(
                      event.target
                        .value.replace(
                          /\D/g,
                          '',
                        ),
                    )
                  }
                  inputMode="numeric"
                  placeholder="例如：2500000"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 pr-20 text-sm outline-none focus:border-foreground/40"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  aUEC
                </span>
              </div>
            </div>
          )}

          {listingType ===
            'wtt' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  我提供
                </label>

                <input
                  value={
                    offeredItem
                  }
                  onChange={(
                    event,
                  ) =>
                    setOfferedItem(
                      event.target
                        .value,
                    )
                  }
                  placeholder="你愿意拿什么交换"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  我想换
                </label>

                <input
                  value={
                    wantedItem
                  }
                  onChange={(
                    event,
                  ) =>
                    setWantedItem(
                      event.target
                        .value,
                    )
                  }
                  placeholder="你希望获得什么"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                数量
              </label>

              <input
                value={quantity}
                onChange={(
                  event,
                ) =>
                  setQuantity(
                    event.target
                      .value.replace(
                        /\D/g,
                        '',
                      ),
                  )
                }
                inputMode="numeric"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                品质
                <span className="ml-2 font-normal text-muted-foreground">
                  可选
                </span>
              </label>

              <div className="relative">
                <input
                  value={quality}
                  onChange={(
                    event,
                  ) =>
                    setQuality(
                      event.target
                        .value.replace(
                          /\D/g,
                          '',
                        ),
                    )
                  }
                  inputMode="numeric"
                  placeholder="0–1000"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3">
              <div className="text-sm font-medium">
                交易地点
              </div>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                请选择商品所在的主城或空间站，方便双方确认个人机库交货地点。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs text-muted-foreground">
                  星系
                </label>

                <select
                  value={starSystem}
                  onChange={(event) => {
                    setStarSystem(
                      event.target.value,
                    )

                    setPlanetarySystem('')
                    setLocationCode('')
                    setCustomLocation('')
                  }}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40"
                >
                  <option value="">
                    选择星系
                  </option>

                  {MARKET_LOCATIONS.map(
                    (system) => (
                      <option
                        key={system.code}
                        value={system.code}
                      >
                        {system.nameZh}{' '}
                        /{' '}
                        {system.nameEn}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs text-muted-foreground">
                  区域
                </label>

                <select
                  value={planetarySystem}
                  disabled={!selectedSystem}
                  onChange={(event) => {
                    setPlanetarySystem(
                      event.target.value,
                    )

                    setLocationCode('')
                    setCustomLocation('')
                  }}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    选择区域
                  </option>

                  {selectedSystem?.regions.map(
                    (region) => (
                      <option
                        key={region.code}
                        value={region.code}
                      >
                        {region.nameZh}{' '}
                        /{' '}
                        {region.nameEn}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs text-muted-foreground">
                  具体地点
                </label>

                <select
                  value={locationCode}
                  disabled={!selectedRegion}
                  onChange={(event) => {
                    setLocationCode(
                      event.target.value,
                    )

                    setCustomLocation('')
                  }}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    选择地点
                  </option>

                  {selectedRegion?.places.map(
                    (place) => (
                      <option
                        key={place.code}
                        value={place.code}
                      >
                        {place.nameZh ===
                        place.nameEn
                          ? place.nameEn
                          : `${place.nameZh} / ${place.nameEn}`}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            {isCustomLocation && (
              <div className="mt-4">
                <label className="mb-2 block text-xs text-muted-foreground">
                  其他交易地点
                </label>

                <input
                  value={customLocation}
                  onChange={(event) =>
                    setCustomLocation(
                      event.target.value,
                    )
                  }
                  maxLength={120}
                  placeholder="请输入具体主城、空间站或其他交货地点"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40"
                />
              </div>
            )}
          </div>

          {listingType !==
            'wtt' && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3">
              <input
                type="checkbox"
                checked={
                  negotiable
                }
                onChange={(
                  event,
                ) =>
                  setNegotiable(
                    event.target
                      .checked,
                  )
                }
                className="size-4"
              />

              <div>
                <div className="text-sm font-medium">
                  接受议价
                </div>

                <div className="mt-0.5 text-xs text-muted-foreground">
                  让其他玩家知道价格可以协商
                </div>
              </div>
            </label>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">
              描述 / 备注
            </label>

            <textarea
              value={
                description
              }
              onChange={(
                event,
              ) =>
                setDescription(
                  event.target
                    .value,
                )
              }
              maxLength={3000}
              rows={5}
              placeholder="补充交易要求、时间、地点或其他说明……"
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm leading-6 outline-none focus:border-foreground/40"
            />

            <div className="mt-1 text-right text-xs text-muted-foreground">
              {description.length}
              /3000
            </div>
          </div>

          {uploadProgressText && (
            <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {uploadProgressText}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="h-10 rounded-full border border-border px-5 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            取消
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={
              submitListing
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {submitting && (
              <Loader2 className="size-4 animate-spin" />
            )}

            {submitting
              ? '处理中...'
              : '发布交易'}
          </button>
        </div>
      </div>
    </div>
  )
}