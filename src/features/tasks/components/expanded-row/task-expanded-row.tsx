"use client"

import { useState } from "react"
import { Activity, ClipboardList, MessageSquare } from "lucide-react"

import type {
  Task,
} from "../../types/task.types"

import {
  EntityExpandedContent,
  EntityExpandedHeader,
  EntityExpandedRow,
  EntityExpandedToggle,
  EntityExpandedSlider,
} from "@/shared/ui/entity-expanded-row"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

import {
  TaskKpisSection,
} from "./task-kpis-section"

import {
  TaskProductionPanel,
} from "./production/task-production-panel"

import {
  TaskCommentsPanel,
} from "./comments/task-comments-panel"

import { CommentHistoryDialog } from "@/features/comments/components/comment-history-dialog"

type Props={
  task:Task
}

export function TaskExpandedRow({
  task,
}:Props){

  const { isMobile } = useResponsive()

  // Antes Workflow/Mensajes vivían siempre lado a lado (o apilados
  // en angosto) y KPIs siempre arriba, fijo — ahora las 3 son
  // opciones de un mismo toggle, igual que ya se hizo en
  // ProjectExpandedRow.
  const [
    activeView,
    setActiveView,
  ] = useState<"workflow" | "comments" | "kpis">("workflow")

  const [
    commentsDialogOpen,
    setCommentsDialogOpen,
  ] = useState(false)

  // Mismo criterio que ProjectExpandedRow: en mobile, "Mensajes"
  // abre el diálogo completo (composer + historial) en vez de
  // cambiar la vista inline — no entra bien apretado en pantalla
  // chica. En desktop cambia activeView y muestra TaskCommentsPanel
  // ahí mismo, como el resto de las opciones.
  const handleViewChange = (
    next: "workflow" | "comments" | "kpis",
  ) => {

    if (isMobile && next === "comments") {
      setCommentsDialogOpen(true)
      return
    }

    setActiveView(next)

  }

  return(

    <EntityExpandedRow
      rowId={task.id}
    >

      <EntityExpandedHeader
        section="TAREA OPERATIVA"
        title={task.reference}
        metric={task.route.length}
        metricLabel="procesos definidos"
      />

      <EntityExpandedContent>

        <div className="mb-2 flex items-center justify-between select-none">

          <div className="mb-2 hidden items-center justify-between select-none tablet:flex">
            <span className="text-xs font-semibold tracking-widest text-neutral-500">
              {activeView === "workflow"
                ? "WORKFLOW OPERATIVO"
                : activeView === "comments"
                  ? "MENSAJES"
                  : "INDICADORES"}
            </span>
          </div>

          <EntityExpandedToggle
            value={activeView}
            onChange={handleViewChange}
            fullWidth={isMobile}
            options={[
              {
                value: "workflow",
                label: "Workflow",
                icon: ClipboardList,
              },
              {
                value: "comments",
                label: "Mensajes",
                icon: MessageSquare,
              },
              {
                value: "kpis",
                label: "KPIs",
                icon: Activity,
              },
            ]}
          />

        </div>

        <EntityExpandedSlider
          value={activeView}
          panels={[
            {
              value: "workflow",
              content: (
                <TaskProductionPanel
                  task={task}
                />
              ),
            },
            {
              value: "comments",
              content: (
                <TaskCommentsPanel
                  taskId={task.id}
                />
              ),
            },
            {
              value: "kpis",
              content: (
                <TaskKpisSection
                  task={task}
                />
              ),
            },
          ]}
        />

      </EntityExpandedContent>

      {/* Solo relevante en mobile — en desktop activeView ya
          maneja "Mensajes" mostrando TaskCommentsPanel inline (ver
          handleViewChange). */}
      <CommentHistoryDialog
        target={{ scope: "task", taskId: task.id }}
        open={commentsDialogOpen}
        onOpenChange={setCommentsDialogOpen}
      />

    </EntityExpandedRow>

  )

}