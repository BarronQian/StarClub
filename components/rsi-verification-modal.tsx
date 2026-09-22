'use client'

import {
  useEffect,
  useState,
} from 'react'

import { getSupabaseBrowser } from '@/lib/supabase-browser'

type RsiVerificationModalProps = {
  open: boolean
  onClose: () => void

  currentHandle?: string | null
  verificationHandle?: string | null
  verificationCode?: string | null
  verificationExpiresAt?: string | null

  onVerified?: (
    handle: string,
    verifiedAt: string,
  ) => void
}

export function RsiVerificationModal({
  open,
  onClose,
  currentHandle,
  verificationHandle,
  verificationCode,
  verificationExpiresAt,
  onVerified,
}: RsiVerificationModalProps) {
  const [
    handleInput,
    setHandleInput,
  ] = useState('')

  const [
    code,
    setCode,
  ] = useState('')

  const [
    expiresAt,
    setExpiresAt,
  ] = useState('')

  const [
    timeLeft,
    setTimeLeft,
  ] = useState(0)

  const [
    starting,
    setStarting,
  ] = useState(false)

  const [
    verifying,
    setVerifying,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  useEffect(() => {
    if (!open) return

    setHandleInput(
      verificationHandle ||
        currentHandle ||
        '',
    )

    setCode(
      verificationCode || '',
    )

    setExpiresAt(
      verificationExpiresAt || '',
    )

    setError('')
  }, [
    open,
    currentHandle,
    verificationHandle,
    verificationCode,
    verificationExpiresAt,
  ])

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(0)
      return
    }

    const updateTimeLeft = () => {
      const expires =
        new Date(
          expiresAt,
        ).getTime()

      const remaining =
        Math.max(
          0,
          Math.floor(
            (
              expires -
              Date.now()
            ) / 1000,
          ),
        )

      setTimeLeft(remaining)
    }

    updateTimeLeft()

    const timer =
      window.setInterval(
        updateTimeLeft,
        1000,
      )

    return () => {
      window.clearInterval(timer)
    }
  }, [expiresAt])

  if (!open) {
    return null
  }

  const getAccessToken =
    async () => {
      const supabase =
        getSupabaseBrowser()

      const {
        data: { session },
      } =
        await supabase.auth.getSession()

      if (
        !session?.access_token
      ) {
        throw new Error(
          '登录状态已失效，请重新登录。',
        )
      }

      return session.access_token
    }

  const handleStart =
    async () => {
      if (starting) return

      const handle =
        handleInput.trim()

      if (!handle) {
        alert(
          '请输入你的 Star Citizen Handle',
        )
        return
      }

      try {
        setStarting(true)
        setError('')

        const accessToken =
          await getAccessToken()

        const response =
          await fetch(
            '/api/rsi/verification/start',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
                Authorization:
                  `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                handle,
              }),
            },
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              '无法创建 RSI 验证请求',
          )
        }

        setCode(
          data.verificationCode,
        )

        setExpiresAt(
          data.expiresAt,
        )

        setError('')
      } catch (error) {
        console.error(
          'RSI verification start error:',
          error,
        )

        alert(
          error instanceof Error
            ? error.message
            : '无法创建 RSI 验证请求',
        )
      } finally {
        setStarting(false)
      }
    }

  const handleVerify =
    async () => {
      const handle =
        handleInput.trim()

      if (timeLeft <= 0) {
        setError(
          '验证码已过期，请重新开始验证。',
        )
        return
      }

      if (!handle || !code) {
        alert(
          '当前没有有效的 RSI 验证请求。',
        )
        return
      }

      try {
        setVerifying(true)
        setError('')

        const accessToken =
          await getAccessToken()

        const response =
          await fetch(
            '/api/rsi/verification/verify',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
                Authorization:
                  `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                handle,
              }),
            },
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              'RSI 验证失败',
          )
        }

        setCode('')
        setExpiresAt('')
        setError('')

        onVerified?.(
          data.handle,
          data.verifiedAt,
        )

        onClose()

        alert(
          `RSI Handle ${data.handle} 验证成功！`,
        )
      } catch (error) {
        console.error(
          'RSI verification error:',
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : 'RSI 验证失败，请稍后再试。',
        )
      } finally {
        setVerifying(false)
      }
    }

  const handleReset =
    async () => {
      try {
        if (code) {
          const accessToken =
            await getAccessToken()

          const response =
            await fetch(
              '/api/rsi/verification/cancel',
              {
                method: 'POST',
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              },
            )

          const data =
            await response.json()

          if (!response.ok) {
            throw new Error(
              data.error ||
                '重置 RSI 验证失败',
            )
          }
        }

        setCode('')
        setExpiresAt('')
        setHandleInput('')
        setError('')
      } catch (error) {
        console.error(
          'RSI verification reset error:',
          error,
        )

        alert(
          error instanceof Error
            ? error.message
            : '重置 RSI 验证失败，请稍后再试。',
        )
      }
    }

  const handleClose =
    async () => {
      /*
       * 关闭窗口不取消服务器端仍有效的验证码。
       * 用户重新打开时可以继续验证。
       */
      setError('')
      onClose()
    }

  return (
    <div
      className="fixed inset-0 z-150 flex items-center justify-center bg-black/25 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          void handleClose()
        }
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-6 text-neutral-950 shadow-2xl dark:border-white/10 dark:bg-[#37332f] dark:text-[#eee9e3]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[0.65rem] tracking-[0.22em] text-primary">
              RSI VERIFICATION
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              绑定 Star Citizen Handle
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              通过 RSI
              公开个人主页验证该
              Handle 确实属于你。
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void handleClose()
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-sm text-muted-foreground transition-colors hover:bg-muted dark:border-white/10 dark:hover:bg-white/8"
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        {!code ? (
          <>
            <label className="mt-6 block">
              <span className="text-sm font-medium">
                Star Citizen Handle
              </span>

              <input
                value={handleInput}
                onChange={(event) =>
                  setHandleInput(
                    event.target.value,
                  )
                }
                placeholder="例如 GuMieHaoRen"
                autoComplete="off"
                className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary dark:border-white/10 dark:bg-[#302d29] dark:text-[#eee9e3] dark:placeholder:text-white/35"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                void handleStart()
              }}
              disabled={starting}
              className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {starting
                ? '正在创建验证...'
                : currentHandle
                  ? '开始重新认证'
                  : '开始验证'}
            </button>
          </>
        ) : (
          <div className="mt-6">
            <div className="rounded-2xl border border-border bg-muted/40 p-5 dark:border-white/8 dark:bg-[#302d29]">
              <p className="text-xs font-medium text-muted-foreground">
                你正在验证
              </p>

              <p className="mt-1 text-lg font-semibold">
                {handleInput.trim()}
              </p>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              请将下面这段验证码临时添加到你的
              RSI Profile Bio 中：
            </p>

            <div className="mt-3 select-all rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-center font-mono text-lg font-semibold tracking-wider text-primary">
              {code}
            </div>

            <div className="mt-5 rounded-2xl border border-border p-4 text-sm leading-7 text-muted-foreground dark:border-white/8">
              <p>
                添加并保存 Bio
                后，回到这里进行验证。验证成功后即可删除
                Bio 中的验证码。
              </p>

              <p className="mt-2 font-medium text-foreground">
                {timeLeft > 0 ? (
                  <>
                    验证码剩余有效时间：
                    {String(
                      Math.floor(
                        timeLeft / 60,
                      ),
                    ).padStart(
                      2,
                      '0',
                    )}
                    :
                    {String(
                      timeLeft % 60,
                    ).padStart(
                      2,
                      '0',
                    )}
                  </>
                ) : (
                  '验证码已过期'
                )}
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
                {error}

                <p className="mt-1 text-xs opacity-80">
                  验证失败不会使验证码失效。请确认
                  RSI Bio
                  已保存，稍等片刻后可以再次验证。
                </p>
              </div>
            )}

            {timeLeft > 0 ? (
              <button
                type="button"
                onClick={() => {
                  void handleVerify()
                }}
                disabled={verifying}
                className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verifying
                  ? '正在验证...'
                  : '我已添加，开始验证'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  void handleReset()
                }}
                className="mt-6 w-full rounded-xl border border-border bg-muted px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10"
              >
                验证码已过期 · 重新开始
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                void handleReset()
              }}
              className="mt-3 w-full rounded-xl px-5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← 修改 Handle
            </button>
          </div>
        )}
      </div>
    </div>
  )
}