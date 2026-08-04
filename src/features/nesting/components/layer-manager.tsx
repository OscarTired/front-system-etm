"use client"

import { Eye, EyeOff, Layers } from "lucide-react"
import type { LayerInfo } from "./dxf-canvas/dxf-canvas"

export interface LayerManagerProps {
  layers: LayerInfo[]
  hiddenKeys: Set<string>
  onToggle: (key: string) => void
  onShowAll: () => void
}

export function LayerManager({ layers, hiddenKeys, onToggle, onShowAll }: LayerManagerProps) {
  if (layers.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-neutral-500">
        Nesteá primero para ver las capas de la plancha activa.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          <Layers className="h-3 w-3" /> Capas ({layers.length})
        </span>
        {hiddenKeys.size > 0 && (
          <button onClick={onShowAll} className="text-[10px] text-cyan-400 hover:text-cyan-300">
            Mostrar todas
          </button>
        )}
      </div>

      {layers.map((layer) => {
        const isHidden = hiddenKeys.has(layer.key.toUpperCase())
        return (
          <button
            key={layer.key}
            onClick={() => onToggle(layer.key)}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${isHidden ? "text-neutral-600" : "text-neutral-200 hover:bg-white/5"}`}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: layer.color, opacity: isHidden ? 0.3 : 1 }}
            />
            <span className="min-w-0 flex-1 truncate" title={layer.label}>{layer.label}</span>
            <span className="shrink-0 text-[10px] text-neutral-600">{layer.count}</span>
            {isHidden ? <EyeOff className="h-3.5 w-3.5 shrink-0" /> : <Eye className="h-3.5 w-3.5 shrink-0 text-neutral-500" />}
          </button>
        )
      })}
    </div>
  )
}