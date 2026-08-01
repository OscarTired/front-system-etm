"use client"

import { createPortal } from "react-dom"
import { X, Download, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SheetGroup } from "../utils/svg-render"
import { formatSheetRangeLabel } from "../utils/svg-render"

export interface ExportDialogProps {
  open: boolean
  onClose: () => void
  sheetGroups: SheetGroup[]
  onExportSheet: (format: "dxf" | "nsp", sheetIndex: number) => void
  onSaveProject: () => void
}

export function ExportDialog({ open, onClose, sheetGroups, onExportSheet, onSaveProject }: ExportDialogProps) {
  if (!open || typeof document === "undefined") return null

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#101012] shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-5 py-4">
          <h3 className="text-sm font-semibold text-white">Exportar</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto p-4">
          <button
            onClick={onSaveProject}
            className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3 text-left hover:bg-white/5"
          >
            <Save className="h-4 w-4 text-neutral-400" />
            <div>
              <p className="text-sm text-neutral-200">Guardar sesión de trabajo</p>
              <p className="text-xs text-neutral-500">.json — para retomar el proyecto, no es para la máquina</p>
            </div>
          </button>

          {sheetGroups.length === 0 && (
            <p className="p-3 text-center text-xs text-neutral-600">Nestea primero para exportar planchas.</p>
          )}

          {sheetGroups.map((group) => (
            <div key={group.startIndex} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <div>
                <p className="text-sm text-neutral-200">
                  {formatSheetRangeLabel(group)} {group.count > 1 && <span className="text-neutral-500">× {group.count}</span>}
                </p>
                <p className="text-xs text-neutral-500">{group.sheet.pieces.length} piezas</p>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => onExportSheet("dxf", group.startIndex)}>
                  <Download className="h-3.5 w-3.5" /> DXF
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onExportSheet("nsp", group.startIndex)}>
                  <Download className="h-3.5 w-3.5" /> NSP
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
