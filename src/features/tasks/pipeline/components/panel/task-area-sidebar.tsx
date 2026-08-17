"use client"

import { useMemo, useState } from "react"

import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { EntityTable } from "@/shared/ui/entity-table"
import type { EntityColumn } from "@/shared/ui/entity-table/types"
import { Layers } from "lucide-react"
import { HistoryToggleButton } from "@/shared/history/components/history-toggle-button"
import { cn } from "@/shared/utils/utils"

import type { ProcessCode, Task } from "@/features/tasks/types/task.types"
import { TaskPipelineCard } from "../cards/task-pipeline-card"
import { PendingInvitesSection } from "./pending-invites-section"
import { SummonConfirmBar } from "./summon-confirm-bar"
import { SummonOperatorButton } from "./summon-operator-button"
import { useTaskAreaPanel } from "../../hooks/use-task-area-panel"

type SectionRow = {
  kind: "section"
  key: string
  processCode: ProcessCode
  count: number
}

type TaskRow = {
  kind: "task"
  key: string
  processCode: ProcessCode
  task: Task
}

type AreaRow = SectionRow | TaskRow

/**
 * Sidebar desktop bitácora — EntityTable con scroll vertical propio.
 * Incluye selector de operador por área (mismo que móvil / AreaTaskSection).
 * Móvil: TaskAreaPanel (sheet), no este componente.
 */
export function TaskAreaSidebar({ className }: { className?: string }) {
  const panel = useTaskAreaPanel()
  const { state, actions } = panel
  const [areasOpen, setAreasOpen] = useState(false)

  if (!state.hasAreaPanel) return null

  const effectiveSelected = (code: string) =>
    state.supervisorAreas.length > 0
      ? state.supervisorAreas.includes(code as never)
      : true

  function toggleArea(code: (typeof state.allAreas)[number]) {
    const current =
      state.supervisorAreas.length > 0
        ? state.supervisorAreas
        : state.allAreas
    const selected = current.includes(code)
    actions.setSupervisorAreas(
      selected ? current.filter(c => c !== code) : [...current, code],
    )
  }

  const rows: AreaRow[] = useMemo(() => {
    const list: AreaRow[] = []
    for (const code of state.areas) {
      const tasks = state.columns.get(code) ?? []
      list.push({
        kind: "section",
        key: `section:${code}`,
        processCode: code,
        count: tasks.length,
      })
      for (const task of tasks) {
        list.push({
          kind: "task",
          key: `${code}:${task.id}`,
          processCode: code,
          task,
        })
      }
    }
    return list
  }, [state.areas, state.columns])

  const columns: EntityColumn<AreaRow>[] = useMemo(
    () => [
      {
        id: "card",
        title: "",
        width: "1fr",
        render: () => null,
      },
    ],
    [],
  )

  return (
    <aside
      className={
        className ??
        "flex h-full min-h-0 w-[min(40vw,26rem)] shrink-0 flex-col overflow-hidden rounded-2xl bg-card"
      }
    >
      <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-3 pb-2.5 pt-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="min-w-0 truncate text-sm font-bold tracking-wide text-foreground">
              Mis tareas
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
                  <Layers size={16} />
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

        {state.currentUserId && (
          <div className="shrink-0 px-3 pt-3">
            <PendingInvitesSection
              tasks={state.allTasks}
              currentUserId={state.currentUserId}
            />
          </div>
        )}

        <div
          className={cn(
            "min-h-0 flex-1 overflow-hidden",
            false,
          )}
        >
          {state.loading ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Cargando…
            </div>
          ) : state.areas.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-center text-sm text-muted-foreground">
              No hay áreas asignadas.
            </div>
          ) : (
            <EntityTable
              data={rows}
              columns={columns}
              rowId={row => row.key}
              emptyMessage="Sin tareas en las áreas seleccionadas"
              renderRow={row => {
                if (row.kind === "section") {
                  const definition = PROCESS_DEFINITIONS[row.processCode]
                  const Icon = ENTITY_ICONS[definition.icon]
                  const isSummoningThis =
                    state.summonTarget?.processCode === row.processCode

                  return (
                    <div className="flex items-center justify-between gap-2 px-2 pb-2 pt-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="flex size-6 shrink-0 items-center justify-center rounded-md"
                          style={{
                            color: definition.color,
                            backgroundColor: `${definition.color}22`,
                          }}
                        >
                          {Icon ? <Icon size={12} /> : row.processCode}
                        </span>
                        <span className="truncate text-xs font-bold uppercase tracking-wide text-foreground">
                          {definition.label}
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                          {row.count}
                        </span>
                      </div>

                      {/* Selector operador — mismo control que móvil */}
                      {state.canChooseAreas &&
                        (row.count > 0 || isSummoningThis) && (
                          <SummonOperatorButton
                            processCode={row.processCode}
                            active={isSummoningThis}
                            selectedOperatorId={
                              isSummoningThis
                                ? state.summonTarget?.operator.id
                                : undefined
                            }
                            onSelect={operator =>
                              actions.setSummonTarget(
                                operator
                                  ? {
                                      processCode: row.processCode,
                                      operator,
                                    }
                                  : null,
                              )
                            }
                          />
                        )}
                    </div>
                  )
                }

                return (
                  <div className="px-1 py-1" data-expanded-row-id={row.key}>
                    <TaskPipelineCard
                      task={row.task}
                      processCode={row.processCode}
                      expanded={state.expandedKey === row.key}
                      dimOthers={
                        state.expandedKey !== null &&
                        state.expandedKey !== row.key
                      }
                      onToggle={() => actions.setExpandedKey(row.key)}
                      overlayLocked={
                        state.activeOverlayKey !== null &&
                        state.activeOverlayKey !== row.key
                      }
                      onOverlayOpenChange={isOpen =>
                        actions.setActiveOverlayKey(row.key, isOpen)
                      }
                    />
                  </div>
                )
              }}
            />
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
      </div>
    </aside>
  )
}
