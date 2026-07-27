"use client"

import type {
  Task,
} from "@/features/tasks/types/task.types"

import type {
  EntityBase,
} from "@/shared/types/entity-base.types"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  Activity,
  Check,
  MoreHorizontal,
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

  const [
    expanded,
    setExpanded,
  ] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)

  const [
    contentHeight,
    setContentHeight,
  ] = useState(0)

  useEffect(() => {

    if (!contentRef.current) return

    const measure = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight)
      }
    }

    measure()

    const resizeObserver = new ResizeObserver(measure)

    resizeObserver.observe(contentRef.current)

    return () => resizeObserver.disconnect()

  }, [])

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

  const summaryTextColor =
    getBadgeColors(status?.color ?? "#737373", "subtle").text

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
                  className="flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-200"
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
                className="h-full rounded-full transition-all duration-200"
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

      <div className="xl:hidden">

        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:brightness-110 tablet:gap-4 tablet:p-4"
          style={{
            background: `linear-gradient(135deg, ${status?.color ?? "#737373"}20, #101012)`,
          }}
        >

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5">

            {StatusIcon ? (
              <StatusIcon size={20} style={{ color: summaryTextColor }} />
            ) : (
              <Activity size={20} style={{ color: summaryTextColor }} />
            )}

          </div>

          <span
            className="hidden shrink-0 text-xs font-bold uppercase tracking-[0.18em] tablet:block"
            style={{ color: summaryTextColor }}
          >
            {status?.name ?? "Producción"}
          </span>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-4 tablet:gap-8">

            <div className="min-w-0 text-right">
              <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Listas</p>
              <p className="text-lg font-bold leading-tight" style={{ color: summaryTextColor }}>
                {workflowView.completedSteps}/{workflowView.totalSteps}
              </p>
            </div>

            <div className="min-w-0 text-right">
              <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Avance</p>
              <p className="text-lg font-bold leading-tight" style={{ color: summaryTextColor }}>
                {workflowView.progress}%
              </p>
            </div>

          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-neutral-400">
            <MoreHorizontal size={18} />
          </div>

        </button>

        <div
          className="overflow-hidden transition-[max-height,opacity,margin-top] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            maxHeight: expanded ? contentHeight : 0,
            opacity: expanded ? 1 : 0,
            marginTop: expanded ? "0.75rem" : 0,
          }}
        >

          <div
            ref={contentRef}
            className="flex flex-col gap-6 rounded-2xl p-5"
            style={{
              background: `linear-gradient(135deg, ${status?.color ?? "#737373"}14, #101012)`,
            }}
          >

            {stepper}

            {progressContent}

          </div>

        </div>

      </div>

    </>

  )

}