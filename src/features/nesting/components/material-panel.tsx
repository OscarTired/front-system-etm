"use client"

import { Input } from "@/components/ui/input"
import type { ProjectSettings } from "../types/project-settings"

export interface MaterialPanelProps {
  settings: ProjectSettings
  onChange: (patch: Partial<ProjectSettings>) => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-500">{label}</label>
      {children}
    </div>
  )
}

/**
 * Solo las dimensiones de la plancha (Ancho/Alto/Margen) — lo ÚNICO
 * que hace falta de verdad para poder nestear. Se muestra siempre,
 * sin colapsar, separado del resto de metadata del proyecto.
 */
export function SheetDimensionsFields({ settings, onChange }: MaterialPanelProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Field label="Ancho">
        <Input inputMode="decimal" value={settings.sheetWidth} onChange={(e) => onChange({ sheetWidth: e.target.value })} />
      </Field>
      <Field label="Alto">
        <Input inputMode="decimal" value={settings.sheetHeight} onChange={(e) => onChange({ sheetHeight: e.target.value })} />
      </Field>
      <Field label="Margen">
        <Input inputMode="decimal" value={settings.margin} onChange={(e) => onChange({ margin: e.target.value })} />
      </Field>
    </div>
  )
}

/**
 * Todo lo demás (Proyecto/Cliente/Material/Espesor/parámetros de
 * corte) — metadata útil pero NO requerida para nestear. Vive
 * colapsado por default en el sidebar.
 */
export function MaterialPanel({ settings, onChange }: MaterialPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Proyecto">
          <Input value={settings.proyecto} onChange={(e) => onChange({ proyecto: e.target.value })} />
        </Field>
        <Field label="Cliente">
          <Input value={settings.cliente} onChange={(e) => onChange({ cliente: e.target.value })} />
        </Field>
        <Field label="Material">
          <Input value={settings.material} onChange={(e) => onChange({ material: e.target.value })} />
        </Field>
        <Field label="Espesor (mm)">
          <Input inputMode="decimal" value={settings.espesor} onChange={(e) => onChange({ espesor: e.target.value })} />
        </Field>
      </div>

      <div className="border-t border-white/5 pt-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">Corte</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Muesca (mm)">
            <Input inputMode="decimal" value={settings.muesca} onChange={(e) => onChange({ muesca: e.target.value })} />
          </Field>
          <Field label="Separación (mm)">
            <Input inputMode="decimal" value={settings.separacion} onChange={(e) => onChange({ separacion: e.target.value })} />
          </Field>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Field label="Rotación permitida">
            <select
              value={settings.rotacionPermitida}
              onChange={(e) => onChange({ rotacionPermitida: e.target.value as ProjectSettings["rotacionPermitida"] })}
              className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-2 text-sm text-neutral-200 outline-none"
            >
              <option value="0-90-180-270" className="bg-[#101012]">0° / 90° / 180° / 270°</option>
              <option value="libre" className="bg-[#101012]">Libre</option>
              <option value="ninguna" className="bg-[#101012]">Ninguna (0°)</option>
            </select>
          </Field>
          <Field label="Prioridad">
            <select
              value={settings.prioridad}
              onChange={(e) => onChange({ prioridad: e.target.value as ProjectSettings["prioridad"] })}
              className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-2 text-sm text-neutral-200 outline-none"
            >
              <option value="normal" className="bg-[#101012]">Normal</option>
              <option value="alta" className="bg-[#101012]">Alta</option>
              <option value="baja" className="bg-[#101012]">Baja</option>
            </select>
          </Field>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-neutral-600">
          Muesca, separación, rotación y prioridad se guardan con el proyecto — el motor de nesting
          todavía no los usa (solo respeta el margen de plancha).
        </p>
      </div>
    </div>
  )
}