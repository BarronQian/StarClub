'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PAGE_COMPANIONS,
  type PageCompanionConfig,
  type PageCompanionId,
} from '@/lib/page-companion'

type PageCompanionProps = {
  companion?: PageCompanionId
}

export function PageCompanion({
  companion = 'lion',
}: PageCompanionProps) {
  const config: PageCompanionConfig = PAGE_COMPANIONS[companion]
    const getMessageDuration = (text: string) => {
  const baseDuration = config.cycleInterval ?? 5000

  if (text.length <= 40) {
    return baseDuration
  }

  return Math.min(
    baseDuration + (text.length - 40) * 45,
    14000
  )
}

const [messageIndex, setMessageIndex] =
  useState(0)

const message = config.messages[messageIndex]
const isLongMessage = message.length > 90

const showNextMessage = () => {
  if (config.messages.length <= 1) return

  setMessageVisible(false)

  window.setTimeout(() => {
    setMessageIndex((currentIndex) => {
      let nextIndex = currentIndex

      while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * config.messages.length)
      }

      return nextIndex
    })

    setMessageVisible(true)
  }, 220)
}

const [visible, setVisible] = useState(false)
const [bubbleVisible, setBubbleVisible] = useState(false)
const [dismissed, setDismissed] = useState(false)
const [hasEntered, setHasEntered] = useState(false)
const [exiting, setAngryExit] = useState(false)
const [closeAttempt, setCloseAttempt] = useState(0)
const [messageVisible, setMessageVisible] = useState(true)

useEffect(() => {
  if (config.messages.length <= 1) {
    return
  }

  setMessageIndex(
    Math.floor(
      Math.random() *
        config.messages.length,
    ),
  )
}, [companion, config.messages.length])

useEffect(() => {
  const characterTimer = window.setTimeout(() => {
    setHasEntered(true)
    setVisible(true)
  }, 1200)

  const bubbleTimer = window.setTimeout(() => {
    setBubbleVisible(true)
  }, 1600)

  let bubbleHideTimer: number | undefined
  let characterHideTimer: number | undefined

  if (!config.autoCycle) {
    bubbleHideTimer = window.setTimeout(() => {
      setBubbleVisible(false)
    }, 9800)

    characterHideTimer = window.setTimeout(() => {
      setVisible(false)
    }, 10300)
  }

  return () => {
    window.clearTimeout(characterTimer)
    window.clearTimeout(bubbleTimer)

    if (bubbleHideTimer) {
      window.clearTimeout(bubbleHideTimer)
    }

    if (characterHideTimer) {
      window.clearTimeout(characterHideTimer)
    }
  }
}, [config.autoCycle])

useEffect(() => {
  if (!config.autoCycle || !bubbleVisible || exiting) {
    return
  }

  const messageTimer = window.setTimeout(() => {
    showNextMessage()
  }, getMessageDuration(message))

  return () => {
    window.clearTimeout(messageTimer)
  }
}, [
  message,
  bubbleVisible,
  exiting,
  config.autoCycle,
])


  if (dismissed) {
    return null
  }

