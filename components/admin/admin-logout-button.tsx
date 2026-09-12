'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'

export function AdminLogoutButton() {
  const router = useRouter()

  const [isSigningOut, setIsSigningOut] =
    useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)

    try {
      await fetch(
        '/api/admin/logout',
        {
          method: 'POST',
        },
      )

      router.push(
        '/admin/login',
      )

      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={
        handleSignOut
      }
      disabled={
        isSigningOut
      }
    >
      {isSigningOut
        ? '退出中...'
        : '退出登录'}
    </Button>
  )
}