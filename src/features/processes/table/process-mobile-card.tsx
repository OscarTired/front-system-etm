"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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

import { workflowAccess } from "@/features/workflow/access/workflow-access"
import type { ProcessTask } from "../types/process.types"
import { processAccess } from "../access/process-access"

import { ProcessOperatorCell } from "../components/cells/process-operator-cell"
import { ProcessRowActions } from "../components/actions/process-row-actions"
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
  onToggle: () => void
}

export function ProcessMobileCard({
  processTask,
  expanded,
  onToggle,
}: Props) {
  const [showFields, setShowFields] = useState(false)

  const { isMobile } = useResponsive()

  const task = processAccess.task(processTask)
  const project = processAccess.project(processTask)
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

  const stepId = workflowAccess.stepId(processTask)
  const processCode = workflowAccess.processCode(processTask)

  const isDimmed = workflowAccess.isCompleted(processTask)

  return (
    <div className={cn("overflow-hidden rounded-xl bg-white/2 transition-opacity", isDimmed && "opacity-50")}>
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
              backgroundColor: `${project.client.color}15`,
              color: project.client.color,
            }}
          >
            {displayProjectCode(project.projectCode)}
          </span>

          <div className="flex min-w-0 flex-1 flex-col items-start">
            {/* md+: referencia · solo iconos prio/estado (16px). Mobile: solo nombre */}
            <div className="flex min-w-0 max-w-full items-center gap-1.5">
              {isMobile ? (
                <span className="max-w-full truncate text-sm font-semibold leading-none text-white">
                  {task.reference}
                </span>
              ) : (
                <Link
                  href={`/tasks?taskId=${task.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="max-w-full truncate text-sm font-semibold leading-none text-white transition-colors hover:text-cyan-300"
                >
                  {task.reference}
                </Link>
              )}
              <span className="hidden shrink-0 self-center text-neutral-600 md:inline">·</span>
              <span
                className="hidden size-5 shrink-0 items-center justify-center self-center md:inline-flex"
                title={priority.name}
              >
                <EntityIconBadge
                  icon={priority.icon}
                  color={priority.color}
                  size={16}
                />
              </span>
              <span className="hidden shrink-0 self-center text-neutral-600 md:inline">·</span>
              <span
                className="hidden size-5 shrink-0 items-center justify-center self-center md:inline-flex"
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
              <span className="shrink-0 truncate text-neutral-400">
                {project.client.name}
              </span>

              <span className="shrink-0 text-neutral-600 md:hidden">·</span>
              <span className="inline-flex shrink-0 items-center gap-1 md:hidden">
                <EntityIconBadge
                  icon={priority.icon}
                  color={priority.color}
                  size={12}
                />
              </span>
              <span className="shrink-0 text-neutral-600 md:hidden">·</span>
              <span className="inline-flex shrink-0 items-center gap-1 md:hidden">
                <EntityIconBadge
                  icon={statusLabel.icon}
                  color={statusLabel.color}
                  size={12}
                />
              </span>

              <span className="shrink-0 text-neutral-600">·</span>
              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  <EntityIconBadge
                    icon={operator?.icon}
                    color={operator?.color ?? "#a3a3a3"}
                    size={12}
                  />
                </span>
                <span
                  className="hidden truncate md:inline text-neutral-400"
                  style={operator?.color ? { color: operator.color } : undefined}
                >
                  {operator?.name ?? "Sin asignar"}
                </span>
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
              className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center gap-0.5 rounded-full bg-sky-500/15 px-1.5 text-[10px] font-semibold tabular-nums text-sky-300"
            >
              <MessageSquare size={10} strokeWidth={2.5} />
              {processTask.workflowStep?.commentCount}
            </span>
          )}

          {/* Fecha entrega — después de mensajes */}
          <span className="hidden shrink-0 text-xs tabular-nums text-neutral-500 md:inline">
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

        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 p-2"
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
            className="animate-comment-in flex w-full items-center gap-2 rounded-lg bg-white/3 px-3 py-2.5 transition hover:bg-white/5"
          >
            <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-sm text-neutral-300">
              <span className="shrink-0 rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-400">
                {String(task.taskNumber).padStart(3, "0")}
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
                    icon={priority.icon}
                    color={priority.color}
                    size={13}
                  />
                </span>
                <span
                  className="hidden truncate md:inline"
                  style={{ color: priority.color }}
                >
                  {priority.name}
                </span>
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

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
                  style={{ color: statusLabel.color }}
                >
                  {statusLabel.label}
                </span>
              </span>

              <span className="shrink-0 text-neutral-600">·</span>

              <span className="flex shrink-0 items-center gap-1">
                <span className="md:hidden">
                  <EntityIconBadge
                    icon={operator?.icon}
                    color={operator?.color ?? "#a3a3a3"}
                    size={13}
                  />
                </span>
                <span
                  className="hidden truncate md:inline text-neutral-400"
                  style={operator?.color ? { color: operator.color } : undefined}
                >
                  {operator?.name ?? "Sin asignar operario"}
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

        <ProcessExpandedRow processTask={processTask} />
      </CollapsibleHeightSection>
    </div>
  )
}