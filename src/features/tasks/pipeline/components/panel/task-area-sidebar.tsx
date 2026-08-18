"use client"

import { useQueryClient } from "@tanstack/react-query"

import { cn } from "@/shared/utils/utils"
import { HistoryToggleButton } from "@/shared/history/components/history-toggle-button"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { BOTTOM_NAV_HEIGHT_PX } from "@/shared/responsive/layout/chrome-constants"
import { AppListScroll } from "@/shared/ui/vertical-scroll/app-list-scroll"
import { SpeedDialFab } from "@/shared/ui/speed-dial-fab/speed-dial-fab"

import { PendingInvitesSection } from "@/features/tasks/pipeline/components/panel/pending-invites-section"
import { SummonConfirmBar } from "@/features/tasks/pipeline/components/panel/summon-confirm-bar"
import { AreaTaskSection } from "@/features/tasks/pipeline/components/panel/area-task-section"
import { AreaFilterChips } from "@/features/tasks/pipeline/components/panel/area-filter-chips"
import { useTaskAreaPanel } from "@/features/tasks/pipeline/hooks/use-task-area-panel"

/**
 * Asignación (/production) y sidebar de bitácora (desktop).
 *
 * Causa raíz de “contenido cortado” en desktop:
 * AppListScroll anidado dentro de otro AppListScroll (página bitácora)
 * rompe el presupuesto de altura. Desktop usa el contrato EntityTable:
 * shell overflow-hidden + cuerpo min-h-0 flex-1 overflow-y-auto.
 *
 * Mobile: AppListScroll de página (chrome topbar/bottomnav + PTR).
 */
export function TaskAreaSidebar({ className }: { className?: string }) {
  const queryClient = useQueryClient()
  const { isMobile } = useResponsive()
  const panel = useTaskAreaPanel()
  const { state, actions } = panel

  if (!state.hasAreaPanel) return null

  const areaChips = state.canChooseAreas ? (
    <AreaFilterChips
      allAreas={state.allAreas}
      selectedAreas={state.supervisorAreas}
      onChange={actions.setSupervisorAreas}
    />
  ) : null

  const areasList =
    state.loading ? (
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
      <div className="flex flex-col gap-4">
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
    )

  if (isMobile) {
    return (
      <aside
        className={cn(
          "relative flex h-full min-h-0 flex-col overflow-hidden bg-background",
          className,
        )}
      >
        <AppListScroll
          onRefresh={async () => {
            await queryClient.invalidateQueries({ queryKey: ["tasks"] })
          }}
        >
          <div className="shrink-0 px-1 py-2.5" aria-hidden />
          {areaChips && <div className="mb-3 px-3">{areaChips}</div>}
          <div className="px-3">{areasList}</div>
        </AppListScroll>

        <SpeedDialFab
          actions={[
            <HistoryToggleButton
              key="history"
              count={state.completedCount}
              active={state.showHistory}
              onClick={() => actions.setShowHistory(v => !v)}
            />,
          ]}
        />

        {state.summonTarget && state.selectedStepIds.size > 0 && (
          <div
            className="pointer-events-auto fixed inset-x-0 z-50 px-3"
            style={{
              bottom: `calc(${BOTTOM_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px) + 8px)`,
            }}
          >
            <div className="animate-slide-up-in overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg shadow-black/40">
              <div className="flex justify-center pt-2.5">
                <div className="h-1 w-10 rounded-full bg-foreground/20" />
              </div>
              <SummonConfirmBar
                operatorName={state.summonTarget.operator.name}
                count={state.selectedStepIds.size}
                mode={state.summonMode}
                onModeChange={actions.setSummonMode}
                onConfirm={actions.handleConfirmSummon}
                onCancel={actions.handleCancelSummon}
                confirming={state.summoning}
              />
            </div>
          </div>
        )}
      </aside>
    )
  }

  // Desktop / tablet: sin AppListScroll anidado.
  return (
    <aside
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card",
        className,
      )}
    >
      <div className="shrink-0 border-b border-border/60 px-3 pb-2.5 pt-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="min-w-0 truncate text-sm font-bold tracking-wide text-foreground">
            Mis tareas
          </h2>
          <HistoryToggleButton
            count={state.completedCount}
            active={state.showHistory}
            onClick={() => actions.setShowHistory(v => !v)}
          />
        </div>
        {areaChips && <div className="mt-2.5">{areaChips}</div>}
      </div>

      <div
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-x-hidden hide-scrollbar overflow-y-auto overscroll-contain p-3",
          state.summonTarget &&
            state.selectedStepIds.size > 0 &&
            "pb-24",
        )}
      >
        {areasList}
      </div>

      {state.summonTarget && state.selectedStepIds.size > 0 && (
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
    </aside>
  )
}
