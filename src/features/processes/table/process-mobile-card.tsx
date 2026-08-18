"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, MessageSquare } from "lucide-react"

import { CollapsibleHeightSection } from "@/shared/ui/collapsible-height-section"
import { cn } from "@/shared/utils/utils"
import { useBadgeColors, useDomainInk } from "@/shared/utils/use-badge-colors"
import { formatDate } from "@/shared/utils/date-format"
import { displayProjectCode } from "@/features/projects/utils/display-project-code"
import {
  ENTITY_ICONS,
  type EntityIcon,
} from "@/shared/constants/entity-icons"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

import { workflowAccess } from "@/features/workflow/access/workflow-access"
import type { ProcessTask } from "../types/process.types"
import { processAccess } from "../access/process-access"

import { ProcessOperatorCell } from "../components/cells/process-operator-cell"
import { ProcessRowActions } from "../components/actions/process-row-actions"
import { EntityAuditInfo } from "@/shared/ui/entity-audit-info/entity-audit-info"
import { TaskMaterialInfo } from "@/features/tasks/components/task-material-info"
import { ProcessExpandedRow } from "../components/expanded-row/process-expanded-row"

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
  processTask: ProcessTask
  expanded: boolean
  dimOthers?: boolean
  onToggle: () => void
}


function OperatorNameText({
  name,
  color,
  className,
}: {
  name: string
  color?: string | null
  className?: string
}) {
  const ink = useDomainInk(color)
  return (
    <span className={className} style={{ color: ink }}>
      {name}
    </span>
  )
}


