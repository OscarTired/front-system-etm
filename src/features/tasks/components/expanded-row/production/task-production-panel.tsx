"use client"

import type {
  Task,
} from "@/features/tasks/types/task.types"

import type {
  EntityBase,
} from "@/shared/types/entity-base.types"

import {
  useMemo,
  useState,
} from "react"

import {
  ChevronDown,
} from "lucide-react"

import {
  createWorkflowView,
} from "@/features/workflow/view/create-workflow-view"

import {
  getCurrentStep,
} from "@/features/workflow/selectors/get-current-step"

import {
  WORKFLOW_STATUS_DEFINITIONS,
} from "@/features/workflow/constants/workflow-status-definitions"

import {
  ENTITY_ICONS,
} from "@/shared/constants/entity-icons"

import {
  cn,
} from "@/shared/utils/utils"

import {
  TaskRouteViewer,
} from "./task-route-viewer"

type Props = {
  task: Task
}

export function TaskProductionPanel({
  task,
}: Props) {

  const [
    expanded,
    setExpanded,
  ] = useState(false)

  const workflowView =
    createWorkflowView(
      task.workflowSteps,
    )

  const currentStep =
    getCurrentStep(
      task.workflowSteps,
    )

  const status =
    useMemo<EntityBase | undefined>(() => {

      if (
        workflowView.completed
      ) {

        return {
          id: "finalized",
          name: "Finalizado",
          icon: "check",
          color: "#22C55E",
        }

      }

      if (
        !currentStep
      ) {
        return undefined
      }

      const definition =
        WORKFLOW_STATUS_DEFINITIONS[
          currentStep.status
        ]

      return {
        id: currentStep.status,
        name: definition.label,
        icon: definition.icon,
        color: definition.color,
      }

    }, [
      workflowView.completed,
      currentStep,
    ])

  const StatusIcon =
    status?.icon
      ? ENTITY_ICONS[status.icon]
      : undefined

  const progressContent = (

    <div className="flex min-w-0 flex-col gap-1.5">

      <div className="flex min-w-0 items-center justify-between gap-2">

        <div className="flex min-w-0 items-center gap-1.5">

          {StatusIcon && status && (
            <StatusIcon size={13} style={{ color: status.color }} />
          )}

          <span
            className="truncate text-xs font-bold uppercase tracking-wide"
            style={{ color: status?.color ?? "#737373" }}
          >
            {status?.name ?? "Sin estado"}
          </span>

        </div>

        <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-neutral-500">
          {workflowView.completedSteps}/{workflowView.totalSteps} completados · <span className="text-cyan-400">{workflowView.progress}%</span>
        </span>

      </div>

      <div className="h-2 min-w-0 overflow-hidden rounded-full bg-white/5">

        <div
          className="h-full rounded-full bg-cyan-500 transition-all"
          style={{
            width: `${workflowView.progress}%`,
          }}
        />

      </div>

    </div>

  )

  return (

    <div className="flex h-full min-h-43.5 w-full flex-col justify-center rounded-xl bg-white/2 p-4">

      {/* Vista de Escritorio — esta ya funcionaba bien, sin cambios. */}
      <div className="hidden xl:block">
        <div className="flex justify-center">

          <TaskRouteViewer
            taskId={task.id}
            route={task.route}
            currentProcess={
              currentStep?.processCode
            }
          />

        </div>

        <div className="mt-3 flex justify-center">

          <div className="w-full max-w-3xl rounded-xl bg-white/2 px-5 py-3.5">

            {progressContent}

          </div>

        </div>
      </div>

      {/* Vista Móvil / pantallas angostas — rediseñada. Antes había
          un carrusel a mano que repetía EXACTAMENTE la misma info
          que ya mostraba el header colapsado (mismo código, mismo
          estado, dos veces), más 3 cajas tipo pill apiladas
          (header / completados / progreso) sin ninguna jerarquía
          entre ellas — "badge sobre badge". Ahora:
          1. El header colapsado muestra SOLO lo esencial de un
             vistazo (paso actual + % ), nunca se repite abajo.
          2. Al expandir, se reusa TaskRouteViewer — el MISMO
             componente que ya usa desktop, ya tiene su propia
             animación, ya resuelve "ver los 6 procesos de un
             vistazo" sin necesitar flechas para navegar uno por
             uno (eso era lo redundante: para ver otro paso había
             que tocar flechas en vez de simplemente mirarlos todos
             juntos, que es lo que la ruta ya hace bien).
          3. Estado + contador + % + barra quedan en UNA sola
             tarjeta cohesiva, no tres piezas sueltas. */}
      <div className="xl:hidden">

        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex w-full items-center justify-between gap-3 rounded-xl bg-white/4 px-3.5 py-3 text-left transition duration-200 hover:bg-white/6"
        >

          <span className="min-w-0 truncate text-sm font-bold text-neutral-200">
            Ruta de producción
          </span>

          <div className="flex shrink-0 items-center gap-3">

            <span
              className={cn(
                "text-sm font-bold text-cyan-400 transition-[opacity,transform] duration-300",
                expanded ? "w-0 scale-95 overflow-hidden opacity-0" : "opacity-100 scale-100",
              )}
            >
              {workflowView.progress}%
            </span>

            <ChevronDown
              size={16}
              className={cn(
                "text-neutral-400 transition-transform duration-300 ease-in-out",
                expanded && "rotate-180",
              )}
            />

          </div>

        </button>

        <div
          className={cn(
            "grid overflow-hidden transition-all duration-300 ease-in-out",
            expanded ? "mt-3 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-3.5 rounded-xl bg-white/2 p-3.5">

              <div className="flex justify-center">

                <TaskRouteViewer
                  taskId={task.id}
                  route={task.route}
                  currentProcess={
                    currentStep?.processCode
                  }
                />

              </div>

              <div className="rounded-xl bg-white/3 px-3.5 py-3">
                {progressContent}
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>

  )

}
