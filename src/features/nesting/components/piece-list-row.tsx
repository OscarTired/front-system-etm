"use client"

import { AlertTriangle, Copy, Eye, Trash2, Crosshair } from "lucide-react"
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
  /** Ubicar la pieza en la plancha nesteada (cambia tab + selección). */
  onLocate?: (row: CadRow) => void
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
  onLocate,
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
        "bg-foreground/5 hover:bg-foreground/5",
        highlighted && "ring-1 ring-blue-400/50 bg-blue-500/10",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="min-w-0 flex-1 truncate text-xs font-medium text-foreground" title={row.fileName}>
          {row.fileName}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {onLocate && (
            <Button
              size="icon-sm"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => onLocate(row)}
              title="Ubicar en plancha"
            >
              <Crosshair className="h-3.5 w-3.5" />
            </Button>
          )}
          {onPreview && (
            <Button
              size="icon-sm"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => onPreview(row)}
              title="Ver pieza"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border w-full">
        <div className="min-w-0 flex-1 flex items-center gap-1 text-[10px] text-muted-foreground truncate">
          <span className="shrink-0">
            {row.width.toFixed(0)}×{row.height.toFixed(0)}
          </span>
          {row.material.thickness > 0 && (
            <span className="text-muted-foreground truncate">
              · {row.material.thickness}mm
              {row.material.dinNorm !== "N/D" && ` · ${row.material.dinNorm}`}
            </span>
          )}
          {conflict && (
            <span className="shrink-0 text-amber-800 dark:text-amber-400" title="Conflicto de material — ver Diagnóstico">
              <AlertTriangle className="h-3.5 w-3.5" />
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
            className="h-7 text-xs w-14 shrink-0 px-1 text-center bg-foreground/5 border-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button
            size="icon-sm"
            variant="ghost"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            disabled={disabled}
            onClick={() => onDuplicate(row.id)}
            title="Duplicar pieza"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
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
