"use client"
import { useMemo } from "react"
import { Download, Save, Layers, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { FormDialogHeader } from "@/shared/ui/dialogs/form-dialog/form-dialog-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { NestedSheet, SheetConfig } from "../engine/types"
import { formatSheetRangeLabel, type SheetGroup } from "../utils/svg-render"
import { buildPieceCatalog, type PieceNameMap } from "../export/piece-catalog"
import { exportNestingReportPdf } from "../export/nesting-report-pdf"
import type { Nomenclatura } from "../export/nomenclatura"

type Props = {
  open: boolean
  onClose: () => void
  sheetGroups: SheetGroup[]
  sheets: NestedSheet[] | null
  sheetConfig: SheetConfig
  nomenclatura: Nomenclatura
  onExportSheet: (format: "dxf" | "nsp", sheetIndex: number) => void
  onSaveProject: () => void
  nameById?: PieceNameMap
}

export function ExportDialog({
  open,
  onClose,
  sheetGroups,
  sheets,
  sheetConfig,
  nomenclatura,
  onExportSheet,
  onSaveProject,
  nameById,
}: Props) {
  const catalog = useMemo(
    () => (sheets ? buildPieceCatalog(sheets, nameById) : []),
    [sheets, nameById],
  )

  function handleExportReport() {
    if (!sheets) return
    void exportNestingReportPdf({ nomenclatura, sheets, sheetConfig, nameById })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        size="large"
        className="flex h-[85vh] max-h-[85vh] w-full max-w-lg flex-col gap-0 overflow-hidden rounded-2xl bg-[#121214] p-0 text-neutral-100 shadow-2xl"
      >
        {/* Header fijo */}
        <div className="shrink-0">
          <FormDialogHeader title="Exportar" icon={Download} />
        </div>

        {/* Acciones Generales — FIJO, no scrollea */}
        <div className="shrink-0 px-5 pb-2 pt-1">
          <div className="flex flex-col gap-2">
            <span className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              Acciones Generales
            </span>
            <div className="flex flex-col gap-2 rounded-xl bg-white/4 p-3">
              <button
                type="button"
                onClick={onSaveProject}
                className="group flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/8"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-neutral-400 transition-colors group-hover:text-white">
                  <Save size={18} />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-neutral-200">
                    Guardar sesión de trabajo
                  </span>
                  <span className="truncate text-[11px] text-neutral-500">
                    .json — para retomar el proyecto
                  </span>
                </div>
              </button>

              {sheets && sheets.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportReport}
                  className="group flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/8"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-neutral-400 transition-colors group-hover:text-white">
                    <FileText size={18} />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-neutral-200">
                      Reporte PDF
                    </span>
                    <span className="truncate text-[11px] text-neutral-500">
                      Resumen, vista de cada plancha y catálogo (BOM)
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 
          Corrección de scroll en desktop:
          Cambiamos a h-0 flex-1 para forzar al contenedor a respetar el espacio restante 
          restando el header y las acciones fijas de arriba.
        */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="flex flex-col gap-5 px-5 pb-5 pt-3">
              {/* Planchas por Lote / Grupo */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    Planchas por Lote / Grupo
                  </span>
                  {sheetGroups.length > 0 && (
                    <span className="text-[11px] font-medium text-neutral-500">
                      {sheetGroups.reduce((acc, g) => acc + g.count, 0)} total
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2 rounded-xl bg-white/4 p-3">
                  {sheetGroups.length === 0 ? (
                    <p className="py-4 text-center text-xs text-neutral-500">
                      Nestea primero para exportar planchas individuales.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {sheetGroups.map((group, index) => (
                        <div
                          key={group.startIndex}
                          style={{ animationDelay: `${Math.min(index, 8) * 25}ms` }}
                          className="animate-comment-in flex items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-white/4"
                        >
                          <div className="flex min-w-0 flex-col">
                            <span className="flex items-center gap-2 text-sm font-medium text-neutral-200">
                              {formatSheetRangeLabel(group)}
                              {group.count > 1 && (
                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-neutral-300">
                                  ×{group.count}
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-neutral-500">
                              {group.sheet.pieces.length} piezas
                            </span>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onExportSheet("dxf", group.startIndex)}
                              className="h-8 border-0 bg-white/5 px-3 text-xs text-neutral-200 shadow-none hover:bg-white/10"
                            >
                              <Download size={14} className="mr-1.5 opacity-70" /> DXF
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onExportSheet("nsp", group.startIndex)}
                              className="h-8 border-0 bg-white/5 px-3 text-xs text-neutral-200 shadow-none hover:bg-white/10"
                            >
                              <Download size={14} className="mr-1.5 opacity-70" /> NSP
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Catálogo (BOM) */}
              {catalog.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 px-0.5">
                    <Layers size={14} className="text-neutral-500" />
                    <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      Catálogo (BOM)
                    </span>
                  </div>
                  <div className="flex overflow-hidden flex-col gap-2 rounded-xl bg-white/4 p-3">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-white/5 text-xs text-neutral-500">
                            <th className="px-2 py-2 font-medium">Pieza</th>
                            <th className="px-2 py-2 font-medium">Dimensiones</th>
                            <th className="px-2 py-2 font-medium">Perímetro</th>
                            <th className="px-2 py-2 text-right font-medium">Cant.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs text-neutral-300">
                          {catalog.map((c) => (
                            <tr key={c.uid} className="transition-colors hover:bg-white/2">
                              <td
                                title={c.displayName}
                                className="max-w-30 truncate px-2 py-2.5 font-medium text-neutral-200"
                              >
                                {c.displayName}
                              </td>
                              <td className="px-2 py-2.5 text-neutral-400">
                                {c.width.toFixed(0)}×{c.height.toFixed(0)}mm
                              </td>
                              <td className="px-2 py-2.5 text-neutral-400">
                                {c.perimeter.toFixed(0)}mm
                              </td>
                              <td className="px-2 py-2.5 text-right font-semibold text-neutral-100">
                                {c.quantity}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}