"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { SlidersHorizontal, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/shared/utils/utils"
import { FAB_RIGHT_OFFSET_PX } from "./fab-layout"
import { usePullToRefreshStore } from "@/shared/ui/pull-to-refresh/pull-to-refresh-store"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"

type Props = {
  actions: ReactNode[]
  className?: string
}

/**
 * FAB de filtro/orden/historial/exportar/crear.
 *
 * Portal a document.body (fixed respecto al viewport; no hereda el
 * translateY del pull-to-refresh ni el del drawer).
 *
 * Capa: z-30 — por debajo de sheets/dialogs (z-40+). Si el dial
 * quedara a z-60, las acciones del speed-dial taparían el bottomsheet
 * que ellas mismas abren.
 *
 * Al elegir una acción del dial se cierra el menú; el sheet queda solo.
 */
export function SpeedDialFab({ actions, className }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const ptrActive = usePullToRefreshStore(s => s.active)
  const drawerOpen = useMobileNavStore(s => s.mode === "open")
  /** Chrome fixed al viewport: no viaja con el panel. Se oculta con el drawer/PTR. */
  const chromeHidden = ptrActive || drawerOpen

  useEffect(() => {
    setMounted(true)
  }, [])
  useEffect(() => {
    if (chromeHidden) setOpen(false)
  }, [chromeHidden])


  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (containerRef.current?.contains(target)) return
      if (
        target.closest(
          '[data-slot="popover-content"],[data-slot="popover-sheet"]',
        )
      ) {
        return
      }
      setOpen(false)
    }

    const onScroll = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (
        target?.closest?.(
          '[data-slot="popover-content"],[data-slot="popover-sheet"]',
        )
      ) {
        return
      }
      setOpen(false)
    }

    window.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("scroll", onScroll, true)

    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("scroll", onScroll, true)
    }
  }, [open])

  if (actions.length === 0 || !mounted) return null

  return createPortal(
    <div
      ref={containerRef}
      data-slot="speed-dial-fab"
      className={cn(
        "pointer-events-none fixed bottom-22 z-30 flex flex-col items-end gap-2",
        // Misma duración que PANEL_TRANSITION del CompactShell (280ms)
        "transition-opacity duration-280 ease-out",
        chromeHidden ? "opacity-0" : "opacity-100",
        className,
      )}
      style={{
        right: FAB_RIGHT_OFFSET_PX,
        pointerEvents: chromeHidden ? "none" : undefined,
      }}
      aria-hidden={chromeHidden}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="dial"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="pointer-events-auto flex flex-col items-end gap-2"
            onPointerDown={() => {
              // Cierra el dial al elegir una acción. El Popover/sheet
              // que abre el trigger sigue su curso (z-40 > z-30).
              setOpen(false)
            }}
          >
            {actions.map((action, i) => (
              <div key={i} className="flex items-center justify-end">
                {action}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        aria-label={open ? "Cerrar acciones" : "Más acciones"}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className={cn(
          "pointer-events-auto flex size-12 items-center justify-center rounded-full transition duration-200",
          "bg-white text-black hover:scale-105 hover:bg-neutral-100 active:scale-95",
          "shadow-[0_12px_32px_rgba(0,0,0,0.55)]",
        )}
      >
        {open ? (
          <X size={20} strokeWidth={2.5} />
        ) : (
          <SlidersHorizontal size={18} strokeWidth={2.4} />
        )}
      </button>
    </div>,
    document.body,
  )
}
