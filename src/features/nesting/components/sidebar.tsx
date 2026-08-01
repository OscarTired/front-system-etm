"use client"

import { forwardRef, useState } from "react"
import { ChevronDown, ChevronUp, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CollapsibleHeightSection } from "@/shared/ui/collapsible-height-section/collapsible-height-section"
import { MaterialPanel, SheetDimensionsFields } from "./material-panel"
import { MachinePanel } from "./machine-panel"
import { PieceList, type PieceListProps, type PieceListHandle } from "./piece-list"
import type { ProjectSettings, MachineSettings } from "../types/project-settings"

export interface SidebarProps {
  settings: ProjectSettings
  onSettingsChange: (patch: Partial<ProjectSettings>) => void
  machine: MachineSettings
  onMachineChange: (patch: Partial<MachineSettings>) => void
  pieceListProps: PieceListProps
  canRun: boolean
  isRunning: boolean
  progress: number
  error: string | null
  onRun: () => void
  onCancel: () => void
}

function CollapsibleSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">{title}</h2>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-neutral-500" /> : <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />}
      </button>
      <CollapsibleHeightSection open={open} className="pt-2.5">
        {children}
      </CollapsibleHeightSection>
    </section>
  )
}

export const Sidebar = forwardRef<PieceListHandle, SidebarProps>(function Sidebar(
  {
    settings,
    onSettingsChange,
    machine,
    onMachineChange,
    pieceListProps,
    canRun,
    isRunning,
    progress,
    error,
    onRun,
    onCancel,
  },
  ref
) {
  return (
    <div className="flex h-full w-full flex-col gap-2.5">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
        <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Plancha</h2>
        <SheetDimensionsFields settings={settings} onChange={onSettingsChange} />
      </section>

      <CollapsibleSection title="Proyecto y material" defaultOpen={false}>
        <MaterialPanel settings={settings} onChange={onSettingsChange} />
      </CollapsibleSection>

      <CollapsibleSection title="Máquina" defaultOpen={false}>
        <MachinePanel settings={machine} onChange={onMachineChange} />
      </CollapsibleSection>

      <div className="flex min-h-[180px] flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
        <PieceList ref={ref} {...pieceListProps} />
      </div>

      {!isRunning ? (
        <Button size="default" className="w-full" disabled={!canRun} onClick={onRun}>
          Nestear
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <Button size="default" variant="outline" className="w-full" onClick={onCancel}>
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Calculando… {Math.round(progress * 100)}%
          </p>
        </div>
      )}

      {error && <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{error}</p>}
    </div>
  )
})