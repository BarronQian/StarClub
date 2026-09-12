'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Bookmark,
  ChevronRight,
  Heart,
  LogOut,
  MessageCircle,
  Settings,
  Ship,
  UserRound,
  X,
  FileText,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { AuthLoginButton } from '@/components/auth-login-button'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

export function HeaderUserAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  // 账户侧栏打开时锁死背景页面滚动
  useEffect(() => {
    if (!open) return

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow =
      document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow =
        previousHtmlOverflow
    }
  }, [open])

  // 加载 Discord 登录 Session
  useEffect(() => {
    const supabase = getSupabaseBrowser()

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setUser(session?.user ?? null)
      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="h-9 w-20 animate-pulse rounded-full bg-muted" />
    )
  }

  if (!user) {
    return <AuthLoginButton />
  }

  const avatar =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    '/placeholder-user.jpg'

  const username =
    user.user_metadata?.preferred_username ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'StarClub User'

  const handleLogout = async () => {
    const supabase = getSupabaseBrowser()

    await supabase.auth.signOut()

    setOpen(false)
  }

  const menuItems = [
    {
      label: '个人主页',
      icon: UserRound,
      href: '/profile',
    },
    {
      label: '我的点赞',
      icon: Heart,
      href: '/profile/likes',
    },
    {
      label: '我的收藏',
      icon: Bookmark,
      href: '/profile/favorites',
    },
    {
      label: '我的评论',
      icon: MessageCircle,
      href: '/profile/comments',
    },
    {
      label: '我的帖子',
      icon: FileText,
      href: '/profile/posts',
    },
    {
      label: '我的舰队',
      icon: Ship,
      href: '/profile/fleet',
    },
  ]

  return (
    <>
      {/* Header 用户按钮 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2.5 rounded-full border border-[#d7b47a]/60 bg-white px-2 py-1.5 transition-all hover:border-[#b87300] hover:shadow-sm"
      >
        <div className="relative size-8 overflow-hidden rounded-full border border-border bg-muted">
          <Image
            src={avatar}
            alt={`${username} 头像`}
            fill
            sizes="32px"
            className="object-cover"
          />
        </div>

        <span className="hidden max-w-32 truncate text-sm font-medium text-foreground lg:block">
          {username}
        </span>

        <span className="pr-1 text-[10px] text-muted-foreground">
          ▾
        </span>
      </button>

      {/* 背景遮罩 */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-90 bg-black/20 transition-opacity duration-200 ${
          open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      />

      {/* 右侧账户栏 */}
      <aside
        className={`fixed right-0 top-0 z-100 flex h-dvh w-90 max-w-[92vw] flex-col overscroll-contain border-l border-black/10 bg-[#faf9f7] shadow-xl transition-transform duration-200 ease-out will-change-transform ${
          open
            ? 'translate-x-0'
            : 'translate-x-full'
        }`}
      >
        {/* 顶部 */}
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-[#a66a12]">
              STARCLUB ACCOUNT
            </p>

            <p className="mt-1 text-sm font-medium">
              酒馆账户
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            aria-label="关闭账户栏"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 用户资料 */}
        <div className="px-6 py-7">
          <div className="flex items-center gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
              <Image
                src={avatar}
                alt={`${username} 头像`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold">
                {username}
              </h2>

              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-green-500" />
                已连接 Discord
              </div>
            </div>
          </div>
        </div>

        {/* 菜单 */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3">
          <div className="border-t border-black/10 py-3">
            {menuItems.map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors hover:bg-[#b87300]/[0.07]"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-black/[0.035]">
                    <Icon className="size-4 text-[#8d5a10]" />
                  </div>

                  <span className="flex-1">
                    {item.label}
                  </span>

                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              )
            })}
          </div>

          <div className="border-t border-black/10 py-3">
            <Link
              href="/profile/settings"
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors hover:bg-[#b87300]/[0.07]"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-black/[0.035]">
                <Settings className="size-4 text-[#8d5a10]" />
              </div>

              <span className="flex-1">
                账号设置
              </span>

              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors hover:bg-red-500/6"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-red-500/6">
                <LogOut className="size-4 text-red-500" />
              </div>

              <span className="flex-1 text-left">
                退出登录
              </span>
            </button>
          </div>
        </div>

        {/* 底部 */}
        <div className="border-t border-black/10 px-6 py-5">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-green-500" />
            Discord Authentication
          </div>

          <p className="mt-1 text-[10px] text-muted-foreground/70">
            STARCLUB · 星际酒馆
          </p>
        </div>
      </aside>
    </>
  )
}