"use client"

import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Trash2, FileInput, FileWarning, AlertTriangle, Eye, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { isSupportedCadFile, readCadFile } from "../cad/cad-reader"
import { isPdfFile, parsePdf } from "../cad/pdf-parser"
import { scanMaterialData, isValidMaterialData, type MaterialData } from "../cad/thickness-scanner"
import type { PieceOutline, SubEntity } from "../engine/types"

export interface PieceListHandle {
  triggerImport: () => void
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

export type PieceRow = CadRow

export interface PieceListProps {
  rows: PieceRow[]
  conflictIds: Set<string>
  disabled: boolean
  onAddCad: (rows: CadRow[]) => void
  onRemove: (id: string) => void
  onUpdateQuantity: (id: string, quantity: string) => void
  onPreviewRow: (row: CadRow) => void
  nextColor: () => string
}

export const PieceList = memo(forwardRef<PieceListHandle, PieceListProps>(function PieceList(
  {
    rows,
    conflictIds,
    disabled,
    onAddCad,
    onRemove,
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

  // Auto-ocultar el mensaje de error después de 4 segundos
  useEffect(() => {
    if (!errorMsg) return

    const timer = setTimeout(() => {
      setErrorMsg(null)
    }, 4000)

    return () => clearTimeout(timer)
  }, [errorMsg])

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newRows: CadRow[] = []
    const rejected: string[] = []
    const duplicated: string[] = []

    const existingFileNames = new Set(rows.map((r) => r.fileName.toLowerCase()))

    for (const file of Array.from(files)) {
      if (file.size === 0) continue

      if (existingFileNames.has(file.name.toLowerCase())) {
        duplicated.push(file.name)
        continue
      }

      if (isPdfFile(file.name)) {
        try {
          const buffer = await file.arrayBuffer()
          const cadData = await parsePdf(file.name, buffer)
          if (!cadData.valid || cadData.outline.points.length === 0) {
            rejected.push(`${file.name} (sin geometría vectorial legible)`)
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
            material: scanMaterialData(file.name, ""),
          })
          existingFileNames.add(file.name.toLowerCase())
        } catch {
          rejected.push(`${file.name} (no se pudo leer el PDF)`)
        }
        continue
      }

      if (!isSupportedCadFile(file.name)) {
        rejected.push(`${file.name} (formato no soportado)`)
        continue
      }
      
      const text = await file.text()
      if (!text.trim()) continue

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
      existingFileNames.add(file.name.toLowerCase())
    }

    const messages: string[] = []
    if (duplicated.length > 0) messages.push(`Ya subidos: ${duplicated.join(", ")}`)
    if (rejected.length > 0) messages.push(`No se pudieron importar: ${rejected.join(", ")}`)

    setErrorMsg(messages.length > 0 ? messages.join(" | ") : null)
    if (newRows.length > 0) onAddCad(newRows)
  }

  const handleQuantityChange = (id: string, value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      onUpdateQuantity(id, value)
    }
  }

  return (
    <div className="flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="mb-2 flex shrink-0 items-center justify-between px-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Piezas</h2>
        <Button size="icon-sm" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={disabled} title="Importar archivos">
          <FileInput className="h-4 w-4" />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".dxf,.geo,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFilesSelected(e.target.files)
          e.target.value = ""
        }}
      />

      {errorMsg && (
        <p className="mb-2 mx-3 shrink-0 flex items-start gap-1.5 rounded-lg bg-destructive/10 p-2 text-xs text-destructive animate-in fade-in duration-200">
          <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}

      <div className="flex h-0 min-h-0 flex-1 flex-col w-full">
        {rows.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
              <Layers className="h-5 w-5 text-neutral-500" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-neutral-400">No hay archivos</p>
              <p className="text-[11px] text-neutral-500">Importa archivos DXF, GEO o PDF para comenzar.</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full w-full">
            <div className="flex flex-col gap-2 w-full px-3 box-border">  
              {rows.map((row) => (
                <div  
                  key={row.id}
                  className={`flex flex-col gap-2 rounded-lg p-3 transition-colors text-xs w-full box-border ${
                    conflictIds.has(row.id) ? "bg-amber-500/15 ring-1 ring-amber-500/30" : "bg-white/3 hover:bg-white/5 border border-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-200" title={row.fileName}>
                      {row.fileName}
                    </div>
                    <Button size="icon-sm" variant="ghost" className="h-6 w-6 shrink-0 text-neutral-300 hover:text-white" onClick={() => onPreviewRow(row)} title="Ver pieza">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 w-full">
                    <div className="min-w-0 flex-1 flex items-center gap-1 text-[10px] text-neutral-400 truncate">
                      <span className="shrink-0">{row.width.toFixed(0)}×{row.height.toFixed(0)}</span>
                      {isValidMaterialData(row.material) && (
                        <span className="text-neutral-500 truncate">
                          · {row.material.thickness}mm{row.material.dinNorm !== "N/D" && ` · ${row.material.dinNorm}`}
                        </span>
                      )}
                      {conflictIds.has(row.id) && (
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
                        onChange={(e) => handleQuantityChange(row.id, e.target.value)} 
                        className="h-7 text-xs w-14 shrink-0 px-1 text-center bg-white/5 border-white/10" 
                      />
                      
                      <Button size="icon-sm" variant="ghost" className="h-7 w-7 text-neutral-400 hover:text-destructive" disabled={disabled} onClick={() => onRemove(row.id)} title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}))