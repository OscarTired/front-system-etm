"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { ChevronDown, MessageSquare } from "lucide-react"

import { CollapsibleHeightSection } from "@/shared/ui/collapsible-height-section"
import { cn } from "@/shared/utils/utils"
import { formatDate } from "@/shared/utils/date-format"
import { displayProjectCode } from "@/features/projects/utils/display-project-code"
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
import { DragCell } from "@/shared/ui/entity-table-common/drag-cell"
import { useSortStore } from "@/shared/sorting/store/sort-store"
import { useLongPress } from "@/features/tasks/pipeline/hooks/use-long-press"

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
  const isManualMode = useSortStore(s => s.taskSortMode === "manual")
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToProject = useCallback(() => {
    router.push(`/projects?projectId=${task.project.id}`)
  }, [router, task.project.id])

  const { bind: projectChipLongPress, pressed: projectChipPressed } = useLongPress({
    onLongPress: goToProject,
    threshold: 320,
  })


  const isTarget = searchParams.get("taskId") === task.id

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

  const stage = taskAccess.stageLabel(task)
  const status = taskAccess.statusLabel(task)

  const isDimmed = taskAccess.isCompleted(task)

  return (
    <div className={cn("overflow-hidden rounded-xl bg-white/2 transition-opacity", isDimmed && "opacity-50")}>
      <div className="flex items-center gap-1 px-1">
        <DragCell hidden={!isManualMode} />

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
          {/* Chip código: desktop click → proyecto; móvil long-press → proyecto */}
          <span
            role="link"
            tabIndex={0}
            title={
              isMobile
                ? "Mantén pulsado para abrir el proyecto"
                : "Abrir proyecto"
            }
            onClick={(e) => {
              e.stopPropagation()
              if (!isMobile) goToProject()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                e.stopPropagation()
                if (!isMobile) goToProject()
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            {...(isMobile
              ? {
                  onTouchStart: (e: React.TouchEvent) => {
                    e.stopPropagation()
                    projectChipLongPress.onTouchStart(e)
                  },
                  onTouchMove: projectChipLongPress.onTouchMove,
                  onTouchEnd: projectChipLongPress.onTouchEnd,
                }
              : {})}
            className={cn(
              "shrink-0 select-none rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide transition-opacity md:px-2 md:py-1 md:text-[11px]",
              isMobile ? "cursor-default" : "cursor-pointer hover:opacity-80",
              projectChipPressed && "opacity-60 scale-95",
            )}
            style={{
              backgroundColor: `${task.project.client.color}15`,
              color: task.project.client.color,
            }}
          >
            {displayProjectCode(task.project.projectCode)}
          </span>

          <div className="flex min-w-0 flex-1 flex-col items-start">
            <p className="max-w-full truncate text-sm font-semibold text-white">
              {task.reference}
            </p>

            {/* Datos compactos en la Fila principal (CON NOMBRE de la prioridad) */}
            <div
              className={cn(
                "mt-0.5 flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden text-xs transition-all duration-200",
                expanded
                  ? "max-h-0 opacity-0"
                  : "max-h-5 opacity-100",
              )}
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: task.project.client.color }}
              />
              <span className="min-w-0 truncate text-neutral-400">
                {task.project.client.name}
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

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

              {/* Prioridad: icono en móvil, nombre truncado en desktop */}
              <span className="flex min-w-0 items-center gap-1 overflow-hidden">
                <span className="md:hidden">
                  {task.priority.icon ? (
                    <EntityIconBadge
                      icon={task.priority.icon}
                      color={task.priority.color ?? "#a3a3a3"}
                      size={12}
                    />
                  ) : (
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: task.priority.color ?? "#a3a3a3" }}
                    >
                      {task.priority.name.charAt(0)}
                    </span>
                  )}
                </span>
                <span
                  className="hidden min-w-0 truncate md:inline"
                  style={{ color: task.priority.color ?? undefined }}
                >
                  {task.priority.name}
                </span>
              </span>
            </div>
          </div>

          {/* Mensajes solo colapsado: al expandir viven en el toggle Mensajes */}
          {!expanded && (
            <span
              title={
                (task.commentCount ?? 0) === 1
                  ? "1 mensaje"
                  : `${task.commentCount ?? 0} mensajes`
              }
              className={cn(
                "inline-flex h-5 min-w-5 shrink-0 items-center justify-center gap-0.5 rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                (task.commentCount ?? 0) > 0
                  ? "bg-sky-500/15 text-sky-300"
                  : "bg-white/5 text-neutral-600",
              )}
            >
              <MessageSquare size={10} strokeWidth={2.5} />
              {(task.commentCount ?? 0) > 0 ? task.commentCount : null}
            </span>
          )}

          <span className="hidden shrink-0 text-xs tabular-nums text-neutral-500 md:inline">
            {formatDate(task.deliveryDate)}
          </span>
        </div>

        {isMobile && expanded && (
          <div
            className="flex shrink-0 items-center gap-0.5 pr-0.5"
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          >
            <TaskRowActions task={task} className="gap-0.5" />
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


            <TaskPriorityCell task={task} triggerVariant="row" rowLabel="Prioridad" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowFields(true)}
            className="animate-comment-in flex w-full items-center gap-2 rounded-lg bg-white/3 px-3 py-2.5 transition hover:bg-white/5"
          >
            {/* Datos colapsados ADENTRO (CON ICONO/INICIAL DE PRIORIDAD en lugar de nombre) */}
            <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-sm text-neutral-300">
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

              {/* Prioridad solo icono/inicial en móvil adentro del panel colapsado */}
              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  {task.priority.icon ? (
                    <EntityIconBadge
                      icon={task.priority.icon}
                      color={task.priority.color ?? "#a3a3a3"}
                      size={13}
                    />
                  ) : (
                    <span className="text-[11px] font-medium text-neutral-400">
                      {task.priority.name.charAt(0)}
                    </span>
                  )}
                </span>
                <span className="hidden min-w-0 truncate text-neutral-400 md:inline">
                  {task.priority.name}
                </span>
              </span>
            </span>

            {/* Fecha interna: solo móvil */}
            <span className="shrink-0 text-xs text-neutral-500 md:hidden">
              {formatDate(task.deliveryDate)}
            </span>

            <ChevronDown
              size={14}
              className="shrink-0 text-neutral-500"
            />
          </button>
        )}

        {/* Desktop: acciones en el panel. Móvil: van en el row al expandir. */}
        {!isMobile && (
          <div className="flex items-center justify-start gap-1">
            <TaskRowActions task={task} />
          </div>
        )}

        <CollapsibleHeightSection open={showPipeline}>
          <TaskExpandedRow task={task} />
        </CollapsibleHeightSection>
      </CollapsibleHeightSection>
    </div>
  )
}