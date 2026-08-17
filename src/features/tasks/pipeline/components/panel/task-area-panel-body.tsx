"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/shared/utils/utils"
import { HistoryToggleButton } from "@/shared/history/components/history-toggle-button"

import { PendingInvitesSection } from "./pending-invites-section"
import { SummonConfirmBar } from "./summon-confirm-bar"
import { AreaTaskSection } from "./area-task-section"
import type { TaskAreaPanelReturn } from "../../hooks/use-task-area-panel"

type Props = {
  panel: TaskAreaPanelReturn
  title?: string
  className?: string
  showHeader?: boolean
  /**
   * "horizontal" — columnas de área lado a lado (desktop sidebar).
   * "vertical" — apiladas (sheet móvil / fallback).
   */
  orientation?: "horizontal" | "vertical"
}

export function TaskAreaPanelBody({
  panel,
  title = "Mis tareas",
  className,
  showHeader = true,
  orientation = "vertical",
}: Props) {
  const { state, actions } = panel
  const horizontal = orientation === "horizontal"

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col", className)}>
      {showHeader && (
        <div className="shrink-0 border-b border-border/60 px-3 pb-3 pt-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="min-w-0 truncate text-sm font-bold tracking-wide text-foreground">
              {title}
            </h2>

            <HistoryToggleButton
              count={state.completedCount}
              active={state.showHistory}
              onClick={() => actions.setShowHistory(v => !v)}
            />
          </div>
        </div>
      )}

      {horizontal ? (
        <div
          className={cn(
            "hide-scrollbar flex min-h-0 min-w-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden p-3",
            state.summonTarget && "pb-24",
          )}
        >
          {state.loading ? (
            <div className="flex h-24 w-full items-center justify-center text-sm text-muted-foreground">
              Cargando…
            </div>
          ) : state.areas.length === 0 ? (
            <div className="flex h-24 w-full items-center justify-center text-center text-sm text-muted-foreground">
              {state.canChooseAreas
                ? "Selecciona al menos un área con el botón de arriba."
                : "No hay áreas asignadas."}
            </div>
          ) : (
            <>
              {state.currentUserId && (
                <div className="w-56 shrink-0">
                  <PendingInvitesSection
                    tasks={state.allTasks}
                    currentUserId={state.currentUserId}
                  />
                </div>
              )}
              {state.areas.map(code => (
                <AreaTaskSection
                  key={code}
                  code={code}
                  panel={panel}
                  column
                />
              ))}
            </>
          )}
        </div>
      ) : (
        <ScrollArea
          className={cn(
            "min-h-0 min-w-0 w-full flex-1 p-3",
            state.summonTarget && "pb-24",
          )}
        >
          {state.loading ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Cargando…
            </div>
          ) : state.areas.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-center text-sm text-muted-foreground">
              {state.canChooseAreas
                ? "Selecciona al menos un área con el botón de arriba para ver sus tareas acá."
                : "No hay áreas asignadas."}
            </div>
          ) : (
            <div className="flex min-w-0 w-full flex-col gap-6">
              {state.currentUserId && (
                <PendingInvitesSection
                  tasks={state.allTasks}
                  currentUserId={state.currentUserId}
                />
              )}
              {state.areas.map(code => (
                <AreaTaskSection key={code} code={code} panel={panel} />
              ))}
            </div>
          )}
        </ScrollArea>
      )}

      {state.summonTarget && (
        <SummonConfirmBar
          operatorName={state.summonTarget.operator.name}
          count={state.selectedStepIds.size}
          mode={state.summonMode}
          onModeChange={actions.setSummonMode}
          onConfirm={actions.handleConfirmSummon}
          onCancel={actions.handleCancelSummon}
          confirming={state.summoning}
        />
      )}
    </div>
  )
}
