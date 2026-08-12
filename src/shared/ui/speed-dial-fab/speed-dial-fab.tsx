"use client"

import { useEffect, useState, type ReactNode } from "react"
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

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  if (actions.length === 0) return null

  return (
    <div
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