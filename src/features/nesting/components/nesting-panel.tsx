"use client"

import type { ReactNode } from "react"
import { LayoutGrid, Layers, Info, SlidersHorizontal } from "lucide-react"

import {
  EntityExpandedToggle,
  type EntityExpandedToggleOption,
} from "@/shared/ui/entity-expanded-row/entity-expanded-toggle"

export type NestingPanelView =
  | "sheet-pieces"
  | "project-material"
  | "layers"
  | "inspector"

const PANEL_OPTIONS: EntityExpandedToggleOption<NestingPanelView>[] = [
  {
    value: "project-material",
    label: "Proyecto y Material",
    icon: SlidersHorizontal,
  },
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
  footer?: ReactNode
}

/**
 * Panel lateral nesting.
 * Zona de contenido: min-h-0 + overflow-y-auto (única fuente de scroll).
 * Footer (Nestear) siempre visible fuera del scroller.
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
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-background p-3 shadow-sm dark:bg-foreground/[0.06] dark:shadow-none">
            {pieces}
          </div>
        )}
        {activePanel === "project-material" && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl bg-background shadow-sm dark:bg-foreground/[0.06] dark:shadow-none">
            {projectMaterial}
          </div>
        )}
        {activePanel === "layers" && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl bg-background shadow-sm dark:bg-foreground/[0.06] dark:shadow-none">
            {layers}
          </div>
        )}
        {activePanel === "inspector" && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl bg-background shadow-sm dark:bg-foreground/[0.06] dark:shadow-none">
            {inspector}
          </div>
        )}
      </div>

      {footer && <div className="mt-auto shrink-0 pt-1">{footer}</div>}
    </div>
  )
}
