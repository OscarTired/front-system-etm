"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { SlidersHorizontal, X } from "lucide-react"
import { motion } from "motion/react"

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
 * FAB mobile (filtro / orden / historial / export / crear).
 *
 * - Portal body, z-30 (sheet z-40 encima del dial).
 * - Acciones siempre montadas (Popover no se desmonta).
 * - El dial / FAB no se cierra por interactuar con un bottomsheet.
 * - Solo se oculta el chrome con drawer o pull-to-refresh.
 */
export function SpeedDialFab({ actions, className }: Props) {
  const [dialOpen, setDialOpen] = useState(false)
  // En navegación client el documento ya existe → no hay frame vacío
  // (el useState(false)+effect era la causa del parpadeo al cambiar de página).
  const [mounted, setMounted] = useState(
    () => typeof document !== "undefined",
  )
  const rootRef = useRef<HTMLDivElement>(null)

  const ptrActive = usePullToRefreshStore(s => s.active)
  const drawerOpen = useMobileNavStore(s => s.mode === "open")
  const chromeHidden = ptrActive || drawerOpen

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (chromeHidden) setDialOpen(false)
  }, [chromeHidden])

  useEffect(() => {
    if (!dialOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDialOpen(false)
    }

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (rootRef.current?.contains(target)) return
      // Tocar el sheet / overlay no colapsa el FAB
      if (isInsideSheetOrPopover(target)) return
      setDialOpen(false)
    }

    const onScroll = (e: Event) => {
      if (isInsideSheetOrPopover(e.target)) return
      setDialOpen(false)
    }

    window.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("scroll", onScroll, true)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("scroll", onScroll, true)
    }
  }, [dialOpen])

  if (actions.length === 0 || !mounted) return null

  return createPortal(
    <div
      ref={rootRef}
      data-slot="speed-dial-fab"
      className={cn(
        "pointer-events-none fixed bottom-22 flex flex-col items-center gap-2.5",
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
      <motion.div
        initial={false}
        animate={
          dialOpen
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 8, scale: 0.96 }
        }
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
        className={cn(
          "flex flex-col items-center gap-2.5",
          dialOpen
            ? "pointer-events-auto relative"
            : "pointer-events-none absolute bottom-14 right-0",
        )}
        aria-hidden={!dialOpen}
      >
        {actions.map((action, i) => (
          <div key={i} className="flex items-center justify-end">
            {action}
          </div>
        ))}
      </motion.div>

      <button
        type="button"
        aria-label={dialOpen ? "Cerrar acciones" : "Más acciones"}
        aria-expanded={dialOpen}
        onClick={() => setDialOpen(v => !v)}
        className={cn(
          "pointer-events-auto flex size-12 items-center justify-center rounded-full transition duration-200",
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
