'use client'

import {
  useEffect,
  useState,
} from 'react'

export function MobileThemeSwitch() {
  const [isDark, setIsDark] =
    useState(false)

  useEffect(() => {
    setIsDark(
      document.documentElement.classList.contains(
        'dark',
      ),
    )
  }, [])

  const toggleTheme = () => {
    const nextDark = !isDark

    document.documentElement.classList.toggle(
      'dark',
      nextDark,
    )

    localStorage.setItem(
      'starclub-theme',
      nextDark
        ? 'dark'
        : 'light',
    )

    setIsDark(nextDark)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isDark
          ? '切换至白天模式'
          : '切换至黑夜模式'
      }
      title={
        isDark
          ? '白天模式'
          : '黑夜模式'
      }
      className="
        grid
        size-10
        shrink-0
        place-items-center
        rounded-full
        border
        border-border
        bg-background
        text-foreground
        transition-all
        duration-200
        hover:bg-muted
        active:scale-95
        lg:hidden
      "
    >
      {isDark ? (
        <svg
          viewBox="0 0 24 24"
          className="size-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {/* 太阳 */}
          <circle
            cx="12"
            cy="12"
            r="3.5"
          />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="size-4.5"
          fill="currentColor"
          aria-hidden="true"
        >
          {/* 月亮 */}
          <path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z" />
        </svg>
      )}
    </button>
  )
}