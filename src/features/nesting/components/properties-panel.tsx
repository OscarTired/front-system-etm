"use client"

import { ScrollArea } from "@/components/ui/scroll-area"

import { useState } from "react"
import {
  ChevronRight,
  Info,
  Lock,
  Unlock,
  Copy,
  ClipboardPaste,
  AlertTriangle,
  BarChart3,
} from "lucide-react"

import type { ReactNode } from "react"
import { boundingRect, perimeterOf } from "../engine/geometry"
import type { PlacedPiece } from "../engine/types"

export interface SheetStats {
  pieceCount: number
  usagePercent: number
  sheetArea: number
  usedArea: number
  totalCutLength: number
}

export type CollisionPairInfo = {
  a: number
  b: number
  nameA: string
  nameB: string
}

export interface PropertiesPanelProps {
  sheetStats: SheetStats | null
  selectedPiece: PlacedPiece | null
  selectedPieceName?: string | null
  selectedPieceIndex?: number | null
  espesor?: string
  material?: string
  children?: ReactNode
  overrideDx?: number
  overrideDy?: number
  overrideAngle?: number
  onOverrideChange?: (next: { dx: number; dy: number; angle: number }) => void
  onResetOverrides?: () => void
  collisionPairs?: CollisionPairInfo[]
  onSelectPieceIndex?: (index: number) => void
  locked?: boolean
  onToggleLock?: () => void
  onCopyOffsets?: () => void
  onPasteOffsets?: () => void
  canPasteOffsets?: boolean
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
  selectedPieceIndex = null,
  espesor,
  material,
  children,
  overrideDx = 0,
  overrideDy = 0,
  overrideAngle = 0,
  onOverrideChange,
  onResetOverrides,
  collisionPairs = [],
  onSelectPieceIndex,
  locked = false,
  onToggleLock,
  onCopyOffsets,
  onPasteOffsets,
  canPasteOffsets = false,
}: PropertiesPanelProps) {
  const relevantCollisions =
    selectedPieceIndex != null
      ? collisionPairs.filter(
          (p) => p.a === selectedPieceIndex || p.b === selectedPieceIndex,
        )
      : collisionPairs

  const [isExpanded, setIsExpanded] = useState(true)

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
      <div className="flex flex-col rounded-xl bg-white/2 p-1 transition-colors">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsExpanded((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setIsExpanded((prev) => !prev)
            }
          }}
          className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left cursor-pointer hover:bg-white/3"
        >
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Pieza seleccionada</span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleLock && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleLock()
                }}
                title={locked ? "Desbloquear" : "Bloquear posición"}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
                  locked
                    ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                    : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                {locked ? "Bloqueada" : "Bloquear"}
              </button>
            )}
            <ChevronRight
              className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </div>
        </div>

        <div
          className={`flex flex-col gap-3 overflow-hidden transition-all duration-200 ease-in-out ${
            isExpanded ? "mt-2 max-h-200 opacity-100 p-1" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex flex-col rounded-lg bg-black/20 p-2.5">
            <StatRow label="Nombre" value={name} />
            <StatRow
              label="Ancho × Alto"
              value={`${bounds.width.toFixed(1)} × ${bounds.height.toFixed(1)} mm`}
            />
            <StatRow label="Perímetro" value={`${perimeter.toFixed(0)} mm`} />
            <StatRow label="Ángulo base" value={`${selectedPiece.angle}°`} />
            {locked && (
              <div className="px-1 py-1 text-[10px] text-amber-400/90">
                Posición bloqueada — no se mueve al arrastrar.
              </div>
            )}
          </div>

          {onOverrideChange && (
            <div className="flex flex-col rounded-lg bg-black/20 p-2.5 gap-2">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  Posición en plancha
                </span>
                <div className="flex items-center gap-1">
                  {onCopyOffsets && (
                    <button
                      type="button"
                      onClick={onCopyOffsets}
                      title="Copiar offsets (ΔX ΔY Áng)"
                      className="rounded-md p-1 text-neutral-500 hover:bg-white/10 hover:text-white"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                  {onPasteOffsets && (
                    <button
                      type="button"
                      disabled={!canPasteOffsets}
                      onClick={onPasteOffsets}
                      title="Pegar offsets"
                      className="rounded-md p-1 text-neutral-500 hover:bg-white/10 hover:text-white disabled:opacity-30"
                    >
                      <ClipboardPaste className="h-3 w-3" />
                    </button>
                  )}
                  {onResetOverrides && (
                    <button
                      type="button"
                      onClick={onResetOverrides}
                      className="rounded-md px-1.5 py-0.5 text-[10px] text-neutral-400 hover:bg-white/10 hover:text-white"
                    >
                      Restablecer
                    </button>
                  )}
                </div>
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
                      disabled={locked}
                      className="h-7 rounded-md border-none bg-neutral-950/50 px-1.5 text-xs text-neutral-100 outline-none focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-40 text-center"
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

          {relevantCollisions.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-lg bg-red-500/10 p-2.5">
              <span className="flex items-center gap-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                <AlertTriangle className="h-3 w-3" />
                Colisiones ({relevantCollisions.length})
              </span>
              <ul className="flex flex-col gap-0.5">
                {relevantCollisions.map((p) => {
                  const other = p.a === selectedPieceIndex ? p.b : p.a
                  const otherName = p.a === selectedPieceIndex ? p.nameB : p.nameA
                  return (
                    <li key={`${p.a}-${p.b}`}>
                      <button
                        type="button"
                        onClick={() => onSelectPieceIndex?.(other)}
                        className="w-full rounded-lg px-1.5 py-1 text-left text-[11px] text-red-300/90 transition-colors hover:bg-red-500/15 hover:text-red-200"
                      >
                        Solapa con <span className="font-medium">#{other + 1}</span>{" "}
                        <span className="text-red-400/70">{otherName}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {children && <div className="mt-1 flex flex-col gap-1">{children}</div>}
        </div>
      </div>
    )
  }

  if (sheetStats) {
    return (
      <div className="flex flex-col rounded-xl bg-white/2 p-1 transition-colors">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsExpanded((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setIsExpanded((prev) => !prev)
            }
          }}
          className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left cursor-pointer hover:bg-white/3"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Plancha activa</span>
          </div>

          <ChevronRight
            className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        </div>

        <div
          className={`flex flex-col gap-3 overflow-hidden transition-all duration-200 ease-in-out ${
            isExpanded ? "mt-2 max-h-150 opacity-100 p-1" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex flex-col rounded-lg bg-black/20 p-2.5">
            <StatRow label="Piezas" value={String(sheetStats.pieceCount)} />
            <StatRow label="Aprovechamiento" value={`${sheetStats.usagePercent.toFixed(1)}%`} />
            <StatRow label="Área plancha" value={`${(sheetStats.sheetArea / 1_000_000).toFixed(3)} m²`} />
            <StatRow label="Área usada" value={`${(sheetStats.usedArea / 1_000_000).toFixed(3)} m²`} />
            <StatRow label="Corte total" value={`${sheetStats.totalCutLength.toFixed(0)} mm`} />
            {material && <StatRow label="Material" value={material} />}
            {espesor && <StatRow label="Espesor" value={`${espesor} mm`} />}
          </div>

          {collisionPairs.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-lg bg-red-500/10 p-2.5">
              <span className="flex items-center gap-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                <AlertTriangle className="h-3 w-3" />
                Colisiones en plancha ({collisionPairs.length})
              </span>
              <ScrollArea className="max-h-40 min-w-0 w-full">
              <ul className="flex min-w-0 w-full flex-col gap-0.5">
                {collisionPairs.map((p) => (
                  <li key={`${p.a}-${p.b}`}>
                    <button
                      type="button"
                      onClick={() => onSelectPieceIndex?.(p.a)}
                      className="w-full rounded-lg px-1.5 py-1 text-left text-[11px] text-red-300/90 transition-colors hover:bg-red-500/15"
                    >
                      <span className="font-medium">#{p.a + 1}</span> {p.nameA}
                      <span className="text-red-500/60"> ↔ </span>
                      <span className="font-medium">#{p.b + 1}</span> {p.nameB}
                    </button>
                  </li>
                ))}
              </ul>
              </ScrollArea>
            </div>
          )}
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