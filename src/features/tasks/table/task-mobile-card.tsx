"use client"

import { useEffect, useState } from "react"

import Link from "next/link"

import { ChevronDown, MoreHorizontal } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { formatDate } from "@/shared/utils/date-format"

import type { Task } from "../types/task.types"

import { taskAccess } from "../access/task-access"

import { TaskPriorityCell } from "../components/cells/task-priority-cell"
import { TaskRowActions } from "../components/actions/task-row-actions"
import { TaskExpandedRow } from "../components/expanded-row/task-expanded-row"
import { IconAction } from "@/shared/ui/actions/icon-action"
import { DragCell } from "@/shared/ui/entity-table-common/drag-cell"

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

  useEffect(() => {
    if (!expanded) {
      setShowFields(false)
      setShowPipeline(false)
    }
  }, [expanded])

  const stage = taskAccess.stageLabel(task)
  const status = taskAccess.statusLabel(task)

  return (
    <div className="overflow-hidden rounded-xl bg-white/2">
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
          {/* ID con el color del cliente aplicado dinámicamente */}
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
            style={{
              backgroundColor: `${task.project.client.color}15`,
              color: task.project.client.color,
            }}
          >
            {String(task.taskNumber).padStart(3, "0")}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {task.reference}
            </p>

            {/* Mismo destino que la columna "PRY" en modo tabla
                (/projects?projectId=...) — antes esto era texto
                plano acá, no navegaba a ningún lado. stopPropagation
                para que tocar el código no dispare TAMBIÉN el
                onToggle del wrapper (que ahora es un div, no un
                button real, justamente para poder anidar este Link
                sin romper el HTML — <a> dentro de <button> tampoco
                es válido). */}
            <Link
              href={`/projects?projectId=${task.project.id}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 block w-fit truncate text-xs text-neutral-500 transition-colors hover:text-cyan-300"
            >
              {task.project.projectCode}
            </Link>
          </div>

          <span className="shrink-0 text-xs text-neutral-500">
            {formatDate(task.deliveryDate)}
          </span>

          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-neutral-500 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </div>
      </div>

      {expanded && (
        <div className="animate-comment-in space-y-3 px-3 pb-3 pt-3">
          {showFields ? (
            <div className="flex flex-col gap-2">
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
              className="flex w-full items-center gap-2 rounded-lg bg-white/3 px-3 py-2.5 transition hover:bg-white/5"
            >
              <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-sm text-neutral-300">
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: task.project.client.color }}
                />
                <span className="shrink-0 truncate">{task.project.client.name}</span>

                <span className="shrink-0 text-neutral-600">·</span>

                <span
                  className="shrink-0 truncate"
                  style={{ color: stage.color }}
                >
                  {stage.label}
                </span>

                <span className="shrink-0 text-neutral-600">·</span>

                <span
                  className="shrink-0 truncate"
                  style={{ color: status.color }}
                >
                  {status.label}
                </span>

                <span className="shrink-0 text-neutral-600">·</span>

                <span className="min-w-0 truncate text-neutral-400">{task.priority.name}</span>
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

          {showPipeline && (
            <TaskExpandedRow task={task} />
          )}
        </div>
      )}
    </div>
  )
}