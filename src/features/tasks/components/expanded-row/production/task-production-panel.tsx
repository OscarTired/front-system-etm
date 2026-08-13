"use client"

import type {
  Task,
} from "@/features/tasks/types/task.types"

import type {
  EntityBase,
} from "@/shared/types/entity-base.types"

import {
  useRouter,
} from "next/navigation"

import {
  useState,
  useMemo,
} from "react"

import {
  Activity,
  Check,
  MoreHorizontal,
} from "lucide-react"

import {
  CollapsibleSummaryPanel,
} from "@/shared/ui/collapsible-summary-panel/collapsible-summary-panel"

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
  getGlassSurface,
} from "@/shared/utils/badge-colors"
import { useThemeStore } from "@/shared/theme"

import {
  cn,
} from "@/shared/utils/utils"

import {
  TaskRouteViewer,
} from "./task-route-viewer"

type Props = {
  task: Task
  indicatorsExpanded?: boolean
  onIndicatorsExpandedChange?: (expanded: boolean) => void
  /** Móvil: el botón vive al lado del EntityExpandedToggle. */
  showCollapseButton?: boolean
}

export function TaskProductionPanel({
  task,
  indicatorsExpanded: indicatorsExpandedProp,
  onIndicatorsExpandedChange,
  showCollapseButton = true,
}: Props) {
  // Re-render chips when theme toggles (getBadgeColors reads DOM class)
  useThemeStore(s => s.resolved)


  const router = useRouter()

  const isControlled = indicatorsExpandedProp !== undefined

  const [
    expandedInternal,
    setExpandedInternal,
  ] = useState(true)

  const expanded = isControlled ? indicatorsExpandedProp! : expandedInternal

  const setExpanded = (next: boolean) => {
    if (!isControlled) setExpandedInternal(next)
    onIndicatorsExpandedChange?.(next)
  }

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

    <div className="flex w-full min-w-0 flex-col gap-1.5">

      <div className="flex min-w-0 items-center justify-between gap-2">

        <div className="flex min-w-0 items-center gap-1.5">

          {StatusIcon && status && (
            <StatusIcon size={13} style={{ color: status.color }} />
          )}

          <span
            className="truncate text-xs font-bold uppercase tracking-wide"
            style={{ color: summaryTextColor }}
          >
            {status?.name ?? "Sin estado"}
          </span>

        </div>

        <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-on-glass-muted">
          {workflowView.completedSteps}/{workflowView.totalSteps} · <span className="text-cyan-700 dark:text-primary">{workflowView.progress}%</span>
        </span>

      </div>

      <div className="h-2 w-full min-w-0 overflow-hidden rounded-full bg-foreground/5">

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
    <div className="w-full overflow-x-auto overflow-y-visible overscroll-x-contain [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max items-center justify-center px-3 pb-1 pt-3">
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

          const commentCount = step?.commentCount ?? 0
          const hasComments = commentCount > 0
          const operator = step?.operator ?? null
          const hasInvite = !operator && Boolean(step?.invitedOperatorId)

          return (
            <div
              key={code}
              data-active={isActive}
              className="flex shrink-0 items-center"
            >
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem(
                    "process-origin-task-id",
                    task.id,
                  )
                  router.push(
                    `/processes?code=${code}&taskId=${task.id}`,
                  )
                }}
                className="flex flex-col items-center gap-1.5 active:scale-95"
              >
                <div className="relative size-10 shrink-0 overflow-visible">
                  <div
                    className="flex size-10 items-center justify-center rounded-full"
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
                        style={{ color: isActive ? colors.text : "var(--on-glass-faint)" }}
                      />
                    )}
                  </div>

                  {/* Mensajes del proceso — globo tipo SidebarRow */}
                  {hasComments && (
                    <span
                      title={
                        commentCount === 1
                          ? "1 mensaje"
                          : `${commentCount} mensajes`
                      }
                      className={cn(
                        "pointer-events-none absolute -right-1.5 -top-1.5 z-10",
                        "flex h-4 min-w-4 items-center justify-center",
                        "rounded-full bg-sky-500 px-1 text-[9px] font-bold leading-none text-foreground",
                        "shadow-md ring-2 ring-background",
                      )}
                    >
                      {commentCount > 99 ? "99+" : commentCount}
                    </span>
                  )}

                  {/* Operador: esquina opuesta si ya hay contador de mensajes */}
                  {operator && (
                    <span
                      title={operator.name}
                      className={cn(
                        "pointer-events-none absolute z-10",
                        "flex h-4 min-w-4 items-center justify-center overflow-hidden",
                        "rounded-full text-[9px] font-bold leading-none text-foreground",
                        "shadow-md ring-2 ring-background",
                        hasComments
                          ? "-bottom-1 -left-1.5"
                          : "-right-1.5 -top-1.5",
                      )}
                      style={{
                        backgroundColor: operator.color || "#404040",
                      }}
                    >
                      {operator.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={operator.avatarUrl}
                          alt={operator.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        operator.name.charAt(0).toUpperCase()
                      )}
                    </span>
                  )}

                  {hasInvite && (
                    <span
                      title="Convocatoria pendiente"
                      className={cn(
                        "pointer-events-none absolute -right-1.5 -top-1.5 z-10",
                        "flex h-4 min-w-4 items-center justify-center",
                        "rounded-full bg-amber-500 text-[9px] font-bold text-foreground",
                        "shadow-md ring-2 ring-background",
                      )}
                    >
                      ?
                    </span>
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
              </button>

              {!isLast && (
                <div className="mx-2 mt-5 h-0.5 w-6 shrink-0 self-start overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full"
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

      <div className="hidden h-full min-h-43.5 w-full flex-col justify-center rounded-xl bg-foreground/5 p-4 xl:flex">

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

          <div className="w-full max-w-3xl rounded-xl bg-foreground/5 px-5 py-3.5">

            {progressContent}

          </div>

        </div>

      </div>

      <div className="w-full xl:hidden flex flex-col">

        <CollapsibleSummaryPanel
          expanded={expanded}
          onCollapse={() => setExpanded(false)}
          showCollapseButton={showCollapseButton}
          collapsed={
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:brightness-110 tablet:gap-4 tablet:p-4"
              style={{
                background: getGlassSurface(status?.color ?? "#64748B").background,
              }}
            >

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground/5">

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
                  <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-on-glass-muted">Listas</p>
                  <p className="text-lg font-bold leading-tight" style={{ color: summaryTextColor }}>
                    {workflowView.completedSteps}/{workflowView.totalSteps}
                  </p>
                </div>

                <div className="min-w-0 text-right">
                  <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-on-glass-muted">Avance</p>
                  <p className="text-lg font-bold leading-tight" style={{ color: summaryTextColor }}>
                    {workflowView.progress}%
                  </p>
                </div>

              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-on-glass-muted">
                <MoreHorizontal size={18} />
              </div>

            </button>
          }
        >

          <div
            className="flex w-full flex-col gap-6 rounded-2xl p-4 tablet:p-5"
            style={{
              background: getGlassSurface(status?.color ?? "#64748B").background,
            }}
          >

            {stepper}

            {progressContent}

          </div>

        </CollapsibleSummaryPanel>

      </div>

    </>

  )

}
