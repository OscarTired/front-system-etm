"use client"

import { useMemo, useState } from "react"
import { Settings2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { cn } from "@/shared/utils/utils"

import { useTasks } from "@/features/tasks/hooks/use-tasks"
import { getTaskProcesses } from "@/features/tasks/pipeline/utils/get-task-process"
import { TaskProcessColumn } from "@/features/tasks/pipeline/table/task-process-column"
import { useMyAreaTasks } from "@/features/areas/hooks/use-my-area-tasks"

import { HistoryToggleButton } from "@/shared/history/components/history-toggle-button"
import { isWorkflowCompleted } from "@/features/workflow/selectors/is-completed"

import type { ProcessCode, Task } from "@/features/tasks/types/task.types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskAreaPanel({ open, onOpenChange }: Props) {
  const { tasks, loading } = useTasks()

  const {
    areas,
    canChooseAreas,
    supervisorAreas,
    setSupervisorAreas,
    allAreas,
    hasAreaPanel,
  } = useMyAreaTasks()

  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [activeOverlayKey, setActiveOverlayKey] = useState<string | null>(null)
  const [configOpen, setConfigOpen] = useState(false)

  const [showHistory, setShowHistory] = useState(false)

  const completedCount = useMemo(
    () => tasks.filter(task => isWorkflowCompleted(task.workflowSteps)).length,
    [tasks],
  )

  const visibleTasks = useMemo(
    () => showHistory
      ? tasks
      : tasks.filter(task => !isWorkflowCompleted(task.workflowSteps)),
    [tasks, showHistory],
  )

  const columns = useMemo(() => {
    const grouped = new Map<ProcessCode, Task[]>(
      areas.map(code => [code, [] as Task[]]),
    )

    for (const task of visibleTasks) {
      const processes = getTaskProcesses(task)

      for (const process of processes) {
        grouped.get(process)?.push(task)
      }
    }

    return grouped
  }, [visibleTasks, areas])

  function handleToggleCard(key: string) {
    if (activeOverlayKey === key) {
      return
    }

    setExpandedKey(current => current === key ? null : key)
  }

  function handleOverlayOpenChange(key: string, isOpen: boolean) {
    setActiveOverlayKey(isOpen ? key : null)
  }

  if (!hasAreaPanel) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          {/* Cabecera principal limpia (solo título y descripción) */}
          <div className="space-y-1">
            <SheetTitle>Mis tareas</SheetTitle>
            <SheetDescription>
              {areas.length > 0
                ? areas.map(code => PROCESS_DEFINITIONS[code].label).join(" · ")
                : "Selecciona qué área(s) supervisar"}
            </SheetDescription>
          </div>

          {/* Barra de herramientas dedicada: ubicada exactamente debajo de la descripción */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
            <div className="text-xs font-medium text-neutral-400">
              {areas.length > 0 ? `${areas.length} área(s) activa(s)` : "Sin áreas seleccionadas"}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <HistoryToggleButton
                count={completedCount}
                active={showHistory}
                onClick={() => setShowHistory(value => !value)}
              />

              {canChooseAreas && (
                <button
                  type="button"
                  onClick={() => setConfigOpen(v => !v)}
                  aria-label="Elegir áreas"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    configOpen
                      ? "bg-white/10 text-white"
                      : "text-neutral-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Settings2 size={16} />
                </button>
              )}
            </div>
          </div>

          {canChooseAreas && configOpen && (
            <div className="mt-2 flex flex-wrap gap-1.5 pt-1">
              {allAreas.map(code => {
                const definition = PROCESS_DEFINITIONS[code]
                const Icon = ENTITY_ICONS[definition.icon]
                const selected = supervisorAreas.includes(code)

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setSupervisorAreas(
                        selected
                          ? supervisorAreas.filter(c => c !== code)
                          : [...supervisorAreas, code],
                      )
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                      selected
                        ? "bg-white/10 text-white"
                        : "bg-white/3 text-neutral-500 hover:bg-white/6 hover:text-neutral-300",
                    )}
                  >
                    <Icon size={13} style={{ color: definition.color }} />
                    {definition.label}
                  </button>
                )
              })}
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 p-4">
          {loading ? (
            <div className="flex h-24 items-center justify-center text-sm text-neutral-500">
              Cargando…
            </div>
          ) : areas.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-center text-sm text-neutral-500">
              Selecciona al menos un área con el botón de abajo/arriba
              <br />
              para ver sus tareas acá.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {areas.map(code => (
                <div key={code}>
                  <div className="mb-2 flex items-center gap-2">
                    {(() => {
                      const Icon = ENTITY_ICONS[PROCESS_DEFINITIONS[code].icon]
                      return (
                        <Icon
                          size={14}
                          style={{ color: PROCESS_DEFINITIONS[code].color }}
                        />
                      )
                    })()}

                    <span className="text-xs font-bold uppercase tracking-wide text-neutral-300">
                      {PROCESS_DEFINITIONS[code].label}
                    </span>
                  </div>

                  <TaskProcessColumn
                    processCode={code}
                    tasks={columns.get(code) ?? []}
                    allTasks={visibleTasks}
                    expandedKey={expandedKey}
                    onToggleCard={handleToggleCard}
                    activeOverlayKey={activeOverlayKey}
                    onOverlayOpenChange={handleOverlayOpenChange}
                    fullWidth
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}