return (
  <>
    <style jsx global>{`
      @keyframes companion-enter {
        0% {
          transform: translateX(-110%);
        }
        72% {
          transform: translateX(14px);
        }
        88% {
          transform: translateX(-4px);
        }
        100% {
          transform: translateX(0);
        }
      }
        @keyframes companion-exit {
  0% {
    transform: translateX(0);
  }

  20% {
    transform: translateX(10px);
  }

  100% {
    transform: translateX(-115%);
  }
}

@keyframes companion-enter-right {
  0% {
    transform: translateX(110%);
  }
  72% {
    transform: translateX(-14px);
  }
  88% {
    transform: translateX(4px);
  }
  100% {
    transform: translateX(0);
  }
}

@keyframes companion-exit-right {
  0% {
    transform: translateX(0);
  }

  20% {
    transform: translateX(-10px);
  }

  100% {
    transform: translateX(115%);
  }
}

@keyframes angry-pop {
  0% {
    transform: scale(0.4) rotate(-12deg);
    opacity: 0;
  }
  70% {
    transform: scale(1.18) rotate(-12deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(-12deg);
    opacity: 1;
  }
}
  
    `}</style>

    <div
style={
  config.side === 'left'
    ? { left: `${config.offsetX}px` }
    : { right: `${config.offsetX}px` }
}
  className={cn(
  'pointer-events-none fixed bottom-0 z-70 hidden lg:block',

  !hasEntered &&
    (config.side === 'left'
      ? 'translate-x-[-115%]'
      : 'translate-x-[115%]'),

  hasEntered &&
    visible &&
    (config.side === 'left'
      ? 'animate-[companion-enter_700ms_cubic-bezier(0.22,1,0.36,1)_forwards]'
      : 'animate-[companion-enter-right_700ms_cubic-bezier(0.22,1,0.36,1)_forwards]'),

  hasEntered &&
    !visible &&
    (config.side === 'left'
      ? 'animate-[companion-exit_650ms_cubic-bezier(0.4,0,1,1)_forwards]'
      : 'animate-[companion-exit-right_650ms_cubic-bezier(0.4,0,1,1)_forwards]'),
)}
>
      <div className="relative">
        <div
style={{
  bottom: `${config.bubbleOffsetY}%`,
  width: `${isLongMessage ? Math.max(config.bubbleWidth, 460) : config.bubbleWidth}px`,
  ...(config.side === 'left'
    ? { left: `${config.bubbleOffsetX}%` }
    : { right: `${config.bubbleOffsetX}%` }),
}}
  className={cn(
    'pointer-events-auto absolute',
    'transition-all duration-300',
    bubbleVisible
      ? 'translate-y-0 scale-100 opacity-100'
      : 'translate-y-3 scale-95 opacity-0',
  )}
>
          <div className="relative rounded-[1.35rem] border border-primary/20 bg-background/95 px-5 py-4 shadow-2xl backdrop-blur-xl">
            <button
              type="button"

onClick={() => {
  if (config.doubleClose && closeAttempt === 0) {
    showNextMessage()
    setCloseAttempt(1)

    window.setTimeout(() => {
      setCloseAttempt(0)
    }, 5000)

    return
  }

  setAngryExit(true)
  setBubbleVisible(true)

  window.setTimeout(() => {
    setBubbleVisible(false)
  }, 1000)

  window.setTimeout(() => {
    setVisible(false)
  }, 1250)

  window.setTimeout(() => {
    setDismissed(true)
  }, 1900)
}}

              aria-label="关闭提示"
              className="absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>

            <p className="pr-6 font-display text-[0.62rem] tracking-[0.18em] text-primary">
              {exiting ? config.exitTitle : config.title}
            </p>

            <p
  className={cn(
    'mt-2 text-sm leading-relaxed text-foreground/85',
    'transition-all duration-200',
    !exiting && isLongMessage && 'whitespace-pre-line',
    messageVisible
      ? 'translate-y-0 opacity-100'
      : 'translate-y-1 opacity-0',
  )}
>
  {exiting ? config.exitMessage : message}
</p>

            <p className="mt-3 text-[0.65rem] tracking-[0.08em] text-muted-foreground">
              {config.name}
            </p>

            <div
  className={cn(
    'absolute -bottom-3 size-5 rotate-45 border-b border-r border-border bg-background',
    config.side === 'left' ? 'left-10' : 'right-10',
  )}
/>
          </div>
        </div>

        <div className="relative">
  {exiting && (
  <div
    style={{
      left: `${config.exitMarkX}%`,
      top: `${config.exitMarkY}%`,
    }}
    className="pointer-events-none absolute z-20 animate-[angry-pop_300ms_ease-out_forwards]"
  >
    <span
  style={{ fontSize: `${config.exitMarkSize}px` }}
  className="block -rotate-12 font-black leading-none text-red-500"
>
  {config.exitMark}
</span>
  </div>
)}

  <Image
    src={config.image}
    alt={config.alt}
    width={640}
    height={1200}
    priority={false}
    style={{ height: `${config.height}px` }}
    className="w-auto select-none object-contain object-bottom drop-shadow-2xl"
  />
</div>
      </div>
    </div>
  </>
  )
}