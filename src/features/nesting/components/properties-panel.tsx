"use client"

import { boundingRect, perimeterOf } from "../engine/geometry"
import type { PlacedPiece } from "../engine/types"

export interface SheetStats {
  pieceCount: number
  usagePercent: number
  sheetArea: number
  usedArea: number
  /** Suma de perímetros de corte de todas las piezas — proxy de tiempo/costo de corte. */
  totalCutLength: number
}

export interface PropertiesPanelProps {
  sheetStats: SheetStats | null
  selectedPiece: PlacedPiece | null
  /** Espesor/material de la sesión — el Inspector no calcula esto, solo lo muestra. */
  espesor?: string
  material?: string
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2 text-xs last:border-0">
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
      <div className="flex flex-col">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">Pieza seleccionada</h3>
        <StatRow label="Nombre" value={selectedPiece.pieceId} />
        <StatRow label="Ancho × Alto" value={`${bounds.width.toFixed(1)} × ${bounds.height.toFixed(1)} mm`} />
        <StatRow label="Área" value={`${((bounds.width * bounds.height) / 1_000_000).toFixed(3)} m²`} />
        <StatRow label="Perímetro" value={`${perimeter.toFixed(0)} mm`} />
        <StatRow label="Rotación" value={`${selectedPiece.angle}°`} />
        <StatRow label="Color" value={selectedPiece.color ?? "—"} />
        {material && <StatRow label="Material" value={material} />}
        {espesor && <StatRow label="Espesor" value={`${espesor} mm`} />}
      </div>
    )
  }

  if (sheetStats) {
    return (
      <div className="flex flex-col">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">Plancha activa</h3>
        <StatRow label="Piezas" value={String(sheetStats.pieceCount)} />
        <StatRow
          label="% Aprovechamiento"
          value={`${sheetStats.usagePercent.toFixed(1)}%`}
        />
        <StatRow label="Área plancha" value={`${(sheetStats.sheetArea / 1_000_000).toFixed(3)} m²`} />
        <StatRow label="Área utilizada" value={`${(sheetStats.usedArea / 1_000_000).toFixed(3)} m²`} />
        <StatRow label="Long. total de corte" value={`${(sheetStats.totalCutLength / 1000).toFixed(2)} m`} />
        {material && <StatRow label="Material" value={material} />}
        {espesor && <StatRow label="Espesor" value={`${espesor} mm`} />}
        <p className="mt-3 text-[11px] leading-relaxed text-neutral-600">
          Tiempo estimado, perforaciones y costo requieren parámetros de máquina (velocidad de corte,
          costo/hora) que todavía no están cableados al motor — el campo queda listo en el panel de Máquina
          para cuando se agreguen.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center text-center text-xs text-neutral-600">
      Selecciona una pieza en el canvas, o nestea para ver estadísticas de la plancha.
    </div>
  )
}
