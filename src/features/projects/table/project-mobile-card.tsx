"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

import { ChevronDown, MoreHorizontal } from "lucide-react"

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

/** Extrae YY-NNN del projectCode (quita -M / -E / -EM) */
function formatCodeBadge(code: string) {
  const match = code.match(/^(\d{2}-\d{3})/)
  return match ? match[1] : code
}

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

  const { isMobile } = useResponsive()
  const searchParams = useSearchParams()
  const isTarget = searchParams.get("projectId") === project.id

  useEffect(() => {
    if (!expanded) {
      setShowFields(false)
      setShowPipeline(false)
      return
    }
    // Desktop: al expandir el row se abre el detalle de una (sin ⋮)
    if (!isMobile) {
      setShowPipeline(true)
    }
  }, [expanded, isMobile])

  useEffect(() => {
    if (expanded && isTarget) {
      setShowPipeline(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, isTarget])

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
          {/* Código YY-NNN */}
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide md:px-2 md:py-1 md:text-[11px]"
            style={{
              backgroundColor: `${project.client.color}15`,
              color: project.client.color,
            }}
          >
            {formatCodeBadge(project.projectCode)}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {project.name}
            </p>

            {/* Datos compactos en la Fila principal (CON NOMBRE del PM) */}
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

              {/* Etapa */}
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

              {/* Estado */}
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

              {/* PM: Nombre visible también en móvil dentro del row principal */}
              <span className="min-w-0 truncate text-neutral-400">
                {project.pm.name}
              </span>
            </div>
          </div>

          {/* Solo el número de conteo de tareas en el row principal */}
          <span
            title={
              (project.taskCount ?? 0) === 1
                ? "1 tarea"
                : `${project.taskCount ?? 0} tareas`
            }
            className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 px-1.5 text-[10px] font-semibold tabular-nums text-green-300"
          >
            {project.taskCount ?? 0}
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
            {/* Datos colapsados ADENTRO (CON ICONO/INICIAL DE PM en lugar de nombre) */}
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

              {/* PM solo icono/inicial en móvil adentro del panel colapsado */}
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

            {/* Fecha en el panel colapsado (opcional si la necesitas visible al estar expandido) */}
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

        <div className="flex items-center justify-start gap-1">
          {/* Móvil: ⋮ abre el detalle. Desktop: se abre solo al expandir el row. */}
          {isMobile && (
            <IconAction
              icon={MoreHorizontal}
              onClick={() =>
                setShowPipeline(current => !current)
              }
            />
          )}

          <ProjectRowActions project={project} />
        </div>

        <CollapsibleHeightSection open={showPipeline}>
          <ProjectExpandedRow project={project} tasks={tasks} />
        </CollapsibleHeightSection>
      </CollapsibleHeightSection>
    </div>
  )
}