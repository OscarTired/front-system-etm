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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import {
  EntityChip,
} from "@/shared/ui/entity-chip/entity-chip"

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

  const routeSteps = useMemo(
    () => task.route ?? [],
    [task.route],
  )

  const currentIndex = useMemo(() => {
    if (!currentStep) return 0
    const idx = routeSteps.findIndex(
      code => code === currentStep.processCode
    )
    return idx !== -1 ? idx : 0
  }, [routeSteps, currentStep])

  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null)

  const displayIndex = activeStepIndex !== null ? activeStepIndex : currentIndex
  const currentRouteCode = routeSteps[displayIndex]

  const handlePrevStep = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveStepIndex(prev => {
      const current = prev !== null ? prev : currentIndex
      return current > 0 ? current - 1 : current
    })
  }

  const handleNextStep = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveStepIndex(prev => {
      const current = prev !== null ? prev : currentIndex
      return current < routeSteps.length - 1 ? current + 1 : current
    })
  }

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

  const progressContent = (

    <div className="flex min-w-0 flex-col items-center gap-1">

      <div className="flex w-full min-w-0 items-center gap-2">

        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/5">

          <div
            className="h-full rounded-full bg-cyan-500 transition-all"
            style={{
              width: `${workflowView.progress}%`,
            }}
          />

        </div>

        <span className="w-12 shrink-0 text-center text-xl font-bold leading-none text-cyan-400">

          {workflowView.progress}%

        </span>

      </div>

      <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-neutral-500">

        AVANCE DE LA TAREA

      </span>

    </div>

  )

  const statusContent =

    status && (

      <EntityChip
        label={status.name}
        color={status.color}
        icon={status.icon}
        compact
      />

    )

  const currentDefinition =
    currentStep
      ? PROCESS_DEFINITIONS[currentStep.processCode]
      : undefined

  return (

    <div className="flex h-full min-h-43.5 w-full flex-col justify-center rounded-xl bg-white/2 p-4">

      {/* Vista de Escritorio */}
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

          <div className="w-full max-w-5xl rounded-xl bg-white/2 px-4 py-3">

            <div className="flex items-center justify-center gap-8">

              <div className="max-w-36 min-w-0 shrink">

                {statusContent}

              </div>

              <div className="w-80">

                {progressContent}

              </div>

              <div className="flex shrink-0 flex-col items-center">

                <span className="text-lg font-bold leading-none text-neutral-100">

                  {workflowView.completedSteps}

                  /

                  {workflowView.totalSteps}

                </span>

                <span className="mt-1 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-neutral-500">

                  COMPLETADOS

                </span>

              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Vista Móvil / Pantallas angostas */}
      <div className="xl:hidden">

        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex w-full items-center justify-between gap-3 rounded-xl bg-white/4 px-3.5 py-3 text-left transition-all duration-200 hover:bg-white/6"
        >

          <div className="flex min-w-0 items-center gap-2.5">
            {currentDefinition && (

              <EntityChip
                label={currentDefinition.code}
                color={currentDefinition.color}
                icon={currentDefinition.icon}
                compact
              />

            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={cn(
                "text-sm font-bold text-cyan-400 transition-all duration-300",
                expanded ? "opacity-0 scale-95 w-0 overflow-hidden" : "opacity-100 scale-100",
              )}
            >
              {workflowView.progress}%
            </span>

            <div className="min-w-0 shrink-0">
              {statusContent}
            </div>

            <ChevronDown
              size={16}
              className={cn(
                "text-neutral-400 transition-transform duration-300 ease-in-out",
                expanded && "rotate-180",
              )}
            />
          </div>

        </button>

        <div className="mt-2 px-1">
          <div className="flex items-center justify-between rounded-lg bg-white/3 px-3 py-2 text-xs font-medium text-neutral-300">
            <span className="text-neutral-400 tracking-wide">COMPLETADOS</span>
            <span className="font-bold text-neutral-100 text-sm">
              {workflowView.completedSteps}
              <span className="text-neutral-500 font-normal"> / {workflowView.totalSteps}</span>
            </span>
          </div>
        </div>

        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out overflow-hidden",
            expanded ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-3.5 rounded-xl bg-white/2 p-3.5">

              <div className="flex items-center gap-1 rounded-lg bg-white/3 px-1 py-2.5">

                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={displayIndex === 0}
                  className="shrink-0 p-1.5 text-neutral-500 disabled:opacity-20 disabled:cursor-not-allowed hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
                  {(() => {

                    const def = currentRouteCode ? PROCESS_DEFINITIONS[currentRouteCode] : undefined
                    const isCurrent = displayIndex === currentIndex

                    const stepObj = task.workflowSteps.find(s => s.processCode === currentRouteCode)
                    const stepStatusDef = stepObj ? WORKFLOW_STATUS_DEFINITIONS[stepObj.status] : undefined
                    const StatusIcon = stepStatusDef ? ENTITY_ICONS[stepStatusDef.icon] : undefined
                    const ProcessIcon = def ? ENTITY_ICONS[def.icon] : undefined

                    return (
                      <>

                        {ProcessIcon && (
                          <ProcessIcon size={13} style={{ color: def?.color }} />
                        )}

                        <span
                          className="text-sm font-bold"
                          style={{ color: def?.color }}
                        >
                          {def?.code}
                        </span>

                        <span className="whitespace-nowrap text-xs text-neutral-500">
                          ({displayIndex + 1}/{routeSteps.length})
                        </span>

                        <span className="text-neutral-700">·</span>

                        {isCurrent ? (

                          <span
                            className="whitespace-nowrap text-xs font-bold uppercase tracking-wide"
                            style={{ color: def?.color }}
                          >
                            Actual
                          </span>

                        ) : stepStatusDef ? (

                          <span
                            className="flex items-center gap-1 whitespace-nowrap text-xs font-medium"
                            style={{ color: stepStatusDef.color }}
                          >
                            {StatusIcon && <StatusIcon size={12} />}
                            {stepStatusDef.label}
                          </span>

                        ) : null}

                      </>
                    )
                  })()}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={displayIndex === routeSteps.length - 1}
                  className="shrink-0 p-1.5 text-neutral-500 disabled:opacity-20 disabled:cursor-not-allowed hover:text-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {progressContent}
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>

  )

}
