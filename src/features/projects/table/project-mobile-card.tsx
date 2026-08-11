"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

import { ChevronDown, Plus, MessageSquare } from "lucide-react"

import { CollapsibleHeightSection } from "@/shared/ui/collapsible-height-section"
import { cn } from "@/shared/utils/utils"
import { formatDate } from "@/shared/utils/date-format"
import {
  ENTITY_ICONS,
  type EntityIcon,
} from "@/shared/constants/entity-icons"

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
import { useSortStore } from "@/shared/sorting/store/sort-store"
import { TaskDialog } from "@/features/tasks/components/dialog/task-dialog"
import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { displayProjectCode } from "@/features/projects/utils/display-project-code"


function EntityIconBadge({
  icon,
  color,
  size = 12,
}: {
  icon?: EntityIcon
  color: string
  size?: number
}) {
  if (!icon) return null
  const Icon = ENTITY_ICONS[icon]
  if (!Icon) return null
  return <Icon size={size} strokeWidth={2.25} style={{ color }} className="shrink-0" />
}

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
  const [newTaskOpen, setNewTaskOpen] = useState(false)

  const { isMobile } = useResponsive()
  const isManualMode = useSortStore(s => s.projectSortMode === "manual")
  const { has } = usePermissions()
  const canCreateTask = has(PermissionCode.TASK_CREATE)
  const searchParams = useSearchParams()
  const isTarget = searchParams.get("projectId") === project.id

  useEffect(() => {
    if (!expanded) {
      setShowFields(false)
      setShowPipeline(false)
      return
    }
    // Móvil y desktop: al expandir el row se abre el detalle de una
    setShowPipeline(true)
  }, [expanded])

  useEffect(() => {
    if (expanded && isTarget) {
      setShowPipeline(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, isTarget])

  const isDimmed = isProjectCompleted(project)
  // Móvil expandido: acciones en el row; burbuja de conteo cede el sitio
  const actionsOnRow = isMobile && expanded

  return (
    <div className={cn("overflow-hidden rounded-xl bg-white/2 transition-opacity", isDimmed && "opacity-50")}>
      <div className="flex items-center gap-1 px-1">
        <DragCell hidden={!isManualMode} />

        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2.5 py-3 pr-1 text-left"
        >
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide md:px-2 md:py-1 md:text-[11px]"
            style={{
              backgroundColor: `${project.client.color}15`,
              color: project.client.color,
            }}
          >
            {displayProjectCode(project.projectCode)}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {project.name}
            </p>

            <div
              className={cn(
                "mt-0.5 flex min-w-0 items-center gap-1.5 overflow-hidden text-xs transition-all duration-200",
                expanded
                  ? "max-h-0 opacity-0"
                  : "max-h-5 opacity-100",
              )}
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: project.client.color }}
              />
              <span className="shrink-0 truncate text-neutral-400">
                {project.client.name}
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  <EntityIconBadge
                    icon={project.stage.icon}
                    color={project.stage.color}
                    size={12}
                  />
                </span>
                <span
                  className="hidden truncate md:inline"
                  style={{ color: project.stage.color }}
                >
                  {project.stage.name}
                </span>
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  <EntityIconBadge
                    icon={project.status.icon}
                    color={project.status.color}
                    size={12}
                  />
                </span>
                <span
                  className="hidden truncate md:inline"
                  style={{ color: project.status.color }}
                >
                  {project.status.name}
                </span>
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              <span className="min-w-0 truncate text-neutral-400">
                {project.pm.name}
              </span>
            </div>
          </div>

          {/* Orden: tareas → mensajes → fecha */}
          {!actionsOnRow && (
            <span className="flex shrink-0 items-center gap-1">
              <span
                title={
                  (project.taskCount ?? 0) === 1
                    ? "1 tarea"
                    : `${project.taskCount ?? 0} tareas`
                }
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500/15 px-1.5 text-[10px] font-semibold tabular-nums text-green-300"
              >
                {project.taskCount ?? 0}
              </span>
              <span
                title={
                  (project.commentCount ?? 0) === 1
                    ? "1 mensaje"
                    : `${project.commentCount ?? 0} mensajes`
                }
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                  (project.commentCount ?? 0) > 0
                    ? "bg-sky-500/15 text-sky-300"
                    : "bg-white/5 text-neutral-600",
                )}
              >
                <MessageSquare size={10} strokeWidth={2.5} />
                {(project.commentCount ?? 0) > 0 ? project.commentCount : null}
              </span>
            </span>
          )}

          <span className="hidden shrink-0 text-xs tabular-nums text-neutral-500 md:inline">
            {formatDate(project.deliveryDate)}
          </span>
        </button>

        {/* Móvil expandido: lápiz / borrar + nueva tarea en el row */}
        {actionsOnRow && (
          <div
            className="flex shrink-0 items-center gap-0.5 pr-0.5"
            onClick={e => e.stopPropagation()}
          >
            <ProjectRowActions project={project} className="gap-0.5" />
            <IconAction
              icon={Plus}
              disabled={!canCreateTask}
              onClick={() => {
                if (!canCreateTask) return
                setNewTaskOpen(true)
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 p-2"
          aria-label={expanded ? "Colapsar" : "Expandir"}
        >
          <ChevronDown
            size={16}
            className={cn(
              "text-neutral-500 transition-transform duration-200",
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
              <span className="shrink-0 rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-400">
                {String(project.sequence).padStart(3, "0")}
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: project.client.color }}
              />
              <span className="shrink-0 truncate">{project.client.name}</span>

              <span className="shrink-0 text-neutral-600">·</span>

              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  <EntityIconBadge
                    icon={project.stage.icon}
                    color={project.stage.color}
                    size={13}
                  />
                </span>
                <span
                  className="hidden truncate md:inline"
                  style={{ color: project.stage.color }}
                >
                  {project.stage.name}
                </span>
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  <EntityIconBadge
                    icon={project.status.icon}
                    color={project.status.color}
                    size={13}
                  />
                </span>
                <span
                  className="hidden truncate md:inline"
                  style={{ color: project.status.color }}
                >
                  {project.status.name}
                </span>
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  {project.pm.icon ? (
                    <EntityIconBadge
                      icon={project.pm.icon}
                      color={project.pm.color ?? "#a3a3a3"}
                      size={13}
                    />
                  ) : (
                    <span className="text-[11px] font-medium text-neutral-400">
                      {project.pm.name.charAt(0)}
                    </span>
                  )}
                </span>
                <span className="hidden min-w-0 truncate text-neutral-400 md:inline">
                  {project.pm.name}
                </span>
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-1.5 md:hidden">
              <span className="text-xs text-neutral-500">
                {formatDate(project.deliveryDate)}
              </span>
            </span>

            <ChevronDown
              size={14}
              className="shrink-0 text-neutral-500"
            />
          </button>
        )}

        {/* Desktop: acciones en el panel expandido. Móvil: ya están en el row. */}
        {!isMobile && (
          <div className="flex items-center justify-start gap-1">
            <ProjectRowActions project={project} />
          </div>
        )}

        <CollapsibleHeightSection open={showPipeline}>
          <ProjectExpandedRow project={project} tasks={tasks} />
        </CollapsibleHeightSection>
      </CollapsibleHeightSection>

      {newTaskOpen && (
        <TaskDialog
          open
          projectId={project.id}
          promptOpenAfterCreate
          onClose={() => setNewTaskOpen(false)}
        />
      )}
    </div>
  )
}
