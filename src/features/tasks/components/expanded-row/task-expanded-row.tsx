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
import { useComments } from "@/features/comments/hooks/use-comments"

import {
  TaskKpisSection,
} from "./task-kpis-section"

import {
  TaskProductionPanel,
} from "./production/task-production-panel"

import { CommentHistoryDialog } from "@/features/comments/components/comment-history-dialog"
import { useActiveCommentContextStore } from "@/features/comments/store/active-comment-context-store"

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

  const [
    activeView,
    setActiveView,
  ] = useState<"workflow" | "comments" | "kpis">("workflow")

  const [
    commentsDialogOpen,
    setCommentsDialogOpen,
  ] = useState(false)

  // Ruta / indicadores: abiertos al expandir la tarea; el usuario decide cerrar.
  const [
    indicatorsExpanded,
    setIndicatorsExpanded,
  ] = useState(true)

  // Solo fetch al ver mensajes — no por cada fila de la lista.
  const commentsEnabled =
    activeView === "comments" || commentsDialogOpen

  const { comments } = useComments(
    { scope: "task", taskId: task.id },
    commentsEnabled,
  )
  // Solo comentarios de la TAREA (scope task). Los de proceso
  // viven en workflowStep.commentCount — no mezclar.
  const totalComments = commentsEnabled
    ? comments.length
    : (task.commentCount ?? 0)

  useEffect(() => {
    if (!isTarget) {
      return
    }

    if (tabParam === "comments") {
      setActiveView("comments")

      if (isMobile) {
        setCommentsDialogOpen(true)
      }

      return
    }

    if (tabParam === "kpis") {
      setActiveView("kpis")
      return
    }

    setActiveView("workflow")
  }, [
    isTarget,
    tabParam,
    isMobile,
  ])

  const setActiveTarget = useActiveCommentContextStore(s => s.setActiveTarget)

  useEffect(() => {

    const isViewingComments =
      (!isMobile && activeView === "comments") ||
      (isMobile && commentsDialogOpen)

    if (isViewingComments) {
      setActiveTarget({ scope: "task", taskId: task.id })
    }

    return () => {
      setActiveTarget(null)
    }

  }, [activeView, commentsDialogOpen, isMobile, task.id, setActiveTarget])

  const handleViewChange = (
    next: "workflow" | "comments" | "kpis",
  ) => {
    // Mensajes: siempre dialog (sin panel inline summary/composer).
    if (next === "comments") {
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
                count: totalComments,
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
                  indicatorsExpanded={indicatorsExpanded}
                  onIndicatorsExpandedChange={setIndicatorsExpanded}
                  showCollapseButton
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
            // Mensajes: CommentHistoryDialog (no panel inline)
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