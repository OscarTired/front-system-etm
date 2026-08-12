"use client"

import { Activity, AlertTriangle, CheckCircle2, ClipboardList, MessageSquare, Puzzle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"

import type { Project } from "../../types/project.types"
import type { Task } from "@/features/tasks/types/task.types"

import { isWorkflowCompleted } from "@/features/workflow/selectors/is-completed"

import { ProcessMiniCard } from "@/shared/ui/mini-card/process-mini-card"
import { KpiCarousel, type KpiItem } from "@/shared/ui/mini-card/kpi-carousel"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useComments } from "@/features/comments/hooks/use-comments"
import { useActiveCommentContextStore } from "@/features/comments/store/active-comment-context-store"

import {
  EntityExpandedContent,
  EntityExpandedRow,
  EntityExpandedToggle,
  EntityExpandedSlider,
} from "@/shared/ui/entity-expanded-row"

import { ProjectTasksList } from "./project-tasks-list"
import { CommentHistoryDialog } from "@/features/comments/components/comment-history-dialog"
import { useFocusSettleStore } from "@/shared/focus/store/focus-settle-store"

type Props = {
  project: Project
  tasks: Task[]
}

const CRITICAL_PRIORITY_CODE = "URGENTE"

export function ProjectExpandedRow({
  project,
  tasks,
}: Props) {
  const { isMobile, ready } = useResponsive()
  const searchParams = useSearchParams()

  const urlProjectId = searchParams.get("projectId")
  const isTarget = urlProjectId === project.id
  const tabParam = searchParams.get("tab")

  const [
    activeView,
    setActiveView,
  ] = useState<"tasks" | "comments" | "kpis">("tasks")

  const [
    commentsDialogOpen,
    setCommentsDialogOpen,
  ] = useState(false)

  // Solo fetch cuando el usuario mira mensajes (no en cada fila de la lista).
  const commentsEnabled =
    activeView === "comments" || commentsDialogOpen

  const { comments } = useComments(
    { scope: "project", projectId: project.id },
    commentsEnabled,
  )
  // Badge desde el listado; al abrir mensajes, comments.length es la fuente viva.
  const totalComments = commentsEnabled
    ? comments.length
    : (project.commentCount ?? 0)

  const {
    totalTasks,
    totalPieces,
    criticalPriorityTasks,
    completedTasks,
  } = useMemo(() => {
    let totalTasks = 0
    let totalPieces = 0
    let criticalPriorityTasks = 0
    let completedTasks = 0

    for (const task of tasks) {
      if (task.project.id !== project.id) {
        continue
      }

      totalTasks++
      totalPieces += task.pieces

      if (task.priority.code === CRITICAL_PRIORITY_CODE) {
        criticalPriorityTasks++
      }

      if (isWorkflowCompleted(task.workflowSteps)) {
        completedTasks++
      }
    }

    return {
      totalTasks,
      totalPieces,
      criticalPriorityTasks,
      completedTasks,
    }
  }, [
    tasks,
    project.id,
  ])

  const urlFocusToken = searchParams.get("focus")
  const settledToken = useFocusSettleStore(s => s.settledToken)
  const focusSettled = !urlFocusToken || settledToken === urlFocusToken

  useEffect(() => {
    if (!isTarget) {
      return
    }

    if (tabParam === "comments") {
      if (!focusSettled) {
        return
      }

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

    setActiveView("tasks")
  }, [
    isTarget,
    tabParam,
    isMobile,
    focusSettled,
  ])

  const setActiveTarget = useActiveCommentContextStore(s => s.setActiveTarget)

  useEffect(() => {

    const isViewingComments =
      (!isMobile && activeView === "comments") ||
      (isMobile && commentsDialogOpen)

    if (isViewingComments) {
      setActiveTarget({ scope: "project", projectId: project.id })
    }

    return () => {
      setActiveTarget(null)
    }

  }, [activeView, commentsDialogOpen, isMobile, project.id, setActiveTarget])

  const handleViewChange = (
    next: "tasks" | "comments" | "kpis",
  ) => {
    // Mensajes: siempre dialog (sin panel inline).
    if (next === "comments") {
      setCommentsDialogOpen(true)
      return
    }

    setActiveView(next)
  }

  const cards = [
    <ProcessMiniCard
      key="tasks"
      size={isMobile ? "large" : "default"}
      label="Tareas"
      icon={ClipboardList}
      color={"#afafaf"}
      rows={[
        {
          label: "Total",
          value: totalTasks,
        },
        {
          label: "Con ruta",
          value: totalTasks,
        },
      ]}
    />,

    <ProcessMiniCard
      key="pieces"
      size={isMobile ? "large" : "default"}
      label="Piezas"
      icon={Puzzle}
      color={"#a6c7d4"}
      rows={[
        {
          label: "Total",
          value: totalPieces,
        },
        {
          label: "Promedio",
          value: totalTasks > 0
            ? Math.round(totalPieces / totalTasks)
            : 0,
        },
      ]}
    />,

    <ProcessMiniCard
      key="urgent"
      size={isMobile ? "large" : "default"}
      label="Urgentes"
      icon={AlertTriangle}
      color={"#EF4444"}
      rows={[
        {
          label: "Total",
          value: criticalPriorityTasks,
        },
        {
          label: "Porcentaje",
          value: totalTasks > 0
            ? `${Math.round((criticalPriorityTasks / totalTasks) * 100)}%`
            : "0%",
        },
      ]}
    />,

    <ProcessMiniCard
      key="progress"
      size={isMobile ? "large" : "default"}
      label="Avance"
      icon={CheckCircle2}
      color={"#22C55E"}
      rows={[
        {
          label: "Finalizadas",
          value: completedTasks,
        },
        {
          label: "Progreso",
          value: totalTasks > 0
            ? `${Math.round((completedTasks / totalTasks) * 100)}%`
            : "0%",
        },
      ]}
    />,
  ]

  const items: KpiItem[] = [
    {
      icon: ClipboardList,
      color: "#afafaf",
      label: "Total tareas",
      value: totalTasks,
    },
    {
      icon: ClipboardList,
      color: "#afafaf",
      label: "Con ruta",
      value: totalTasks,
    },
    {
      icon: Puzzle,
      color: "#a6c7d4",
      label: "Piezas",
      value: totalPieces,
    },
    {
      icon: Puzzle,
      color: "#a6c7d4",
      label: "Promedio",
      value: totalTasks > 0
        ? Math.round(totalPieces / totalTasks)
        : 0,
    },
    {
      icon: AlertTriangle,
      color: "#EF4444",
      label: "Urgentes",
      value: criticalPriorityTasks,
    },
    {
      icon: AlertTriangle,
      color: "#EF4444",
      label: "% urgentes",
      value: totalTasks > 0
        ? `${Math.round((criticalPriorityTasks / totalTasks) * 100)}%`
        : "0%",
    },
    {
      icon: CheckCircle2,
      color: "#22C55E",
      label: "Finalizadas",
      value: completedTasks,
    },
    {
      icon: CheckCircle2,
      color: "#22C55E",
      label: "Progreso",
      value: totalTasks > 0
        ? `${Math.round((completedTasks / totalTasks) * 100)}%`
        : "0%",
    },
  ]

  return (
    <EntityExpandedRow rowId={project.id}>
      <EntityExpandedContent>
        <div className="mb-2 flex items-center justify-end select-none">
          <EntityExpandedToggle
            value={activeView}
            onChange={handleViewChange}
            options={[
              {
                value: "tasks",
                label: "Tareas",
                icon: ClipboardList,
                count: totalTasks,
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
              value: "tasks",
              content: (
                <ProjectTasksList
                  projectId={project.id}
                  tasks={tasks}
                />
              ),
            },
            {
              value: "kpis",
              content: !ready ? null : (
                <KpiCarousel
                  cards={cards}
                  items={items}
                  summary={{
                    icon: CheckCircle2,
                    color: "#22C55E",
                    label: "Avance",
                    values: [
                      { label: "Finalizadas", value: completedTasks },
                      {
                        label: "Progreso",
                        value: totalTasks > 0
                          ? `${Math.round((completedTasks / totalTasks) * 100)}%`
                          : "0%",
                      },
                    ],
                  }}
                />
              ),
            },
            // Mensajes: CommentHistoryDialog

          ]}
        />
      </EntityExpandedContent>

      <CommentHistoryDialog
        target={{ scope: "project", projectId: project.id }}
        open={commentsDialogOpen}
        onOpenChange={setCommentsDialogOpen}
      />
    </EntityExpandedRow>
  )
}