"use client"

import { forwardRef, memo, useImperativeHandle, useRef, useState } from "react"
import { Plus, Trash2, FileInput, FileWarning, AlertTriangle, Eye, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { isSupportedCadFile, readCadFile } from "../cad/cad-reader"
import { scanMaterialData, isValidMaterialData, type MaterialData } from "../cad/thickness-scanner"
import type { PieceOutline, SubEntity } from "../engine/types"

export interface PieceListHandle {
  triggerImport: () => void
}

export interface ManualRow {
  id: string
  source: "manual"
  width: string
  height: string
  quantity: string
  color: string
}

export interface CadRow {
  id: string
  source: "cad"
  fileName: string
  outline: PieceOutline
  subEntities: SubEntity[]
  width: number
  height: number
  quantity: string
  color: string
  material: MaterialData
}

export type PieceRow = ManualRow | CadRow

export interface PieceListProps {
  rows: PieceRow[]
  conflictIds: Set<string>
  disabled: boolean
  onAddManual: () => void
  onAddCad: (rows: CadRow[]) => void
  onRemove: (id: string) => void
  onUpdateManual: (id: string, patch: Partial<ManualRow>) => void
  onUpdateQuantity: (id: string, quantity: string) => void
  onPreviewRow: (row: CadRow) => void
  nextColor: () => string
}

export const PieceList = memo(forwardRef<PieceListHandle, PieceListProps>(function PieceList(
  {
    rows,
    conflictIds,
    disabled,
    onAddManual,
    onAddCad,
    onRemove,
    onUpdateManual,
    onUpdateQuantity,
    onPreviewRow,
    nextColor,
  },
  ref
) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useImperativeHandle(ref, () => ({
    triggerImport: () => fileInputRef.current?.click(),
  }))

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newRows: CadRow[] = []
    const rejected: string[] = []

    for (const file of Array.from(files)) {
      if (!isSupportedCadFile(file.name)) {
        rejected.push(`${file.name} (formato no soportado)`)
        continue
      }
      const text = await file.text()
      const cadData = readCadFile(file.name, text)
      if (!cadData.valid || cadData.outline.points.length === 0) {
        rejected.push(`${file.name} (geometría inválida)`)
        continue
      }
      newRows.push({
        id: `cad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        source: "cad",
        fileName: file.name,
        outline: cadData.outline,
        subEntities: cadData.entities.map((e) => ({ outline: e.outline, color: e.color, layer: e.layer })),
        width: cadData.width,
        height: cadData.height,
        quantity: "1",
        color: nextColor(),
        material: scanMaterialData(file.name, text),
      })
    }

    if (rejected.length > 0) {
      setErrorMsg(`No se pudieron importar: ${rejected.join(", ")}`)
    } else {
      setErrorMsg(null)
    }

    if (newRows.length > 0) onAddCad(newRows)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Piezas</h2>
        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={disabled} title="Importar DXF/GEO">
            <FileInput className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={onAddManual} disabled={disabled} title="Agregar pieza manual">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".dxf,.geo"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFilesSelected(e.target.files)
          e.target.value = ""
        }}
      />

      {errorMsg && (
        <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
          <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}

      <ScrollArea className="min-h-[140px] flex-1">
        {/* Lógica condicional: Si no hay piezas, muestra el placeholder. Si hay, muestra la lista. */}
        {rows.length === 0 ? (
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
              <Layers className="h-5 w-5 text-neutral-500" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-neutral-400">No hay piezas</p>
              <p className="text-xs text-neutral-500">Importa archivos o agrega piezas manualmente para comenzar a nestear.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 pr-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className={`flex items-center gap-2 rounded-lg p-1.5 transition-colors ${
                  conflictIds.has(row.id) ? "bg-amber-500/10 ring-1 ring-amber-500/30" : "hover:bg-white/5"
                }`}
              >
                {row.source === "manual" && (
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} aria-hidden />
                )}

                {row.source === "manual" ? (
                  <div className="flex flex-1 items-center gap-1.5">
                    <Input placeholder="Ancho" inputMode="decimal" value={row.width} disabled={disabled} onChange={(e) => onUpdateManual(row.id, { width: e.target.value })} className="w-0 flex-1" />
                    <span className="text-neutral-600">×</span>
                    <Input placeholder="Alto" inputMode="decimal" value={row.height} disabled={disabled} onChange={(e) => onUpdateManual(row.id, { height: e.target.value })} className="w-0 flex-1" />
                  </div>
                ) : (
                  <div className="w-0 flex-1 truncate" title={row.fileName}>
                    <div className="truncate text-sm text-neutral-300">{row.fileName}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      <span>{row.width.toFixed(0)}×{row.height.toFixed(0)}</span>
                      {isValidMaterialData(row.material) && (
                        <span className="text-neutral-600">
                          · {row.material.thickness}mm{row.material.dinNorm !== "N/D" && ` · ${row.material.dinNorm}`}
                        </span>
                      )}
                      {conflictIds.has(row.id) && (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <AlertTriangle className="h-2.5 w-2.5" /> conflicto
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {row.source === "cad" && (
                  <Button size="icon-sm" variant="ghost" onClick={() => onPreviewRow(row)} title="Ver pieza">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                )}

                <Input placeholder="Cant." inputMode="numeric" value={row.quantity} disabled={disabled} onChange={(e) => onUpdateQuantity(row.id, e.target.value)} className="w-12 shrink-0" />
                
                {/* Se eliminó la restricción rows.length <= 1 de este botón */}
                <Button size="icon-sm" variant="ghost" disabled={disabled} onClick={() => onRemove(row.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}))