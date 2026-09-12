'use client'

import {
  useState,
  type FormEvent,
} from 'react'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminLoginPage() {
  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [error, setError] =
    useState<string | null>(null)

  const [isLoading, setIsLoading] =
    useState(false)

  const router = useRouter()

  const handleLogin = async (
    e: FormEvent,
  ) => {
    e.preventDefault()

    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch(
        '/api/admin/login',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      )

      const data = await res
        .json()
        .catch(() => ({}))

      if (!res.ok) {
        throw new Error(
          data.error ??
            '登录失败',
        )
      }

      router.push(
        '/admin/gallery',
      )

      router.refresh()
    } catch (err) {
      console.error(
        '[v0] Admin login error:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : '登录失败，请重试',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center bg-background p-6">
      <div
        aria-hidden="true"
        className="hud-grid absolute inset-0 -z-10 opacity-70"
      />

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="font-display text-[0.65rem] tracking-[0.4em] text-primary">
            STARCLUB / ADMIN
          </span>

          <h1 className="font-display text-xl tracking-tight text-foreground">
            星际酒馆后台管理
          </h1>

          <p className="text-xs text-muted-foreground">
            管理员身份验证
          </p>
        </div>

        <div className="corner-cut border border-border bg-card p-6">
          <form
            onSubmit={
              handleLogin
            }
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="email"
                className="text-xs text-muted-foreground"
              >
                邮箱
              </Label>

              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@starclub.example"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value,
                  )
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="password"
                className="text-xs text-muted-foreground"
              >
                密码
              </Label>

              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value,
                  )
                }
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={
                isLoading
              }
            >
              {isLoading
                ? '登录中...'
                : '登录后台'}
            </Button>
          </form>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            仅获得 StarClub
            后台管理权限的账号可以登录。
          </p>
        </div>
      </div>
    </div>
  )
}
