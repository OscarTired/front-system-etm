"use client"

import { useEffect, useState } from "react"

import Link from "next/link"

import { ChevronDown } from "lucide-react"

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

// Espeja ProjectMobileCard/TaskMobileCard, con dos diferencias
// deliberadas, ambas para minimizar clicks hasta los campos
// editables (a diferencia de Task/Project, acá el contenido
// expandido no es solo informativo — es donde se cargan datos de
// producción):
//
// 1. ProcessRowActions (Iniciar/Pausar/Completar/Revisar) vive en
//    el row siempre visible, igual que su propia columna dedicada
//    en la vista TABLA (ver buildProcessColumns) — no dentro del
//    panel expandido. Por eso el header deja de ser un único
//    <button>: el toggle de expansión vive en un div clickeable +
//    el chevron, y las acciones tienen su propio wrapper con
//    stopPropagation para no disparar el expand al togglear el
//    workflow.
//
// 2. ProcessExpandedRow (Producción/Material/Jornada/Progreso +
//    comentarios) se muestra directo al expandir la card, SIN el
//    toggle intermedio "···" que sí tienen Task/Project para su
//    panel de detalle. Eso bajaba a 3 clicks el camino hasta un
//    valor editable (expandir → "···" → campo). Con esto quedan 2
//    (expandir → campo).
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
          {/* ID con el color del cliente aplicado dinámicamente */}
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
            style={{
              backgroundColor: `${project.client.color}15`,
              color: project.client.color,
            }}
          >
            {String(task.taskNumber).padStart(3, "0")}
          </span>

          <div className="min-w-0 flex-1">
            {/* Mismos 2 destinos que las columnas "REFERENCIA"/"PRY"
                en modo tabla (buildProcessColumns) — antes texto
                plano acá, no navegaban a ningún lado.
                stopPropagation para que tocarlos no dispare TAMBIÉN
                el onToggle del wrapper. */}
            <Link
              href={`/tasks?taskId=${task.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate text-sm font-semibold text-white transition-colors hover:text-cyan-300"
            >
              {task.reference}
            </Link>

            <Link
              href={`/projects?projectId=${project.id}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 block w-fit truncate text-xs text-neutral-500 transition-colors hover:text-cyan-300"
            >
              {project.projectCode}
            </Link>
          </div>

          <span className="shrink-0 text-xs text-neutral-500">
            {formatDate(task.deliveryDate)}
          </span>
        </div>

        {/* Acciones del workflow, siempre visibles — no dependen
            de expandir la card. stopPropagation para que clickear
            Iniciar/Pausar/Completar no dispare el toggle del
            padre. Ancho fijo igual al de la columna "actions" de
            la tabla (TABLE_WIDTHS.actions = 120px), así el botón
            no crece ni se descentra dentro del row. */}
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
              className="flex w-full items-center gap-2 rounded-lg bg-white/3 px-3 py-2.5 transition hover:bg-white/5"
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
                  {operator?.name ?? "Sin asignar"}
                </span>
              </span>

              <ChevronDown
                size={14}
                className="shrink-0 text-neutral-500"
              />
            </button>
          )}

          {/* Sin gate intermedio: al expandir la card, esto ya
              queda visible — acá vive lo que realmente hay que
              tocar (Entrada/Salida, Material, Espesor). */}
          <ProcessExpandedRow processTask={processTask} />
        </div>
      )}
    </div>
  )
}