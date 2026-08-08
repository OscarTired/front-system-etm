"use client"

import type { ReactNode } from "react"
import type { NestingPanelId } from "./nesting-shell"

export interface NestingSidePanelProps {
  activePanel: NestingPanelId
  pieces: ReactNode
  projectMaterial: ReactNode
  layers: ReactNode
  inspector: ReactNode
}

/** Solo el cuerpo del panel activo (sin layout de rail). */
export function NestingSidePanel({
  activePanel,
  pieces,
  projectMaterial,
  layers,
  inspector,
}: NestingSidePanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {activePanel === "sheet-pieces" && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white/3">
          {pieces}
        </div>
      )}
      {activePanel === "project-material" && (
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-white/3">
          {projectMaterial}
        </div>
      )}
      {activePanel === "layers" && (
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-white/3">
          {layers}
        </div>
      )}
      {activePanel === "inspector" && (
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-white/3">
          {inspector}
        </div>
      )}
    </div>
  )
}