"use client"

import { useEffect, useState } from "react"
import { cn } from "@/shared/utils/utils"

type Props = {
  open: boolean
  children: React.ReactNode
  className?: string
  /**
   * Si true (default), desmonta children al cerrar (tras la animación).
   * Evita que hooks pesados (useComments, etc.) corran en filas colapsadas.
   */
  unmountOnExit?: boolean
}

/**
 * Collapse por grid 0fr/1fr (patrón CSS estándar).
 *
 * No anima height en px: esa medición se vuelve stale si el shell
 * cambia de ancho a mitad de animación. El ajuste de scrollTop
 * cuando el contenido encoge (ej. al cerrar una sección con el
 * scroll abajo del todo) lo maneja el navegador solo, nativo — no
 * hace falta (ni conviene) clampearlo a mano; eso fue justo lo que
 * rompía el rebote nativo en ScrollArea/vertical-scroll antes.
 */
export function CollapsibleHeightSection({
  open,
  children,
  className,
  unmountOnExit = true,
}: Props) {
  const [rendered, setRendered] = useState(open)

  useEffect(() => {
    if (open) {
      setRendered(true)
      return
    }
    if (!unmountOnExit) {
      setRendered(true)
      return
    }
    const t = window.setTimeout(() => setRendered(false), 320)
    return () => window.clearTimeout(t)
  }, [open, unmountOnExit])

  return (
    <div
      className={cn(
        "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            "max-w-full transition-opacity duration-200 ease-out",
            open ? "opacity-100 delay-75" : "opacity-0",
            className,
          )}
        >
          {rendered ? children : null}
        </div>
      </div>
    </div>
  )
}