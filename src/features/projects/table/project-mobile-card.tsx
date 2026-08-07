"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { ChevronDown, MoreHorizontal } from "lucide-react"

import { CollapsibleHeightSection } from "@/shared/ui/collapsible-height-section"
import { cn } from "@/shared/utils/utils"
import { formatDate } from "@/shared/utils/date-format"

import type { Project } from "../types/project.types"
import type { Task } from "@/features/tasks/types/task.types"

import { isProjectCompleted } from "../selectors/is-project-completed"

import { ProjectClientCell } from "../components/cells/project-client-cell"
import { ProjectStageCell } from "../components/cells/project-stage-cell"
import { ProjectStatusCell } from "../components/cells/project-status-cell"
import { ProjectPmCell } from "../components/cells/project-pm-cell"
import { ProjectRowActions } from "../components/actions/project-row-actions"
import { ProjectExpandedRow } from "../components/expanded-row/project-expanded-row"
import { IconAction } from "@/shared/ui/actions/icon-action"
import { DragCell } from "@/shared/ui/entity-table-common/drag-cell"

type Props = {
  project: Project
  tasks: Task[]
  expanded: boolean
  onToggle: () => void
}

export function ProjectMobileCard({
  project,
  tasks,
  expanded,
  onToggle,
}: Props) {
  const [showFields, setShowFields] = useState(false)
  const [showPipeline, setShowPipeline] = useState(false)

  const searchParams = useSearchParams()
  const isTarget = searchParams.get("projectId") === project.id

  useEffect(() => {
    if (!expanded) {
      setShowFields(false)
      setShowPipeline(false)
    }
  }, [expanded])

  // Sin esto, useFocusedRow (el mecanismo que expande la card al
  // llegar desde una notificación/link) solo abría el PRIMER nivel
  // — el segundo nivel (el panel de abajo, con Tareas/Comentarios/
  // KPIs) seguía requiriendo el toque manual en MoreHorizontal.
  useEffect(() => {
    if (expanded && isTarget) {
      setShowPipeline(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, isTarget])

  // Mismo criterio que ya usa TaskPipelineCard/TaskMobileCard/
  // ProcessMobileCard: un proyecto finalizado, mostrado solo porque
  // el historial está activo, queda atenuado.
  const isDimmed = isProjectCompleted(project)

  return (
    <div className={cn("overflow-hidden rounded-xl bg-white/2 transition-opacity", isDimmed && "opacity-50")}>
      <div className="flex items-center gap-1 px-1">
        <DragCell />

        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2.5 py-3 pr-2 text-left"
        >
          {/* Código completo con el color del cliente */}
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
            style={{
              backgroundColor: `${project.client.color}15`,
              color: project.client.color,
            }}
          >
            {project.projectCode}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {project.name}
            </p>

            {/* ID (sequence) debajo del nombre */}
            <p className="mt-0.5 truncate text-xs text-neutral-500">
              {String(project.sequence).padStart(3, "0")}
            </p>
          </div>

          <span className="shrink-0 text-xs text-neutral-500">
            {formatDate(project.deliveryDate)}
          </span>

          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-neutral-500 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </button>
      </div>

      <CollapsibleHeightSection open={expanded} className="space-y-3 px-3 pb-3 pt-3">
        {showFields ? (
          <div className="animate-comment-in flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowFields(false)}
              className="flex w-full items-center justify-between rounded-lg bg-white/3 px-3 py-2 text-xs font-medium text-neutral-500 transition hover:bg-white/5"
            >
              Ocultar campos
              <ChevronDown
                size={14}
                className="shrink-0 rotate-180 text-neutral-500"
              />
            </button>

            <ProjectClientCell project={project} triggerVariant="row" rowLabel="Cliente" />
            <ProjectStageCell project={project} triggerVariant="row" rowLabel="Etapa" />
            <ProjectStatusCell project={project} triggerVariant="row" rowLabel="Estado" />
            <ProjectPmCell project={project} triggerVariant="row" rowLabel="PM" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowFields(true)}
            className="animate-comment-in flex w-full items-center gap-2 rounded-lg bg-white/3 px-3 py-2.5 transition hover:bg-white/5"
          >
            <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-sm text-neutral-300">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: project.client.color }}
              />
              <span className="shrink-0 truncate">{project.client.name}</span>

              <span className="shrink-0 text-neutral-600">·</span>

              <span
                className="shrink-0 truncate"
                style={{ color: project.stage.color }}
              >
                {project.stage.name}
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              <span
                className="shrink-0 truncate"
                style={{ color: project.status.color }}
              >
                {project.status.name}
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              <span className="min-w-0 truncate text-neutral-400">{project.pm.name}</span>
            </span>

            <ChevronDown
              size={14}
              className="shrink-0 text-neutral-500"
            />
          </button>
        )}

        <div className="flex items-center justify-start gap-1">
          <IconAction
            icon={MoreHorizontal}
            onClick={() =>
              setShowPipeline(current => !current)
            }
          />

          <ProjectRowActions project={project} />
        </div>

        <CollapsibleHeightSection open={showPipeline}>
          <ProjectExpandedRow project={project} tasks={tasks} />
        </CollapsibleHeightSection>
      </CollapsibleHeightSection>
    </div>
  )
}