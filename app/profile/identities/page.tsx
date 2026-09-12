'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { DISCORD_ROLE_IDENTITIES } from '@/lib/discord-identities'

export default function IdentitiesPage() {

const [discordRoles, setDiscordRoles] = useState<string[]>([])
const [loadingRoles, setLoadingRoles] = useState(true)
const [activeIdentityId, setActiveIdentityId] = useState<string | null>(null)
const router = useRouter()

useEffect(() => {
  const loadDiscordRoles = async () => {
    try {
      const supabase = getSupabaseBrowser()

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setLoadingRoles(false)
        return
      }

      const response = await fetch('/api/discord/membership', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setDiscordRoles([])
        setLoadingRoles(false)
        return
      }

      setDiscordRoles(
        Array.isArray(data.roles) ? data.roles : []
      )
    } catch (error) {
      console.error('Failed to load Discord roles:', error)
      setDiscordRoles([])
    } finally {
      setLoadingRoles(false)
    }
  }

  loadDiscordRoles()
}, [])

useEffect(() => {
  const supabase = getSupabaseBrowser()

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (
        event === 'SIGNED_OUT' ||
        !session
      ) {
        router.replace('/')
        router.refresh()
      }
    }
  )

  return () => {
    subscription.unsubscribe()
  }
}, [router])

    const unlockedCount = DISCORD_ROLE_IDENTITIES.filter((identity) =>
      discordRoles.includes(identity.id)
    ).length

  return (
        <main
          className="mx-auto w-full max-w-7xl px-5 pb-16 pt-24 lg:px-10 lg:pt-28"
          onClick={() => setActiveIdentityId(null)}
        >
      <div className="mb-10">
        <Link
          href="/profile"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← 返回个人主页
        </Link>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          酒馆身份图鉴
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            查看星际酒馆所有特殊身份与荣誉名牌。
          </span>

          <span className="font-medium text-[#a66700]">
            已获得 {unlockedCount} / {DISCORD_ROLE_IDENTITIES.length}
          </span>
        </div>

      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-12 px-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:px-8">
{DISCORD_ROLE_IDENTITIES.map((identity) => {
  const unlocked = discordRoles.includes(identity.id)

  return (
      <div
        key={identity.id}
        className="group relative flex cursor-pointer flex-col items-center text-center"
        onClick={(event) => {
          event.stopPropagation()

          setActiveIdentityId((current) =>
            current === identity.id ? null : identity.id
          )
        }}
      >
      {/* Hover 信息窗口 */}
        <div
          className={[
            `
              pointer-events-none absolute bottom-[calc(100%+12px)] left-1/2 z-30
              w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2
              rounded-2xl border border-white/60
              bg-white/75 p-4 text-left
              shadow-[0_16px_50px_rgba(0,0,0,0.14)]
              backdrop-blur-xl
              transition-all duration-200 ease-out
              group-hover:translate-y-0 group-hover:opacity-100
            `,
            activeIdentityId === identity.id
              ? 'translate-y-0 opacity-100'
              : 'translate-y-2 opacity-0',
          ].join(' ')}
        >
        {/* 分类 */}
        <p className="text-[10px] font-semibold tracking-[0.12em] text-[#a66700]">
          {identity.category}
        </p>

        {/* 身份名称 */}
        <p className="mt-1.5 text-sm font-semibold text-neutral-900">
          {identity.name}
        </p>

        {/* 描述 / 获取方式 */}
        <p className="mt-2 text-xs leading-relaxed text-neutral-600">
          {identity.description}
        </p>

        {/* 小箭头 */}
        <div
          className="
            absolute -bottom-1.5 left-1/2
            h-3 w-3 -translate-x-1/2 rotate-45
            border-b border-r border-white/60
            bg-white/75
          "
        />
      </div>

      {/* Logo */}
      <div
        className={[
          'flex h-20 w-full items-center justify-center transition-all duration-200',
          unlocked
            ? 'opacity-100'
            : 'opacity-30 grayscale',
        ].join(' ')}
      >
        <img
          src={identity.logo}
          alt={identity.name}
          className={[
            'max-h-16 max-w-16 object-contain',
            'drop-shadow-[0_2px_2px_rgba(0,0,0,0.20)]',
            'transition-all duration-200',
            'group-hover:-translate-y-1 group-hover:scale-105',
            'group-hover:drop-shadow-[0_5px_5px_rgba(0,0,0,0.24)]',
          ].join(' ')}
        />
      </div>

      {/* 名称 */}
      <p
        className={[
          'mt-2 text-sm font-medium leading-snug transition-colors duration-200',
          unlocked
            ? 'text-foreground'
            : 'text-muted-foreground',
        ].join(' ')}
      >
        {identity.name}
      </p>
    </div>
  )
})}
      </div>
    </main>
  )
}