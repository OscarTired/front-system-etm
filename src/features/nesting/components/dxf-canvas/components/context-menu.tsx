"use client"

import { useEffect, useRef } from "react"

export type ContextMenuItem = {
  id: string
  label: string
  disabled?: boolean
  separator?: boolean
  onClick?: () => void
}

type Props = {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function CanvasContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("mousedown", onDown)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("mousedown", onDown)
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  // Evitar que salga de viewport
  const left = Math.min(x, typeof window !== "undefined" ? window.innerWidth - 200 : x)
  const top = Math.min(y, typeof window !== "undefined" ? window.innerHeight - 240 : y)

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] rounded-lg border border-white/10 bg-[#141416]/98 py-1 shadow-xl backdrop-blur-md"
      style={{ left, top }}
      role="menu"
    >
      {items.map((item) =>
        item.separator ? (
          <div key={item.id} className="my-1 h-px bg-white/10" />
        ) : (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-neutral-200 hover:bg-white/10 disabled:opacity-40"
            onClick={() => {
              if (item.disabled) return
              item.onClick?.()
              onClose()
            }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  )
}