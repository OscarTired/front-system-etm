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

/**
 * Solo monta el panel activo. Antes montaba TODOS los paneles a la vez
 * (comments + KPIs + tasks), lo que disparaba useComments / timelines
 * aunque el usuario estuviera en otra pestaña.
 */
export function EntityExpandedSlider<T extends string>({
  value,
  panels,
}: Props<T>) {
  const activeIndex = panels.findIndex(p => p.value === value)
  const index = activeIndex === -1 ? 0 : activeIndex
  const active = panels[index]

  const panelRef = useRef<HTMLDivElement | null>(null)
  const [activeHeight, setActiveHeight] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    const activeEl = panelRef.current
    if (!activeEl) return

    setActiveHeight(activeEl.scrollHeight)

    const observer = new ResizeObserver(() => {
      if (panelRef.current) {
        setActiveHeight(panelRef.current.scrollHeight)
      }
    })

    observer.observe(activeEl)
    return () => observer.disconnect()
  }, [index, value])

  return (
    <div
      className="min-w-0 overflow-hidden rounded-2xl transition-[height] duration-300 ease-out"
      style={{ height: activeHeight }}
    >
      <div ref={panelRef} className="w-full min-w-0 self-start">
        {active?.content ?? null}
      </div>
    </div>
  )
}
