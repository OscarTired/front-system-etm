import { useMemo } from "react"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { TaskProcessColumn } from "@/features/tasks/pipeline/table/task-process-column"
import { SummonOperatorButton } from "./summon-operator-button"
import { cn } from "@/shared/utils/utils"
import type { ProcessCode } from "@/features/tasks/types/task.types"
import type { TaskAreaPanelReturn } from "../../hooks/use-task-area-panel"

type AreaTaskSectionProps = {
  code: ProcessCode
  panel: TaskAreaPanelReturn
}

export function AreaTaskSection({ code, panel }: AreaTaskSectionProps) {
  const { state, actions } = panel
  const definition = PROCESS_DEFINITIONS[code]
  const Icon = ENTITY_ICONS[definition.icon]
  const isSummoningThis = state.summonTarget?.processCode === code
  const allTasksForCode = state.columns.get(code) ?? []

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex items-center gap-2.5">

        </div>

        {state.canChooseAreas && (allTasksForCode.length > 0 || isSummoningThis) && (
          <div className="flex items-center gap-2">
            <SummonOperatorButton
              processCode={code}
              active={isSummoningThis}
              selectedOperatorId={isSummoningThis ? state.summonTarget?.operator.id : undefined}
              onSelect={(operator) =>
                actions.setSummonTarget(
                  operator ? { processCode: code, operator } : null,
                )
              }
            />
          </div>
        )}
      </div>

      {state.canChooseAreas || isSummoningThis ? (
        <TaskProcessColumn
          processCode={code}
          tasks={allTasksForCode}
          expandedKey={state.expandedKey}
          onToggleCard={actions.setExpandedKey}
          activeOverlayKey={state.activeOverlayKey}
          onOverlayOpenChange={actions.setActiveOverlayKey}
          fullWidth
          selectionMode={isSummoningThis}
          selectedStepIds={state.selectedStepIds}
          onToggleStepSelection={actions.handleToggleStepSelection}
          onUnsummon={state.canChooseAreas ? actions.handleUnsummon : undefined}
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
      task.workflowSteps.find((s: { processCode: ProcessCode }) => s.processCode === code)?.assignedById
    )
    const availableList = tasks.filter(task =>
      !task.workflowSteps.find((s: { processCode: ProcessCode }) => s.processCode === code)?.assignedById
    )
    return { assigned: assignedList, available: availableList }
  }, [tasks, code])

  return (
    <>
      {assigned.length > 0 && (
        <>
          <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Asignadas</p>
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
          <p className={cn("mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground", assigned.length > 0 && "mt-3")}>
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
