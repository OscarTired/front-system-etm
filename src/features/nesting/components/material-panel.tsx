"use client"

import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
 * Reemplaza al <select> nativo. Reusa exactamente las clases del
 * Input compartido (h-10, rounded-xl, bg-white/6) en vez de definir
 * una escala de alto/color propia, para que ambos campos convivan
 * en la misma grilla sin desalinearse.
 */
function FieldSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const current = options.find((option) => option.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 w-full min-w-0 justify-between rounded-xl bg-white/6 px-4 text-sm font-medium text-neutral-200 hover:bg-white/10"
        >
          <span className="truncate">{current?.label ?? value}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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

      <div className="pt-3">
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
            <FieldSelect
              value={settings.rotacionPermitida}
              onChange={(value) => onChange({ rotacionPermitida: value })}
              options={[
                { value: "0-90-180-270", label: "0° / 90° / 180° / 270°" },
                { value: "libre", label: "Libre" },
                { value: "ninguna", label: "Ninguna (0°)" },
              ]}
            />
          </Field>
          <Field label="Prioridad">
            <FieldSelect
              value={settings.prioridad}
              onChange={(value) => onChange({ prioridad: value })}
              options={[
                { value: "normal", label: "Normal" },
                { value: "alta", label: "Alta" },
                { value: "baja", label: "Baja" },
              ]}
            />
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