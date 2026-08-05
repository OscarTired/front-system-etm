"use client"

import type { ReactNode } from "react"
import { boundingRect, perimeterOf } from "../engine/geometry"
import type { PlacedPiece } from "../engine/types"
import { BarChart3, Info } from "lucide-react"

export interface SheetStats {
  pieceCount: number
  usagePercent: number
  sheetArea: number
  usedArea: number
  totalCutLength: number
}

export interface PropertiesPanelProps {
  sheetStats: SheetStats | null
  selectedPiece: PlacedPiece | null
  /** Nombre legible (fileName del CAD), no el id interno. */
  selectedPieceName?: string | null
  espesor?: string
  material?: string
  /** Slot bajo propiedades (ej. fila editable del piece-list). */
  children?: ReactNode
  /** Overrides de instancia en plancha (editables). */
  overrideDx?: number
  overrideDy?: number
  overrideAngle?: number
  onOverrideChange?: (next: { dx: number; dy: number; angle: number }) => void
  onResetOverrides?: () => void
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs last:border-0 px-1">
      <span className="text-neutral-500">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-neutral-200" title={value}>
        {value}
      </span>
    </div>
  )
}

export function PropertiesPanel({
  sheetStats,
  selectedPiece,
  selectedPieceName,
  espesor,
  material,
  children,
  overrideDx = 0,
  overrideDy = 0,
  overrideAngle = 0,
  onOverrideChange,
  onResetOverrides,
}: PropertiesPanelProps) {
  if (selectedPiece) {
    const bounds = boundingRect(selectedPiece.outline)
    const perimeter = selectedPiece.subEntities?.length
      ? selectedPiece.subEntities.reduce((sum, s) => sum + perimeterOf(s.outline), 0)
      : perimeterOf(selectedPiece.outline)

    const name =
      selectedPieceName && selectedPieceName.trim()
        ? selectedPieceName
        : selectedPiece.pieceId

    return (
      <div className="flex flex-col gap-2 p-2">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            <Info className="h-3 w-3" /> Pieza seleccionada
          </span>
        </div>
        <div className="flex flex-col rounded-xl bg-white/3 p-1">
          <StatRow label="Nombre" value={name} />
          <StatRow label="Ancho × Alto" value={`${bounds.width.toFixed(1)} × ${bounds.height.toFixed(1)} mm`} />
          <StatRow label="Área" value={`${((bounds.width * bounds.height) / 1_000_000).toFixed(3)} m²`} />
          <StatRow label="Perímetro" value={`${perimeter.toFixed(0)} mm`} />
          <StatRow label="Rotación" value={`${selectedPiece.angle}°`} />
          <StatRow label="Color" value={selectedPiece.color ?? "—"} />
          {material && <StatRow label="Material" value={material} />}
          {espesor && <StatRow label="Espesor" value={`${espesor} mm`} />}
        </div>

        {onOverrideChange && (
          <div className="mt-1 flex flex-col gap-1.5 rounded-xl bg-white/3 p-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Posición en plancha
              </span>
              {onResetOverrides && (
                <button
                  type="button"
                  className="text-[10px] text-neutral-400 hover:text-white"
                  onClick={onResetOverrides}
                >
                  Restablecer
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  ["dx", overrideDx, "ΔX mm"],
                  ["dy", overrideDy, "ΔY mm"],
                  ["angle", overrideAngle, "Áng °"],
                ] as const
              ).map(([key, val, label]) => (
                <label key={key} className="flex flex-col gap-0.5">
                  <span className="px-0.5 text-[9px] text-neutral-500">{label}</span>
                  <input
                    type="number"
                    step={key === "angle" ? 1 : 0.1}
                    className="h-7 rounded-md border-none bg-white/5 px-1.5 text-xs text-neutral-100 outline-none focus:ring-1 focus:ring-white/20"
                    value={Number.isFinite(val) ? val : 0}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value)
                      if (!Number.isFinite(n)) return
                      onOverrideChange({
                        dx: key === "dx" ? n : overrideDx,
                        dy: key === "dy" ? n : overrideDy,
                        angle: key === "angle" ? n : overrideAngle,
                      })
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {children && <div className="mt-1 flex flex-col gap-1">{children}</div>}
      </div>
    )
  }

  if (sheetStats) {
    return (
      <div className="flex flex-col gap-1 p-2">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            <BarChart3 className="h-3 w-3" /> Plancha activa
          </span>
        </div>
        <div className="flex flex-col rounded-xl bg-white/3 p-1">
          <StatRow label="Piezas" value={String(sheetStats.pieceCount)} />
          <StatRow label="Aprovechamiento" value={`${sheetStats.usagePercent.toFixed(1)}%`} />
          <StatRow label="Área plancha" value={`${(sheetStats.sheetArea / 1_000_000).toFixed(3)} m²`} />
          <StatRow label="Área usada" value={`${(sheetStats.usedArea / 1_000_000).toFixed(3)} m²`} />
          <StatRow label="Corte total" value={`${sheetStats.totalCutLength.toFixed(0)} mm`} />
          {material && <StatRow label="Material" value={material} />}
          {espesor && <StatRow label="Espesor" value={`${espesor} mm`} />}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-xs text-neutral-500">
      <Info className="h-5 w-5 opacity-40" />
      Selecciona una pieza o nestear para ver propiedades.
    </div>
  )
}