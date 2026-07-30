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

import {
  EntityExpandedContent,
  EntityExpandedRow,
  EntityExpandedToggle,
  EntityExpandedSlider,
} from "@/shared/ui/entity-expanded-row"

import { ProjectTasksList } from "./project-tasks-list"
import { ProjectCommentsPanel } from "../comments/project-comments-panel"
import { CommentHistoryDialog } from "@/features/comments/components/comment-history-dialog"

type Props = {
  project: Project
  tasks: Task[]
}

const CRITICAL_PRIORITY_CODE = "URGENTE"

export function ProjectExpandedRow({
  project,
  tasks,
}: Props) {
  const searchParams = useSearchParams()

  const urlProjectId = searchParams.get("projectId")
  const isTarget = urlProjectId === project.id
  const tabParam = searchParams.get("tab")

  const initialTab = isTarget && tabParam === "comments" ? "comments" : "tasks"

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

  const { isMobile, ready } = useResponsive()

  const [
    activeView,
    setActiveView,
  ] = useState<"tasks" | "comments" | "kpis">(initialTab)

  const [
    commentsDialogOpen,
    setCommentsDialogOpen,
  ] = useState(false)

  const handleViewChange = (
    next: "tasks" | "comments" | "kpis",
  ) => {
    if (isMobile && next === "comments") {
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

  // Mismo dato que las cards de arriba, pero aplanado en filas
  // sueltas (una por métrica) para el carousel mobile — sin esto
  // KpiCarousel no tenía nada que mostrar en la fila de chips y el
  // tab de KPIs quedaba vacío en mobile (items es opcional, así que
  // no rompía en compilación, solo en runtime).
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
            {
              value: "comments",
              content: (
                <ProjectCommentsPanel
                  projectId={project.id}
                />
              ),
            },
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