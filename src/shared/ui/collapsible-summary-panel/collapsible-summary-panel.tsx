"use client"

import {
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { ChevronUp } from "lucide-react"
import { cn } from "@/shared/utils/utils"

type Props = {
  expanded: boolean
  onCollapse: () => void
  collapsed: React.ReactNode
  children: React.ReactNode
}

const HEIGHT_DURATION = 250

export function CollapsibleSummaryPanel({
  expanded,
  onCollapse,
  collapsed,
  children,
}: Props) {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [height, setHeight] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return

    const updateHeight = () => {
      setHeight(el.scrollHeight)
    }

    updateHeight()

    const observer = new ResizeObserver(() => {
      updateHeight()
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [expanded])

  return (
    <div
      className="w-full overflow-hidden transition-[height] ease-out will-change-[height]"
      style={{
        height: height !== undefined ? `${height}px` : "auto",
        transitionDuration: `${HEIGHT_DURATION}ms`,
      }}
    >
      <div ref={contentRef} className="w-full min-w-0">
        {!expanded ? (
          // Estado Colapsado: Aparece rápido al terminar de cerrar
          <div className="w-full min-w-0 opacity-100 transition-opacity duration-150 delay-100">
            {collapsed}
          </div>
        ) : (
          // Estado Expandido: Primero crece la altura, el contenido entra con delay
          <div className="flex w-full min-w-0 flex-col opacity-100 transition-opacity duration-150 delay-150">
            <div className="mb-2 flex w-full justify-end px-1">
              <button
                type="button"
                onClick={onCollapse}
                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-neutral-400 transition hover:bg-white/10 hover:text-neutral-200 active:scale-95"
              >
                <ChevronUp size={14} strokeWidth={2.4} />
                Ocultar indicadores
              </button>
            </div>

            <div className="w-full min-w-0">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}