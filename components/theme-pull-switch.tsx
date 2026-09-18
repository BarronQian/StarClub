'use client'

import {
  useEffect,
  useState,
} from 'react'

export function ThemePullSwitch() {
  const [isDark, setIsDark] =
    useState(false)

  const [pulling, setPulling] =
    useState(false)

  useEffect(() => {
    setIsDark(
      document.documentElement.classList.contains(
        'dark',
      ),
    )
  }, [])

  const toggleTheme = () => {
    if (pulling) return

    setPulling(true)

    /*
     * 绳子先伸长。
     * 到达最低点时切换主题。
     */
    window.setTimeout(() => {
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
    }, 180)

    /*
     * 然后绳子自动缩回原长。
     */
    window.setTimeout(() => {
      setPulling(false)
    }, 420)
  }

  return (
    <div
      className="
        group
        fixed
        left-5
        top-16
        z-40
        sm:left-6
        lg:left-8
        lg:top-20
      "
    >
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
            ? '点击拉绳切换至白天模式'
            : '点击拉绳切换至黑夜模式'
        }
        className="
          relative
          block
          cursor-pointer
          border-0
          bg-transparent
          p-0
          outline-none
        "
      >
        <div className="flex flex-col items-center">

          {/* 绳子 */}
          <div
            className={`
              w-0.75
              bg-linear-to-r
              from-[#725020]
              via-[#d8a84c]
              to-[#684519]
              shadow-[0_0_3px_rgba(0,0,0,0.2)]
              transition-[height]
              duration-300
              ease-[cubic-bezier(.22,1,.36,1)]
              ${
                pulling
                  ? 'h-28'
                  : 'h-18'
              }
            `}
          />

          {/* 拉绳与金属坠之间的小连接环 */}
            <div
              className="
                -mb-0.5
                h-1.25
                w-1.75
                rounded-full
                border
                border-[#8a5a20]
                bg-[#c9933d]
              "
            />

          {/* 金属模式指示器 */}
          <div
            className="
              relative
              -mt-px
              flex
              h-9
              w-4.5
              items-center
              justify-center
              rounded-full
              border
              border-[#8a5a20]
              bg-linear-to-r
              from-[#76501f]
              via-[#e4b75d]
              to-[#76501f]
              shadow-[0_4px_8px_rgba(0,0,0,0.22)]
              transition-shadow
              duration-300
              group-hover:shadow-[0_5px_14px_rgba(191,132,42,0.30)]
            "
          >
            {isDark ? (
              /* Moon */
              <svg
                viewBox="0 0 24 24"
                className="size-4.25 text-[#fff1c7]"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z" />
              </svg>
            ) : (
              /* Sun */
              <svg
                viewBox="0 0 24 24"
                className="size-4.25 text-[#fff4c9]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="3.5"
                  fill="currentColor"
                  stroke="none"
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
            )}

            {/* 金属高光 */}
            <div
              className="
                pointer-events-none
                absolute
                inset-x-1
                top-0.5
                h-px
                bg-white/35
              "
            />
          </div>
        </div>

        {/* Hover Tooltip */}
        <div
          className="
            pointer-events-none
            absolute
            left-11.5
            top-10
            w-max
            -translate-x-1
            rounded-xl
            border
            border-border
            bg-popover/95
            px-3
            py-2
            text-left
            opacity-0
            shadow-xl
            backdrop-blur-md
            transition-all
            duration-200
            group-hover:translate-x-0
            group-hover:opacity-100
          "
        >
          <div className="text-xs font-medium text-foreground">
            {isDark
              ? '当前：黑夜模式'
              : '当前：白天模式'}
          </div>

          <div className="mt-1 text-[10px] text-muted-foreground">
            {isDark
              ? '点击拉绳切换至白天模式'
              : '点击拉绳切换至黑夜模式'}
          </div>

          {/* Tooltip 箭头 */}
          <div
            className="
              absolute
              -left-1.5
              top-3
              size-3
              rotate-45
              border-b
              border-l
              border-border
              bg-popover
            "
          />
        </div>
      </button>
    </div>
  )
}