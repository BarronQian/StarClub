'use client'

import {
  FormEvent,
  useState,
} from 'react'

import {
  useRouter,
} from 'next/navigation'

import {
  Button,
} from '@/components/ui/button'

import type {
  EventCategory,
  EventStatus,
  EventSubcategory,
  EventSeries,
  EventSandboxType,
} from '@/lib/events'

type EventEditorProps = {
  mode?: 'create'
}

const inputClass =
  'h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'

const textareaClass =
  'min-h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'

const labelClass =
  'mb-2 block text-xs font-medium text-foreground'

const hintClass =
  'mt-1.5 text-[0.68rem] leading-relaxed text-muted-foreground'

export function EventEditor({
  mode = 'create',
}: EventEditorProps) {
  const router =
    useRouter()

  const [
    submitting,
    setSubmitting,
  ] = useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    category,
    setCategory,
  ] =
    useState<EventCategory>(
      'activity',
    )

  const [
    subcategory,
    setSubcategory,
  ] =
    useState<
      EventSubcategory | ''
    >('')

  const [
    status,
    setStatus,
  ] =
    useState<EventStatus>(
      'upcoming',
    )

  const [
    series,
    setSeries,
  ] =
    useState<
      EventSeries | ''
    >('')

  const [
    sandboxType,
    setSandboxType,
  ] =
    useState<
      EventSandboxType | ''
    >('')

  const [
    featuredOnHome,
    setFeaturedOnHome,
  ] = useState(false)

  const [
    isPublished,
    setIsPublished,
  ] = useState(true)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (submitting) {
      return
    }

    setSubmitting(true)
    setError(null)

    const form =
      new FormData(
        event.currentTarget,
      )

    const splitLines = (
      value: FormDataEntryValue | null,
    ) =>
      String(
        value ?? '',
      )
        .split('\n')
        .map((item) =>
          item.trim(),
        )
        .filter(Boolean)

    const payload = {
      slug:
        form.get(
          'slug',
        ),

      tag:
        form.get(
          'tag',
        ),

      title:
        form.get(
          'title',
        ),

      subtitle:
        form.get(
          'subtitle',
        ),

      date:
        form.get(
          'date',
        ),

      timezone:
        form.get(
          'timezone',
        ),

      startTimes:
        splitLines(
          form.get(
            'startTimes',
          ),
        ),

      location:
        form.get(
          'location',
        ),

      category,

      subcategory:
        subcategory ||
        null,

      series:
        category ===
        'competition'
          ? series ||
            null
          : null,

      sandboxType:
        category ===
          'activity' &&
        subcategory ===
          'sandbox'
          ? sandboxType ||
            null
          : null,

      customTags:
        splitLines(
          form.get(
            'customTags',
          ),
        ),

      tags:
        splitLines(
          form.get(
            'tags',
          ),
        ),

      status,

      image:
        form.get(
          'image',
        ),

      alt:
        form.get(
          'alt',
        ),

      description:
        form.get(
          'description',
        ),

      details:
        form.get(
          'details',
        ),

      rules:
        splitLines(
          form.get(
            'rules',
          ),
        ),

      rewards:
        splitLines(
          form.get(
            'rewards',
          ),
        ),

      slots:
        form.get(
          'slots',
        ),

      discordUrl:
        form.get(
          'discordUrl',
        ),

      archiveHref:
        form.get(
          'archiveHref',
        ),

      sortOrder:
        Number(
          form.get(
            'sortOrder',
          ) ?? 0,
        ),

      featuredOnHome,
      isPublished,
    }

    try {
      const response =
        await fetch(
          '/api/admin/events',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        )

      const data =
        await response.json()

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ||
            '创建活动失败',
        )
      }

      router.push(
        '/admin/events',
      )

      router.refresh()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '创建活动失败',
      )
    } finally {
      setSubmitting(
        false,
      )
    }
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="flex flex-col gap-8"
    >
      <section className="corner-cut border border-border bg-card p-6">
        <div className="mb-6">
          <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
            基本信息
          </h2>

          <p className="mt-2 text-xs text-muted-foreground">
            活动卡片与详情页使用的主要信息。
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="title"
              className={
                labelClass
              }
            >
              活动标题 *
            </label>

            <input
              id="title"
              name="title"
              required
              className={
                inputClass
              }
              placeholder="例如：逐星之翼杯 · 第四届"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="subtitle"
              className={
                labelClass
              }
            >
              英文 / 副标题
            </label>

            <input
              id="subtitle"
              name="subtitle"
              className={
                inputClass
              }
              placeholder="StarClub Racing Championship"
            />
          </div>

          <div>
            <label
              htmlFor="slug"
              className={
                labelClass
              }
            >
              Slug *
            </label>

            <input
              id="slug"
              name="slug"
              required
              className={
                inputClass
              }
              placeholder="star-racing-cup-4"
            />

            <p className={
              hintClass
            }>
              只使用小写英文、数字和 -
            </p>
          </div>

          <div>
            <label
              htmlFor="tag"
              className={
                labelClass
              }
            >
              卡片标签 *
            </label>

            <input
              id="tag"
              name="tag"
              required
              className={
                inputClass
              }
              placeholder="赛事 / 活动 / 逐星之翼"
            />
          </div>
        </div>
      </section>

      <section className="corner-cut border border-border bg-card p-6">
        <div className="mb-6">
          <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
            活动分类
          </h2>

          <p className="mt-2 text-xs text-muted-foreground">
            根据分类自动显示对应的赛事或活动字段。
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="category"
              className={
                labelClass
              }
            >
              分类 *
            </label>

            <select
              id="category"
              value={
                category
              }
              onChange={(
                event,
              ) => {
                const value =
                  event
                    .target
                    .value as EventCategory

                setCategory(
                  value,
                )

                setSubcategory(
                  '',
                )

                setSeries(
                  '',
                )

                setSandboxType(
                  '',
                )
              }}
              className={
                inputClass
              }
            >
              <option value="activity">
                活动
              </option>

              <option value="competition">
                赛事
              </option>

              <option value="teaching">
                教学
              </option>

              <option value="group-photo">
                大合影
              </option>

              <option value="other">
                其他
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="status"
              className={
                labelClass
              }
            >
              状态 *
            </label>

            <select
              id="status"
              value={
                status
              }
              onChange={(
                event,
              ) =>
                setStatus(
                  event
                    .target
                    .value as EventStatus,
                )
              }
              className={
                inputClass
              }
            >
              <option value="open">
                报名中
              </option>

              <option value="upcoming">
                即将开始
              </option>

              <option value="ongoing">
                进行中
              </option>

              <option value="ended">
                已结束
              </option>
            </select>
          </div>

          {category ===
          'activity' ? (
            <div>
              <label
                htmlFor="subcategory"
                className={
                  labelClass
                }
              >
                活动子分类
              </label>

              <select
                id="subcategory"
                value={
                  subcategory
                }
                onChange={(
                  event,
                ) => {
                  const value =
                    event
                      .target
                      .value as
                      | EventSubcategory
                      | ''

                  setSubcategory(
                    value,
                  )

                  if (
                    value !==
                    'sandbox'
                  ) {
                    setSandboxType(
                      '',
                    )
                  }
                }}
                className={
                  inputClass
                }
              >
                <option value="">
                  无
                </option>

                <option value="sandbox">
                  沙盒活动
                </option>

                <option value="limited-time">
                  限时活动
                </option>

                <option value="ship-flight">
                  舰船 / 飞行活动
                </option>

                <option value="custom">
                  自创活动
                </option>

                <option value="community">
                  社区活动
                </option>

                <option value="other">
                  其他
                </option>
              </select>
            </div>
          ) : null}

          {category ===
          'competition' ? (
            <div>
              <label
                htmlFor="series"
                className={
                  labelClass
                }
              >
                赛事系列
              </label>

              <select
                id="series"
                value={
                  series
                }
                onChange={(
                  event,
                ) =>
                  setSeries(
                    event
                      .target
                      .value as
                      | EventSeries
                      | '',
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="">
                  无
                </option>

                <option value="gun-king">
                  绝境枪王
                </option>

                <option value="air-combat-ace">
                  空战英豪
                </option>

                <option value="star-wing">
                  逐星之翼
                </option>

                <option value="casual-competition">
                  休闲赛事
                </option>

                <option value="other">
                  其他赛事
                </option>
              </select>
            </div>
          ) : null}

          {category ===
            'activity' &&
          subcategory ===
            'sandbox' ? (
            <div>
              <label
                htmlFor="sandboxType"
                className={
                  labelClass
                }
              >
                沙盒活动类型
              </label>

              <select
                id="sandboxType"
                value={
                  sandboxType
                }
                onChange={(
                  event,
                ) =>
                  setSandboxType(
                    event
                      .target
                      .value as
                      | EventSandboxType
                      | '',
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="">
                  无
                </option>

                <option value="executive-hangar">
                  行政机库 / 争夺区
                </option>

                <option value="asd-onyx">
                  ASD 玛瑙设施
                </option>

                <option value="laser-alignment">
                  激光校准
                </option>

                <option value="storm-breaker">
                  风暴破坏者
                </option>

                <option value="tsg">
                  TSG
                </option>

                <option value="other">
                  其他
                </option>
              </select>
            </div>
          ) : null}
        </div>
      </section>

      <section className="corner-cut border border-border bg-card p-6">
        <div className="mb-6">
          <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
            时间与地点
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="date"
              className={
                labelClass
              }
            >
              显示日期 *
            </label>

            <input
              id="date"
              name="date"
              required
              className={
                inputClass
              }
              placeholder="2026.09.20 或 待定"
            />
          </div>

          <div>
            <label
              htmlFor="timezone"
              className={
                labelClass
              }
            >
              时区
            </label>

            <input
              id="timezone"
              name="timezone"
              className={
                inputClass
              }
              placeholder="UTC+8"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="startTimes"
              className={
                labelClass
              }
            >
              精确开始时间
            </label>

            <textarea
              id="startTimes"
              name="startTimes"
              className={
                textareaClass
              }
              placeholder={`每行一个 ISO 时间，例如：\n2026-09-21T02:00:00Z`}
            />

            <p className={
              hintClass
            }>
              填写后前台会自动显示访问者本地时间。没有精确时间可以留空。
            </p>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="location"
              className={
                labelClass
              }
            >
              活动地点 *
            </label>

            <input
              id="location"
              name="location"
              required
              className={
                inputClass
              }
              placeholder="竞技场指挥官 · 经典竞速"
            />
          </div>
        </div>
      </section>

      <section className="corner-cut border border-border bg-card p-6">
        <div className="mb-6">
          <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
            封面
          </h2>
        </div>

        <div className="grid gap-5">
          <div>
            <label
              htmlFor="image"
              className={
                labelClass
              }
            >
              图片路径 *
            </label>

            <input
              id="image"
              name="image"
              required
              className={
                inputClass
              }
              placeholder="/images/events/example.jpg"
            />

            <p className={
              hintClass
            }>
              下一步会给这里增加直接上传图片功能。
            </p>
          </div>

          <div>
            <label
              htmlFor="alt"
              className={
                labelClass
              }
            >
              图片 Alt
            </label>

            <input
              id="alt"
              name="alt"
              className={
                inputClass
              }
              placeholder="活动封面描述"
            />
          </div>
        </div>
      </section>

      <section className="corner-cut border border-border bg-card p-6">
        <div className="mb-6">
          <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
            活动内容
          </h2>
        </div>

        <div className="grid gap-5">
          <div>
            <label
              htmlFor="description"
              className={
                labelClass
              }
            >
              简介 *
            </label>

            <textarea
              id="description"
              name="description"
              required
              className={
                textareaClass
              }
              placeholder="用于活动卡片和 SEO 的简短介绍。"
            />
          </div>

          <div>
            <label
              htmlFor="details"
              className={
                labelClass
              }
            >
              详细介绍
            </label>

            <textarea
              id="details"
              name="details"
              className={`${textareaClass} min-h-40`}
              placeholder="活动详情页正文..."
            />
          </div>

          <div>
            <label
              htmlFor="rules"
              className={
                labelClass
              }
            >
              活动规则
            </label>

            <textarea
              id="rules"
              name="rules"
              className={
                textareaClass
              }
              placeholder={`每行一条，例如：\n比赛采用 1v1 模式\n禁止利用 BUG 获取优势`}
            />
          </div>

          <div>
            <label
              htmlFor="rewards"
              className={
                labelClass
              }
            >
              奖励
            </label>

            <textarea
              id="rewards"
              name="rewards"
              className={
                textareaClass
              }
              placeholder={`每行一条，例如：\n冠军：LTI 飞船\n亚军：月度订阅包`}
            />
          </div>
        </div>
      </section>

      <section className="corner-cut border border-border bg-card p-6">
        <div className="mb-6">
          <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
            其他信息
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="slots"
              className={
                labelClass
              }
            >
              席位
            </label>

            <input
              id="slots"
              name="slots"
              className={
                inputClass
              }
              placeholder="0 / 32 席位"
            />
          </div>

          <div>
            <label
              htmlFor="sortOrder"
              className={
                labelClass
              }
            >
              排序权重
            </label>

            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={0}
              className={
                inputClass
              }
            />

            <p className={
              hintClass
            }>
              数值越高越靠前。
            </p>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="discordUrl"
              className={
                labelClass
              }
            >
              Discord 报名链接
            </label>

            <input
              id="discordUrl"
              name="discordUrl"
              className={
                inputClass
              }
              placeholder="https://discord.com/channels/..."
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="archiveHref"
              className={
                labelClass
              }
            >
              活动归档 / 合影链接
            </label>

            <input
              id="archiveHref"
              name="archiveHref"
              className={
                inputClass
              }
              placeholder="/archive/..."
            />
          </div>

          <div>
            <label
              htmlFor="customTags"
              className={
                labelClass
              }
            >
              自定义活动标签
            </label>

            <textarea
              id="customTags"
              name="customTags"
              className={
                textareaClass
              }
              placeholder={`每行一个：\nracing\nfps`}
            />
          </div>

          <div>
            <label
              htmlFor="tags"
              className={
                labelClass
              }
            >
              通用标签
            </label>

            <textarea
              id="tags"
              name="tags"
              className={
                textareaClass
              }
              placeholder={`每行一个：\npve\nvehicle`}
            />
          </div>
        </div>
      </section>

      <section className="corner-cut border border-border bg-card p-6">
        <div className="flex flex-col gap-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={
                featuredOnHome
              }
              onChange={(
                event,
              ) =>
                setFeaturedOnHome(
                  event
                    .target
                    .checked,
                )
              }
              className="mt-0.5 size-4"
            />

            <span>
              <span className="block text-sm font-medium text-foreground">
                首页推荐
              </span>

              <span className="mt-1 block text-xs text-muted-foreground">
                开启后，该活动可以出现在首页 Featured Events 区域。
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={
                isPublished
              }
              onChange={(
                event,
              ) =>
                setIsPublished(
                  event
                    .target
                    .checked,
                )
              }
              className="mt-0.5 size-4"
            />

            <span>
              <span className="block text-sm font-medium text-foreground">
                立即发布
              </span>

              <span className="mt-1 block text-xs text-muted-foreground">
                关闭后保存为草稿，普通用户无法在前台看到。
              </span>
            </span>
          </label>
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="outline"
          disabled={
            submitting
          }
          onClick={() =>
            router.push(
              '/admin/events',
            )
          }
        >
          取消
        </Button>

        <Button
          type="submit"
          disabled={
            submitting
          }
        >
          {submitting
            ? '正在创建...'
            : mode ===
                'create'
              ? '创建活动'
              : '保存活动'}
        </Button>
      </div>
    </form>
  )
}