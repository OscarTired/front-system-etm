"use client"

import { Settings2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
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

            <div className="flex shrink-0 items-center gap-1">
              <HistoryToggleButton
                count={state.completedCount}
                active={state.showHistory}
                onClick={() => actions.setShowHistory(v => !v)}
              />

              {state.canChooseAreas && (
                <button
                  type="button"
                  onClick={() => actions.setConfigOpen(v => !v)}
                  aria-label="Elegir áreas"
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    state.configOpen
                      ? "bg-foreground/15 text-foreground"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                  )}
                >
                  <Settings2 size={16} />
                </button>
              )}
            </div>
          </div>

          {state.canChooseAreas && state.configOpen && (
            <div className="mt-3 flex flex-wrap gap-2 rounded-xl bg-foreground/5 p-2.5">
              {state.allAreas.map(code => {
                const definition = PROCESS_DEFINITIONS[code]
                const Icon = ENTITY_ICONS[definition.icon]
                // Si el store está vacío mostramos allAreas: el chip
                // seleccionado refleja ese default.
                const effectiveSelected =
                  state.supervisorAreas.length > 0
                    ? state.supervisorAreas.includes(code)
                    : true

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      const current =
                        state.supervisorAreas.length > 0
                          ? state.supervisorAreas
                          : state.allAreas
                      const selected = current.includes(code)
                      actions.setSupervisorAreas(
                        selected
                          ? current.filter(c => c !== code)
                          : [...current, code],
                      )
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition active:scale-95",
                      effectiveSelected
                        ? "bg-foreground/15 text-foreground shadow-sm"
                        : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
                    )}
                  >
                    <Icon size={14} style={{ color: definition.color }} />
                    <span>{definition.label}</span>
                  </button>
                )
              })}
            </div>
          )}
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
