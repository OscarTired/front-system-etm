"use client"

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react"

import { cn } from "@/shared/utils/utils"

type Props = {
  children: ReactNode
  className?: string
  // px/segundo — más alto = desliza más rápido.
  speed?: number
}

// Como los carteles LED de las tiendas: si el contenido entra
// cómodo en el ancho disponible, se queda quieto (no tiene sentido
// animar algo que ya se ve completo). Si NO entra, se desliza hacia
// la izquierda hasta mostrar el final, pausa, y vuelve a arrancar
// desde el principio — en vez de truncar con "..." y perder
// información (el caso real: "Sebastian #3" truncando a solo "#3"
// no le dice nada a nadie).
export function MarqueeText({ children, className, speed = 35 }: Props) {

  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const [distance, setDistance] = useState(0)

  useEffect(() => {

    function measure() {

      if (!containerRef.current || !contentRef.current) return

      const overflow = contentRef.current.scrollWidth - containerRef.current.clientWidth

      setDistance(overflow > 4 ? overflow : 0)

    }

    measure()

    const resizeObserver = new ResizeObserver(measure)

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()

  }, [children])

  const overflowing = distance > 0

  const duration = overflowing ? Math.max(distance / speed, 2.5) : 0

  return (

    <div ref={containerRef} className={cn("min-w-0 overflow-hidden", className)}>

      <div
        ref={contentRef}
        className={cn("flex w-max items-center gap-1.5", overflowing && "animate-marquee-scroll")}
        style={
          overflowing
            ? ({
                "--marquee-distance": `${distance}px`,
                animationDuration: `${duration}s`,
              } as CSSProperties)
            : undefined
        }
      >
        {children}
      </div>

    </div>

  )

}