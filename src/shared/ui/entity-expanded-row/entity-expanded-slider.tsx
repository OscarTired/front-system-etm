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

export function EntityExpandedSlider<T extends string>({
  value,
  panels,
}: Props<T>) {

  const activeIndex = panels.findIndex(p => p.value === value)
  const index = activeIndex === -1 ? 0 : activeIndex

  const panelRefs = useRef<(HTMLDivElement | null)[]>([])
  const [heights, setHeights] = useState<number[]>(() => panels.map(() => 0))

  useLayoutEffect(() => {
    setHeights(panelRefs.current.map(el => el?.scrollHeight ?? 0))

    const observers = panelRefs.current.map((el, i) => {
      if (!el) return null
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

    return () => { observers.forEach(o => o?.disconnect()) }
  }, [panels.length])

  const activeHeight = heights[index] || undefined

  return (
    // FIX 1: min-w-0 aquí para que el overflow-hidden sí contenga el ancho intrínseco
    <div className="min-w-0 overflow-hidden rounded-2xl transition-[height] duration-300 ease-out"
         style={{ height: activeHeight }}>

      {/* FIX 2: min-w-0 en el track también, por si acaso */}
      <div className="flex min-w-0 transition-transform duration-300 ease-out"
           style={{
             width: `${panels.length * 100}%`,
             transform: `translateX(-${(100 / panels.length) * index}%)`,
           }}>

        {panels.map((panel, i) => (
          // FIX 3: min-w-0 en cada panel para romper la cadena flex
          <div key={panel.value}
               ref={el => { panelRefs.current[i] = el }}
               className="w-full min-w-0 shrink-0 self-start"
               style={{ width: `${100 / panels.length}%` }}>

            {panel.content}

          </div>
        ))}

      </div>
    </div>
  )
}