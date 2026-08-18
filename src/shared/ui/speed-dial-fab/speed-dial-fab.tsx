"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"
import { SlidersHorizontal, X } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { usePullToRefreshStore } from "@/shared/ui/pull-to-refresh/pull-to-refresh-store"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"
import {
  FAB_CHROME_FADE_MS,
  FAB_RIGHT_OFFSET_PX,
  FAB_Z_CLASS,
} from "./fab-layout"

type Props = {
  actions: ReactNode[]
  className?: string
}

function isInsideSheetOrPopover(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      '[data-slot="popover-content"],[data-slot="popover-sheet"],[data-slot="dialog-overlay"],[data-radix-dialog-overlay]',
    ),
  )
}

/**
 * FAB mobile.
 * - Acciones: montar/desmontar sin animación de salida (evita el
 *   "desvanecido lag" al cambiar de página por bottom-nav).
 * - Cierre inmediato en pathname / drawer / PTR.
 */
export function SpeedDialFab({ actions, className }: Props) {
  const [dialOpen, setDialOpen] = useState(false)
  const [mounted, setMounted] = useState(
    () => typeof document !== "undefined",
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const ptrActive = usePullToRefreshStore(s => s.active)
  const drawerOpen = useMobileNavStore(s => s.mode === "open")
  const chromeHidden = ptrActive || drawerOpen

  useEffect(() => {
    setMounted(true)
  }, [])

  // Cierre instantáneo: no hay exit animation que “laggee”.
  useEffect(() => {
    setDialOpen(false)
  }, [pathname])

  useEffect(() => {
    if (chromeHidden) setDialOpen(false)
  }, [chromeHidden])

  // Scroll: solo cierra si el dedo/pointer SIGUE abajo.
  // El momentum post finger-up sigue emitiendo "scroll"; no debe
  // impedir abrir el FAB ni cerrarlo si el usuario ya soltó.
  const pointerDownRef = useRef(false)
  useEffect(() => {
    const onDown = () => {
      pointerDownRef.current = true
    }
    const onUp = () => {
      pointerDownRef.current = false
    }
    const onScroll = (e: Event) => {
      if (isInsideSheetOrPopover(e.target)) return
      if (!pointerDownRef.current) return
      setDialOpen(false)
    }
    window.addEventListener("pointerdown", onDown, true)
    window.addEventListener("pointerup", onUp, true)
    window.addEventListener("pointercancel", onUp, true)
    window.addEventListener("scroll", onScroll, true)
    return () => {
      window.removeEventListener("pointerdown", onDown, true)
      window.removeEventListener("pointerup", onUp, true)
      window.removeEventListener("pointercancel", onUp, true)
      window.removeEventListener("scroll", onScroll, true)
    }
  }, [])

  useEffect(() => {
    if (!dialOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDialOpen(false)
    }

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (rootRef.current?.contains(target)) return
      if (isInsideSheetOrPopover(target)) return
      setDialOpen(false)
    }

    window.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointerDown)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [dialOpen])

  function toggleDial() {
    setDialOpen(v => !v)
  }

  if (actions.length === 0 || !mounted) return null

  return createPortal(
    <div
      ref={rootRef}
      data-slot="speed-dial-fab"
      className={cn(
        "pointer-events-none fixed bottom-22 flex flex-col items-center gap-2",
        FAB_Z_CLASS,
        "transition-opacity ease-out",
        chromeHidden ? "opacity-0" : "opacity-100",
        className,
      )}
      style={{
        right: FAB_RIGHT_OFFSET_PX,
        transitionDuration: `${FAB_CHROME_FADE_MS}ms`,
        pointerEvents: chromeHidden ? "none" : undefined,
      }}
      aria-hidden={chromeHidden}
    >
      {dialOpen ? (
        <div className="pointer-events-auto relative flex flex-col items-center gap-2">
          {actions.map((action, i) => (
            <div key={i} className="flex items-center justify-center">
              {action}
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        aria-label={dialOpen ? "Cerrar acciones" : "Más acciones"}
        aria-expanded={dialOpen}
        onClick={toggleDial}
        className={cn(
          "pointer-events-auto flex size-12 items-center justify-center rounded-full transition-transform duration-150",
          "bg-foreground text-background hover:scale-105 hover:bg-foreground/90 active:scale-95",
          "shadow-sm shadow-black/15 dark:shadow-black/40",
        )}
      >
        {dialOpen ? (
          <X size={20} strokeWidth={2.5} />
        ) : (
          <SlidersHorizontal size={18} strokeWidth={2.4} />
        )}
      </button>
    </div>,
    document.body,
  )
}
