"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/shared/utils/utils"
import { FAB_RIGHT_OFFSET_PX } from "./fab-layout"

type Props = {
  actions: ReactNode[]
  className?: string
}

/**
 * FAB de filtro/orden/historial/exportar/crear. z-[60]. No scrollea.
 * Cada `action` es autosuficiente (usa FabTrigger) — este componente
 * solo pone la fila (alineación + gap) y la animación de apertura,
 * nunca le adivina estilo al contenido vía selectores CSS.
 */
export function SpeedDialFab({ actions, className }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }

    // Cualquier tap fuera del widget (hamburguesa, un card de la
    // lista, el bottom nav, lo que sea) lo cierra. pointerdown (no
    // click) para que se sienta inmediato, igual que un popover.
    // Excepción: los popovers que abren Filtro/Orden/Exportar se
    // portalean fuera de este contenedor (van a document.body), así
    // que sin esta excepción, elegir una opción ahí adentro se
    // vería como "click afuera" y cerraría el dial de golpe.
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (containerRef.current?.contains(target)) return
      if (target.closest('[data-slot="popover-content"],[data-slot="popover-sheet"]')) return
      setOpen(false)
    }

    // scroll no hace bubbling, pero SÍ se recibe en fase de captura
    // en cualquier ancestro (incluido window) — así cierra el dial
    // sea cual sea el contenedor que scrollee (la lista, un panel
    // interno, etc), sin tener que conocerlo. Misma excepción de
    // popover que en pointerdown: scrollear las opciones de un
    // popover abierto no debe cerrar el dial que lo disparó.
    const onScroll = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (target?.closest?.('[data-slot="popover-content"],[data-slot="popover-sheet"]')) return
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

  if (actions.length === 0) return null

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none fixed bottom-22 z-60 flex flex-col items-end gap-2",
        className,
      )}
      style={{ right: FAB_RIGHT_OFFSET_PX }}
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
    </div>
  )
}