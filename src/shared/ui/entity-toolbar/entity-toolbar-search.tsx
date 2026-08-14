"use client"

import { useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { usePageSearchStore } from "./page-search-store"

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/**
 * Búsqueda de entidad.
 *
 * Mobile: no pinta UI acá — registra en page-search-store y el icono
 * vive en el TopBar (barra expandida bajo el header).
 *
 * Desktop/tablet: lupa + input inline en la toolbar.
 */
export function EntityToolbarSearch({
  value,
  onChange,
  placeholder = "Buscar...",
}: Props) {
  const { isMobile, ready } = useResponsive()
  const register = usePageSearchStore(s => s.register)
  const syncValue = usePageSearchStore(s => s.syncValue)
  const unregister = usePageSearchStore(s => s.unregister)

  // —— Mobile: solo bridge al TopBar ——
  useEffect(() => {
    if (!ready || !isMobile) return
    register({ value, onChange, placeholder })
    return () => unregister()
    // onChange/placeholder estables en la práctica; value se sync aparte
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isMobile, register, unregister, placeholder])

  useEffect(() => {
    if (!ready || !isMobile) return
    syncValue(value)
  }, [ready, isMobile, value, syncValue])

  const [open, setOpen] = useState(Boolean(value))
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  if (!ready) return null

  if (isMobile) {
    // UI en TopBar
    return null
  }

  // —— Desktop / tablet ——
  return (
    <div className="flex justify-end">
      <div
        ref={containerRef}
        data-toolbar-search=""
        className={cn(
          "flex items-center overflow-hidden transition-all duration-200 ease-out",
          open ? "w-60" : "w-8",
        )}
      >
        <button
          type="button"
          data-toolbar-search=""
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={() => {
            if (open) {
              onChange("")
              setOpen(false)
              inputRef.current?.blur()
            } else {
              setOpen(true)
            }
          }}
          className={cn(
            "flex size-8 shrink-0 touch-none items-center justify-center rounded-xl text-foreground transition-all duration-200",
            open ? "bg-muted" : "hover:bg-muted",
          )}
        >
          <Search size={14} strokeWidth={2} />
        </button>

        <div
          className={cn(
            "flex min-w-0 flex-1 items-center transition-all duration-200",
            open ? "pl-2.5 opacity-100" : "pointer-events-none pl-0 opacity-0",
          )}
        >
          <input
            ref={inputRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={() => {
              if (!value) setOpen(false)
            }}
            onPointerDown={e => e.stopPropagation()}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
          />
        </div>
      </div>
    </div>
  )
}
