"use client"

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

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

const DURATION_MS = 300

/**
 * Collapse por altura medida (scrollHeight), NO por grid 1fr/0fr.
 *
 * El enfoque grid falla cuando el AppShell cambia de ancho (cerrar
 * sidebar / drawer) a mitad de un row expandido + scroll: el 1fr
 * recalcula mal y deja franja vacía o recorte. Con altura explícita
 * el colapso es predecible y el reflow del shell no lo desfasá.
 */
export function CollapsibleHeightSection({
  open,
  children,
  className,
  unmountOnExit = true,
}: Props) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(open)
  /** px numérico mientras anima; "auto" en reposo abierto */
  const [height, setHeight] = useState<number | "auto">(open ? "auto" : 0)

  // Montar/desmontar children
  useEffect(() => {
    if (open) {
      setRendered(true)
      return
    }
    if (!unmountOnExit) {
      setRendered(true)
      return
    }
    const t = window.setTimeout(() => setRendered(false), DURATION_MS + 30)
    return () => window.clearTimeout(t)
  }, [open, unmountOnExit])

  // Animar altura al cambiar open
  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return

    if (open) {
      // Expandir: medir tras render → animar a scrollHeight → auto
      const target = el.scrollHeight
      setHeight(target)
      const t = window.setTimeout(() => {
        setHeight("auto")
      }, DURATION_MS)
      return () => window.clearTimeout(t)
    }

    // Colapsar: si está en auto, fijar altura actual y luego ir a 0
    const current = el.scrollHeight
    setHeight(current)
    const raf = requestAnimationFrame(() => {
      setHeight(0)
    })
    return () => cancelAnimationFrame(raf)
  }, [open, rendered])

  // Si el contenido crece/encoge estando abierto (auto), no hace falta
  // tocar height — "auto" sigue al contenido. Si el shell cambia de
  // ancho y hay height fijo residual, al volver a auto ya está bien.

  return (
    <div
      className="max-w-full overflow-hidden transition-[height] duration-300 ease-out"
      style={{
        height: height === "auto" ? "auto" : `${height}px`,
      }}
    >
      <div
        ref={innerRef}
        className={cn(
          "max-w-full transition-opacity duration-200 ease-out",
          open ? "opacity-100 delay-75" : "opacity-0",
          className,
        )}
      >
        {rendered ? children : null}
      </div>
    </div>
  )
}