export function ProcessMobileCard({
  processTask,
  expanded,
  dimOthers = false,
  onToggle,
}: Props) {
  const [showFields, setShowFields] = useState(false)

  const { isMobile } = useResponsive()
  const task = processAccess.task(processTask)
  const project = processAccess.project(processTask)
  const projectChipBadge = useBadgeColors(
    project.client?.color ?? "#64748B",
    "subtle",
  )
  const priority = processAccess.priority(processTask)
  const operator = processAccess.operator(processTask)

  // Al expandir: campos de una (móvil y desktop), igual que tasks/projects.
  // Sin operario el UserSelect queda a la vista de inmediato.
  useEffect(() => {
    if (!expanded) {
      setShowFields(false)
      return
    }
    setShowFields(true)
  }, [expanded])
  const statusLabel = workflowAccess.statusLabel(processTask)
  const priorityInk = useDomainInk(priority.color)
  const statusInk = useDomainInk(statusLabel.color)

  const stepId = workflowAccess.stepId(processTask)
  const processCode = workflowAccess.processCode(processTask)

  const isCompleted = workflowAccess.isCompleted(processTask)
  const isDimmed = isCompleted || (dimOthers && !expanded)

  return (
    <div className={cn("@container/prow overflow-hidden rounded-xl bg-foreground/5", isDimmed && "opacity-50")}>
      <div className="flex items-center gap-1 px-1">
        <div
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              onToggle()
            }
          }}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-3 pr-2 pl-2 text-left"
        >
          {/* Código del proyecto YY-NNN — más grande solo en desktop */}
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide md:px-2 md:py-1 md:text-[11px]"
            style={{
              backgroundColor: projectChipBadge.background,
              color: projectChipBadge.text,
            }}
          >
            {displayProjectCode(project.projectCode)}
          </span>

          <div className="flex min-w-0 flex-1 flex-col items-start">
            {/* md+: referencia · solo iconos prio/estado (16px). Mobile: solo nombre */}
            <div className="flex min-w-0 max-w-full items-center gap-1.5">
              {isMobile ? (
                <span className="max-w-full truncate text-sm font-semibold leading-none text-foreground">
                  {task.reference}
                </span>
              ) : (
                <Link
                  href={`/tasks?taskId=${task.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="max-w-full truncate text-sm font-semibold leading-none text-foreground transition-colors hover:text-primary"
                >
                  {task.reference}
                </Link>
              )}
              <span className="hidden shrink-0 self-center text-muted-foreground/80 @[36rem]/prow:inline">·</span>
              <span
                className="hidden size-5 shrink-0 items-center justify-center self-center @[36rem]/prow:inline-flex"
                title={priority.name}
              >
                <EntityIconBadge
                  icon={priority.icon}
                  color={priority.color}
                  size={16}
                />
              </span>
              <span className="hidden shrink-0 self-center text-muted-foreground/80 @[36rem]/prow:inline">·</span>
              <span
                className="hidden size-5 shrink-0 items-center justify-center self-center @[36rem]/prow:inline-flex"
                title={statusLabel.label}
              >
                <EntityIconBadge
                  icon={statusLabel.icon}
                  color={statusLabel.color}
                  size={16}
                />
              </span>
            </div>

            {/* Mobile: cliente · iconos prio/estado · operario | md+: cliente · operario */}
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
              <span className="shrink-0 truncate text-muted-foreground">
                {project.client.name}
              </span>

              {/* Meta 2ª fila: se oculta si el row no tiene ancho (split). */}
              <span className="hidden shrink-0 text-muted-foreground/80 @[22rem]/prow:inline @[36rem]/prow:hidden">·</span>
              <span className="hidden shrink-0 items-center gap-1 @[22rem]/prow:inline-flex @[36rem]/prow:hidden">
                <EntityIconBadge
                  icon={priority.icon}
                  color={priority.color}
                  size={12}
                />
              </span>
              <span className="hidden shrink-0 text-muted-foreground/80 @[22rem]/prow:inline @[36rem]/prow:hidden">·</span>
              <span className="hidden shrink-0 items-center gap-1 @[22rem]/prow:inline-flex @[36rem]/prow:hidden">
                <EntityIconBadge
                  icon={statusLabel.icon}
                  color={statusLabel.color}
                  size={12}
                />
              </span>

              <span className="hidden shrink-0 text-muted-foreground/80 @[22rem]/prow:inline">·</span>
              <span className="hidden shrink-0 items-center gap-1 @[22rem]/prow:flex">
                <span className="@[36rem]/prow:hidden">
                  <EntityIconBadge
                    icon={operator?.icon}
                    color={operator?.color ?? "#a3a3a3"}
                    size={12}
                  />
                </span>
                {operator ? (
                  <OperatorNameText
                    name={operator.name}
                    color={operator.color}
                    className="hidden truncate @[36rem]/prow:inline"
                  />
                ) : (
                  <span className="hidden truncate text-muted-foreground @[36rem]/prow:inline">
                    Sin asignar
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Mensajes del proceso — solo si hay */}
          {(processTask.workflowStep?.commentCount ?? 0) > 0 && (
            <span
              title={
                processTask.workflowStep?.commentCount === 1
                  ? "1 mensaje del proceso"
                  : `${processTask.workflowStep?.commentCount} mensajes del proceso`
              }
              className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center gap-0.5 rounded-full bg-sky-500/15 px-1.5 text-[10px] font-semibold tabular-nums text-sky-700 dark:text-sky-300"
            >
              <MessageSquare size={10} strokeWidth={2.5} />
              {processTask.workflowStep?.commentCount}
            </span>
          )}

          {/* Fecha entrega — después de mensajes */}
          <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground @[40rem]/prow:inline">
            {formatDate(task.deliveryDate)}
          </span>
        </div>

        {stepId && processCode && (
          <div
            className="w-30 shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <ProcessRowActions
              task={task}
              stepId={stepId}
              status={workflowAccess.status(processTask)}
              processCode={processCode}
            />
          </div>
        )}

        {/* Info + materiales: solo colapsado y con ancho; al expandir van junto a la zona de acciones */}
        {!expanded && (
          <div
            className="hidden shrink-0 items-center gap-1 pr-0.5 @[40rem]/prow:flex"
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          >
            <EntityAuditInfo
              createdAt={task.createdAt}
              updatedAt={task.updatedAt}
              createdBy={task.createdBy}
              updatedBy={task.updatedBy}
            />
            <TaskMaterialInfo task={task} alwaysShow />
          </div>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 p-2"
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
        {/* Misma zona que lápiz en tareas/proyectos: auditoría + materiales */}
        <div
          className="flex items-center justify-start gap-1"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          <EntityAuditInfo
            createdAt={task.createdAt}
            updatedAt={task.updatedAt}
            createdBy={task.createdBy}
            updatedBy={task.updatedBy}
          />
          <TaskMaterialInfo task={task} alwaysShow />
        </div>

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
<ProcessOperatorCell
              processTask={processTask}
              triggerVariant="row"
              rowLabel="Asignar operario"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowFields(true)}
            className="flex w-full items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2.5 transition hover:bg-foreground/5"
          >
            <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-sm text-muted-foreground">
              <span className="shrink-0 rounded-md bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
                {String(task.taskNumber).padStart(3, "0")}
              </span>

              <span className="shrink-0 text-muted-foreground/80">·</span>

              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: project.client.color }}
              />
              <span className="shrink-0 truncate">{project.client.name}</span>

              <span className="shrink-0 text-muted-foreground/80">·</span>

              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  <EntityIconBadge
                    icon={priority.icon}
                    color={priority.color}
                    size={13}
                  />
                </span>
                <span
                  className="hidden truncate md:inline"
                  style={{ color: priorityInk }}
                >
                  {priority.name}
                </span>
              </span>

              <span className="shrink-0 text-muted-foreground/80">·</span>

              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  <EntityIconBadge
                    icon={statusLabel.icon}
                    color={statusLabel.color}
                    size={13}
                  />
                </span>
                <span
                  className="hidden truncate md:inline"
                  style={{ color: statusInk }}
                >
                  {statusLabel.label}
                </span>
              </span>

              <span className="shrink-0 text-muted-foreground/80">·</span>

              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  <EntityIconBadge
                    icon={operator?.icon} 
                    color={operator?.color ?? "#a3a3a3"}
                    size={13}
                  />
                </span>
                {operator ? (
                  <OperatorNameText
                    name={operator.name}
                    color={operator.color}
                    className="hidden truncate md:inline"
                  />
                ) : (
                  <span className="hidden truncate md:inline text-muted-foreground">
                    Sin asignar operario
                  </span>
                )}
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

        <ProcessExpandedRow processTask={processTask} />
      </CollapsibleHeightSection>
    </div>
  )
}
