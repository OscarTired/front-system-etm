"use client"

import type {
  Task,
} from "@/features/tasks/types/task.types"

import type {
  EntityBase,
} from "@/shared/types/entity-base.types"

import {
  useEffect,
  useMemo,
  useRef,
} from "react"

import {
  Check,
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
  PROCESS_DEFINITIONS,
} from "@/features/processes/constants/process-definitions"

import {
  ENTITY_ICONS,
} from "@/shared/constants/entity-icons"

import {
  getBadgeColors,
} from "@/shared/utils/badge-colors"

import {
  TaskRouteViewer,
} from "./task-route-viewer"

type Props = {
  task: Task
}

export function TaskProductionPanel({
  task,
}: Props) {

  // Siempre visible, sin colapsar — a diferencia de TaskKpisSection
  // (que sí colapsa, con el estilo denso del Kanban), esto se dejó
  // sin acordeón por pedido explícito.
  const scrollRef = useRef<HTMLDivElement>(null)

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

  // Centra el paso activo apenas monta — antes esto corría al
  // expandir; como ya no hay colapso, corre una sola vez al montar.
  useEffect(() => {

    if (!scrollRef.current) return

    const activeEl = scrollRef.current.querySelector('[data-active="true"]')

    activeEl?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    })

  }, [])

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
          {workflowView.completedSteps}/{workflowView.totalSteps} · <span className="text-cyan-400">{workflowView.progress}%</span>
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

  const stepper = (

    <div
      ref={scrollRef}
      className="hide-scrollbar -mx-5 flex snap-x snap-mandatory overflow-x-auto px-5 xl:-mx-0 xl:px-0 xl:justify-center"
    >

      <div className="flex items-center">

        {task.route.map((code, index) => {

          const definition = PROCESS_DEFINITIONS[code]
          const ProcessIcon = ENTITY_ICONS[definition.icon]

          const step = task.workflowSteps.find(
            s => s.processCode === code,
          )

          const isActive = currentStep?.processCode === code

          const isDone =
            step?.status === "COMPLETED" ||
            step?.status === "REVIEWED"

          const isLast = index === task.route.length - 1

          const colors = getBadgeColors(definition.color, "subtle")

          return (

            <div
              key={code}
              data-active={isActive}
              className="flex items-center"
            >

              <div className="flex flex-col items-center gap-1.5">

                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                  style={
                    isActive || isDone
                      ? {
                          backgroundColor: isActive
                            ? colors.backgroundActive
                            : colors.background,
                        }
                      : {
                          backgroundColor: "rgba(255,255,255,0.03)",
                          opacity: 0.45,
                        }
                  }
                >

                  {isDone ? (
                    <Check size={16} style={{ color: colors.text }} />
                  ) : (
                    <ProcessIcon
                      size={16}
                      style={{ color: isActive ? colors.text : "#737373" }}
                    />
                  )}

                </div>

                <span
                  className="text-[10px] font-bold"
                  style={{
                    color:
                      isActive || isDone
                        ? colors.text
                        : "#525252",
                  }}
                >
                  {definition.code}
                </span>

              </div>

              {!isLast && (

                <div className="mx-1.5 h-0.5 w-6 shrink-0 overflow-hidden rounded-full bg-white/8">

                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: isDone ? "100%" : "0%",
                      backgroundColor: colors.text,
                    }}
                  />

                </div>

              )}

            </div>

          )

        })}

      </div>

    </div>

  )

  return (

    <div className="flex h-full min-h-43.5 w-full flex-col justify-center rounded-xl bg-white/2 p-4">

      {/* Desktop — sin cambios. */}
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

      {/* Mobile — siempre visible, sin acordeón. Misma card con
          gradiente sutil (mismo tratamiento que ProcessMiniCard)
          conteniendo el stepper y el progreso, pero sin botón de
          colapsar encima. */}
      <div
        className="flex flex-col gap-6 rounded-2xl p-5 xl:hidden"
        style={{
          background: `linear-gradient(135deg, ${status?.color ?? "#737373"}14, #101012)`,
        }}
      >

        {stepper}

        {progressContent}

      </div>

    </div>

  )

}
