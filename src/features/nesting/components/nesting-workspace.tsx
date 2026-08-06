"use client"

import type { ReactNode } from "react"

export interface NestingWorkspaceProps {
  /** Sheet tabs arriba */
  tabs?: ReactNode
  /** DxfCanvas u empty state */
  canvas: ReactNode
  /** Barra de selección / alinear debajo o encima */
  selectionBar?: ReactNode
  className?: string
}

/**
 * Área de trabajo: tabs + canvas a pantalla completa del slot.
 * Sin sidebar — el shell se encarga del rail/drawer.
 */
export function NestingWorkspace({ tabs, canvas, selectionBar, className }: NestingWorkspaceProps) {
  return (
    <div className={`flex h-full min-h-0 flex-col ${className ?? ""}`}>
      {tabs && <div className="shrink-0 px-2 pt-2">{tabs}</div>}
      <div className="relative min-h-0 flex-1 overflow-hidden p-2">{canvas}</div>
      {selectionBar && (
        <div className="shrink-0 border-t border-white/5 px-2 py-1.5">{selectionBar}</div>
      )}
    </div>
  )
}
