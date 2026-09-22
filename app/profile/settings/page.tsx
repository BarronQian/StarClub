'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { TIMEZONES, formatTimezone } from '@/lib/timezones'
import { RsiVerificationModal } from '@/components/rsi-verification-modal'
import {
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Gamepad2,
  LogOut,
  ShieldCheck,
} from 'lucide-react'

type Profile = {
  username: string | null
  display_name: string | null
  avatar_url: string | null
  star_citizen_handle: string | null
  rsi_verified: boolean
  timezone: string | null
  bio: string | null
}

export default function ProfileSettingsPage() {
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const [editTimezone, setEditTimezone] = useState('')
  const [editBio, setEditBio] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const [rsiVerificationOpen, setRsiVerificationOpen] =
  useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = getSupabaseBrowser()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        setUser(user)

        const { data, error } = await supabase
          .from('profiles')
          .select(`
            username,
            display_name,
            avatar_url,
            star_citizen_handle,
            rsi_verified,
            timezone,
            bio
          `)
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Failed to load profile:', error)
          return
        }

        setProfile(data)

        setEditTimezone(data?.timezone || '')
        setEditBio(data?.bio || '')
      } catch (error) {
        console.error('Failed to load account settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.replace('/')
          router.refresh()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleSaveProfile = async () => {
    if (!user || saving) return

    try {
      setSaving(true)
      setSaveMessage('')

      const supabase = getSupabaseBrowser()

      const updates = {
        timezone: editTimezone || null,
        bio: editBio.trim() || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        console.error('Failed to save profile:', error)
        setSaveMessage('保存失败，请稍后重试。')
        return
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              timezone: updates.timezone,
              bio: updates.bio,
            }
          : current
      )

      setSaveMessage('保存成功')
    } catch (error) {
      console.error('Failed to save profile:', error)
      setSaveMessage('保存失败，请稍后重试。')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowser()

    await supabase.auth.signOut()

    window.location.href = '/'
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-16 pt-24 lg:px-10 lg:pt-28">
      {/* 返回 */}
      <Link
        href="/profile"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 返回个人主页
      </Link>

      {/* 标题 */}
      <div className="mb-10 mt-5">
        <h1 className="text-3xl font-semibold tracking-tight">
          账号设置
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          管理你的个人资料、Discord 账号与 Star Citizen 身份。
        </p>
      </div>

      <div className="space-y-6">
        {/* Discord */}
        <section className="overflow-hidden rounded-2xl border border-border bg-white dark:border-white/8 dark:bg-[#37332f]">
          <div className="flex items-center gap-3 border-b border-border px-6 py-5">
            <CircleUserRound className="size-5 text-[#a66700]" />

            <div>
              <h2 className="font-medium">
                Discord 账号
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                用于登录星际酒馆并同步社区身份。
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-5 px-6 py-5">
            <div className="flex min-w-0 items-center gap-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={
                    profile.display_name ||
                    profile.username ||
                    'Discord avatar'
                  }
                  className="size-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10">
                  <CircleUserRound className="size-5 text-muted-foreground" />
                </div>
              )}

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  当前 Discord 账号
                </p>

                <p className="mt-1 truncate text-sm font-medium">
                  {loading
                    ? '读取中...'
                    : profile?.display_name ||
                      profile?.username ||
                      user?.user_metadata?.full_name ||
                      user?.user_metadata?.name ||
                      'Discord 用户'}
                </p>

                {profile?.username &&
                  profile?.display_name &&
                  profile.username !== profile.display_name && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      @{profile.username}
                    </p>
                  )}
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              已连接
            </span>
          </div>
        </section>

        {/* RSI */}
        <section className="overflow-hidden rounded-2xl border border-border bg-white dark:border-white/8 dark:bg-[#37332f]">
          <div className="flex items-center gap-3 border-b border-border px-6 py-5">
            <Gamepad2 className="size-5 text-[#a66700]" />

            <div>
              <h2 className="font-medium">
                Star Citizen 身份
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                管理经过验证的 RSI Handle。
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-5 px-6 py-5">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                RSI Handle
              </p>

              <p className="mt-1 text-sm font-medium">
                {loading
                  ? '读取中...'
                  : profile?.star_citizen_handle || '尚未验证'}
              </p>
            </div>

              <button
                type="button"
                onClick={() => setRsiVerificationOpen(true)}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#b87300] transition-colors hover:text-[#925b00] dark:text-[#e3ad5c] dark:hover:text-[#f0c47d]"
              >
                {profile?.rsi_verified ? '重新认证' : '立即认证'}

                <ChevronRight className="size-4" />
              </button>
          </div>

          <div className="flex items-center justify-between gap-5 border-t border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-muted-foreground" />

              <div>
                <p className="text-sm font-medium">
                  RSI 身份认证
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  验证 RSI Citizen Profile 的所有权。
                </p>
              </div>
            </div>

            {loading ? (
              <span className="text-xs text-muted-foreground">
                读取中...
              </span>
            ) : profile?.rsi_verified ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#a66700]">
                ✓ 已验证
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                未验证
              </span>
            )}
          </div>
        </section>

        {/* 个人资料 */}
        <section className="overflow-hidden rounded-2xl border border-border bg-white dark:border-white/8 dark:bg-[#37332f]">
          <div className="flex items-center gap-3 border-b border-border px-6 py-5">
            <Clock3 className="size-5 text-[#a66700]" />

            <div>
              <h2 className="font-medium">
                个人资料
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                这些信息会显示在你的酒馆个人主页。
              </p>
            </div>
          </div>

          <div className="space-y-6 p-6">
            {/* 时区 */}
            <div>
              <label className="text-sm font-medium">
                时区
              </label>

              <p className="mt-1 text-xs text-muted-foreground">
                选择你常驻使用的 UTC 时区。
              </p>

              <div className="relative mt-3">
                <select
                  value={editTimezone}
                  onChange={(event) => {
                    setEditTimezone(event.target.value)
                    setSaveMessage('')
                  }}
                  className="w-full appearance-none rounded-xl border border-border bg-white px-4 py-3 pr-11 text-sm text-foreground outline-none transition-all focus:border-[#b87300]/50 focus:ring-4 focus:ring-[#b87300]/5 dark:border-white/10 dark:bg-[#302d29] dark:scheme-dark"
                >
                  <option value="">
                    未设置时区
                  </option>

                  <option value="">
                    选择时区
                  </option>

                  {TIMEZONES.map((timezone) => (
                    <option
                      key={timezone}
                      value={timezone}
                    >
                      {formatTimezone(timezone)}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* 个人简介 */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  个人简介
                </label>

                <span className="text-xs text-muted-foreground">
                  {editBio.length} / 200
                </span>
              </div>

              <textarea
                value={editBio}
                onChange={(event) => {
                  setEditBio(
                    event.target.value.slice(0, 200)
                  )
                  setSaveMessage('')
                }}
                placeholder="简单介绍一下自己..."
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-border bg-white px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-[#b87300]/50 focus:ring-4 focus:ring-[#b87300]/5 dark:border-white/10 dark:bg-[#302d29]"
              />
            </div>

            {/* 保存 */}
            <div className="flex items-center justify-end gap-4 border-t border-border pt-5">
              {saveMessage && (
                <span
                  className={[
                    'text-xs',
                    saveMessage === '保存成功'
                      ? 'text-[#a66700]'
                      : 'text-red-500',
                  ].join(' ')}
                >
                  {saveMessage}
                </span>
              )}

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving || loading}
                className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#2b2825] dark:hover:bg-white/90"
              >
                {saving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        </section>

        {/* 账号操作 */}
        <section className="overflow-hidden rounded-2xl border border-border bg-white dark:border-white/8 dark:bg-[#37332f]">
          <div className="px-6 py-5">
            <h2 className="font-medium">
              账号
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              管理当前登录状态。
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-between border-t border-border px-6 py-5 text-left transition-colors hover:bg-neutral-50 dark:border-white/8 dark:hover:bg-white/4"
          >
            <div className="flex items-center gap-3">
              <LogOut className="size-4 text-red-500" />

              <span className="text-sm font-medium text-red-600">
                退出登录
              </span>
            </div>

            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </section>
      </div>

      <RsiVerificationModal
        open={rsiVerificationOpen}
        onClose={() => setRsiVerificationOpen(false)}
        currentHandle={profile?.star_citizen_handle}
        onVerified={(handle) => {
          setProfile((current) =>
            current
              ? {
                  ...current,
                  star_citizen_handle: handle,
                  rsi_verified: true,
                }
              : current,
          )
        }}
      />
    </main>
  )
}