"use client"

import { forwardRef, memo, useState, useCallback, type ReactNode } from "react"
import { ChevronDown, ChevronUp, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CollapsibleHeightSection } from "@/shared/ui/collapsible-height-section/collapsible-height-section"
import { MaterialPanel } from "./material-panel"
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

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

/** Componente contenedor colapsable reutilizable con semántica de accesibilidad */
const CollapsibleSection = memo(function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  return (
    <section className="rounded-2xl bg-foreground/5 p-2.5 transition-all">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-0.5 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
      >
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground transition-transform" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform" />
        )}
      </button>
      <CollapsibleHeightSection open={open} className="pt-2.5">
        {children}
      </CollapsibleHeightSection>
    </section>
  )
})

interface ExecutionFooterProps {
  isRunning: boolean
  canRun: boolean
  progress: number
  onRun: () => void
  onCancel: () => void
}

/** Subcomponente para aislar la lógica y estados del proceso de nesting (Run/Cancel) */
const ExecutionFooter = memo(function ExecutionFooter({
  isRunning,
  canRun,
  progress,
  onRun,
  onCancel,
}: ExecutionFooterProps) {
  const percentage = Math.round(progress * 100)

  if (!isRunning) {
    return (
      <Button size="default" className="w-full" disabled={!canRun} onClick={onRun}>
        Nestear
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button size="default" variant="outline" className="w-full" onClick={onCancel}>
        <X className="h-4 w-4" />
        Cancelar
      </Button>
      <div 
        role="progressbar" 
        aria-valuenow={percentage} 
        aria-valuemin={0} 
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Calculando… {percentage}%
      </p>
    </div>
  )
})

export const Sidebar = memo(
  forwardRef<PieceListHandle, SidebarProps>(function Sidebar(
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
      <aside aria-label="Panel lateral de configuración" className="flex h-full w-full flex-col gap-2.5">
        <section className="rounded-2xl bg-foreground/5 p-2.5">
          <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Plancha
          </h2>
        </section>

        <CollapsibleSection title="Proyecto y material" defaultOpen={false}>
          <MaterialPanel settings={settings} onChange={onSettingsChange} />
        </CollapsibleSection>

        <CollapsibleSection title="Máquina" defaultOpen={false}>
          <MachinePanel settings={machine} onChange={onMachineChange} />
        </CollapsibleSection>

        <div className="flex min-h-45 flex-1 flex-col rounded-2xl bg-foreground/5 p-2.5">
          <PieceList ref={ref} {...pieceListProps} />
        </div>

        <ExecutionFooter
          isRunning={isRunning}
          canRun={canRun}
          progress={progress}
          onRun={onRun}
          onCancel={onCancel}
        />

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </aside>
    )
  })
)