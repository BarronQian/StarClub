'use client'

import {
  useMemo,
  useState,
} from 'react'

import {
  useRouter,
} from 'next/navigation'

import {
  Check,
  Eye,
  EyeOff,
  Gift,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

import type {
  SponsorGiftRow,
} from '@/lib/sponsor-gifts-db'

type SponsorOption = {
  id: string
  name: string
  nickname: string | null
  amount: number
}

type SponsorGiftManagerProps = {
  initialGifts: SponsorGiftRow[]
  sponsors: SponsorOption[]
}

type FormState = {
  sponsorId: string
  sponsorName: string
  recipientName: string
  eventName: string
  giftName: string
  quantity: string
  giftValue: string
  giftedAt: string
  textColor: string
  fontSize:
    | 'small'
    | 'medium'
    | 'large'
    | 'xlarge'
  speed:
    | 'slow'
    | 'normal'
    | 'fast'
  depth:
    | 'back'
    | 'middle'
    | 'front'
  isVisible: boolean
  countsTowardTotal: boolean
}

const COLORS = [
  {
    name: '酒馆金',
    value: '#B87922',
  },
  {
    name: '深金',
    value: '#8F651D',
  },
  {
    name: '玫瑰',
    value: '#A96A87',
  },
  {
    name: '星空蓝',
    value: '#557A9E',
  },
  {
    name: '青灰',
    value: '#637D7D',
  },
  {
    name: '暖灰',
    value: '#746E66',
  },
]

function today() {
  return new Date()
    .toISOString()
    .slice(0, 10)
}

function emptyForm(): FormState {
  return {
    sponsorId: '',
    sponsorName: '',
    recipientName: '',
    eventName: '',
    giftName: '',
    quantity: '1',
    giftValue: '0',
    giftedAt: today(),
    textColor: '#B87922',
    fontSize: 'medium',
    speed: 'normal',
    depth: 'middle',
    isVisible: true,
    countsTowardTotal: false,
  }
}

function formatMoney(
  value: number,
) {
  return `$${Number(
    value,
  ).toLocaleString(
    'en-US',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`
}

export function SponsorGiftManager({
  initialGifts,
  sponsors,
}: SponsorGiftManagerProps) {
  const router =
    useRouter()

  const [
    gifts,
    setGifts,
  ] =
    useState(
      initialGifts,
    )

  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      emptyForm(),
    )

  const [
    editingId,
    setEditingId,
  ] =
    useState<
      string | null
    >(null)

  const [
    showForm,
    setShowForm,
  ] =
    useState(false)

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<
      string | null
    >(null)

  const [
    message,
    setMessage,
  ] =
    useState<
      string | null
    >(null)

  const visibleCount =
    useMemo(
      () =>
        gifts.filter(
          (gift) =>
            gift.is_visible,
        ).length,
      [gifts],
    )

  function updateForm<
    K extends keyof FormState,
  >(
    key: K,
    value: FormState[K],
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]:
          value,
      }),
    )
  }

  function startCreate() {
    setEditingId(
      null,
    )

    setForm(
      emptyForm(),
    )

    setMessage(
      null,
    )

    setShowForm(
      true,
    )
  }

  function startEdit(
    gift: SponsorGiftRow,
  ) {
    setEditingId(
      gift.id,
    )

    setForm({
      sponsorId:
        gift.sponsor_id ??
        '',

      sponsorName:
        gift.sponsor_name,

      recipientName:
        gift.recipient_name,

      eventName:
        gift.event_name ??
        '',

      giftName:
        gift.gift_name,

      quantity:
        String(
          gift.quantity,
        ),

      giftValue:
        String(
          gift.gift_value,
        ),

      giftedAt:
        gift.gifted_at,

      textColor:
        gift.text_color,

      fontSize:
        gift.font_size,

      speed:
        gift.speed,

      depth:
        gift.depth,

      isVisible:
        gift.is_visible,

      countsTowardTotal:
        gift.counts_toward_total ??
        false,
    })

    setMessage(
      null,
    )

    setShowForm(
      true,
    )
  }

  function closeForm() {
    if (saving) {
      return
    }

    setShowForm(
      false,
    )

    setEditingId(
      null,
    )

    setForm(
      emptyForm(),
    )
  }

  function selectSponsor(
    sponsorId: string,
  ) {
    const sponsor =
      sponsors.find(
        (item) =>
          item.id ===
          sponsorId,
      )

    setForm(
      (current) => ({
        ...current,

        sponsorId,

        sponsorName:
          sponsor?.name ??
          '',
      }),
    )
  }

  async function saveGift() {
    if (
      !form.sponsorName.trim()
    ) {
      setMessage(
        '请选择赞助者',
      )
      return
    }

    if (
      !form.recipientName.trim()
    ) {
      setMessage(
        '请填写礼物接收者',
      )
      return
    }

    if (
      !form.giftName.trim()
    ) {
      setMessage(
        '请填写赞助礼物',
      )
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const url =
        editingId
          ? `/api/admin/sponsor-gifts/${editingId}`
          : '/api/admin/sponsor-gifts'

      const response =
        await fetch(
          url,
          {
            method:
              editingId
                ? 'PATCH'
                : 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                sponsorId:
                  form.sponsorId,

                sponsorName:
                  form.sponsorName,

                recipientName:
                  form.recipientName,

                eventName:
                  form.eventName,

                giftName:
                  form.giftName,

                quantity:
                  Number(
                    form.quantity,
                  ),

                giftValue:
                  Number(
                    form.giftValue,
                  ),

                giftedAt:
                  form.giftedAt,

                textColor:
                  form.textColor,

                fontSize:
                  form.fontSize,

                speed:
                  form.speed,

                depth:
                  form.depth,

                isVisible:
                  form.isVisible,

                ...(editingId
                  ? {
                      countsTowardTotal:
                        form.countsTowardTotal,
                    }
                  : {
                      addToSponsorTotal:
                        form.countsTowardTotal,
                    }),
              }),
          },
        )

      const responseText =
        await response.text()

      let data: any = null

      try {
        data =
          responseText
            ? JSON.parse(
                responseText,
              )
            : null
      } catch {
        console.error(
          'Sponsor gift API returned non-JSON:',
          responseText,
        )

        throw new Error(
          response.ok
            ? '服务器返回了无法识别的数据'
            : `服务器错误 (${response.status})，请查看 Logs`,
        )
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `保存失败 (${response.status})`,
        )
      }

      if (editingId) {
        setGifts(
          (current) =>
            current.map(
              (gift) =>
                gift.id ===
                editingId
                  ? data.gift
                  : gift,
            ),
        )
      } else {
        setGifts(
          (current) => [
            data.gift,
            ...current,
          ],
        )
      }

      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm())

      setMessage(
        data.warning ||
          '赞助记录已保存',
      )

      router.refresh()
    } catch (error) {
      setMessage(
        error instanceof
          Error
          ? error.message
          : '保存失败',
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleVisibility(
    gift: SponsorGiftRow,
  ) {
    try {
      const response =
        await fetch(
          `/api/admin/sponsor-gifts/${gift.id}`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                sponsorId:
                  gift.sponsor_id ??
                  '',

                sponsorName:
                  gift.sponsor_name,

                recipientName:
                  gift.recipient_name,

                eventName:
                  gift.event_name ??
                  '',

                giftName:
                  gift.gift_name,

                quantity:
                  gift.quantity,

                giftValue:
                  gift.gift_value,

                giftedAt:
                  gift.gifted_at,

                textColor:
                  gift.text_color,

                fontSize:
                  gift.font_size,

                speed:
                  gift.speed,

                depth:
                  gift.depth,

                isVisible:
                  !gift.is_visible,

                countsTowardTotal:
                  gift.counts_toward_total ??
                  false,
              }),
          },
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            '更新失败',
        )
      }

      setGifts(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              gift.id
                ? data.gift
                : item,
          ),
      )

      router.refresh()
    } catch (error) {
      setMessage(
        error instanceof
          Error
          ? error.message
          : '更新失败',
      )
    }
  }

  async function deleteGift(
    gift: SponsorGiftRow,
  ) {
    const confirmed =
      window.confirm(
        `确定删除这条赞助记录吗？\n\n${gift.sponsor_name} → ${gift.recipient_name}\n${gift.gift_name}`,
      )

    if (!confirmed) {
      return
    }

    setDeletingId(
      gift.id,
    )

    setMessage(
      null,
    )

    try {
      const response =
        await fetch(
          `/api/admin/sponsor-gifts/${gift.id}`,
          {
            method:
              'DELETE',
          },
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            '删除失败',
        )
      }

      setGifts(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              gift.id,
          ),
      )

      router.refresh()
    } catch (error) {
      setMessage(
        error instanceof
          Error
          ? error.message
          : '删除失败',
      )
    } finally {
      setDeletingId(
        null,
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-[0.62rem] tracking-[0.24em] text-primary">
            GIFT RECORDS
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            赞助记录
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            共 {gifts.length} 条记录 · {visibleCount} 条正在赞助弹幕墙显示
          </p>
        </div>

        <button
          type="button"
          onClick={
            startCreate
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          新增赞助记录
        </button>
      </div>

      {message && (
        <div className="border-l-2 border-primary bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {message}
        </div>
      )}

      {showForm && (
        <div className="border-y border-border py-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="font-display text-[0.6rem] tracking-[0.22em] text-primary">
                {editingId
                  ? 'EDIT GIFT'
                  : 'NEW GIFT'}
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                {editingId
                  ? '编辑赞助记录'
                  : '新增赞助记录'}
              </h3>
            </div>

            <button
              type="button"
              onClick={
                closeForm
              }
              className="rounded-md p-2 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <span className="text-xs font-medium">
                赞助者
              </span>

              <select
                value={
                  form.sponsorId
                }
                onChange={(
                  event,
                ) =>
                  selectSponsor(
                    event.target.value,
                  )
                }
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">
                  手动输入 / 新赞助者
                </option>

                {sponsors.map(
                  (sponsor) => (
                    <option
                      key={
                        sponsor.id
                      }
                      value={
                        sponsor.id
                      }
                    >
                      {sponsor.name}
                      {sponsor.nickname
                        ? ` · ${sponsor.nickname}`
                        : ''}
                    </option>
                  ),
                )}
              </select>

              <input
                value={
                  form.sponsorName
                }
                onChange={(
                  event,
                ) => {
                  setForm(
                    (current) => ({
                      ...current,

                      sponsorId:
                        '',

                      sponsorName:
                        event.target.value,
                    }),
                  )
                }}
                placeholder="或手动输入赞助者游戏 ID / 名称"
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />

              <p className="text-[0.7rem] leading-5 text-muted-foreground">
                可以从现有赞助者中选择，也可以直接输入新的赞助者名称。
              </p>
            </div>

            <label className="space-y-2">
              <span className="text-xs font-medium">
                接收者 / 获奖者
              </span>

              <input
                value={
                  form.recipientName
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'recipientName',
                    event
                      .target
                      .value,
                  )
                }
                placeholder="例如 ilQwQli"
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-medium">
                活动 / 获奖原因
              </span>

              <input
                value={
                  form.eventName
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'eventName',
                    event
                      .target
                      .value,
                  )
                }
                placeholder="例如 第三届逐星之翼杯竞速比赛 · 冠军"
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-medium">
                赞助礼物
              </span>

              <input
                value={
                  form.giftName
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'giftName',
                    event
                      .target
                      .value,
                  )
                }
                placeholder="例如 LTI Basher + Corroded Paint"
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium">
                数量
              </span>

              <input
                type="number"
                min="1"
                step="1"
                value={
                  form.quantity
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'quantity',
                    event
                      .target
                      .value,
                  )
                }
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium">
                礼物参考价值（USD）
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.giftValue
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'giftValue',
                    event
                      .target
                      .value,
                  )
                }
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium">
                赠送日期
              </span>

              <input
                type="date"
                value={
                  form.giftedAt
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'giftedAt',
                    event
                      .target
                      .value,
                  )
                }
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>

            <div className="space-y-2">
              <span className="text-xs font-medium">
                弹幕颜色
              </span>

              <div className="flex min-h-11 flex-wrap items-center gap-2">
                {COLORS.map(
                  (color) => {
                    const active =
                      form.textColor ===
                      color.value

                    return (
                      <button
                        key={
                          color.value
                        }
                        type="button"
                        title={
                          color.name
                        }
                        onClick={() =>
                          updateForm(
                            'textColor',
                            color.value,
                          )
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-105 ${
                          active
                            ? 'border-foreground'
                            : 'border-transparent'
                        }`}
                      >
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full"
                          style={{
                            backgroundColor:
                              color.value,
                          }}
                        >
                          {active && (
                            <Check className="h-3.5 w-3.5 text-white" />
                          )}
                        </span>
                      </button>
                    )
                  },
                )}

                <input
                  type="color"
                  value={
                    form.textColor
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      'textColor',
                      event
                        .target
                        .value,
                    )
                  }
                  title="自定义颜色"
                  className="h-9 w-9 cursor-pointer rounded-full border-0 bg-transparent p-0"
                />
              </div>
            </div>

            <label className="space-y-2">
              <span className="text-xs font-medium">
                弹幕字号
              </span>

              <select
                value={
                  form.fontSize
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'fontSize',
                    event
                      .target
                      .value as FormState['fontSize'],
                  )
                }
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="small">
                  小
                </option>
                <option value="medium">
                  中
                </option>
                <option value="large">
                  大
                </option>
                <option value="xlarge">
                  特大
                </option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium">
                弹幕速度
              </span>

              <select
                value={
                  form.speed
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'speed',
                    event
                      .target
                      .value as FormState['speed'],
                  )
                }
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="slow">
                  慢
                </option>
                <option value="normal">
                  正常
                </option>
                <option value="fast">
                  快
                </option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium">
                弹幕景深
              </span>

              <select
                value={
                  form.depth
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'depth',
                    event
                      .target
                      .value as FormState['depth'],
                  )
                }
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="back">
                  远景
                </option>
                <option value="middle">
                  中景
                </option>
                <option value="front">
                  前景
                </option>
              </select>
            </label>
          </div>

          <div className="mt-7 space-y-3 border-t border-border pt-6">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={
                  form.isVisible
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'isVisible',
                    event
                      .target
                      .checked,
                  )
                }
                className="mt-1"
              />

              <span>
                <span className="block text-sm font-medium">
                  在赞助弹幕墙显示
                </span>

                <span className="mt-1 block text-xs text-muted-foreground">
                  关闭后记录仍保留，但不会出现在公开赞助页面。
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={
                  form.countsTowardTotal
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'countsTowardTotal',
                    event
                      .target
                      .checked,
                  )
                }
                className="mt-1"
              />

              <span>
                <span className="block text-sm font-medium">
                  计入该赞助者累计礼物参考价值
                </span>

                <span className="mt-1 block text-xs text-muted-foreground">
                  开启后，本次礼物参考价值会同步计入首页与赞助页的累计统计。
                </span>
              </span>
            </label>
          </div>

          <div className="mt-7 flex justify-end gap-3">
            <button
              type="button"
              onClick={
                closeForm
              }
              disabled={
                saving
              }
              className="h-10 rounded-lg border border-border px-4 text-sm hover:bg-muted disabled:opacity-50"
            >
              取消
            </button>

            <button
              type="button"
              onClick={
                saveGift
              }
              disabled={
                saving
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Gift className="h-4 w-4" />
              )}

              {editingId
                ? '保存修改'
                : '发布赞助记录'}
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-border border-y border-border">
        {gifts.length ===
        0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            暂无赞助记录
          </div>
        ) : (
          gifts.map(
            (gift) => (
              <div
                key={
                  gift.id
                }
                className="grid gap-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          gift.text_color,
                      }}
                    />

                    <span className="font-semibold">
                      {
                        gift.sponsor_name
                      }
                    </span>

                    <span className="text-xs text-muted-foreground">
                      →
                    </span>

                    <span className="font-medium">
                      {
                        gift.recipient_name
                      }
                    </span>

                    {!gift.is_visible && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] text-muted-foreground">
                        已隐藏
                      </span>
                    )}

                    {gift.counts_toward_total && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] text-primary">
                        已计入累计
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-foreground">
                    {gift.gift_name}
                    {gift.quantity >
                    1
                      ? ` ×${gift.quantity}`
                      : ''}
                  </p>

                  {gift.event_name && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {
                        gift.event_name
                      }
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem] text-muted-foreground">
                    <span>
                      {
                        gift.gifted_at
                      }
                    </span>

                    <span>
                      {formatMoney(
                        gift.gift_value,
                      )}
                    </span>

                    <span>
                      {
                        gift.font_size
                      }
                      {' / '}
                      {gift.speed}
                      {' / '}
                      {gift.depth}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      toggleVisibility(
                        gift,
                      )
                    }
                    title={
                      gift.is_visible
                        ? '隐藏'
                        : '显示'
                    }
                    className="rounded-lg p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {gift.is_visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      startEdit(
                        gift,
                      )
                    }
                    title="编辑"
                    className="rounded-lg p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteGift(
                        gift,
                      )
                    }
                    disabled={
                      deletingId ===
                      gift.id
                    }
                    title="删除"
                    className="rounded-lg p-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {deletingId ===
                    gift.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  )
}