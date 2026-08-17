"use client"

import { useEffect, useRef, type RefObject } from "react"

type Options<T> = {
  // Valor activo controlado desde afuera (ej. el proceso actual).
  value: T
  onChange: (value: T) => void
  // Orden de los "slides" del carrusel, en el mismo orden en que
  // aparecen en el DOM — se usa para traducir índice <-> valor.
  order: readonly T[]
  // Si el consumidor ya tiene su propio ref (ej. porque también usa
  // ScrollArea sobre el mismo nodo), se lo pasa acá para que todo
  // opere sobre el MISMO elemento en vez de crear uno propio sin uso.
  containerRef?: RefObject<HTMLDivElement | null>
  // Cuánto esperar sin nuevos eventos "scroll" antes de confirmar en
  // qué slide quedó asentado el snap. "scroll" dispara decenas de
  // veces durante la animación; sin este debounce se dispararía
  // onChange de más, con valores intermedios que no llegaron a
  // asentarse.
  settleDelay?: number
}

// Sincroniza un carrusel con scroll-snap con un valor externo, en
// las DOS direcciones:
// 1) el usuario swipea/arrastra el carrusel -> se detecta en qué
//    slide quedó asentado y se notifica hacia afuera (onChange).
// 2) el valor cambia desde afuera (ej. se tocó un botón en otro
//    componente que comparte el mismo "value") -> el carrusel se
//    desliza solo para mostrar el slide correspondiente.
//
// Extraído de PipelineProcessSelector y TaskPipelineCarousel, que
// tenían esta misma lógica copiada dos veces con leves diferencias
// no siempre intencionales.
export function useSnapCarouselSync<T>({
  value,
  onChange,
  order,
  containerRef: externalRef,
  settleDelay = 0,
}: Options<T>) {

  const internalRef = useRef<HTMLDivElement>(null)

  const containerRef = externalRef ?? internalRef

  // Dirección 1: swipe/scroll interno -> notifica afuera.
  useEffect(() => {

    const el = containerRef.current

    if (!el) {
      return
    }

    let timeout: ReturnType<typeof setTimeout>

    const handleSnapSettle = () => {
      clearTimeout(timeout)

      const run = () => {
        const index = Math.round(el.scrollLeft / el.clientWidth)
        const next = order[index]
        if (next !== undefined && next !== value) {
          onChange(next)
        }
      }

      // 0 = al siguiente frame (sin espera artificial entre ejes)
      if (settleDelay <= 0) {
        timeout = requestAnimationFrame(run) as unknown as ReturnType<typeof setTimeout>
      } else {
        timeout = setTimeout(run, settleDelay)
      }
    }

    el.addEventListener("scroll", handleSnapSettle, { passive: true })

    return () => {

      clearTimeout(timeout)
      cancelAnimationFrame(timeout as unknown as number)
      el.removeEventListener("scroll", handleSnapSettle)

    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, value, onChange, order, settleDelay])

  // Dirección 2: cambio externo -> el carrusel se desliza para
  // seguirlo (ej. al tocar una flecha o un botón en otro componente
  // sincronizado al mismo valor, no solo al swipear acá mismo).
  useEffect(() => {

    const el = containerRef.current

    if (!el) {
      return
    }

    const index = order.indexOf(value)

    if (index < 0) {
      return
    }

    const target = index * el.clientWidth

    if (Math.abs(el.scrollLeft - target) > 4) {
      el.scrollTo({ left: target, behavior: "auto" })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, value, order])

  function scrollByPage(direction: 1 | -1) {

    const el = containerRef.current

    el?.scrollBy({
      left: direction * el.clientWidth,
      behavior: "auto",
    })

  }

  return {
    containerRef,
    scrollToPrevious: () => scrollByPage(-1),
    scrollToNext: () => scrollByPage(1),
  }

}