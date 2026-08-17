"use client"

import { useTaskAreaPanel } from "../../hooks/use-task-area-panel"
import { TaskAreaPanelBody } from "./task-area-panel-body"

/**
 * Columna lateral fija de "Mis tareas" / convocatoria para desktop bitácora.
 * Misma data que el sheet móvil; distinto shell (columna vs sheet).
 */
export function TaskAreaSidebar({ className }: { className?: string }) {
  const panel = useTaskAreaPanel()
  const { state } = panel

  if (!state.hasAreaPanel) return null

  return (
    <aside
      className={
        className ??
        "flex h-full min-h-0 w-80 shrink-0 flex-col overflow-hidden rounded-2xl bg-card"
      }
    >
      <TaskAreaPanelBody panel={panel} title="Mis tareas" />
    </aside>
  )
}
