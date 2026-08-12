"use client"

import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
  type TouchEvent,
} from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/shared/utils/utils"

const THRESHOLD_PX = 64
const MAX_PULL_PX = 96

type Props = {
  children: ReactNode
  onRefresh: () => void | Promise<void>
  scrollRef: RefObject<HTMLElement | null>
}

/**
 * PTR: solo con scrollTop === 0. No interfiere con el scroll normal.
 */
export function PullToRefresh({ children, onRefresh, scrollRef }: Props) {
  const startY = useRef(0)
  const pulling = useRef(false)
  const [offset, setOffset] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (refreshing) return
      const el = scrollRef.current
      if (!el || el.scrollTop > 0) {
        pulling.current = false
        return
      }
      startY.current = e.touches[0].clientY
      pulling.current = true
    },
    [refreshing, scrollRef],
  )

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || refreshing) return
      const el = scrollRef.current
      if (!el || el.scrollTop > 0) {
        pulling.current = false
        setOffset(0)
        return
      }
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) {
        setOffset(0)
        return
      }
      setOffset(Math.min(MAX_PULL_PX, dy * 0.45))
    },
    [refreshing, scrollRef],
  )

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false
    if (offset >= THRESHOLD_PX && !refreshing) {
      setRefreshing(true)
      setOffset(THRESHOLD_PX * 0.7)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        setOffset(0)
      }
    } else {
      setOffset(0)
    }
  }, [offset, onRefresh, refreshing])

  const armed = offset >= THRESHOLD_PX

  return (
    <div
      className="relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className={cn(
          "pointer-events-none absolute left-0 right-0 top-0 z-10 flex justify-center transition-opacity",
          offset > 8 || refreshing ? "opacity-100" : "opacity-0",
        )}
        style={{ height: Math.max(offset, refreshing ? 40 : 0) }}
        aria-hidden
      >
        <div
          className={cn(
            "mt-2 flex size-8 items-center justify-center rounded-full bg-white/10 text-neutral-300 shadow-lg ring-1 ring-white/10 backdrop-blur-md",
            armed && !refreshing && "text-white",
          )}
        >
          <Loader2
            size={16}
            className={cn(refreshing && "animate-spin")}
            style={
              !refreshing
                ? {
                    transform: `rotate(${Math.min(180, (offset / THRESHOLD_PX) * 180)}deg)`,
                  }
                : undefined
            }
          />
        </div>
      </div>

      <div
        style={{
          transform: offset || refreshing ? `translateY(${offset}px)` : undefined,
          transition: pulling.current ? undefined : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  )
}
