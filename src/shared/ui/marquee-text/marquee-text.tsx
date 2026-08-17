"use client"

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react"

import { cn } from "@/shared/utils/utils"

type Props = {
  children: ReactNode
  className?: string
  // px/segundo — más alto = desliza más rápido.
  speed?: number
  // true: loop continuo SIEMPRE, como un cartel LED real (se mueve
  // aunque el contenido entre cómodo en el ancho disponible). Sin
  // esto, sería un marquee "inteligente" que solo anima cuando hace
  // falta — pero un cartel LED de tienda no le importa si el texto
  // entra o no, se mueve todo el tiempo, ese es el efecto que se
  // pidió acá.
  always?: boolean
  /** Segundos de espera antes de arrancar el movimiento (default 0). */
  delay?: number
}

// Loop continuo real (contenido duplicado + translateX a -50%), no
// un "va y viene" con pausa en los extremos — así el texto
// desaparece por la izquierda y reaparece por la derecha sin salto
// ni corte, igual que un cartel LED de tienda de verdad.
export function MarqueeText({ children, className, speed = 35, always = false, delay = 0 }: Props) {

  const containerRef = useRef<HTMLDivElement>(null)
  const singleCopyRef = useRef<HTMLDivElement>(null)

  const [copyWidth, setCopyWidth] = useState(0)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {

    function measure() {

      if (!containerRef.current || !singleCopyRef.current) return

      const width = singleCopyRef.current.scrollWidth

      setCopyWidth(width)
      setOverflowing(width > containerRef.current.clientWidth)

    }

    measure()

    const resizeObserver = new ResizeObserver(measure)

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()

  }, [children])

  const shouldAnimate = (always || overflowing) && copyWidth > 0

  const duration = shouldAnimate ? Math.max(copyWidth / speed, 4) : 0

  return (

    <div ref={containerRef} className={cn("min-w-0 overflow-hidden", className)}>

      <div
        className={cn("flex w-max items-center", shouldAnimate && "animate-marquee-loop")}
        style={
          shouldAnimate
            ? ({
                "--marquee-width": `${copyWidth}px`,
                animationDuration: `${duration}s`,
                animationDelay: delay > 0 ? `${delay}s` : undefined,
              } as CSSProperties)
            : undefined
        }
      >

        <div ref={singleCopyRef} className="flex shrink-0 items-center gap-1.5 pr-8">
          {children}
        </div>

        {/* Segunda copia — recién visible cuando el loop arranca a
            desplazarse, es lo que hace que el "final" del texto se
            encuentre sin corte con su propio "principio" otra vez. */}
        {shouldAnimate && (
          <div aria-hidden className="flex shrink-0 items-center gap-1.5 pr-8">
            {children}
          </div>
        )}

      </div>

    </div>

  )

}