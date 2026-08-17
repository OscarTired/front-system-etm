"use client"

import { useTaskAreaPanel } from "../../hooks/use-task-area-panel"
import { TaskAreaPanelBody } from "./task-area-panel-body"

/**
 * Columna lateral desktop de "Mis tareas".
 * Áreas en columnas horizontales (no apiladas) → franjas más cortas.
 */
export function TaskAreaSidebar({ className }: { className?: string }) {
  const panel = useTaskAreaPanel()
  const { state } = panel

  if (!state.hasAreaPanel) return null

  return (
    <aside
      className={
        className ??
        "flex h-full min-h-0 w-[min(42vw,28rem)] shrink-0 flex-col overflow-hidden rounded-2xl bg-card"
      }
    >
      <TaskAreaPanelBody
        panel={panel}
        title="Mis tareas"
        orientation="horizontal"
      />
    </aside>
  )
}
