"use client"

import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState, useMemo } from "react"
import { Import, FileWarning, AlertTriangle, Eye, Layers, Copy, Search, X, Trash2 } from "lucide-react"
import { PieceListRow } from "./piece-list-row"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { isSupportedCadFile, readCadFile } from "../cad/cad-reader"
import { isPdfFile, parsePdf } from "../cad/pdf-parser"
import { scanMaterialData, type MaterialData } from "../cad/thickness-scanner"
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
  onOpenDiagnostics?: () => void
  disabled: boolean
  onAddCad: (rows: CadRow[]) => void
  onRemove: (id: string) => void
  onClearAll: () => void
  onUpdateQuantity: (id: string, quantity: string) => void
  onPreviewRow: (row: CadRow) => void
  /** Ubicar pieza nesteada en tabs + canvas. */
  onLocateRow?: (row: CadRow) => void
  onRotate: (id: string, degrees: number) => void
  onMirrorX: (id: string) => void
  onMirrorY: (id: string) => void
  onDuplicate: (id: string) => void
  nextColor: () => string
  /** ids de filas resaltadas (selección en canvas). */
  highlightedIds?: Set<string>
}

type GroupByType = "none" | "thickness" | "material"

export const PieceList = memo(forwardRef<PieceListHandle, PieceListProps>(function PieceList(
  {
    rows,
    conflictIds,
    onOpenDiagnostics,
    disabled,
    onAddCad,
    onRemove,
    onClearAll,
    onUpdateQuantity,
    onPreviewRow,
    onLocateRow,
    onRotate,
    onMirrorX,
    onMirrorY,
    onDuplicate,
    nextColor,
    highlightedIds,
  },
  ref
) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<GroupByType>("none")
  const [searchQuery, setSearchQuery] = useState("")
  
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const dragCounterRef = useRef(0)

  useImperativeHandle(ref, () => ({
    triggerImport: () => fileInputRef.current?.click(),
  }))

  useEffect(() => {
    if (!errorMsg) return
    const timer = setTimeout(() => setErrorMsg(null), 4000)
    return () => clearTimeout(timer)
  }, [errorMsg])


  /** Misma base (sin extensión): heredar espesor/material de un hermano ya cargado. */
  const inheritMaterialFromSibling = (
    fileName: string,
    material: MaterialData,
    pool: CadRow[]
  ): MaterialData => {
    if (material.thickness > 0 && material.dinNorm !== "N/D") return material
    const stem = fileName.replace(/\.[^.]+$/, "").toLowerCase()
    const sibling = pool.find((r) => {
      const s = r.fileName.replace(/\.[^.]+$/, "").toLowerCase()
      return s === stem && r.material.thickness > 0
    })
    if (!sibling) return material
    return {
      thickness: material.thickness > 0 ? material.thickness : sibling.material.thickness,
      dinNorm: material.dinNorm !== "N/D" ? material.dinNorm : sibling.material.dinNorm,
      alloy: material.alloy !== "N/D" ? material.alloy : sibling.material.alloy,
    }
  }

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
            rejected.push(`${file.name} (sin geometría vectorial)`)
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
          rejected.push(`${file.name} (error al leer PDF)`)
        }
        continue
      }

      if (!isSupportedCadFile(file.name)) {
        rejected.push(`${file.name} (no soportado)`)
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
        material: inheritMaterialFromSibling(
          file.name,
          scanMaterialData(file.name, text),
          [...rows, ...newRows]
        ),
      })
      existingFileNames.add(file.name.toLowerCase())
    }

    const messages: string[] = []
    if (duplicated.length > 0) messages.push(`Duplicados: ${duplicated.join(", ")}`)
    if (rejected.length > 0) messages.push(`Rechazados: ${rejected.join(", ")}`)

    setErrorMsg(messages.length > 0 ? messages.join(" | ") : null)
    if (newRows.length > 0) onAddCad(newRows)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    dragCounterRef.current = 0
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFilesSelected(e.dataTransfer.files)
    }
  }

  const handleQuantityChange = (id: string, value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      onUpdateQuantity(id, value)
    }
  }

  const groupedEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const filtered = query
      ? rows.filter((r) =>
          r.fileName.toLowerCase().includes(query) ||
          r.material.dinNorm.toLowerCase().includes(query) ||
          r.material.alloy.toLowerCase().includes(query)
        )
      : rows

    if (groupBy === "none") return [{ groupKey: null, items: filtered }]

    const map = new Map<string, CadRow[]>()
    for (const row of filtered) {
      let key = "Sin clasificar"
      if (groupBy === "thickness") {
        key = row.material.thickness > 0 ? `${row.material.thickness} mm` : "Sin espesor"
      } else if (groupBy === "material") {
        key = row.material.dinNorm !== "N/D" ? row.material.dinNorm : (row.material.alloy !== "N/D" ? row.material.alloy : "Sin material")
      }
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(row)
    }
    return Array.from(map.entries()).map(([groupKey, items]) => ({ groupKey, items }))
  }, [rows, groupBy, searchQuery])

  return (
    <div 
      className="flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm border-2 border-dashed border-primary/50 flex flex-col items-center justify-center gap-2 p-4 text-center rounded-xl animate-in fade-in duration-150 pointer-events-none">
          <Import className="h-8 w-8 text-primary animate-bounce" />
          <p className="text-xs font-semibold text-white">Suelta tus archivos CAD aquí</p>
        </div>
      )}

      {/* Cabecera con título, contador y acciones globales */}
      <div className="mb-2 flex shrink-0 items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Piezas</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-neutral-400 font-medium">
            {rows.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onOpenDiagnostics && rows.length > 0 && (
            <Button
              size="icon-sm"
              variant="ghost"
              className={conflictIds.size > 0 ? "text-amber-400 hover:text-amber-300" : "text-neutral-400 hover:text-white"}
              onClick={onOpenDiagnostics}
              title={
                conflictIds.size > 0
                  ? `Diagnóstico (${conflictIds.size} conflictos)`
                  : "Diagnóstico de piezas"
              }
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          )}
          {rows.length > 0 && (
            <Button size="icon-sm" variant="ghost" className="text-neutral-400 hover:text-destructive" onClick={onClearAll} disabled={disabled} title="Eliminar todos">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon-sm" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={disabled} title="Importar archivos">
            <Import className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="relative mb-2 shrink-0 px-3">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 bg-white/5 pl-7 pr-7 text-xs border-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 mb-2 shrink-0 overflow-x-auto hide-scrollbar">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Agrupar:</span>
          <button 
            onClick={() => setGroupBy("none")} 
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${groupBy === "none" ? "bg-white/10 text-white font-medium" : "text-neutral-400 hover:text-white"}`}
          >
            Ninguno
          </button>
          <button 
            onClick={() => setGroupBy("thickness")} 
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${groupBy === "thickness" ? "bg-white/10 text-white font-medium" : "text-neutral-400 hover:text-white"}`}
          >
            Espesor
          </button>
          <button 
            onClick={() => setGroupBy("material")} 
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${groupBy === "material" ? "bg-white/10 text-white font-medium" : "text-neutral-400 hover:text-white"}`}
          >
            Material
          </button>
        </div>
      )}

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
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer border-2 border-dashed border-white/10 rounded-xl m-3 hover:border-white/25 transition-colors bg-white/2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
              <Layers className="h-5 w-5 text-neutral-500" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-neutral-400">Arrastra archivos o haz clic</p>
              <p className="text-[11px] text-neutral-500">Soporta DXF, GEO o PDF</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full w-full">
            <div className="flex flex-col gap-3 w-full px-3 box-border pb-3">  
              {groupedEntries.map(({ groupKey, items }) => (
                <div key={groupKey ?? "default"} className="flex flex-col gap-2">
                  {groupKey && (
                    <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1 pt-1 flex items-center justify-between pb-1">
                      <span>{groupKey}</span>
                      <span className="text-[10px] text-neutral-500 font-normal">({items.length})</span>
                    </div>
                  )}
                  {items.map((row) => (
                    <PieceListRow
                      key={row.id}
                      row={row}
                      conflict={conflictIds.has(row.id)}
                      disabled={disabled}
                      highlighted={highlightedIds?.has(row.id)}
                      onPreview={onPreviewRow}
                    onLocate={onLocateRow}
                      onUpdateQuantity={onUpdateQuantity}
                      onDuplicate={onDuplicate}
                      onRemove={onRemove}
                    />
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}))