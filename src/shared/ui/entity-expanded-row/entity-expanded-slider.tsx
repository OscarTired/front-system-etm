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
  const [activeHeight, setActiveHeight] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    const activeEl = panelRefs.current[index]
    if (!activeEl) return

    // Seteo inicial inmediato de la altura activa para evitar parpadeos
    setActiveHeight(activeEl.scrollHeight)

    const observer = new ResizeObserver(() => {
      if (activeEl) {
        setActiveHeight(activeEl.scrollHeight)
      }
    })

    observer.observe(activeEl)

    return () => {
      observer.disconnect()
    }
  }, [index, panels])

  return (
    <div
      className="min-w-0 overflow-hidden rounded-2xl transition-[height] duration-300 ease-out"
      style={{ height: activeHeight }}
    >
      <div
        className="flex min-w-0 transition-transform duration-300 ease-out"
        style={{
          width: `${panels.length * 100}%`,
          transform: `translateX(-${(100 / panels.length) * index}%)`,
        }}
      >
        {panels.map((panel, i) => (
          <div
            key={panel.value}
            ref={el => { panelRefs.current[i] = el }}
            className="w-full min-w-0 shrink-0 self-start"
            style={{ width: `${100 / panels.length}%` }}
          >
            {panel.content}
          </div>
        ))}
      </div>
    </div>
  )
}