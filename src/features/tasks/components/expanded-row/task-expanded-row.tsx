"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Activity, ClipboardList, MessageSquare } from "lucide-react"

import type {
  Task,
} from "../../types/task.types"

import {
  EntityExpandedContent,
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

type Props = {
  task: Task
}

export function TaskExpandedRow({
  task,
}: Props) {
  const { isMobile } = useResponsive()
  const searchParams = useSearchParams()

  const urlTaskId = searchParams.get("taskId")
  const isTarget = urlTaskId === task.id
  const tabParam = searchParams.get("tab")

  const initialTab = isTarget && tabParam === "comments" ? "comments" : "workflow"

  const [
    activeView,
    setActiveView,
  ] = useState<"workflow" | "comments" | "kpis">(initialTab)

  const [
    commentsDialogOpen,
    setCommentsDialogOpen,
  ] = useState(false)

  // Al llegar desde una notificación (o cualquier link con
  // ?tab=comments) en mobile, el tab de Comentarios no es un tab
  // normal — abre este diálogo aparte (ver handleViewChange abajo).
  // Sin este efecto, aterrizar acá con tab=comments en mobile no
  // hacía nada visible: activeView quedaba en "comments" pero como
  // en mobile eso nunca se renderiza inline, había que tocar el tab
  // OTRA VEZ a mano para que se abriera el diálogo — el deep-link
  // de la notificación no cumplía lo que prometía.
  useEffect(() => {

    if (isMobile && initialTab === "comments") {
      setCommentsDialogOpen(true)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleViewChange = (
    next: "workflow" | "comments" | "kpis",
  ) => {
    if (isMobile && next === "comments") {
      setCommentsDialogOpen(true)
      return
    }

    setActiveView(next)
  }

  return (
    <EntityExpandedRow
      rowId={task.id}
    >
      <EntityExpandedContent>
        {/* Contenedor del toggle unificado con el comportamiento de ProjectExpandedRow */}
        <div className="mb-2 flex items-center justify-end select-none">
          <EntityExpandedToggle
            value={activeView}
            onChange={handleViewChange}
            options={[
              {
                value: "workflow",
                label: "Workflow",
                icon: ClipboardList,
              },
              {
                value: "kpis",
                label: "KPIs",
                icon: Activity,
              },
              {
                value: "comments",
                label: "Mensajes",
                icon: MessageSquare,
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
              value: "kpis",
              content: (
                <TaskKpisSection
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
          ]}
        />
      </EntityExpandedContent>

      <CommentHistoryDialog
        target={{ scope: "task", taskId: task.id }}
        open={commentsDialogOpen}
        onOpenChange={setCommentsDialogOpen}
      />
    </EntityExpandedRow>
  )
}