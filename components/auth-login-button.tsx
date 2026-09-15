'use client'

import { useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

type AuthLoginButtonProps = {
  variant?: 'default' | 'text'
  redirectTo?: string
}

export function AuthLoginButton({
  variant = 'default',
  redirectTo = '/',
}: AuthLoginButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDiscordLogin = async () => {
    const supabase = getSupabaseBrowser()

    try {
      setLoading(true)

      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: 'discord',
          options: {
          redirectTo:
            `${window.location.origin}${redirectTo}`,
            scopes: 'identify email',
          },
        })

      if (error) {
        console.error(
          'Discord login error:',
          error,
        )
        alert(
          'Discord 登录失败，请稍后再试。',
        )
        setLoading(false)
      }
    } catch (error) {
      console.error(
        'Discord login error:',
        error,
      )
      alert(
        'Discord 登录失败，请稍后再试。',
      )
      setLoading(false)
    }
  }

  if (variant === 'text') {
    return (
      <button
        type="button"
        onClick={handleDiscordLogin}
        disabled={loading}
        className="inline-flex border-0 bg-transparent p-0 text-sm font-medium text-[#a66700] underline underline-offset-4 transition-colors hover:text-[#8f5900] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? '正在登录...'
          : '登录'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleDiscordLogin}
      disabled={loading}
      className="pill inline-flex items-center justify-center bg-foreground px-5 py-2.5 font-display text-[0.72rem] tracking-[0.16em] text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading
        ? '正在登录...'
        : '登录'}
    </button>
  )
}