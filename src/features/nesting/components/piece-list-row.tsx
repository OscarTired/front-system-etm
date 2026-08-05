"use client"

import { AlertTriangle, Copy, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/shared/utils/utils"
import type { CadRow } from "./piece-list"

export interface PieceListRowProps {
  row: CadRow
  conflict?: boolean
  disabled?: boolean
  /** Resalta la fila (ej. pieza seleccionada en canvas). */
  highlighted?: boolean
  onPreview?: (row: CadRow) => void
  onUpdateQuantity: (id: string, quantity: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  className?: string
}

/**
 * Fila canónica de pieza — misma UI y mismos handlers que la lista.
 * Usar aquí y en el inspector para no duplicar lógica.
 */
export function PieceListRow({
  row,
  conflict = false,
  disabled = false,
  highlighted = false,
  onPreview,
  onUpdateQuantity,
  onDuplicate,
  onRemove,
  className,
}: PieceListRowProps) {
  const handleQuantityChange = (value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return
    onUpdateQuantity(row.id, value)
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg p-3 transition-colors text-xs w-full box-border",
        conflict ? "bg-amber-500/15" : "bg-white/3 hover:bg-white/5",
        highlighted && "ring-1 ring-blue-400/50 bg-blue-500/10",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-200" title={row.fileName}>
          {row.fileName}
        </div>
        {onPreview && (
          <Button
            size="icon-sm"
            variant="ghost"
            className="h-6 w-6 shrink-0 text-neutral-300 hover:text-white"
            onClick={() => onPreview(row)}
            title="Ver pieza"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 w-full">
        <div className="min-w-0 flex-1 flex items-center gap-1 text-[10px] text-neutral-400 truncate">
          <span className="shrink-0">
            {row.width.toFixed(0)}×{row.height.toFixed(0)}
          </span>
          {row.material.thickness > 0 && (
            <span className="text-neutral-500 truncate">
              · {row.material.thickness}mm
              {row.material.dinNorm !== "N/D" && ` · ${row.material.dinNorm}`}
            </span>
          )}
          {conflict && (
            <span className="flex items-center gap-0.5 text-amber-400 shrink-0">
              <AlertTriangle className="h-2.5 w-2.5" /> conflicto
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Input
            placeholder="Cant."
            inputMode="numeric"
            value={row.quantity}
            disabled={disabled}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="h-7 text-xs w-14 shrink-0 px-1 text-center bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button
            size="icon-sm"
            variant="ghost"
            className="h-7 w-7 shrink-0 text-neutral-400 hover:text-white"
            disabled={disabled}
            onClick={() => onDuplicate(row.id)}
            title="Duplicar pieza"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="h-7 w-7 text-neutral-400 hover:text-destructive"
            disabled={disabled}
            onClick={() => onRemove(row.id)}
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}