'use client'

import { useEffect, useState } from 'react'
import {
  Bot,
  Check,
  Gamepad2,
  LogIn,
  MessageSquareMore,
  ShoppingBag,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react'

import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { RsiVerificationModal } from '@/components/rsi-verification-modal'

type Profile = {
  star_citizen_handle: string | null
  rsi_verified: boolean
  rsi_verification_handle: string | null
  rsi_verification_code: string | null
  rsi_verification_expires_at: string | null
}

const SESSION_DISMISSED_KEY =
  'starclub-home-welcome-dismissed'

export function HomeWelcomeDialog() {
  const [loading, setLoading] =
    useState(true)

  const [loggedIn, setLoggedIn] =
    useState(false)

  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [open, setOpen] =
    useState(false)

  const [
    rsiVerificationOpen,
    setRsiVerificationOpen,
  ] = useState(false)

  useEffect(() => {
    const loadAccountState =
      async () => {
        try {
          const supabase =
            getSupabaseBrowser()

          const {
            data: { session },
          } =
            await supabase.auth.getSession()

          const user =
            session?.user ?? null

          setLoggedIn(Boolean(user))

          if (!user) {
            const dismissed =
              sessionStorage.getItem(
                SESSION_DISMISSED_KEY,
              )

            if (!dismissed) {
              setOpen(true)
            }

            return
          }

          const {
            data,
            error,
          } = await supabase
            .from('profiles')
            .select(`
              star_citizen_handle,
              rsi_verified,
              rsi_verification_handle,
              rsi_verification_code,
              rsi_verification_expires_at
            `)
            .eq('id', user.id)
            .maybeSingle()

          if (error) {
            console.error(
              'Failed to load homepage account state:',
              error,
            )

            return
          }

          setProfile(data)

          /*
           * 已登录 + 已完成 RSI 认证：
           * 不显示账号引导。
           */
          if (
            data?.rsi_verified === true
          ) {
            return
          }

          /*
          * 已登录但未完成 RSI 认证：
          * 登录是新的账号设置阶段，
          * 因此即使登录前点过“稍后提醒”，
          * 登录成功回到首页后仍然提醒一次。
          */
          sessionStorage.removeItem(
            SESSION_DISMISSED_KEY,
          )

          setOpen(true)
        } catch (error) {
          console.error(
            'Failed to initialize homepage welcome dialog:',
            error,
          )
        } finally {
          setLoading(false)
        }
      }

    void loadAccountState()
  }, [])

  const handleDismiss = () => {
    sessionStorage.setItem(
      SESSION_DISMISSED_KEY,
      '1',
    )

    setOpen(false)
  }

    const handleDiscordLogin =
      async () => {
        try {
          const supabase =
            getSupabaseBrowser()

          const { error } =
            await supabase.auth.signInWithOAuth({
              provider: 'discord',
              options: {
                redirectTo:
                  `${window.location.origin}/`,
                scopes: 'identify email',
              },
            })

          if (error) {
            throw error
          }
        } catch (error) {
          console.error(
            'Discord login failed:',
            error,
          )

          alert(
            'Discord 登录失败，请稍后再试。',
          )
        }
      }

  if (loading) {
    return null
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-120 flex items-center justify-center bg-black/25 px-4 py-6 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[82vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#37332f]">
            {/* Header */}
            <div className="border-b border-border px-6 py-5 dark:border-white/8 sm:px-7">
              <div className="flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-[#a66700]">
                <Sparkles className="size-4" />

                STARCLUB UPDATE
              </div>

              <h2 className="mt-2.5 text-2xl font-semibold tracking-tight sm:text-[1.7rem]">
                欢迎来到星际酒馆
              </h2>

              <p className="mt-1.5 max-w-xl text-sm leading-5 text-muted-foreground">
                星际酒馆官网正在持续更新。登录并完成
                Star Citizen 游戏 ID
                认证，可以完整使用社区与玩家功能。
              </p>
            </div>

            {/* Account status */}
            <div className="px-6 pt-5 sm:px-7">
              <div className="rounded-2xl border border-border bg-[#f7f7f5] p-4.5 dark:border-white/8 dark:bg-[#302d29]">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground">
                  ACCOUNT STATUS
                </p>

                <div className="mt-3 space-y-2.5">
                  {/* Discord */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-white dark:bg-white/8">
                        {loggedIn ? (
                          <Check className="size-4 text-emerald-500" />
                        ) : (
                          <LogIn className="size-4 text-muted-foreground" />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          Discord 账号
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {loggedIn
                            ? '已登录'
                            : '尚未登录'}
                        </p>
                      </div>
                    </div>

                    {loggedIn && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        已完成
                      </span>
                    )}
                  </div>

                  {/* RSI */}
                  <div className="flex items-center justify-between gap-4 border-t border-border pt-3 dark:border-white/8">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-white dark:bg-white/8">
                        {profile?.rsi_verified ? (
                          <Check className="size-4 text-emerald-500" />
                        ) : (
                          <Gamepad2 className="size-4 text-muted-foreground" />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          Star Citizen 游戏 ID
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {!loggedIn
                            ? '登录后进行认证'
                            : profile?.rsi_verified
                              ? profile.star_citizen_handle ||
                                '已认证'
                              : '尚未认证'}
                        </p>
                      </div>
                    </div>

                    {profile?.rsi_verified && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        已完成
                      </span>
                    )}
                  </div>
                </div>

                {/* Main action */}
                {!loggedIn ? (
                  <button
                    type="button"
                    onClick={() => {
                      void handleDiscordLogin()
                    }}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <LogIn className="size-4" />
                    使用 Discord 登录
                  </button>
                ) : !profile?.rsi_verified ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      setRsiVerificationOpen(
                        true,
                      )
                    }}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-[#2b2825] dark:hover:bg-white/90"
                  >
                    <UserRoundCheck className="size-4" />
                    认证游戏 ID
                  </button>
                ) : null}
              </div>
            </div>

            {/* Updates */}
            <div className="px-6 py-5 sm:px-7">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  网站近期更新
                </h3>

                <span className="text-[11px] text-muted-foreground">
                  2026 · SEPTEMBER
                </span>
              </div>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <UpdateItem
                  icon={ShoppingBag}
                  title="玩家市场"
                  description="发布与浏览 WTS / WTB / WTT 玩家交易。"
                />

                <UpdateItem
                  icon={Bot}
                  title="酒馆智能助手"
                  description="小萝卜 AI 助手现已加入网站。"
                />

                <UpdateItem
                  icon={MessageSquareMore}
                  title="社区功能"
                  description="社区动态、表情包与玩家互动持续完善。"
                />

                <UpdateItem
                  icon={UserRoundCheck}
                  title="个人主页"
                  description="个人资料、身份认证与社区身份系统。"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4 dark:border-white/8 sm:px-7">
              <p className="text-xs text-muted-foreground">
                未完成账号设置时，下次访问仍会提醒
              </p>

              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-xl bg-neutral-100 px-5 py-2.5 text-xs font-medium text-neutral-700 transition-all hover:bg-neutral-200 active:scale-[0.97] dark:bg-white/8 dark:text-white/80 dark:hover:bg-white/12"
              >
                稍后提醒
              </button>
            </div>
          </div>
        </div>
      )}

      <RsiVerificationModal
        open={rsiVerificationOpen}
        onClose={() => {
          setRsiVerificationOpen(false)
        }}
        currentHandle={
          profile?.star_citizen_handle
        }
        verificationHandle={
          profile?.rsi_verification_handle
        }
        verificationCode={
          profile?.rsi_verification_code
        }
        verificationExpiresAt={
          profile?.rsi_verification_expires_at
        }
          onVerified={(handle) => {
            setProfile((current) => ({
              ...current,
              star_citizen_handle: handle,
              rsi_verified: true,
              rsi_verification_handle: null,
              rsi_verification_code: null,
              rsi_verification_expires_at: null,
            }))

            sessionStorage.setItem(
              SESSION_DISMISSED_KEY,
              '1',
            )
          }}
      />
    </>
  )
}

function UpdateItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShoppingBag
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border p-3.5 dark:border-white/8">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#a66700]/8">
        <Icon className="size-4 text-[#a66700]" />
      </div>

      <div>
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}