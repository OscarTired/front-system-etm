"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { CollapsibleHeightSection } from "@/shared/ui/collapsible-height-section"
import { cn } from "@/shared/utils/utils"
import { formatDate } from "@/shared/utils/date-format"

import { workflowAccess } from "@/features/workflow/access/workflow-access"
import type { ProcessTask } from "../types/process.types"
import { processAccess } from "../access/process-access"

import { ProcessOperatorCell } from "../components/cells/process-operator-cell"
import { ProcessRowActions } from "../components/actions/process-row-actions"
import { ProcessExpandedRow } from "../components/expanded-row/process-expanded-row"

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

  useEffect(() => {
    if (!expanded) {
      setShowFields(false)
    }
  }, [expanded])

  const task = processAccess.task(processTask)
  const project = processAccess.project(processTask)
  const priority = processAccess.priority(processTask)
  const operator = processAccess.operator(processTask)
  const statusLabel = workflowAccess.statusLabel(processTask)

  const stepId = workflowAccess.stepId(processTask)
  const processCode = workflowAccess.processCode(processTask)

  return (
    <div className="overflow-hidden rounded-xl bg-white/2">
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
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
            style={{
              backgroundColor: `${project.client.color}15`,
              color: project.client.color,
            }}
          >
            {String(task.taskNumber).padStart(3, "0")}
          </span>

          {/* Ajuste: flex-col e items-start para que los hijos ajusten su hit area al texto */}
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <Link
              href={`/tasks?taskId=${task.id}`}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full truncate text-sm font-semibold text-white transition-colors hover:text-cyan-300"
            >
              {task.reference}
            </Link>

            <Link
              href={`/projects?projectId=${project.id}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 max-w-full truncate text-xs text-neutral-500 transition-colors hover:text-cyan-300"
            >
              {project.projectCode}
            </Link>
          </div>

          <span className="shrink-0 text-xs text-neutral-500">
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
              rowLabel="Operario"
            />
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
                style={{ color: priority.color }}
              >
                {priority.name}
              </span>
              <span className="shrink-0 text-neutral-600">·</span>
              <span
                className="shrink-0 truncate"
                style={{ color: statusLabel.color }}
              >
                {statusLabel.label}
              </span>
              <span className="shrink-0 text-neutral-600">·</span>
              <span className="min-w-0 truncate text-neutral-400">
                {operator?.name ?? "Sin asignar operario"}
              </span>
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