"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Settings2 } from "lucide-react"

import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { cn } from "@/shared/utils/utils"
import { HistoryToggleButton } from "@/shared/history/components/history-toggle-button"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { Popover, PopoverContent } from "@/components/ui/popover"
import { AppListScroll } from "@/shared/ui/vertical-scroll/app-list-scroll"
import { SpeedDialFab } from "@/shared/ui/speed-dial-fab/speed-dial-fab"
import { FabTrigger } from "@/shared/ui/speed-dial-fab/fab-trigger"

import { PendingInvitesSection } from "@/features/tasks/pipeline/components/panel/pending-invites-section"
import {
  SummonConfirmBar,
  SummonConfirmBarContent,
} from "@/features/tasks/pipeline/components/panel/summon-confirm-bar"
import { AreaTaskSection } from "@/features/tasks/pipeline/components/panel/area-task-section"
import { useTaskAreaPanel } from "@/features/tasks/pipeline/hooks/use-task-area-panel"

/**
 * Asignación (/production) y sidebar de bitácora (desktop).
 *
 * - Móvil: scroller de página = AppListScroll (padding topbar/bottomnav + PTR).
 *   Sin “card” interna; FAB fuera del scroll.
 * - Desktop/tablet: panel tipo card; FAB no aplica.
 */
export function TaskAreaSidebar({ className }: { className?: string }) {
  const queryClient = useQueryClient()
  const { isMobile } = useResponsive()
  const panel = useTaskAreaPanel()
  const { state, actions } = panel

  if (!state.hasAreaPanel) return null

  const listBody = (
    <>
      {/* Cabecera interna solo desktop/tablet (en móvil el título va en TopBar) */}
      {!isMobile && (
        <div className="shrink-0 px-3 pb-2.5 pt-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="min-w-0 truncate text-sm font-bold tracking-wide text-foreground">
              Mis tareas
            </h2>
            <div className="flex shrink-0 items-center gap-1">
              {state.canChooseAreas && (
                <button
                  type="button"
                  aria-label="Áreas"
                  aria-pressed={state.configOpen}
                  onClick={() => actions.setConfigOpen(v => !v)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg transition active:scale-95",
                    state.configOpen
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
        </div>
      )}

      {/* Selector de áreas — centrado en todos los breakpoints */}
      {state.canChooseAreas && state.configOpen && (
        <div className="mb-3 px-3">
          <div className="rounded-xl bg-foreground/5 p-2.5">
            <div className="flex flex-wrap justify-center gap-2">
              {state.allAreas.map(code => {
                const definition = PROCESS_DEFINITIONS[code]
                const Icon = ENTITY_ICONS[definition.icon]
                const selected = state.supervisorAreas.includes(code)

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      const current = state.supervisorAreas
                      const next = selected
                        ? current.filter(c => c !== code)
                        : [...current, code]
                      actions.setSupervisorAreas(next)
                    }}
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
        </div>
      )}

      {/* Listado */}
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
        <div className="flex flex-col gap-6 px-3">
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
    </>
  )

  return (
    <aside
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden",
        // Móvil (/production): lienzo de página, sin card anidada
        // Desktop: panel embebible (bitácora / asignación)
        isMobile ? "bg-background" : "rounded-2xl bg-card",
        className,
      )}
    >
      {/*
        AppListScroll SIEMPRE: mismo contrato que Proyectos/Tareas.
        En móvil aporta padding topbar/bottomnav + pull-to-refresh.
      */}
      <AppListScroll
        className={cn(
          !isMobile &&
            state.summonTarget &&
            state.selectedStepIds.size > 0 &&
            "pb-24",
        )}
        onRefresh={async () => {
          await queryClient.invalidateQueries({ queryKey: ["tasks"] })
        }}
      >
        {listBody}
      </AppListScroll>

      {/* FAB fuera del scroller — no participa del scroll ni del PTR */}
      {isMobile && (
        <SpeedDialFab
          actions={[
            <HistoryToggleButton
              key="history"
              count={state.completedCount}
              active={state.showHistory}
              onClick={() => actions.setShowHistory(v => !v)}
            />,
            ...(state.canChooseAreas
              ? [
                  <FabTrigger
                    key="areas"
                    icon={Settings2}
                    label="ÁREAS"
                    active={state.configOpen}
                    onClick={() => actions.setConfigOpen(v => !v)}
                  />,
                ]
              : []),
          ]}
        />
      )}

      {/* Confirmación / Summon */}
      {isMobile ? (
        <Popover
          open={!!(state.summonTarget && state.selectedStepIds.size > 0)}
          onOpenChange={open => {
            if (!open) actions.handleCancelSummon()
          }}
        >
          <PopoverContent>
            {state.summonTarget && (
              <SummonConfirmBarContent
                operatorName={state.summonTarget.operator.name}
                count={state.selectedStepIds.size}
                mode={state.summonMode}
                onModeChange={actions.setSummonMode}
                onConfirm={actions.handleConfirmSummon}
                onCancel={actions.handleCancelSummon}
                confirming={state.summoning}
              />
            )}
          </PopoverContent>
        </Popover>
      ) : (
        state.summonTarget &&
        state.selectedStepIds.size > 0 && (
          <SummonConfirmBar
            operatorName={state.summonTarget.operator.name}
            count={state.selectedStepIds.size}
            mode={state.summonMode}
            onModeChange={actions.setSummonMode}
            onConfirm={actions.handleConfirmSummon}
            onCancel={actions.handleCancelSummon}
            confirming={state.summoning}
          />
        )
      )}
    </aside>
  )
}
