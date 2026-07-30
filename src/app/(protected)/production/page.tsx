"use client"

import { Settings2 } from "lucide-react"

import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { cn } from "@/shared/utils/utils"
import { HistoryToggleButton } from "@/shared/history/components/history-toggle-button"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

import { PendingInvitesSection } from "@/features/tasks/pipeline/components/panel/pending-invites-section"
import { SummonConfirmBar } from "@/features/tasks/pipeline/components/panel/summon-confirm-bar"
import { AreaTaskSection } from "@/features/tasks/pipeline/components/panel/area-task-section"
import { useTaskAreaPanel } from "@/features/tasks/pipeline/hooks/use-task-area-panel"

export default function AssignmentPage() {

  usePageTitle("Asignación")

  const panel = useTaskAreaPanel()
  const { state, actions } = panel

  return (

    <main className="relative flex h-full min-h-0 flex-col bg-[#050505] px-4 pt-0 pb-5 text-white select-none tablet:h-full tablet:px-8 tablet:pt-0 desktop:py-10">

      <header className="hidden flex-wrap items-center justify-between gap-4 mb-4 desktop:flex">

        <div className="flex min-w-0 flex-1 items-center gap-2">

          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            ASIGNACIÓN
          </h1>

          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />

          <p className="min-w-0 truncate text-sm text-neutral-500">
            Convocá operarios a las tareas de cada área
          </p>

        </div>

        <div className="flex shrink-0 items-center gap-2">

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
                "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                state.configOpen
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white",
              )}
            >
              <Settings2 size={16} />
            </button>
          )}

        </div>

      </header>

      <div className="flex items-center justify-between gap-2 mb-3 desktop:hidden">

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
              "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
              state.configOpen
                ? "bg-white/15 text-white"
                : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white",
            )}
          >
            <Settings2 size={16} />
          </button>
        )}

      </div>

      {state.canChooseAreas && state.configOpen && (

        <div className="mb-3 flex flex-wrap gap-2 rounded-xl bg-white/5 p-2.5">

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
                      : [...state.supervisorAreas, code],
                  )
                }
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition active:scale-95",
                  selected
                    ? "bg-white/15 text-white shadow-sm"
                    : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200",
                )}
              >
                <Icon size={14} style={{ color: definition.color }} />
                <span>{definition.label}</span>
              </button>

            )

          })}

        </div>

      )}

      <div className={cn(
        "min-h-0 flex-1 overflow-y-auto pb-4",
        state.summonTarget && "pb-24",
      )}>

        {state.loading ? (

          <div className="flex h-24 items-center justify-center text-sm text-neutral-500">
            Cargando…
          </div>

        ) : state.areas.length === 0 ? (

          <div className="flex h-24 items-center justify-center text-center text-sm text-neutral-500">
            Elegí al menos un área con el botón de arriba para ver sus tareas acá.
          </div>

        ) : (

          <div className="flex flex-col gap-6">

            {state.currentUserId && (
              <PendingInvitesSection
                tasks={state.allTasks}
                currentUserId={state.currentUserId}
              />
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

      </div>

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

    </main>

  )

}
