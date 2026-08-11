"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Check, Trash2, Search, ArrowUpDown, ShieldCheck, CheckCheck } from "lucide-react"
import type { CadRow } from "./piece-list"
import type { AuditResult, MaterialAuditSummary } from "../cad/material-audit"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/shared/utils/utils"

export interface DiagnosticsDialogProps {
  open: boolean
  onClose: () => void
  rows: CadRow[]
  audit: MaterialAuditSummary | null
  forgivenIds: Set<string>
  onForgive: (id: string) => void
  onRemove: (id: string) => void
}

function fmtThick(t: number) {
  if (!(t > 0)) return "N/D"
  return Number.isInteger(t) ? `${t} mm` : `${t.toFixed(2)} mm`
}

export function DiagnosticsDialog({
  open,
  onClose,
  rows,
  audit,
  forgivenIds,
  onForgive,
  onRemove,
}: DiagnosticsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMode, setFilterMode] = useState<"all" | "conflicts" | "forgiven">("all")

  const results = audit?.results ?? []
  const resultById = useMemo(() => new Map(results.map((r) => [r.id, r])), [results])

  const activeConflicts = useMemo(
    () => results.filter((r) => r.hasConflict && !forgivenIds.has(r.id)),
    [results, forgivenIds]
  )
  const activeConflictsCount = activeConflicts.length

  const handleForgiveAll = () => {
    for (const r of activeConflicts) {
      onForgive(r.id)
    }
  }

  const filteredAndOrdered = useMemo(() => {
    return [...rows]
      .filter((row) => {
        const matchesSearch = row.fileName.toLowerCase().includes(searchQuery.toLowerCase().trim())
        if (!matchesSearch) return false

        const r = resultById.get(row.id)
        const forgiven = forgivenIds.has(row.id)
        const conflict = !!r?.hasConflict && !forgiven

        if (filterMode === "conflicts") return conflict
        if (filterMode === "forgiven") return forgiven
        return true
      })
      .sort((a, b) => {
        const ra = resultById.get(a.id)
        const rb = resultById.get(b.id)
        const ca = forgivenIds.has(a.id) ? 1 : ra?.hasConflict ? 0 : 2
        const cb = forgivenIds.has(b.id) ? 1 : rb?.hasConflict ? 0 : 2
        return ca - cb
      })
  }, [rows, searchQuery, filterMode, resultById, forgivenIds])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        size="large"
        className="flex max-h-[85vh] w-[min(960px,95vw)] max-w-none flex-col gap-0 overflow-hidden border-white/10 bg-[#141416] p-0 text-neutral-200 shadow-2xl sm:max-w-none"
      >
        <DialogHeader className="shrink-0 border-b border-white/8 px-6 py-4 pr-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <DialogTitle className="text-sm font-semibold uppercase tracking-wider text-neutral-100 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                Diagnóstico de piezas y materiales
              </DialogTitle>
              <p className="mt-1 text-[11px] text-neutral-400">
                Parámetros más comunes del grupo:{" "}
                <span className="font-medium text-neutral-200">
                  Espesor: {audit ? fmtThick(audit.targetThickness) : "—"} | Material:{" "}
                  {audit?.majorityDin ?? "—"} | Aleación: {audit?.majorityAlloy ?? "—"}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {activeConflictsCount > 0 && (
                <>
                  <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 animate-pulse" />
                    <span className="text-xs font-medium text-amber-300">
                      {activeConflictsCount} conflicto{activeConflictsCount === 1 ? "" : "s"} activo{activeConflictsCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3 text-xs gap-1.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-300 font-medium rounded-xl"
                    onClick={handleForgiveAll}
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span>Permitir todos</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Buscar archivo por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-white/5 pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1">
              {(
                [
                  ["all", "Todas", rows.length],
                  ["conflicts", "Conflictos", activeConflictsCount],
                  ["forgiven", "Aceptadas", forgivenIds.size],
                ] as const
              ).map(([mode, label, count]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  className={cn(
                    "rounded-lg px-3 py-1 text-[11px] font-medium transition-colors flex items-center gap-1.5",
                    filterMode === mode
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                  )}
                >
                  <span>{label}</span>
                  <span className="rounded-full bg-black/40 px-1.5 py-0.2 text-[9px] tabular-nums text-neutral-400">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden bg-neutral-950/40">
          {/* min(30rem, 55vh): tope fijo en pantallas grandes (no
              queremos un diálogo gigante), pero se achica solo en
              pantallas chicas (55% del alto visible) para que no se
              corte contra los bordes. */}
          <ScrollArea className="h-[min(30rem,55vh)]">
            {/* ScrollArea por default bloquea scroll horizontal
                (overflow-x-hidden) — para que la tabla no se apriete
                hasta cortar columnas en mobile, se le da su propio
                scroll horizontal nativo + un ancho mínimo, para que
                las columnas mantengan un tamaño legible y el usuario
                deslice a los costados en vez de perder contenido. */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-188 border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-[#161618] text-[10px] uppercase tracking-wider text-neutral-400 shadow-sm">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre del archivo</th>
                  <th className="px-2 py-3 text-center font-medium">Cant.</th>
                  <th className="px-3 py-3 text-center font-medium">Espesor</th>
                  <th className="px-3 py-3 text-center font-medium">Material</th>
                  <th className="px-3 py-3 text-center font-medium">Aleación</th>
                  <th className="px-4 py-3 text-right font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAndOrdered.map((row) => {
                  const r: AuditResult | undefined = resultById.get(row.id)
                  const forgiven = forgivenIds.has(row.id)
                  const conflict = !!r?.hasConflict && !forgiven
                  const dinBad = !!r?.dinConflict && !forgiven
                  const alloyBad = !!r?.alloyConflict && !forgiven

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "transition-colors hover:bg-white/2",
                        conflict && "bg-amber-500/4 hover:bg-amber-500/[0.07]",
                        forgiven && "bg-emerald-500/3"
                      )}
                    >
                      <td className="max-w-75 truncate px-4 py-3 font-medium text-neutral-200">
                        <div className="flex items-center gap-2">
                          {conflict && (
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </span>
                          )}
                          {forgiven && (
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                          {!conflict && !forgiven && (
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 text-neutral-500">
                              <ArrowUpDown className="h-3 w-3" />
                            </span>
                          )}
                          <span className="truncate" title={row.fileName}>
                            {row.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center tabular-nums text-neutral-400 font-medium">
                        {row.quantity || "1"}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums text-neutral-300">
                        {fmtThick(row.material.thickness)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-3 text-center",
                          dinBad ? "font-semibold text-amber-400 bg-amber-500/10 rounded-md" : "text-neutral-300"
                        )}
                      >
                        {row.material.dinNorm || "N/D"}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-3 text-center",
                          alloyBad ? "font-semibold text-amber-400 bg-amber-500/10 rounded-md" : "text-neutral-300"
                        )}
                      >
                        {row.material.alloy || "N/D"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {conflict && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              title="Aceptar / perdonar conflicto"
                              className="h-7 px-2.5 text-xs gap-1.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all font-medium rounded-lg"
                              onClick={() => onForgive(row.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Permitir</span>
                            </Button>
                          )}
                          {forgiven && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400">
                              <Check className="h-3 w-3" /> Aceptado
                            </span>
                          )}
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            title="Eliminar pieza del proyecto"
                            className="h-7 w-7 text-neutral-400 hover:bg-red-500/15 hover:text-red-400 rounded-lg transition-colors"
                            onClick={() => onRemove(row.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredAndOrdered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center text-neutral-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="h-8 w-8 text-neutral-700" />
                        <p className="text-xs">No se encontraron piezas con los filtros actuales.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </ScrollArea>
        </div>

        <div className="shrink-0 border-t border-white/8 bg-[#141416] p-4 flex items-center justify-between">
          <p className="text-[11px] text-neutral-500">
            Mostrando <span className="font-medium text-neutral-300">{filteredAndOrdered.length}</span> de {rows.length} piezas
          </p>
          <Button
            type="button"
            className="h-9 px-6 rounded-xl bg-white/10 text-xs font-semibold uppercase tracking-wider text-neutral-200 hover:bg-white/15 transition-colors"
            onClick={onClose}
          >
            Cerrar inspección
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}