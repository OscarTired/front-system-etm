"use client"

import { useBadgeColors, useDomainInk } from "@/shared/utils/use-badge-colors"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useFocusNavStore } from "@/shared/focus/store/focus-nav-store"
import { useSearchParams } from "next/navigation"
import { ChevronDown, MessageSquare } from "lucide-react"

import { CollapsibleHeightSection } from "@/shared/ui/collapsible-height-section"
import { cn } from "@/shared/utils/utils"
import { formatDate } from "@/shared/utils/date-format"
import { EntityAuditInfo } from "@/shared/ui/entity-audit-info/entity-audit-info"
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
  dimOthers?: boolean
  onToggle: () => void
}

export function TaskMobileCard({
  task,
  expanded,
  dimOthers = false,
  onToggle,
}: Props) {
  const [showFields, setShowFields] = useState(false)
  const [showPipeline, setShowPipeline] = useState(false)

  const { isMobile } = useResponsive()
  const isManualMode = useSortStore(s => s.taskSortMode === "manual")
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToProject = useCallback(() => {
    useFocusNavStore.getState().start("Abriendo proyecto…")
    router.push(`/projects?projectId=${task.project.id}`)
  }, [router, task.project.id])

  const { bind: projectChipLongPress, pressed: projectChipPressed } = useLongPress({
    onLongPress: goToProject,
    threshold: 320,
  })


  const isTarget = searchParams.get("taskId") === task.id
  const projectChipBadge = useBadgeColors(task.project?.client?.color ?? "#64748B", "subtle")

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
  const priorityInk = useDomainInk(task.priority.color)
  const stageInk = useDomainInk(stage.color)
  const statusInk = useDomainInk(status.color)

  const isCompleted = taskAccess.isCompleted(task)
  const isDimmed = isCompleted || (dimOthers && !expanded)

  return (
    <div className={cn("overflow-hidden rounded-xl bg-foreground/5", isDimmed && "opacity-50")}>
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
              backgroundColor: projectChipBadge.background,
              color: projectChipBadge.text,
            }}
          >
            {displayProjectCode(task.project.projectCode)}
          </span>

          <div className="flex min-w-0 flex-1 flex-col items-start">
            {/* md+: referencia · solo iconos (16px). Mobile: solo referencia */}
            <div className="flex min-w-0 max-w-full items-center gap-1.5">
              <p className="max-w-full truncate text-sm font-semibold leading-none text-foreground">
                {task.reference}
              </p>
              <span className="hidden shrink-0 self-center text-muted-foreground/80 md:inline">·</span>
              <span
                className="hidden size-5 shrink-0 items-center justify-center self-center md:inline-flex"
                title={stage.label}
              >
                <EntityIconBadge
                  icon={stage.icon}
                  color={stage.color}
                  size={16}
                />
              </span>
              <span className="hidden shrink-0 self-center text-muted-foreground/80 md:inline">·</span>
              <span
                className="hidden size-5 shrink-0 items-center justify-center self-center md:inline-flex"
                title={status.label}
              >
                <EntityIconBadge
                  icon={status.icon}
                  color={status.color}
                  size={16}
                />
              </span>
            </div>

            {/* Mobile: cliente · iconos · prioridad | md+: cliente · prioridad (cliente y PM/prioridad se quedan abajo) */}
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
              <span className="min-w-0 truncate text-muted-foreground">
                {task.project.client.name}
              </span>

              <span className="shrink-0 text-muted-foreground/80 md:hidden">·</span>
              <span className="inline-flex shrink-0 items-center gap-1 md:hidden">
                <EntityIconBadge
                  icon={stage.icon}
                  color={stage.color}
                  size={12}
                />
              </span>
              <span className="shrink-0 text-muted-foreground/80 md:hidden">·</span>
              <span className="inline-flex shrink-0 items-center gap-1 md:hidden">
                <EntityIconBadge
                  icon={status.icon}
                  color={status.color}
                  size={12}
                />
              </span>

              <span className="shrink-0 text-muted-foreground/80">·</span>
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
                      style={{ color: priorityInk }}
                    >
                      {task.priority.name.charAt(0)}
                    </span>
                  )}
                </span>
                <span
                  className="hidden min-w-0 truncate md:inline"
                  style={{ color: priorityInk }}
                >
                  {task.priority.name}
                </span>
              </span>
            </div>
          </div>

          {/* Mensajes solo colapsado y solo si hay */}
          {!expanded && (task.commentCount ?? 0) > 0 && (
            <span
              title={
                task.commentCount === 1
                  ? "1 mensaje"
                  : `${task.commentCount} mensajes`
              }
              className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center gap-0.5 rounded-full bg-sky-500/15 px-1.5 text-[10px] font-semibold tabular-nums text-sky-700 dark:text-sky-300"
            >
              <MessageSquare size={10} strokeWidth={2.5} />
              {task.commentCount}
            </span>
          )}

          <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground md:inline">
            {formatDate(task.deliveryDate)}
          </span>
        </div>

        {/* Info auditoría: solo desktop (en móvil vive dentro del expand / actions) */}
        <div
          className="hidden shrink-0 items-center md:flex"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          <EntityAuditInfo
            createdAt={task.createdAt}
            updatedAt={task.updatedAt}
            createdBy={task.createdBy}
            updatedBy={task.updatedBy}
          />
        </div>

        {isMobile && expanded && (
          <div
            className="flex shrink-0 items-center gap-0.5 pr-0.5"
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          >
            <TaskRowActions task={task} className="gap-0.5" showAudit={isMobile} />
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
              "text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </button>
      </div>

      <CollapsibleHeightSection open={expanded} className="space-y-3 px-3 pb-3 pt-3">
        {showFields ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowFields(false)}
              className="flex w-full items-center justify-between rounded-lg bg-foreground/5 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-foreground/5"
            >
              Ocultar campos
              <ChevronDown
                size={14}
                className="shrink-0 rotate-180 text-muted-foreground"
              />
            </button>


            <TaskPriorityCell task={task} triggerVariant="row" rowLabel="Prioridad" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowFields(true)}
            className="flex w-full items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2.5 transition hover:bg-foreground/5"
          >
            {/* Datos colapsados ADENTRO (CON ICONO/INICIAL DE PRIORIDAD en lugar de nombre) */}
            <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-sm text-muted-foreground">
              <span className="shrink-0 rounded-md bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
                {String(task.taskNumber).padStart(3, "0")}
              </span>

              <span className="shrink-0 text-muted-foreground/80">·</span>

              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: task.project.client.color }}
              />
              <span className="shrink-0 truncate">{task.project.client.name}</span>

              <span className="shrink-0 text-muted-foreground/80">·</span>

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
                  style={{ color: stageInk }}
                >
                  {stage.label}
                </span>
              </span>

              <span className="shrink-0 text-muted-foreground/80">·</span>

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
                  style={{ color: statusInk }}
                >
                  {status.label}
                </span>
              </span>

              <span className="shrink-0 text-muted-foreground/80">·</span>

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
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {task.priority.name.charAt(0)}
                    </span>
                  )}
                </span>
                <span className="hidden min-w-0 truncate text-muted-foreground md:inline">
                  {task.priority.name}
                </span>
              </span>
            </span>

            {/* Fecha interna: solo móvil */}
            <span className="shrink-0 text-xs text-muted-foreground md:hidden">
              {formatDate(task.deliveryDate)}
            </span>

            <ChevronDown
              size={14}
              className="shrink-0 text-muted-foreground"
            />
          </button>
        )}

        {/* Desktop: acciones en el panel. Móvil: van en el row al expandir. */}
        {!isMobile && (
          <div className="flex items-center justify-start gap-1">
            <TaskRowActions task={task} showAudit={isMobile} />
          </div>
        )}

        <CollapsibleHeightSection open={showPipeline}>
          <TaskExpandedRow task={task} />
        </CollapsibleHeightSection>
      </CollapsibleHeightSection>
    </div>
  )
}
