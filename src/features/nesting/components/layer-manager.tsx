"use client"

import { useState } from "react"
import { ChevronRight, Layers, Eye, EyeOff } from "lucide-react"
import type { LayerInfo } from "./dxf-canvas/dxf-canvas"

export interface LayerManagerProps {
  layers: LayerInfo[]
  hiddenKeys: Set<string>
  onToggle: (key: string) => void
  onShowAll: () => void
}

export function LayerManager({ layers, hiddenKeys, onToggle, onShowAll }: LayerManagerProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (layers.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-neutral-500">
        Nesteá primero para ver las capas de la plancha activa.
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-xl bg-white/2 p-1 transition-colors">
      {/* Header: no anidar button dentro de button */}
      <div className="flex w-full items-center gap-1 rounded-lg px-1 py-1">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/3"
        >
          <Layers className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <span className="truncate text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Capas ({layers.length})
          </span>
          <ChevronRight
            className={`ml-auto h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        </button>

        {hiddenKeys.size > 0 && (
          <button
            type="button"
            onClick={onShowAll}
            className="shrink-0 rounded-lg px-2 py-1.5 text-[10px] text-cyan-400 hover:bg-white/5 hover:text-cyan-300"
          >
            Mostrar todas
          </button>
        )}
      </div>

      <div
        className={`flex flex-col gap-1 overflow-hidden transition-all duration-200 ease-in-out ${
          isExpanded ? "mt-2 max-h-125 opacity-100 p-1" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-1 rounded-lg bg-black/20 p-1">
          {layers.map((layer) => {
            const isHidden = hiddenKeys.has(layer.key.toUpperCase())
            return (
              <button
                key={layer.key}
                type="button"
                onClick={() => onToggle(layer.key)}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                  isHidden ? "text-neutral-600" : "text-neutral-200 hover:bg-white/5"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: layer.color, opacity: isHidden ? 0.3 : 1 }}
                />
                <span className="min-w-0 flex-1 truncate" title={layer.label}>
                  {layer.label}
                </span>
                <span className="shrink-0 text-[10px] text-neutral-600">{layer.count}</span>
                {isHidden ? (
                  <EyeOff className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Eye className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}