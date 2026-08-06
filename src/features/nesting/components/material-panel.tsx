"use client"

import { useState } from "react"
import {
  ChevronRight,
  FilePlus,
  FileUp,
  FolderOpen,
  Layers,
  Save,
  Sliders,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/shared/utils/utils"
import type { ProjectSettings } from "../types/project-settings"

export type PieceMaterialSummary = {
  /** Espesores distintos detectados en piezas CAD (mm). */
  thicknesses: number[]
  /** Normas / aleaciones distintas (dinNorm o alloy). */
  materials: string[]
}

export type ProjectToolbarActions = {
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onExport: () => void
}

export interface MaterialPanelProps {
  settings: ProjectSettings
  onChange: (patch: Partial<ProjectSettings>) => void
  pieceMaterials?: PieceMaterialSummary | null
  projectActions?: ProjectToolbarActions | null
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-neutral-400">{label}</label>
      {children}
    </div>
  )
}

export function MaterialPanel({
  settings,
  onChange,
  pieceMaterials,
  projectActions = null,
}: MaterialPanelProps) {
  const multiThick = (pieceMaterials?.thicknesses.length ?? 0) > 1
  const multiMat = (pieceMaterials?.materials.length ?? 0) > 1
  const thickLabel = multiThick
    ? `Varios: ${pieceMaterials!.thicknesses.map((t) => (Number.isInteger(t) ? String(t) : t.toFixed(2))).join(", ")} mm`
    : null
  const matLabel = multiMat
    ? `Varios: ${pieceMaterials!.materials.join(", ")}`
    : null

  const [isProjectExpanded, setIsProjectExpanded] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const btn =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"

  return (
    <div className="flex flex-col gap-3">
      {projectActions && (
        <div className="flex flex-col rounded-xl items-center bg-white/2 p-1 transition-colors">
          <button
            type="button"
            onClick={() => setIsProjectExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-white/3"
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Proyecto</span>
            </div>

            <ChevronRight
              className={cn(
                "h-4 w-4 text-neutral-500 transition-transform duration-200",
                isProjectExpanded && "rotate-90"
              )}
            />
          </button>

          <div
            className={cn(
              "flex flex-col gap-2 overflow-hidden transition-all duration-200 ease-in-out",
              isProjectExpanded ? "mt-2 max-h-50 opacity-100 p-1" : "max-h-0 opacity-0 pointer-events-none"
            )}
          >
            <div className="flex items-center gap-0.5 rounded-lg bg-black/25 p-2">
              <button type="button" className={btn} title="Nuevo proyecto" onClick={projectActions.onNew}>
                <FilePlus className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button type="button" className={btn} title="Abrir proyecto" onClick={projectActions.onOpen}>
                <FolderOpen className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button type="button" className={btn} title="Guardar proyecto" onClick={projectActions.onSave}>
                <Save className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <div className="mx-1 h-4 w-px bg-white/10" aria-hidden />
              <button type="button" className={btn} title="Exportar" onClick={projectActions.onExport}>
                <FileUp className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor principal estilo Box unificado */}
      <div className="flex flex-col rounded-xl bg-white/2 p-1 transition-colors">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-white/3"
        >
          <div className="flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Configuración</span>
          </div>

          <ChevronRight
            className={cn(
              "h-4 w-4 text-neutral-500 transition-transform duration-200",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        <div
          className={cn(
            "flex flex-col gap-3 overflow-hidden transition-all duration-200 ease-in-out",
            isExpanded ? "mt-2 max-h-150 opacity-100 p-1" : "max-h-0 opacity-0 pointer-events-none"
          )}
        >
          {/* Dimensiones */}
          <div className="flex flex-col rounded-lg bg-black/20 p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
              <span className="text-xs font-medium text-neutral-200">Dimensiones de Plancha</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Ancho (mm)">
                <Input
                  className="h-8 rounded-lg border-0 bg-neutral-950/50 text-center text-xs text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30"
                  inputMode="decimal"
                  value={settings.sheetWidth}
                  onChange={(e) => onChange({ sheetWidth: e.target.value })}
                />
              </Field>

              <Field label="Alto (mm)">
                <Input
                  className="h-8 rounded-lg border-0 bg-neutral-950/50 text-center text-xs text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30"
                  inputMode="decimal"
                  value={settings.sheetHeight}
                  onChange={(e) => onChange({ sheetHeight: e.target.value })}
                />
              </Field>

              <Field label="Margen (mm)">
                <Input
                  className="h-8 rounded-lg border-0 bg-neutral-950/50 text-center text-xs text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30"
                  inputMode="decimal"
                  value={settings.margin}
                  onChange={(e) => onChange({ margin: e.target.value })}
                />
              </Field>
            </div>
          </div>

          {/* Información General */}
          <div className="flex flex-col rounded-lg bg-black/20 p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Información General</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Field label="Proyecto">
                <Input
                  className="h-8 rounded-lg border-0 bg-neutral-950/50 text-xs truncate uppercase text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30"
                  placeholder="001-M"
                  value={settings.proyecto}
                  onChange={(e) => onChange({ proyecto: e.target.value })}
                />
              </Field>
              <Field label="Cliente">
                <Input
                  className="h-8 rounded-lg border-0 bg-neutral-950/50 text-xs truncate uppercase text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30"
                  placeholder="ETM"
                  value={settings.cliente}
                  onChange={(e) => onChange({ cliente: e.target.value })}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-2">
              <Field label="Material">
                {multiMat ? (
                  <div className="flex min-h-14 flex-col items-center justify-center text-center gap-0.5 rounded-lg bg-amber-500/10 px-2.5 py-2 w-full">
                    <span className="text-xs font-medium text-amber-200/90 leading-tight">{matLabel}</span>
                    <span className="text-[10px] text-amber-500/80">Varios materiales</span>
                  </div>
                ) : (
                  <Input
                    className="h-8 rounded-lg border-0 bg-neutral-950/50 text-xs truncate uppercase text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30 w-full"
                    placeholder="INOX"
                    value={settings.material}
                    onChange={(e) => onChange({ material: e.target.value })}
                  />
                )}
              </Field>

              <Field label="Espesor">
                {multiThick ? (
                  <div className="flex min-h-14 flex-col items-center justify-center truncate uppercase text-center gap-0.5 rounded-lg bg-amber-500/10 px-2.5 py-2 w-full">
                    <span className="text-xs font-medium text-amber-200/90 leading-tight">{thickLabel}</span>
                    <span className="text-[10px] text-amber-500/80">Varios espesores</span>
                  </div>
                ) : (
                  <Input
                    className="h-8 rounded-lg border-0 bg-neutral-950/50 text-center text-xs truncate uppercase text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30 w-full"
                    inputMode="decimal"
                    placeholder="Ej: 3.0 mm"
                    value={settings.espesor}
                    onChange={(e) => onChange({ espesor: e.target.value })}
                  />
                )}
              </Field>
            </div>
          </div>

          {/* Empaquetado: fast (AABB, rápido) vs precise (polígono real +
              nesting en calados, mejor aprovechamiento pero más lento —
              antes esto estaba hardcodeado a "fast" en el motor sin
              ninguna forma de acceder a "precise" desde la UI). */}
          <div className="flex flex-col rounded-lg bg-black/20 p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Empaquetado</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.empaquetadoPreciso}
              onClick={() => onChange({ empaquetadoPreciso: !settings.empaquetadoPreciso })}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-neutral-200">Empaquetado preciso</span>
                <span className="text-[10px] leading-snug text-neutral-500">
                  Usa el contorno real de cada pieza (incluye calados) en vez
                  de su rectángulo — mejor aprovechamiento de plancha, pero
                  el cálculo de Nestear tarda notablemente más, sobre todo
                  combinado con rotación libre.
                </span>
              </span>
              <span
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                  settings.empaquetadoPreciso ? "bg-cyan-500" : "bg-white/15"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform",
                    settings.empaquetadoPreciso && "translate-x-4"
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}