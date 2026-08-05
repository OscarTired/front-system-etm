"use client"

import { useState } from "react"
import { ChevronDown, Sliders, Layers, Scissors, Check, ChevronRight } from "lucide-react"

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
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-neutral-400">{label}</label>
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
          className="h-9 w-full min-w-0 justify-between rounded-lg bg-neutral-950/40 px-3 text-xs font-normal text-neutral-200 border-0 hover:bg-neutral-900 hover:text-white"
        >
          <span className="truncate">{current?.label ?? value}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 rounded-xl border-white/10 bg-[#121214] text-neutral-200 shadow-2xl">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((option) => (
            <DropdownMenuRadioItem 
              key={option.value} 
              value={option.value} 
              className="text-xs focus:bg-white/10 focus:text-white cursor-pointer py-2"
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
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="flex flex-col rounded-xl px-3 py-2 transition-colors">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-start justify-between rounded-lg px-2 py-2 text-left hover:bg-white/3"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
            <span className="text-xs font-medium text-neutral-200">Dimensiones</span>
          </div>

          {!isExpanded && (
            <div className="mt-1 pl-5.5">
              <div className="text-xs font-medium text-neutral-300">
                {settings.sheetWidth} × {settings.sheetHeight} mm
              </div>
              <div className="text-[11px] text-neutral-500">
                Margen: {settings.margin} mm
              </div>
            </div>
          )}
        </div>

        <ChevronRight
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
      </button>

      <div
        className={cn(
          "grid grid-cols-3 gap-2.5 overflow-hidden transition-all duration-200 ease-in-out",
          isExpanded ? "mt-3 max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <Field label="Ancho (mm)">
          <Input
            className="h-9 rounded-lg border-0 bg-neutral-950/50 text-center text-xs text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30"
            inputMode="decimal"
            value={settings.sheetWidth}
            onChange={(e) => onChange({ sheetWidth: e.target.value })}
          />
        </Field>

        <Field label="Alto (mm)">
          <Input
            className="h-9 rounded-lg border-0 bg-neutral-950/50 text-center text-xs text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30"
            inputMode="decimal"
            value={settings.sheetHeight}
            onChange={(e) => onChange({ sheetHeight: e.target.value })}
          />
        </Field>

        <Field label="Margen (mm)">
          <Input
            className="h-9 rounded-lg border-0 bg-neutral-950/50 text-center text-xs text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30"
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
    <div className="flex flex-col gap-4 p-3">
      
      {/* Bloque 1: Información General */}
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-xs font-semibold text-neutral-400 px-1">
          <Sliders className="h-3.5 w-3.5" /> Información General
        </span>
        <div className="grid grid-cols-2 gap-2.5 p-1">
          <Field label="Proyecto">
            <Input 
              className="h-9 rounded-lg bg-neutral-950/50 border-0 text-xs text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30" 
              value={settings.proyecto} 
              onChange={(e) => onChange({ proyecto: e.target.value })} 
            />
          </Field>
          <Field label="Cliente">
            <Input 
              className="h-9 rounded-lg bg-neutral-950/50 border-0 text-xs text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30" 
              value={settings.cliente} 
              onChange={(e) => onChange({ cliente: e.target.value })} 
            />
          </Field>
          <Field label="Material">
            <Input 
              className="h-9 rounded-lg bg-neutral-950/50 border-0 text-xs text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30" 
              value={settings.material} 
              onChange={(e) => onChange({ material: e.target.value })} 
            />
          </Field>
          <Field label="Espesor">
            <Input 
              className="h-9 rounded-lg bg-neutral-950/50 border-0 text-xs text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30" 
              inputMode="decimal" 
              placeholder="Ej: 3.0 mm"
              value={settings.espesor} 
              onChange={(e) => onChange({ espesor: e.target.value })} 
            />
          </Field>
        </div>
      </div>

      {/* Bloque 2: Parámetros de Corte */}
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-xs font-semibold text-neutral-400 px-1">
          <Scissors className="h-3.5 w-3.5" /> Parámetros de Corte
        </span>
        
        <div className="flex flex-col gap-3 p-1">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Muesca">
              <Input 
                className="h-9 rounded-lg bg-neutral-950/50 border-0 text-xs text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30" 
                inputMode="decimal" 
                value={settings.muesca} 
                onChange={(e) => onChange({ muesca: e.target.value })} 
              />
            </Field>
            <Field label="Separación">
              <Input 
                className="h-9 rounded-lg bg-neutral-950/50 border-0 text-xs text-neutral-200 focus-visible:ring-1 focus-visible:ring-cyan-500/30" 
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
              onChange={(value) => onChange({ rotacionPermitida: value } as any)}
              options={[
                { value: "0-90-180-270", label: "0° / 90° / 180° / 270°" },
                { value: "libre", label: "Libre" },
                { value: "ninguna", label: "Ninguna (0°)" },
              ]}
            />
          </Field>
        </div>
        <span className="text-[10px] text-neutral-500 px-1">
          * Los parámetros de corte se guardan automáticamente en la configuración del proyecto.
        </span>
      </div>

      {/* Bloque 3: Puentes / Micro-uniones */}
      <div className="p-1">
        <button
          type="button"
          onClick={() => onChange({ puentesHabilitado: !settings.puentesHabilitado })}
          className="flex w-full items-center justify-between text-left cursor-pointer select-none"
        >
          <span className="text-xs font-medium text-neutral-300">
            Puentes / Micro-uniones
          </span>
          <div
            className={cn(
              "flex size-4 items-center justify-center rounded border transition-colors",
              settings.puentesHabilitado
                ? "border-cyan-500 bg-cyan-500 text-neutral-950"
                : "border-neutral-700 bg-transparent text-transparent"
            )}
          >
            <Check size={10} strokeWidth={3} />
          </div>
        </button>
      </div>

    </div>
  )
}