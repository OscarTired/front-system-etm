"use client"

import { useLayoutEffect, useRef, useState } from "react"

type Panel<T extends string> = {
  value: T
  content: React.ReactNode
}

type Props<T extends string> = {
  value: T
  panels: Panel<T>[]
}

// Contraparte de EntityExpandedToggle: los mismos "options" del
// toggle, pero como paneles de contenido que se deslizan
// horizontalmente entre sí (mismo mecanismo que MobilePipelineCarousel
// — track con transform, no scroll nativo, porque acá el cambio lo
// dispara el toggle, no un gesto de swipe).
//
// Sin altura fija: los 3 (o 2) paneles están montados a la vez
// (hace falta para que el slide horizontal se vea, no se puede
// desmontar el que no está activo) y cada uno se mide con
// ResizeObserver — el contenedor toma el alto real del panel
// ACTIVO y lo anima al cambiar de pestaña, así KPIs/Mensajes
// ocupan lo mismo que ocupe Tareas (o al revés), sin dejar un hueco
// enorme cuando el contenido es chico.
export function EntityExpandedSlider<T extends string>({
  value,
  panels,
}: Props<T>) {

  const activeIndex = panels.findIndex(p => p.value === value)

  const index = activeIndex === -1 ? 0 : activeIndex

  const panelRefs = useRef<(HTMLDivElement | null)[]>([])

  const [heights, setHeights] = useState<number[]>(
    () => panels.map(() => 0),
  )

  useLayoutEffect(() => {

    // Medición inicial SÍNCRONA (antes de pintar) — sin esto, el
    // primer render arranca en height:undefined (auto) y recién
    // unos ms después el ResizeObserver dispara con el número real,
    // lo que se ve como un salto al montar. Ahora particularmente
    // notorio en Process, que arranca directo en la pestaña KPIs.
    setHeights(
      panelRefs.current.map(el => el?.scrollHeight ?? 0),
    )

    const observers = panelRefs.current.map((el, i) => {

      if (!el) {
        return null
      }

      const observer = new ResizeObserver(() => {

        setHeights(prev => {

          const next = [...prev]

          next[i] = el.scrollHeight

          return next

        })

      })

      observer.observe(el)

      return observer

    })

    return () => {
      observers.forEach(o => o?.disconnect())
    }

  }, [panels.length])

  const activeHeight = heights[index] || undefined

  return (

    <div
      className="overflow-hidden rounded-2xl transition-[height] duration-300 ease-out"
      style={{ height: activeHeight }}
    >

      <div
        className="flex transition-transform duration-300 ease-out"
        style={{
          width: `${panels.length * 100}%`,
          transform: `translateX(-${(100 / panels.length) * index}%)`,
        }}
      >

        {panels.map((panel, i) => (

          <div
            key={panel.value}
            ref={el => { panelRefs.current[i] = el }}
            className="w-full shrink-0 self-start"
            style={{ width: `${100 / panels.length}%` }}
          >

            {panel.content}

          </div>

        ))}

      </div>

    </div>

  )

}