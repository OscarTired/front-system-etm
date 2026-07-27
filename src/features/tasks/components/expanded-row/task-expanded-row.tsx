"use client"

import { useState } from "react"
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

type Props={
  task:Task
}

export function TaskExpandedRow({
  task,
}:Props){

  const { isMobile } = useResponsive()

  const [
    activeView,
    setActiveView,
  ] = useState<"workflow" | "comments" | "kpis">("workflow")

  const [
    commentsDialogOpen,
    setCommentsDialogOpen,
  ] = useState(false)

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

      <EntityExpandedContent>

        <div className="mb-2 flex items-center justify-end select-none">
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

      <CommentHistoryDialog
        target={{ scope: "task", taskId: task.id }}
        open={commentsDialogOpen}
        onOpenChange={setCommentsDialogOpen}
      />

    </EntityExpandedRow>

  )

}