"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import { Plus, Trash2, FileInput, FileWarning, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  selectedRowId: string | null
  conflictIds: Set<string>
  disabled: boolean
  onAddManual: () => void
  onAddCad: (rows: CadRow[]) => void
  onRemove: (id: string) => void
  onUpdateManual: (id: string, patch: Partial<ManualRow>) => void
  onUpdateQuantity: (id: string, quantity: string) => void
  onSelectRow: (row: CadRow) => void
  nextColor: () => string
}

export const PieceList = forwardRef<PieceListHandle, PieceListProps>(function PieceList(
  {
    rows,
    selectedRowId,
    conflictIds,
    disabled,
    onAddManual,
    onAddCad,
    onRemove,
    onUpdateManual,
    onUpdateQuantity,
    onSelectRow,
    nextColor,
  },
  ref
) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

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

    if (rejected.length > 0 && errorRef.current) {
      errorRef.current.textContent = `No se pudieron importar: ${rejected.join(", ")}`
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

      <p ref={errorRef} className="mb-2 flex items-start gap-1.5 rounded-lg bg-destructive/10 p-2 text-xs text-destructive empty:hidden">
        <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      </p>

      <div className="flex min-h-[140px] flex-1 flex-col gap-1 overflow-y-auto">
        {rows.map((row) => (
          <div
            key={row.id}
            onClick={() => row.source === "cad" && onSelectRow(row)}
            role={row.source === "cad" ? "button" : undefined}
            tabIndex={row.source === "cad" ? 0 : undefined}
            onKeyDown={(e) => {
              if (row.source === "cad" && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault()
                onSelectRow(row)
              }
            }}
            className={`flex items-center gap-2 rounded-lg p-1.5 transition-colors ${row.source === "cad" ? "cursor-pointer" : ""} ${
              conflictIds.has(row.id) ? "bg-amber-500/10 ring-1 ring-amber-500/30" : "hover:bg-white/5"
            } ${selectedRowId === row.id ? "bg-white/5 ring-1 ring-primary/50" : ""}`}
          >
            {row.source === "manual" && (
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} aria-hidden />
            )}

            {row.source === "manual" ? (
              <div className="flex flex-1 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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

            <div onClick={(e) => e.stopPropagation()} className="flex shrink-0 items-center gap-1">
              <Input placeholder="Cant." inputMode="numeric" value={row.quantity} disabled={disabled} onChange={(e) => onUpdateQuantity(row.id, e.target.value)} className="w-12 shrink-0" />
              <Button size="icon-sm" variant="ghost" disabled={disabled || rows.length <= 1} onClick={() => onRemove(row.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
