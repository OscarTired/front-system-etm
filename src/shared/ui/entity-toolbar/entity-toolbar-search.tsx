"use client"

import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

type Props = {
  value: string
  onChange: (value: string) => void
  /** Placeholder del input expandido. Default: "Buscar..." */
  placeholder?: string
}

/**
 * Búsqueda de toolbar.
 *
 * Mobile
 *  - Cerrado: solo icono (sin reservar fila ancha).
 *  - Abierto: barra full-width tipo mensajes; empuja el contenido
 *    de abajo (el padre debe permitir w-full / flex-wrap).
 *
 * Desktop / tablet: icono + input inline (w-60) como antes.
 */
export function EntityToolbarSearch({
  value,
  onChange,
  placeholder = "Buscar...",
}: Props) {
  const { isMobile } = useResponsive()
  const [open, setOpen] = useState(Boolean(value))
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open || value) return
    function onPointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open, value])

  function openSearch() {
    setOpen(true)
  }

  function closeSearch() {
    onChange("")
    setOpen(false)
    inputRef.current?.blur()
  }

  // —— Mobile: lupa o barra full-width (empuja layout) ——
  if (isMobile) {
    if (!open) {
      return (
        <button
          type="button"
          data-toolbar-search=""
          aria-label="Buscar"
          onPointerDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onClick={openSearch}
          className="flex size-8 shrink-0 touch-none items-center justify-center rounded-xl text-foreground transition hover:bg-muted"
        >
          <Search size={16} strokeWidth={2.2} />
        </button>
      )
    }

    return (
      <div
        ref={containerRef}
        data-toolbar-search=""
        className="w-full min-w-0 basis-full"
      >
        <div className="flex items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2.5">
          <Search
            size={15}
            strokeWidth={2.2}
            className="shrink-0 text-muted-foreground"
          />
          <input
            ref={inputRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onPointerDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/80"
          />
          <button
            type="button"
            aria-label="Cerrar búsqueda"
            onClick={closeSearch}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    )
  }

  // —— Desktop / tablet: inline compacto ——
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
            if (open) closeSearch()
            else openSearch()
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
