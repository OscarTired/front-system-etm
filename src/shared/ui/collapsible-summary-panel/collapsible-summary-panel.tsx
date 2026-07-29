"use client"

import { ChevronUp } from "lucide-react"

type Props = {
  expanded: boolean
  onCollapse: () => void
  collapsed: React.ReactNode
  children: React.ReactNode
}

// FIX: este panel ya vive dentro de un contenedor que anima su propia
// altura en base a scrollHeight + ResizeObserver (EntityExpandedSlider).
// Antes, este componente ALSO animaba su propia altura con su propio
// ResizeObserver — dos animaciones de altura independientes, con
// duraciones distintas, compitiendo entre sí. El padre reaccionaba con
// retraso al crecimiento del hijo, así que durante la transición el
// contenido ya renderizado (más alto) se salía del contenedor exterior
// (overflow-hidden, altura en px) y se superponía con la siguiente
// fila del listado en vez de empujarla.
//
// Ahora este componente solo intercambia contenido en flujo normal.
// Una única fuente de verdad (el padre) controla la altura animada,
// así que el resto del listado siempre recibe el espacio correcto.
export function CollapsibleSummaryPanel({
  expanded,
  onCollapse,
  collapsed,
  children,
}: Props) {
  return (
    <div className="w-full min-w-0">
      {!expanded ? (
        <div className="w-full min-w-0 animate-comment-in">
          {collapsed}
        </div>
      ) : (
        <div className="flex w-full min-w-0 flex-col animate-comment-in">
          <div className="mb-2 flex w-full justify-end px-1">
            <button
              type="button"
              onClick={onCollapse}
              className="flex items-center gap-1.5 rounded-2xl bg-white/5 px-2.5 py-1.5 text-xs font-medium text-neutral-400 transition hover:bg-white/10 hover:text-neutral-200 active:scale-95"
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
  )
}
