"use client"

import { Settings2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { cn } from "@/shared/utils/utils"
import { HistoryToggleButton } from "@/shared/history/components/history-toggle-button"

import { PendingInvitesSection } from "./pending-invites-section"
import { SummonConfirmBar } from "./summon-confirm-bar"
import { AreaTaskSection } from "./area-task-section"
import { useTaskAreaPanel } from "../../hooks/use-task-area-panel"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskAreaPanel({ open, onOpenChange }: Props) {
  const panel = useTaskAreaPanel()
  const { state, actions } = panel

  if (!state.hasAreaPanel) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center justify-between gap-2 pr-10">
            <div className="min-w-0">
              <SheetTitle>Mis tareas</SheetTitle>
            </div>

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
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
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
                const selected = state.supervisorAreas.includes(code)

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() =>
                      actions.setSupervisorAreas(
                        selected
                          ? state.supervisorAreas.filter(c => c !== code)
                          : [...state.supervisorAreas, code]
                      )
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition active:scale-95",
                      selected
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
        </SheetHeader>

        <ScrollArea className={cn("min-h-0 min-w-0 w-full flex-1 p-4", state.summonTarget && "pb-24")}>
          {state.loading ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">Cargando…</div>
          ) : state.areas.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-center text-sm text-muted-foreground">
              Selecciona al menos un área con el botón de arriba para ver sus tareas acá.
            </div>
          ) : (
            <div className="flex min-w-0 w-full flex-col gap-6">
              {state.currentUserId && (
                <PendingInvitesSection tasks={state.allTasks} currentUserId={state.currentUserId} />
              )}

              {state.areas.map(code => (
                <AreaTaskSection
                  key={code}
                  code={code}
                  panel={panel}
                />
              ))}
            </div>
          )}
        </ScrollArea>

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
      </SheetContent>
    </Sheet>
  )
}