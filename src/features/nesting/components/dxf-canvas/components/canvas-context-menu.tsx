"use client"

import {
  Trash2,
  MousePointer2,
  Hand,
  Maximize2,
  RotateCw,
  Focus,
  CircleSlash,
  Move,
  MoveHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CanvasTool, TransformMode } from "../types/types"

/**
 * Menú contextual (anticlick) del canvas — extraído de dxf-canvas.tsx
 * (que ya pasaba las 1500 líneas). Es puramente presentacional: no
 * tiene estado propio, solo recibe qué hay seleccionado y los mismos
 * callbacks que ya existían en dxf-canvas.tsx, sin cambiar ninguna
 * lógica.
 */
export interface CanvasContextMenuProps {
  ctxMenu: { x: number; y: number; pieceIndex: number | null } | null
  onClose: () => void
  selectedPieceIndices: number[]
  rotationStep: number
  transformMode: TransformMode
  onRotateSelected?: (pieceIndices: number[], degrees: number) => void
  onTransformModeChange?: (mode: TransformMode) => void
  onDeleteSelected?: (pieceIndices: number[]) => void
  onSelectPiece?: (index: number | null, additive: boolean) => void
  onFit: () => void
  onFocusSelected: () => void
  onSetCanvasTool: (tool: CanvasTool) => void
}

export function CanvasContextMenu({
  ctxMenu,
  onClose,
  selectedPieceIndices,
  rotationStep,
  transformMode,
  onRotateSelected,
  onTransformModeChange,
  onDeleteSelected,
  onSelectPiece,
  onFit,
  onFocusSelected,
  onSetCanvasTool,
}: CanvasContextMenuProps) {
  if (!ctxMenu) return null

  const hasSelection = ctxMenu.pieceIndex !== null || selectedPieceIndices.length > 0

  return (
    <DropdownMenu open onOpenChange={(o) => { if (!o) onClose() }}>
      <DropdownMenuTrigger asChild>
        <span
          className="fixed h-0 w-0"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-48 border-white/10 bg-[#141416] text-neutral-100">
        {/* Siempre primero: ajustar a plancha */}
        <DropdownMenuItem onClick={() => onFit()}>
          <Maximize2 className="mr-2 h-4 w-4 opacity-70" />
          Ajustar a plancha
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        {hasSelection ? (
          <>
            <DropdownMenuItem
              disabled={!onRotateSelected || selectedPieceIndices.length === 0}
              onClick={() => onRotateSelected?.(selectedPieceIndices, rotationStep)}
            >
              <RotateCw className="mr-2 h-4 w-4 opacity-70" />
              Rotar +{rotationStep}°
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!onRotateSelected || selectedPieceIndices.length === 0}
              onClick={() => onRotateSelected?.(selectedPieceIndices, -rotationStep)}
            >
              <RotateCw className="mr-2 h-4 w-4 opacity-70 -scale-x-100" />
              Rotar -{rotationStep}°
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={selectedPieceIndices.length === 0}
              onClick={() => onSetCanvasTool("rotate")}
            >
              <RotateCw className="mr-2 h-4 w-4 opacity-70" />
              Rotar libre (arrastrar)
              <span className="ml-auto text-[10px] text-neutral-500">Shift = 15°</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={selectedPieceIndices.length === 0}
              onClick={() => onFocusSelected()}
            >
              <Focus className="mr-2 h-4 w-4 opacity-70" />
              Enfocar selección
            </DropdownMenuItem>
            {onTransformModeChange && (
              <DropdownMenuItem
                onClick={() =>
                  onTransformModeChange(transformMode === "free" ? "geometric" : "free")
                }
              >
                {transformMode === "free" ? (
                  <MoveHorizontal className="mr-2 h-4 w-4 opacity-70" />
                ) : (
                  <Move className="mr-2 h-4 w-4 opacity-70" />
                )}
                {transformMode === "free" ? "Restringir a un eje" : "Movimiento libre"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              disabled={selectedPieceIndices.length === 0}
              onClick={() => onSelectPiece?.(null, false)}
            >
              <CircleSlash className="mr-2 h-4 w-4 opacity-70" />
              Quitar selección
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              variant="destructive"
              disabled={!onDeleteSelected || selectedPieceIndices.length === 0}
              onClick={() => onDeleteSelected?.(selectedPieceIndices)}
            >
              <Trash2 className="mr-2 h-4 w-4 opacity-70" />
              Eliminar…
              <span className="ml-auto text-[10px] text-neutral-500">Supr</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => onSetCanvasTool("select")}>
              <MousePointer2 className="mr-2 h-4 w-4 opacity-70" />
              Seleccionar
              <span className="ml-auto text-[10px] text-neutral-500">V</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetCanvasTool("pan")}>
              <Hand className="mr-2 h-4 w-4 opacity-70" />
              Pan
              <span className="ml-auto text-[10px] text-neutral-500">H</span>
            </DropdownMenuItem>
            {onTransformModeChange && (
              <DropdownMenuItem
                onClick={() =>
                  onTransformModeChange(transformMode === "free" ? "geometric" : "free")
                }
              >
                {transformMode === "free" ? (
                  <MoveHorizontal className="mr-2 h-4 w-4 opacity-70" />
                ) : (
                  <Move className="mr-2 h-4 w-4 opacity-70" />
                )}
                {transformMode === "free"
                  ? "Restringir movimiento a un eje"
                  : "Activar movimiento libre"}
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}