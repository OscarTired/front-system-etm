"use client"

import type { ReactNode } from "react"
import { LayoutGrid, Layers, Info, SlidersHorizontal } from "lucide-react"

import {
  EntityExpandedToggle,
  type EntityExpandedToggleOption,
} from "@/shared/ui/entity-expanded-row/entity-expanded-toggle"

export type NestingPanelView = "sheet-pieces" | "project-material" | "layers" | "inspector"

const PANEL_OPTIONS: EntityExpandedToggleOption<NestingPanelView>[] = [
  { value: "project-material", label: "Proyecto y Material", icon: SlidersHorizontal },
  { value: "sheet-pieces", label: "Piezas", icon: LayoutGrid },
  { value: "layers", label: "Capas", icon: Layers },
  { value: "inspector", label: "Inspector", icon: Info },
]

export interface NestingPanelProps {
  activePanel: NestingPanelView
  onActivePanelChange: (v: NestingPanelView) => void
  pieces: ReactNode
  projectMaterial: ReactNode
  layers: ReactNode
  inspector: ReactNode
  /** Botón Nestear / progreso */
  footer?: ReactNode
}

/**
 * Panel lateral de nesting — reutiliza EntityExpandedToggle de shared
 * (mismo control que el resto de la app).
 */
export function NestingPanel({
  activePanel,
  onActivePanelChange,
  pieces,
  projectMaterial,
  layers,
  inspector,
  footer,
}: NestingPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <EntityExpandedToggle
        value={activePanel}
        onChange={onActivePanelChange}
        options={PANEL_OPTIONS}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activePanel === "sheet-pieces" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-muted/40 dark:bg-foreground/5 p-3">
            {pieces}
          </div>
        )}
        {activePanel === "project-material" && (
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-muted/40 dark:bg-foreground/5">
            {projectMaterial}
          </div>
        )}
        {activePanel === "layers" && (
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-muted/40 dark:bg-foreground/5">{layers}</div>
        )}
        {activePanel === "inspector" && (
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-muted/40 dark:bg-foreground/5">{inspector}</div>
        )}
      </div>

      {footer && <div className="mt-auto shrink-0 pt-1">{footer}</div>}
    </div>
  )
}
