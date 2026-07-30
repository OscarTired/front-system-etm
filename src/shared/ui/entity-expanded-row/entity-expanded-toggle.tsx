"use client"

import type { LucideIcon } from "lucide-react"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/shared/utils/utils"

export type EntityExpandedToggleOption<T extends string> = {
  value: T
  label: string
  icon: LucideIcon
  count?: number
}

type Props<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: EntityExpandedToggleOption<T>[]
}

// Ancho mínimo cómodo para 3 botones con label completo visible —
// por debajo de esto se pasa a modo compacto (solo íconos,
// estirado a todo el ancho).
const COMPACT_BREAKPOINT = 420

export function EntityExpandedToggle<T extends string>({
  value,
  onChange,
  options,
}: Props<T>) {

  const wrapperRef = useRef<HTMLDivElement>(null)

  const [fullWidth, setFullWidth] = useState(false)

  useEffect(() => {

    if (!wrapperRef.current) return

    const measure = () => {
      if (wrapperRef.current) {
        setFullWidth(wrapperRef.current.offsetWidth < COMPACT_BREAKPOINT)
      }
    }

    measure()

    const resizeObserver = new ResizeObserver(measure)

    resizeObserver.observe(wrapperRef.current)

    return () => resizeObserver.disconnect()

  }, [])

  return (
    <div ref={wrapperRef} className="flex w-full justify-end">

      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-lg bg-white/5 p-1 select-none",
          fullWidth && "flex w-full",
        )}
      >
        {options.map(option => {
          const isActive = option.value === value
          const Icon = option.icon

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              title={option.label}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold tracking-wide transition-colors",
                fullWidth && "flex-1",
                isActive
                  ? "bg-white/10 text-neutral-100 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300",
              )}
            >
              {/* Contenedor reservado y rígido para el icono para evitar micro-saltos */}
              <span className="flex shrink-0 items-center justify-center">
                <Icon
                  size={13}
                  strokeWidth={2.5}
                  className="shrink-0"
                />
              </span>

              {!fullWidth && (
                <span className="min-w-0 truncate">
                  {option.label}
                </span>
              )}

              {option.count !== undefined && (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold",
                    isActive
                      ? "bg-white/10 text-neutral-200"
                      : "bg-white/5 text-neutral-500",
                  )}
                >
                  {option.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

    </div>
  )
}