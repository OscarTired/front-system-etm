"use client"

import { cn } from "@/shared/utils/utils"
import { HistoryToggleButton } from "@/shared/history/components/history-toggle-button"

import { PendingInvitesSection } from "./pending-invites-section"
import { SummonConfirmBar } from "./summon-confirm-bar"
import { AreaTaskSection } from "./area-task-section"
import { AreaFilterChips } from "./area-filter-chips"
import type { TaskAreaPanelReturn } from "../../hooks/use-task-area-panel"

type Props = {
  panel: TaskAreaPanelReturn
  title?: string
  className?: string
  showHeader?: boolean
  /**
   * "horizontal" — columnas lado a lado (desktop sidebar).
   * "vertical" — apiladas (sheet móvil).
   */
  orientation?: "horizontal" | "vertical"
}

/**
 * Mis tareas — mismo contrato de scroll que EntityTable:
 * shell overflow-hidden + cuerpo min-h-0 flex-1 overflow-y-auto overscroll-contain.
 * Así el scroll vertical vive solo dentro de este contenedor (no mueve franjas).
 */
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
    <div
      className={cn(
        "relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
        className,
      )}
    >
      {showHeader && (
        <div className="shrink-0 px-3 pb-2.5 pt-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="min-w-0 truncate text-sm font-bold tracking-wide text-foreground">
              {title}
            </h2>
            <div className="flex shrink-0 items-center gap-1">
              
              <HistoryToggleButton
                count={state.completedCount}
                active={state.showHistory}
                onClick={() => actions.setShowHistory(v => !v)}
              />
            </div>
          </div>

          {state.canChooseAreas && (
            <AreaFilterChips
              className="mt-2.5"
              allAreas={state.allAreas}
              selectedAreas={state.supervisorAreas}
              onChange={actions.setSupervisorAreas}
            />
          )}
        </div>
      )}

      {/* Cuerpo con scroll independiente (patrón EntityTable). */}
      {horizontal ? (
        <div
          data-task-area-scroll
          className={cn(
            "hide-scrollbar flex min-h-0 min-w-0 flex-1 items-stretch justify-start gap-3 overflow-x-auto overflow-y-hidden p-3",
            false,
          )}
        >
          {state.loading ? (
            <div className="flex h-24 w-full items-center justify-center text-sm text-muted-foreground">
              Cargando…
            </div>
          ) : state.areas.length === 0 ? (
            <div className="flex h-24 w-full items-center justify-center text-center text-sm text-muted-foreground">
              No hay áreas asignadas.
            </div>
          ) : (
            <>
              {state.currentUserId && (
                <PendingInvitesSection
                  tasks={state.allTasks}
                  currentUserId={state.currentUserId}
                />
              )}
              {state.areas.map(code => (
                <div
                  key={code}
                  className="flex h-full min-h-0 w-64 shrink-0 flex-col items-stretch justify-start hide-scrollbar overflow-y-auto overscroll-contain"
                >
                  <AreaTaskSection code={code} panel={panel} column />
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
        <div
          data-task-area-scroll
          className={cn(
            "min-h-0 min-w-0 w-full flex-1 overflow-x-hidden hide-scrollbar overflow-y-auto overscroll-contain p-3",
            false,
          )}
        >
          {state.loading ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Cargando…
            </div>
          ) : state.areas.length === 0 ? (
            <div className="flex h-24 flex-col items-center justify-center gap-1 px-4 text-center text-sm text-muted-foreground">
              {state.canChooseAreas ? (
                <>
                  <span>Ningún área seleccionada</span>
                  <span className="text-xs text-muted-foreground/80">
                    Usa el selector para elegir áreas
                  </span>
                </>
              ) : (
                <span>No hay áreas asignadas.</span>
              )}
            </div>
          ) : (
            <div className="flex min-w-0 w-full flex-col gap-4">
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
        </div>
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
