"use client"

import { ChevronDown, Sliders, Layers, Scissors, Check } from "lucide-react"

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

export interface MaterialPanelProps {
  settings: ProjectSettings
  onChange: (patch: Partial<ProjectSettings>) => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">{label}</label>
      {children}
    </div>
  )
}

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
          className="h-8 w-full min-w-0 justify-between rounded-lg bg-white/5 px-2.5 text-xs font-normal text-neutral-200 hover:bg-white/10 hover:text-white"
        >
          <span className="truncate">{current?.label ?? value}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 rounded-2xl border-white/10 bg-[#101012] text-neutral-200 shadow-xl">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((option) => (
            <DropdownMenuRadioItem 
              key={option.value} 
              value={option.value} 
              className="text-xs focus:bg-white/10 focus:text-white"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SheetDimensionsFields({ settings, onChange }: MaterialPanelProps) {
  return (
    <div className="flex flex-col gap-1 p-2">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          <Layers className="h-3 w-3" /> Dimensiones de Plancha
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-white/3 p-2.5">
        <Field label="Ancho">
          <Input 
            className="h-8 rounded-lg bg-white/5 border-0 text-center text-xs text-neutral-200 focus-visible:ring-cyan-500/30" 
            inputMode="decimal" 
            value={settings.sheetWidth} 
            onChange={(e) => onChange({ sheetWidth: e.target.value })} 
          />
        </Field>
        <Field label="Alto">
          <Input 
            className="h-8 rounded-lg bg-white/5 border-0 text-center text-xs text-neutral-200 focus-visible:ring-cyan-500/30" 
            inputMode="decimal" 
            value={settings.sheetHeight} 
            onChange={(e) => onChange({ sheetHeight: e.target.value })} 
          />
        </Field>
        <Field label="Margen">
          <Input 
            className="h-8 rounded-lg bg-white/5 border-0 text-center text-xs text-neutral-200 focus-visible:ring-cyan-500/30" 
            inputMode="decimal" 
            value={settings.margin} 
            onChange={(e) => onChange({ margin: e.target.value })} 
          />
        </Field>
      </div>
    </div>
  )
}

export function MaterialPanel({ settings, onChange }: MaterialPanelProps) {
  return (
    <div className="flex flex-col gap-3 p-2">
      
      {/* Bloque 1: Información General */}
      <div className="flex flex-col gap-1">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            <Sliders className="h-3 w-3" /> Información General
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/3 p-2.5">
          <Field label="Proyecto">
            <Input 
              className="h-8 rounded-lg bg-white/5 border-0 text-xs text-neutral-200 focus-visible:ring-cyan-500/30" 
              value={settings.proyecto} 
              onChange={(e) => onChange({ proyecto: e.target.value })} 
            />
          </Field>
          <Field label="Cliente">
            <Input 
              className="h-8 rounded-lg bg-white/5 border-0 text-xs text-neutral-200 focus-visible:ring-cyan-500/30" 
              value={settings.cliente} 
              onChange={(e) => onChange({ cliente: e.target.value })} 
            />
          </Field>
          <Field label="Material">
            <Input 
              className="h-8 rounded-lg bg-white/5 border-0 text-xs text-neutral-200 focus-visible:ring-cyan-500/30" 
              value={settings.material} 
              onChange={(e) => onChange({ material: e.target.value })} 
            />
          </Field>
          <Field label="Espesor (mm)">
            <Input 
              className="h-8 rounded-lg bg-white/5 border-0 text-xs text-neutral-200 focus-visible:ring-cyan-500/30" 
              inputMode="decimal" 
              value={settings.espesor} 
              onChange={(e) => onChange({ espesor: e.target.value })} 
            />
          </Field>
        </div>
      </div>

      {/* Bloque 2: Parámetros de Corte */}
      <div className="flex flex-col gap-1">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            <Scissors className="h-3 w-3" /> Parámetros de Corte
          </span>
        </div>
        
        <div className="flex flex-col gap-2 rounded-xl bg-white/3 p-2.5">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Muesca (mm)">
              <Input 
                className="h-8 rounded-lg bg-white/5 border-0 text-xs text-neutral-200 focus-visible:ring-cyan-500/30" 
                inputMode="decimal" 
                value={settings.muesca} 
                onChange={(e) => onChange({ muesca: e.target.value })} 
              />
            </Field>
            <Field label="Separación (mm)">
              <Input 
                className="h-8 rounded-lg bg-white/5 border-0 text-xs text-neutral-200 focus-visible:ring-cyan-500/30" 
                inputMode="decimal" 
                value={settings.separacion} 
                onChange={(e) => onChange({ separacion: e.target.value })} 
              />
            </Field>
          </div>

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
        </div>
        <p className="mt-1 px-1 text-[10px] leading-relaxed text-neutral-600">
          * Muesca, separación, rotación y prioridad se guardan con el proyecto.
        </p>
      </div>

      {/* Bloque 3: Puentes / Micro-uniones */}
      <div className="flex flex-col gap-1">
        <div className="rounded-xl bg-white/3 p-2.5">
          <button
            type="button"
            onClick={() => onChange({ puentesHabilitado: !settings.puentesHabilitado })}
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all",
              "border border-transparent bg-white/5 hover:bg-white/10 cursor-pointer select-none"
            )}
          >
            <span className="text-xs font-medium text-neutral-300">
              Puentes / Micro-uniones
            </span>
            <div
              className={cn(
                "flex size-4 items-center justify-center rounded-md border transition-colors",
                settings.puentesHabilitado
                  ? "border-cyan-500 bg-cyan-500 text-neutral-950"
                  : "border-white/20 bg-transparent text-transparent"
              )}
            >
              <Check size={10} strokeWidth={3} />
            </div>
          </button>
        </div>
      </div>

    </div>
  )
}