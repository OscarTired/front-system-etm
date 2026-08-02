"use client"

import { useMemo } from "react"
import { Download, Save, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { FormDialogHeader } from "@/shared/ui/dialogs/form-dialog/form-dialog-header"
import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"

import type { NestedSheet } from "../engine/types"
import type { SheetGroup } from "../utils/svg-render"
import { formatSheetRangeLabel } from "../utils/svg-render"
import { buildPieceCatalog } from "../export/piece-catalog"

export interface ExportDialogProps {
  open: boolean
  onClose: () => void
  sheetGroups: SheetGroup[]
  /** Todas las planchas (no solo los grupos deduplicados) — para armar el catálogo/BOM con la cantidad real total. */
  sheets: NestedSheet[] | null
  onExportSheet: (format: "dxf" | "nsp", sheetIndex: number) => void
  onSaveProject: () => void
}

export function ExportDialog({ open, onClose, sheetGroups, sheets, onExportSheet, onSaveProject }: ExportDialogProps) {
  const catalog = useMemo(() => (sheets ? buildPieceCatalog(sheets) : []), [sheets])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[80vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0">
        <FormDialogHeader title="Exportar" icon={Download} />

        <VerticalScroll containerClassName="min-h-0 flex-1" className="flex flex-col gap-2 p-4">
          <button
            onClick={onSaveProject}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
          >
            <Save className="h-4 w-4 shrink-0 text-neutral-400" />
            <div className="min-w-0">
              <p className="text-sm text-neutral-200">Guardar sesión de trabajo</p>
              <p className="text-xs text-neutral-500">.json — para retomar el proyecto, no es para la máquina</p>
            </div>
          </button>

          {sheetGroups.length === 0 && (
            <p className="p-3 text-center text-xs text-neutral-600">Nestea primero para exportar planchas.</p>
          )}

          {sheetGroups.map((group) => (
            <div
              key={group.startIndex}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-neutral-200">
                  {formatSheetRangeLabel(group)} {group.count > 1 && <span className="text-neutral-500">× {group.count}</span>}
                </p>
                <p className="text-xs text-neutral-500">{group.sheet.pieces.length} piezas</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => onExportSheet("dxf", group.startIndex)}>
                  <Download className="h-3.5 w-3.5" /> DXF
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onExportSheet("nsp", group.startIndex)}>
                  <Download className="h-3.5 w-3.5" /> NSP
                </Button>
              </div>
            </div>
          ))}

          {catalog.length > 0 && (
            <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                <Layers className="h-3.5 w-3.5" /> Catálogo (BOM)
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-neutral-500">
                    <th className="pb-1.5 font-medium">Pieza</th>
                    <th className="pb-1.5 font-medium">Dimensiones</th>
                    <th className="pb-1.5 font-medium">Perímetro</th>
                    <th className="pb-1.5 text-right font-medium">Cant.</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-300">
                  {catalog.map((c) => (
                    <tr key={c.uid} className="border-t border-white/5">
                      <td className="max-w-35 truncate py-1.5" title={c.pieceId}>{c.pieceId}</td>
                      <td className="py-1.5">{c.width.toFixed(0)}×{c.height.toFixed(0)}mm</td>
                      <td className="py-1.5">{c.perimeter.toFixed(0)}mm</td>
                      <td className="py-1.5 text-right font-medium">{c.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </VerticalScroll>
      </DialogContent>
    </Dialog>
  )
}