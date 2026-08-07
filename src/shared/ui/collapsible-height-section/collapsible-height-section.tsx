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
        "grid transition-[grid-template-rows] duration-300 ease-out",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div className="overflow-hidden min-h-0">
        <div
          className={cn(
            "transition-opacity duration-200 ease-out",
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
