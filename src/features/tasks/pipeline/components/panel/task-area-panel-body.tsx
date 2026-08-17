"use client"

import { useState } from "react"

import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { cn } from "@/shared/utils/utils"
import { Settings2 } from "lucide-react"
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

  const [areasOpen, setAreasOpen] = useState(
    () => state.canChooseAreas && state.supervisorAreas.length === 0,
  )

  const effectiveSelected = (code: string) =>
    state.supervisorAreas.includes(code as never)

  function toggleArea(code: (typeof state.allAreas)[number]) {
    const current = state.supervisorAreas
    const selected = current.includes(code)
    actions.setSupervisorAreas(
      selected ? current.filter(c => c !== code) : [...current, code],
    )
  }

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
              {state.canChooseAreas && (
                <button
                  type="button"
                  aria-label="Áreas"
                  aria-pressed={areasOpen}
                  onClick={() => setAreasOpen(v => !v)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg transition active:scale-95",
                    areasOpen
                      ? "bg-foreground/15 text-foreground"
                      : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
                  )}
                >
                  <Settings2 size={16} />
                </button>
              )}
              <HistoryToggleButton
                count={state.completedCount}
                active={state.showHistory}
                onClick={() => actions.setShowHistory(v => !v)}
              />
            </div>
          </div>

          {state.canChooseAreas && areasOpen && (
            <div className="mt-2.5 rounded-xl bg-foreground/5 p-2">
              <div className="flex flex-wrap gap-1.5">
                {state.allAreas.map(code => {
                  const definition = PROCESS_DEFINITIONS[code]
                  const Icon = ENTITY_ICONS[definition.icon]
                  const selected = effectiveSelected(code)
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleArea(code)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition active:scale-95",
                        selected
                          ? "bg-foreground/15 text-foreground"
                          : "bg-background/40 text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
                      )}
                    >
                      <Icon size={13} style={{ color: definition.color }} />
                      <span>{definition.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
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
                  className="flex h-full min-h-0 w-64 shrink-0 flex-col items-stretch justify-start overflow-y-auto overscroll-contain themed-scrollbar-y"
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
            "min-h-0 min-w-0 w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-contain themed-scrollbar-y p-3",
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
