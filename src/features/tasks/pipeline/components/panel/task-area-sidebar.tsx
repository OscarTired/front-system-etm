"use client"

import { useTaskAreaPanel } from "../../hooks/use-task-area-panel"
import { TaskAreaPanelBody } from "./task-area-panel-body"

/**
 * Sidebar desktop bitácora.
 * Alto acotado por el padre; el scroll vertical vive solo adentro
 * (mismo modelo que EntityTable: overflow-hidden + flex-1 min-h-0).
 */
export function TaskAreaSidebar({ className }: { className?: string }) {
  const panel = useTaskAreaPanel()
  const { state } = panel

  if (!state.hasAreaPanel) return null

  return (
    <aside
      className={
        className ??
        "flex h-full min-h-0 w-[min(40vw,26rem)] shrink-0 flex-col overflow-hidden rounded-2xl bg-card"
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
