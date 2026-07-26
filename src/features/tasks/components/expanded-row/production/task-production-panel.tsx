"use client"

import type {
  Task,
} from "@/features/tasks/types/task.types"

import type {
  EntityBase,
} from "@/shared/types/entity-base.types"

import {
  useCallback,
  useMemo,
} from "react"

import {
  Activity,
  Check,
} from "lucide-react"

import {
  KpiCarousel,
} from "@/shared/ui/mini-card/kpi-carousel"

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

  // Autoscroll al paso activo — callback ref en vez de
  // ref+useEffect: el stepper solo existe en el DOM cuando el
  // KpiCarousel de abajo está expandido (arranca colapsado), así
  // que un efecto corriendo al montar TaskProductionPanel se
  // disparaba ANTES de que el nodo existiera. Un callback ref se
  // ejecuta exactamente cuando el elemento se adjunta al DOM de
  // verdad, sea cuando sea (al expandir, no al montar el panel).
  const scrollToActive = useCallback((node: HTMLDivElement | null) => {

    if (!node) return

    const activeEl = node.querySelector('[data-active="true"]')

    activeEl?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    })

  }, [])

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
      ref={scrollToActive}
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

    <>

      {/* Desktop — sin cambios. */}
      <div className="hidden h-full min-h-43.5 w-full flex-col justify-center rounded-xl bg-white/2 p-4 xl:flex">

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

      {/* Mobile — mismo componente genérico que ya usa TaskKpisSection
          (KpiCarousel: colapsado = barra con fondo tinteado + ícono
          + label + 2 valores; expandido = el contenido de abajo).
          Sin wrapper extra alrededor — KpiCarousel ya trae su propia
          tarjeta con gradiente; envolverla en OTRO contenedor con
          fondo/padding (lo que había antes) se veía como una card
          metida dentro de otra card. */}
      <div className="xl:hidden">

        <KpiCarousel
          cards={[
            <div
              key="route"
              className="flex flex-col gap-6 rounded-2xl p-5"
              style={{
                background: `linear-gradient(135deg, ${status?.color ?? "#737373"}14, #101012)`,
              }}
            >

              {stepper}

              {progressContent}

            </div>,
          ]}
          summary={{
            icon: StatusIcon ?? Activity,
            color: status?.color ?? "#737373",
            label: status?.name ?? "Producción",
            values: [
              { label: "Listas", value: `${workflowView.completedSteps}/${workflowView.totalSteps}` },
              { label: "Avance", value: `${workflowView.progress}%` },
            ],
          }}
        />

      </div>

    </>

  )

}
