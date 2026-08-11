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
 * Collapse por grid-template-rows (1fr ↔ 0fr).
 * overflow-hidden en el grid + en el slot evita que, al reflowear el
 * shell (cerrar sidebar / cambiar ancho), el contenido “se pase” del
 * colapso y deje una franja vacía o recorte raro.
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
    // Esperar el collapse (~300ms) antes de desmontar
    const t = window.setTimeout(() => setRendered(false), 320)
    return () => window.clearTimeout(t)
  }, [open, unmountOnExit])

  return (
    <div
      className={cn(
        // overflow-hidden en el grid: sin esto, en reflows de ancho del
        // AppShell el 1fr puede pintar fuera un frame y dejar franja vacía.
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
