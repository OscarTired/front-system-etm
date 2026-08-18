"use client"

import { useMemo } from "react"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { TaskProcessColumn } from "@/features/tasks/pipeline/table/task-process-column"
import { SummonOperatorButton } from "./summon-operator-button"
import { cn } from "@/shared/utils/utils"
import { useBadgeColors } from "@/shared/utils/use-badge-colors"
import type { ProcessCode } from "@/features/tasks/types/task.types"
import type { TaskAreaPanelReturn } from "../../hooks/use-task-area-panel"

type AreaTaskSectionProps = {
  code: ProcessCode
  panel: TaskAreaPanelReturn
  /** Columna fija en layout horizontal (sidebar / board). */
  column?: boolean
}

export function AreaTaskSection({
  code,
  panel,
  column = false,
}: AreaTaskSectionProps) {
  const { state, actions } = panel
  const definition = PROCESS_DEFINITIONS[code]
  const Icon = ENTITY_ICONS[definition.icon]
  const badge = useBadgeColors(definition.color, "subtle")
  const isSummoningThis = state.summonTarget?.processCode === code
  const allTasksForCode = state.columns.get(code) ?? []

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        column && "h-full min-h-0 w-64 shrink-0",
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
            style={{
              color: badge.text,
              backgroundColor: badge.background,
            }}
          >
            {Icon ? <Icon size={12} /> : code}
          </span>
          <span className="truncate text-xs font-bold uppercase tracking-wide text-foreground">
            {definition.label}
          </span>
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {allTasksForCode.length}
          </span>
        </div>

        {state.canChooseAreas &&
          (allTasksForCode.length > 0 || isSummoningThis) && (
            <div className="flex shrink-0 items-center gap-2">
              <SummonOperatorButton
                processCode={code}
                active={isSummoningThis}
                selectedOperatorId={
                  isSummoningThis
                    ? state.summonTarget?.operator.id
                    : undefined
                }
                onSelect={operator =>
                  actions.setSummonTarget(
                    operator ? { processCode: code, operator } : null,
                  )
                }
              />
            </div>
          )}
      </div>

      <div className={cn(column && "min-h-0 flex-1 overflow-y-auto")}>
        {state.canChooseAreas || isSummoningThis ? (
          <TaskProcessColumn
            processCode={code}
            tasks={allTasksForCode}
            expandedKey={state.expandedKey}
            onToggleCard={actions.setExpandedKey}
            activeOverlayKey={state.activeOverlayKey}
            onOverlayOpenChange={actions.setActiveOverlayKey}
            fullWidth
            contentOnly
            selectionMode={isSummoningThis}
            selectedStepIds={state.selectedStepIds}
            onToggleStepSelection={actions.handleToggleStepSelection}
            onUnsummon={
              state.canChooseAreas ? actions.handleUnsummon : undefined
            }
            unsummoning={state.unsummoning}
          />
        ) : (
          <OperatorTaskLists
            code={code}
            tasks={allTasksForCode}
            panel={panel}
          />
        )}
      </div>
    </div>
  )
}

type OperatorTaskListsProps = {
  code: ProcessCode
  tasks: any[]
  panel: TaskAreaPanelReturn
}

function OperatorTaskLists({ code, tasks, panel }: OperatorTaskListsProps) {
  const { state, actions } = panel

  const { assigned, available } = useMemo(() => {
    const assignedList = tasks.filter(task =>
      task.workflowSteps.find(
        (s: { processCode: ProcessCode }) => s.processCode === code,
      )?.assignedById,
    )
    const availableList = tasks.filter(
      task =>
        !task.workflowSteps.find(
          (s: { processCode: ProcessCode }) => s.processCode === code,
        )?.assignedById,
    )
    return { assigned: assignedList, available: availableList }
  }, [tasks, code])

  return (
    <>
      {assigned.length > 0 && (
        <>
          <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Asignadas
          </p>
          <TaskProcessColumn
            processCode={code}
            tasks={assigned}
            expandedKey={state.expandedKey}
            onToggleCard={actions.setExpandedKey}
            activeOverlayKey={state.activeOverlayKey}
            onOverlayOpenChange={actions.setActiveOverlayKey}
            fullWidth
            contentOnly
          />
        </>
      )}

      {available.length > 0 && (
        <>
          <p
            className={cn(
              "mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground",
              assigned.length > 0 && "mt-3",
            )}
          >
            Disponibles
          </p>
          <TaskProcessColumn
            processCode={code}
            tasks={available}
            expandedKey={state.expandedKey}
            onToggleCard={actions.setExpandedKey}
            activeOverlayKey={state.activeOverlayKey}
            onOverlayOpenChange={actions.setActiveOverlayKey}
            fullWidth
            contentOnly
          />
        </>
      )}

      {assigned.length === 0 && available.length === 0 && (
        <div className="flex h-12 items-center justify-center rounded-xl bg-foreground/5 px-3 text-sm font-medium text-muted-foreground">
          Sin tareas
        </div>
      )}
    </>
  )
}
