"use client"

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
  espesor?: string
  material?: string
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs last:border-0 px-1">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-200">{value}</span>
    </div>
  )
}

export function PropertiesPanel({ sheetStats, selectedPiece, espesor, material }: PropertiesPanelProps) {
  if (selectedPiece) {
    const bounds = boundingRect(selectedPiece.outline)
    const perimeter = selectedPiece.subEntities?.length
      ? selectedPiece.subEntities.reduce((sum, s) => sum + perimeterOf(s.outline), 0)
      : perimeterOf(selectedPiece.outline)

    return (
      <div className="flex flex-col gap-1 p-2">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            <Info className="h-3 w-3" /> Pieza seleccionada
          </span>
        </div>
        <div className="flex flex-col rounded-xl bg-white/3 p-1">
          <StatRow label="Nombre" value={selectedPiece.pieceId} />
          <StatRow label="Ancho × Alto" value={`${bounds.width.toFixed(1)} × ${bounds.height.toFixed(1)} mm`} />
          <StatRow label="Área" value={`${((bounds.width * bounds.height) / 1_000_000).toFixed(3)} m²`} />
          <StatRow label="Perímetro" value={`${perimeter.toFixed(0)} mm`} />
          <StatRow label="Rotación" value={`${selectedPiece.angle}°`} />
          <StatRow label="Color" value={selectedPiece.color ?? "—"} />
          {material && <StatRow label="Material" value={material} />}
          {espesor && <StatRow label="Espesor" value={`${espesor} mm`} />}
        </div>
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
          <StatRow label="% Aprovechamiento" value={`${sheetStats.usagePercent.toFixed(1)}%`} />
          <StatRow label="Área plancha" value={`${(sheetStats.sheetArea / 1_000_000).toFixed(3)} m²`} />
          <StatRow label="Área utilizada" value={`${(sheetStats.usedArea / 1_000_000).toFixed(3)} m²`} />
          <StatRow label="Long. total de corte" value={`${(sheetStats.totalCutLength / 1000).toFixed(2)} m`} />
          {material && <StatRow label="Material" value={material} />}
          {espesor && <StatRow label="Espesor" value={`${espesor} mm`} />}
        </div>
        <p className="mt-2 px-1 text-[10px] leading-relaxed text-neutral-600">
          Tiempo estimado, perforaciones y costo requieren parámetros de máquina (velocidad de corte, costo/hora) que todavía no están cableados al motor.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 text-center text-xs text-neutral-500">
      Selecciona una pieza en el canvas, o nestea para ver estadísticas de la plancha.
    </div>
  )
}