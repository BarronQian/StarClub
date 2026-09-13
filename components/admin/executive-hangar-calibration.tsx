'use client'

import {
  useState,
} from 'react'

import {
  Check,
  Loader2,
  Wrench,
} from 'lucide-react'

import {
  useRouter,
} from 'next/navigation'

import {
  Button,
} from '@/components/ui/button'

function toDatetimeLocal(
  value: string,
) {
  const date =
    new Date(value)

  const parts =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone:
          'America/Los_Angeles',
      },
    ).formatToParts(
      date,
    )

  const get = (
    type: string,
  ) =>
    parts.find(
      (part) =>
        part.type === type,
    )?.value ?? ''

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`
}

export function ExecutiveHangarCalibration({
  currentFullGreenTime,
}: {
  currentFullGreenTime: string
}) {
  const router =
    useRouter()

  const [
    value,
    setValue,
  ] =
    useState(
      toDatetimeLocal(
        currentFullGreenTime,
      ),
    )

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    success,
    setSuccess,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

  const save =
    async () => {
      if (
        !value ||
        saving
      ) {
        return
      }

      setSaving(true)
      setSuccess(false)
      setError('')

      try {
        /*
         * datetime-local 没有时区信息。
         * 这里明确把管理员输入解释为
         * America/Los_Angeles 当前时区。
         *
         * 浏览器位于 Pacific Time 时，
         * new Date(value) 会正确生成 UTC 时间。
         */
        const localDate =
          new Date(value)

        if (
          Number.isNaN(
            localDate.getTime(),
          )
        ) {
          throw new Error(
            '请输入有效的校准时间',
          )
        }

        const response =
          await fetch(
            '/api/admin/executive-hangar',
            {
              method:
                'PATCH',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  fullGreenTime:
                    localDate.toISOString(),
                }),
            },
          )

        const result =
          await response.json()

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              '保存校准失败',
          )
        }

        setSuccess(true)

        router.refresh()

        window.setTimeout(
          () => {
            setSuccess(false)
          },
          2500,
        )
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : '保存校准失败',
        )
      } finally {
        setSaving(false)
      }
    }

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">

      <div>
        <p className="text-sm font-semibold">
          更新全局校准
        </p>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
          输入游戏内五盏信号灯全部转绿、行政机库正式进入开放阶段的时间。
          保存后将作为网站新的默认周期基准。
        </p>
      </div>

      <div className="mt-5">

        <label className="block">

          <div className="flex flex-wrap items-center justify-between gap-2">

            <span className="text-xs font-medium">
              五盏灯全部转绿时间
            </span>

            <span className="text-[10px] tracking-wider text-muted-foreground">
              PACIFIC TIME
            </span>

          </div>

          <input
            type="datetime-local"
            step={1}
            value={value}
            onChange={(
              event,
            ) => {
              setValue(
                event.target.value,
              )

              setSuccess(false)
              setError('')
            }}
            className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 font-mono text-sm tabular-nums outline-none transition-colors focus:border-primary"
          />

        </label>

        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">

          <p className="text-xs font-medium text-amber-900">
            校准点必须是五盏灯全部转绿的时刻
          </p>

          <p className="mt-1 text-[11px] leading-5 text-amber-800/80">
            不要填写单独某一盏灯转绿的时间。
            系统保存时会自动向前推算 120 分钟，得到 CLOSED 周期起点。
          </p>

        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">

          <Button
            type="button"
            onClick={save}
            disabled={
              saving ||
              !value
            }
          >
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : success ? (
              <Check className="mr-2 size-4" />
            ) : (
              <Wrench className="mr-2 size-4" />
            )}

            {saving
              ? '正在保存'
              : success
                ? '全局校准已更新'
                : '应用全局校准'}
          </Button>

          <span className="text-[10px] text-muted-foreground">
            {success
              ? '网站全局基准已保存'
              : '仅管理员可修改'}
          </span>

        </div>

      </div>

    </section>
  )
}