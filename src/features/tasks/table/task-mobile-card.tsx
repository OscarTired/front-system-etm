"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ChevronDown, MoreHorizontal } from "lucide-react"

import { CollapsibleHeightSection } from "@/shared/ui/collapsible-height-section"
import { cn } from "@/shared/utils/utils"
import { formatDate } from "@/shared/utils/date-format"
import {
  ENTITY_ICONS,
  type EntityIcon,
} from "@/shared/constants/entity-icons"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

import type { Task } from "../types/task.types"
import { taskAccess } from "../access/task-access"

import { TaskPriorityCell } from "../components/cells/task-priority-cell"
import { TaskRowActions } from "../components/actions/task-row-actions"
import { TaskExpandedRow } from "../components/expanded-row/task-expanded-row"
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
  task: Task
  expanded: boolean
  onToggle: () => void
}

export function TaskMobileCard({
  task,
  expanded,
  onToggle,
}: Props) {
  const [showFields, setShowFields] = useState(false)
  const [showPipeline, setShowPipeline] = useState(false)

  const { isMobile } = useResponsive()
  const searchParams = useSearchParams()

  const isTarget = searchParams.get("taskId") === task.id

  useEffect(() => {
    if (!expanded) {
      setShowFields(false)
      setShowPipeline(false)
    }
  }, [expanded])

  // Sin esto, useFocusedRow (el mecanismo que expande la card al
  // llegar desde una notificación/link) solo abría el PRIMER nivel
  // (esta card) — el segundo nivel (el panel de abajo, con
  // Workflow/Comentarios/KPIs) seguía requiriendo el toque manual en
  // MoreHorizontal, así que "abrir la notificación" nunca mostraba
  // de verdad los comentarios sin un segundo click extra.
  useEffect(() => {
    if (expanded && isTarget) {
      setShowPipeline(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, isTarget])

  const stage = taskAccess.stageLabel(task)
  const status = taskAccess.statusLabel(task)

  // Mismo criterio que ya usa TaskPipelineCard en el Kanban de
  // Tareas y las cards de Proyectos/Procesos: una tarea finalizada,
  // mostrada solo porque el historial está activo, queda atenuada.
  const isDimmed = taskAccess.isCompleted(task)

  return (
    <div className={cn("overflow-hidden rounded-xl bg-white/2 transition-opacity", isDimmed && "opacity-50")}>
      <div className="flex items-center gap-1 px-1">
        <DragCell />

        <div
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onToggle()
            }
          }}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-3 pr-2 text-left"
        >
          {/* Código del proyecto YY-NNN — más grande solo en desktop */}
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide md:px-2 md:py-1 md:text-[11px]"
            style={{
              backgroundColor: `${task.project.client.color}15`,
              color: task.project.client.color,
            }}
          >
            {formatCodeBadge(task.project.projectCode)}
          </span>

          <div className="flex min-w-0 flex-1 flex-col items-start">
            <p className="max-w-full truncate text-sm font-semibold text-white">
              {task.reference}
            </p>

            {/* Datos compactos debajo del nombre — se desvanecen al expandir */}
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
                style={{ backgroundColor: task.project.client.color }}
              />
              <span className="shrink-0 truncate text-neutral-400">
                {task.project.client.name}
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              {/* Etapa: icono en móvil, nombre en desktop */}
              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  <EntityIconBadge
                    icon={stage.icon}
                    color={stage.color}
                    size={12}
                  />
                </span>
                <span
                  className="hidden truncate md:inline"
                  style={{ color: stage.color }}
                >
                  {stage.label}
                </span>
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              {/* Estado: icono en móvil, nombre en desktop */}
              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  <EntityIconBadge
                    icon={status.icon}
                    color={status.color}
                    size={12}
                  />
                </span>
                <span
                  className="hidden truncate md:inline"
                  style={{ color: status.color }}
                >
                  {status.label}
                </span>
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              <span className="min-w-0 truncate text-neutral-400">
                {task.priority.name}
              </span>
            </div>
          </div>

          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-neutral-500 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </div>
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

            {/* ID de tarea antes de los campos */}
            <div className="flex items-center gap-2 rounded-lg bg-white/3 px-3 py-2 text-sm">
              <span className="text-xs font-medium text-neutral-500">ID</span>
              <span className="font-semibold tracking-wide text-neutral-300">
                {String(task.taskNumber).padStart(3, "0")}
              </span>
            </div>

            {/* Código completo del proyecto (con sufijo) */}
            <div className="flex items-center gap-2 rounded-lg bg-white/3 px-3 py-2 text-sm">
              <span className="text-xs font-medium text-neutral-500">Proyecto</span>
              {isMobile ? (
                <span className="font-semibold tracking-wide text-neutral-300">
                  {task.project.projectCode}
                </span>
              ) : (
                <Link
                  href={`/projects?projectId=${task.project.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold tracking-wide text-neutral-300 transition-colors hover:text-cyan-300"
                >
                  {task.project.projectCode}
                </Link>
              )}
            </div>

            <TaskPriorityCell task={task} triggerVariant="row" rowLabel="Prioridad" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowFields(true)}
            className="animate-comment-in flex w-full items-center gap-2 rounded-lg bg-white/3 px-3 py-2.5 transition hover:bg-white/5"
          >
            <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-sm text-neutral-300">
              {/* ID antes del cliente */}
              <span className="shrink-0 rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-400">
                {String(task.taskNumber).padStart(3, "0")}
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: task.project.client.color }}
              />
              <span className="shrink-0 truncate">{task.project.client.name}</span>

              <span className="shrink-0 text-neutral-600">·</span>

              {/* Etapa: icono en móvil */}
              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  <EntityIconBadge
                    icon={stage.icon}
                    color={stage.color}
                    size={13}
                  />
                </span>
                <span
                  className="hidden truncate md:inline"
                  style={{ color: stage.color }}
                >
                  {stage.label}
                </span>
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              {/* Estado: icono en móvil */}
              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  <EntityIconBadge
                    icon={status.icon}
                    color={status.color}
                    size={13}
                  />
                </span>
                <span
                  className="hidden truncate md:inline"
                  style={{ color: status.color }}
                >
                  {status.label}
                </span>
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              <span className="min-w-0 truncate text-neutral-400">
                {task.priority.name}
              </span>
            </span>

            {/* Fecha junto al chevron interno */}
            <span className="shrink-0 text-xs text-neutral-500">
              {formatDate(task.deliveryDate)}
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
          <TaskRowActions task={task} />
        </div>

        <CollapsibleHeightSection open={showPipeline}>
          <TaskExpandedRow task={task} />
        </CollapsibleHeightSection>
      </CollapsibleHeightSection>
    </div>
  )
}