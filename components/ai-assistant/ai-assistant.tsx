'use client'

import {
  Bot,
  Send,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
} from 'react'

import {
  getSupabaseBrowser,
} from '@/lib/supabase-browser'

export function AiAssistant() {
  const [open, setOpen] =
    useState(false)

  const [input, setInput] =
    useState('')

  const [
    loggedIn,
    setLoggedIn,
  ] = useState<boolean | null>(
    null,
  )

  useEffect(() => {
    const supabase =
      getSupabaseBrowser()

    const checkSession =
      async () => {
        const {
          data: { session },
        } =
          await supabase.auth.getSession()

        setLoggedIn(
          Boolean(session?.user),
        )
      }

    void checkSession()

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setLoggedIn(
            Boolean(session?.user),
          )
        },
      )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const requireLogin = () => {
    if (loggedIn === false) {
      window.alert(
        '请先登录星际酒馆官网后使用酒馆智能助手。',
      )

      return false
    }

    return loggedIn === true
  }

  return (
    <>
      {/* 右下角悬浮按钮 */}
      {!open && (
        <button
          type="button"
          onClick={() =>
            setOpen(true)
          }
          aria-label="打开酒馆智能助手"
          className="
            fixed
            bottom-6
            right-6
            z-90
            flex
            size-14
            items-center
            justify-center
            rounded-full
            border
            border-black/10
            bg-[#a66700]
            text-white
            shadow-[0_10px_35px_rgba(0,0,0,0.22)]
            transition-all
            duration-200
            hover:-translate-y-1
            hover:scale-105
            hover:bg-[#8f5900]
            dark:border-white/10
          "
        >
          <Bot
            className="size-6"
            strokeWidth={1.8}
          />
        </button>
      )}

      {/* 聊天窗口 */}
      {open && (
        <div
          className="
            fixed
            bottom-5
            right-5
            z-90
            flex
            h-[min(620px,calc(100dvh-40px))]
            w-[calc(100vw-40px)]
            max-w-100
            flex-col
            overflow-hidden
            rounded-3xl
            border
            border-black/10
            bg-white
            shadow-[0_20px_70px_rgba(0,0,0,0.28)]
            dark:border-white/10
            dark:bg-[#37332f]
          "
        >
          {/* Header */}
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-black/8
              px-5
              py-4
              dark:border-white/8
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  size-10
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  bg-[#a66700]
                  text-white
                "
              >
                <Bot
                  className="size-5"
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <div className="text-sm font-semibold text-foreground">
                  酒馆智能助手
                </div>

                <div className="mt-0.5 text-xs text-muted-foreground">
                  Chris Robots · 小萝卜
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
              aria-label="关闭酒馆智能助手"
              className="
                flex
                size-9
                items-center
                justify-center
                rounded-full
                text-muted-foreground
                transition-colors
                hover:bg-black/5
                hover:text-foreground
                dark:hover:bg-white/10
              "
            >
              <X
                className="size-5"
                strokeWidth={1.7}
              />
            </button>
          </div>

          {/* 对话区域 */}
          <div
            className="
              min-h-0
              flex-1
              overflow-y-auto
              bg-[#faf9f7]
              px-4
              py-5
              dark:bg-[#302d29]
            "
          >
            <div className="flex items-start gap-2.5">
              <div
                className="
                  flex
                  size-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#a66700]
                  text-white
                "
              >
                <Bot
                  className="size-4"
                  strokeWidth={1.8}
                />
              </div>

              <div
                className="
                  max-w-[82%]
                  rounded-2xl
                  rounded-tl-md
                  bg-white
                  px-4
                  py-3
                  text-sm
                  leading-6
                  text-foreground
                  shadow-sm
                  dark:bg-[#37332f]
                "
              >
                <p>
                  你好！我是酒馆智能助手
                  <strong>
                    {' '}Chris Robots
                  </strong>
                  。
                </p>

                <p className="mt-2">
                  如果不习惯叫英文名，也可以叫我的中文名
                  <strong>
                    {' '}小萝卜
                  </strong>
                  。
                </p>

                <p className="mt-2">
                  有什么关于星际酒馆、官网功能或
                  Star Citizen 的问题，都可以问我。
                </p>
              </div>
            </div>
          </div>

          {/* 每日次数 */}
          <div
            className="
              border-t
              border-black/8
              px-4
              pt-3
              text-right
              text-[11px]
              text-muted-foreground
              dark:border-white/8
            "
          >
            {loggedIn
              ? '今日剩余 20 / 20 次'
              : '登录后即可使用'}
          </div>

          {/* 输入框 */}
          <div className="px-4 pb-4 pt-2">
            <div
              className="
                flex
                items-end
                gap-2
                rounded-2xl
                border
                border-black/10
                bg-white
                p-2
                transition-colors
                focus-within:border-[#a66700]/60
                dark:border-white/10
                dark:bg-[#2b2825]
              "
            >
              <textarea
                value={input}
                maxLength={500}
                rows={1}
                placeholder={
                  loggedIn === false
                    ? '登录后与小萝卜聊天...'
                    : '问问小萝卜...'
                }
                onFocus={(event) => {
                  if (!requireLogin()) {
                    event.currentTarget.blur()
                  }
                }}
                onChange={(event) => {
                  if (!requireLogin()) {
                    return
                  }

                  setInput(
                    event.target.value,
                  )
                }}
                className="
                  max-h-28
                  min-h-10
                  flex-1
                  resize-none
                  bg-transparent
                  px-2
                  py-2
                  text-sm
                  leading-5
                  text-foreground
                  outline-none
                  placeholder:text-muted-foreground
                "
              />

              <button
                type="button"
                disabled={
                  !loggedIn ||
                  !input.trim()
                }
                className="
                  flex
                  size-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#a66700]
                  text-white
                  transition-colors
                  hover:bg-[#8f5900]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <Send
                  className="size-4"
                  strokeWidth={1.8}
                />
              </button>
            </div>

            <div className="mt-2 text-center text-[10px] text-muted-foreground">
              AI 生成内容可能存在错误，请注意核实重要信息。
            </div>
          </div>
        </div>
      )}
    </>
  )
}