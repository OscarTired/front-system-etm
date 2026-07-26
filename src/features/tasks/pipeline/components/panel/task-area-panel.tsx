"use client"

import { useMemo, useState } from "react"
import { Settings2 } from "lucide-react"
import { toast } from "sonner"
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

import { TaskProcessColumn } from "@/features/tasks/pipeline/table/task-process-column"
import { useTasks } from "@/features/tasks/hooks/use-tasks"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { useMyAreaTasks } from "@/features/areas/hooks/use-my-area-tasks"
import { useMyAreaTaskColumns } from "@/features/areas/hooks/use-my-area-task-columns"
import { useWorkflowSummon } from "@/features/workflow/hooks/use-workflow-summon"

import { SummonOperatorButton } from "./summon-operator-button"
import { SummonConfirmBar } from "./summon-confirm-bar"
import { PendingInvitesSection } from "./pending-invites-section"

import { HistoryToggleButton } from "@/shared/history/components/history-toggle-button"
import { isProcessStepReviewed } from "@/features/workflow/selectors/is-process-step-reviewed"

import type { ProcessCode, Task } from "@/features/tasks/types/task.types"
import type { User } from "@/features/users/types/user.types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Superficie de trabajo real, no una lista de solo lectura: reusa
// exactamente el mismo TaskProcessColumn (y por dentro,
// TaskPipelineCard con su overlay de iniciar/pausar/completar) que
// ya usa el Kanban de Tareas — así que iniciar/completar acá pasa
// por el mismo WorkflowService.complete() de siempre, que ya dispara
// el auto-registro en la Bitácora (ver plan). No hay lógica nueva de
// workflow acá, solo un recorte por área sobre los mismos datos.
export function TaskAreaPanel({ open, onOpenChange }: Props) {

  const {
    areas,
    canChooseAreas,
    supervisorAreas,
    setSupervisorAreas,
    allAreas,
    hasAreaPanel,
  } = useMyAreaTasks()

  const {
    columns: allColumns,
    loading,
  } = useMyAreaTaskColumns(areas)

  // Solo para PendingInvitesSection — a diferencia de allColumns
  // (recortado a las áreas elegidas), las invitaciones pendientes
  // son sobre ESTE usuario en particular, sin importar qué área
  // tenga activa ahora mismo.
  const { tasks: allTasks } = useTasks()
  const currentUserId = useAuthStore(state => state.user?.id)

  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [activeOverlayKey, setActiveOverlayKey] = useState<string | null>(null)
  const [configOpen, setConfigOpen] = useState(false)

  // Estado del flujo de "Convocar": se elige un operario del área
  // (SummonOperatorButton), eso activa el modo selección SOLO en la
  // columna de esa área — el resto del panel sigue funcionando
  // normal. selectedStepIds son los workflowStep.id de las tareas
  // tildadas (uno por tarea, ya que cada una tiene un solo step por
  // proceso — ver TaskProcessColumn.ColumnContent).
  const [summonTarget, setSummonTarget] = useState<{ processCode: ProcessCode; operator: User } | null>(null)
  const [selectedStepIds, setSelectedStepIds] = useState<Set<string>>(new Set())
  const [summonMode, setSummonMode] = useState<"ASSIGN" | "INVITE">("ASSIGN")

  const { summon, summoning, unsummon, unsummoning } = useWorkflowSummon()

  async function handleUnsummon(stepId: string) {

    try {
      await unsummon(stepId)
      toast.success("Convocatoria deshecha")
    } catch {
      toast.error("No se pudo deshacer la convocatoria. Intenta de nuevo.")
    }

  }

  function handleToggleStepSelection(stepId: string) {

    setSelectedStepIds(prev => {

      const next = new Set(prev)

      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }

      return next

    })

  }

  function handleCancelSummon() {
    setSummonTarget(null)
    setSelectedStepIds(new Set())
  }

  async function handleConfirmSummon() {

    if (!summonTarget || selectedStepIds.size === 0) {
      return
    }

    try {

      await summon({
        stepIds: [...selectedStepIds],
        operatorId: summonTarget.operator.id,
        mode: summonMode,
      })

      toast.success(
        summonMode === "ASSIGN"
          ? `Se le asignaron ${selectedStepIds.size} ${selectedStepIds.size === 1 ? "tarea" : "tareas"} a ${summonTarget.operator.name}`
          : `Se invitó a ${summonTarget.operator.name} a ${selectedStepIds.size} ${selectedStepIds.size === 1 ? "tarea" : "tareas"}`,
      )

      handleCancelSummon()

    } catch {

      toast.error("No se pudo enviar la convocatoria. Intenta de nuevo.")

    }

  }

  // Mismo criterio visual que el Kanban de Tareas (usePipelineTasks
  // + HistoryToggleButton en TaskPageContent): por default se
  // esconden las revisadas, y el botón las vuelve a mostrar. La
  // diferencia acá es QUÉ cuenta como "revisado": no la tarea
  // completa (isWorkflowCompleted exige TODA la ruta en REVIEWED),
  // sino el paso de CADA área puntual — una tarea puede estar
  // revisada en Corte y seguir pendiente en Plegado; en la columna
  // de Corte eso ya es historial, sin importar que a la tarea le
  // falte ruta en otras áreas.
  const [showHistory, setShowHistory] = useState(false)

  const completedCount = useMemo(() => {

    let count = 0

    for (const [process, columnTasks] of allColumns) {
      count += columnTasks.filter(
        task => isProcessStepReviewed(task.workflowSteps, process),
      ).length
    }

    return count

  }, [allColumns])

  const columns = useMemo(() => {

    const grouped = new Map<ProcessCode, Task[]>()

    for (const [process, columnTasks] of allColumns) {

      const filtered = showHistory
        ? columnTasks
        : columnTasks.filter(task => !isProcessStepReviewed(task.workflowSteps, process))

      // Con el historial visible, las revisadas de ESTA área
      // quedarían mezcladas en el orden natural junto con las
      // pendientes — se agrupan arriba para que quede claro de un
      // vistazo qué ya se resolvió acá vs qué sigue activo. Orden
      // relativo dentro de cada grupo intacto (sort es estable).
      const sorted = showHistory
        ? [...filtered].sort((a, b) => {

            const aReviewed = isProcessStepReviewed(a.workflowSteps, process)
            const bReviewed = isProcessStepReviewed(b.workflowSteps, process)

            if (aReviewed === bReviewed) return 0

            return aReviewed ? -1 : 1

          })
        : filtered

      grouped.set(process, sorted)

    }

    return grouped

  }, [allColumns, showHistory])

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

          {/* pr-10: la X de cerrar del Sheet es absolute
              right-3/top-3 (32px) — sin este espacio reservado acá,
              el botón de configuración quedaba solapado con ella. */}
          <div className="flex items-center justify-between gap-2 pr-10">

            <div className="min-w-0">

              <SheetTitle>Mis tareas</SheetTitle>

              <SheetDescription>
                {areas.length > 0
                  ? areas.map(code => PROCESS_DEFINITIONS[code].label).join(" · ")
                  : "Elegí qué área(s) supervisar"}
              </SheetDescription>

            </div>

            <div className="flex shrink-0 items-center gap-1">

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
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Settings2 size={16} />
                </button>

              )}

            </div>

          </div>

          {canChooseAreas && configOpen && (

            <div className="mt-2 flex flex-wrap gap-1.5">

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

        {/* Quitamos contentOnly de TaskProcessColumn para que las tarjetas
            mantengan habilitado por completo su overlay interactivo con las
            acciones de workflow (iniciar, pausar, completar, etc.).
            fullWidth: acá las columnas van apiladas verticalmente
            (no una al lado de otra como en el Kanban), así que deben
            ocupar el ancho completo del panel en vez del w-72 fijo. */}
        <ScrollArea className={cn("min-h-0 flex-1 p-4", summonTarget && "pb-24")}>

          {loading ? (

            <div className="flex h-24 items-center justify-center text-sm text-neutral-500">
              Cargando…
            </div>

          ) : areas.length === 0 ? (

            <div className="flex h-24 items-center justify-center text-center text-sm text-neutral-500">
              Elegí al menos un área con el botón de arriba
              para ver sus tareas acá.
            </div>

          ) : (

            <div className="flex flex-col gap-6">

              {currentUserId && (
                <PendingInvitesSection tasks={allTasks} currentUserId={currentUserId} />
              )}

              {areas.map(code => (

                <div key={code}>

                  <div className="mb-2 flex items-center justify-between gap-2">

                    <div className="flex items-center gap-2">

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

                    {/* Solo quien puede elegir áreas (Supervisor/Admin)
                        tiene sentido que convoque — un operario de área
                        fija viendo su propia cola no asigna nada.
                        invisible en vez de no-renderizar: reserva el
                        mismo espacio siempre, así el resto de las áreas
                        no salta de lugar en cuanto se activa el modo
                        selección en cualquiera de ellas. */}
                    {canChooseAreas && (
                      <div className={cn(!!summonTarget && "invisible")}>
                        <SummonOperatorButton
                          processCode={code}
                          onSelect={(operator) => {
                            setSummonTarget({ processCode: code, operator })
                            setSelectedStepIds(new Set())
                          }}
                        />
                      </div>
                    )}

                  </div>

                  {canChooseAreas || summonTarget?.processCode === code ? (

                    <TaskProcessColumn
                      processCode={code}
                      tasks={columns.get(code) ?? []}
                      expandedKey={expandedKey}
                      onToggleCard={handleToggleCard}
                      activeOverlayKey={activeOverlayKey}
                      onOverlayOpenChange={handleOverlayOpenChange}
                      fullWidth
                      selectionMode={summonTarget?.processCode === code}
                      selectedStepIds={selectedStepIds}
                      onToggleStepSelection={handleToggleStepSelection}
                      onUnsummon={canChooseAreas ? handleUnsummon : undefined}
                      unsummoning={unsummoning}
                    />

                  ) : (

                    // Vista de un operario de área fija: separa lo
                    // que alguien le asignó puntualmente (Convocar,
                    // ver assignedById) de la cola abierta que
                    // cualquiera del área puede tomar.
                    (() => {

                      const allTasksForCode = columns.get(code) ?? []

                      const assigned = allTasksForCode.filter(
                        task => task.workflowSteps.find(s => s.processCode === code)?.assignedById,
                      )

                      const available = allTasksForCode.filter(
                        task => !task.workflowSteps.find(s => s.processCode === code)?.assignedById,
                      )

                      return (
                        <>

                          {assigned.length > 0 && (
                            <>
                              <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
                                Asignadas
                              </p>
                              <TaskProcessColumn
                                processCode={code}
                                tasks={assigned}
                                expandedKey={expandedKey}
                                onToggleCard={handleToggleCard}
                                activeOverlayKey={activeOverlayKey}
                                onOverlayOpenChange={handleOverlayOpenChange}
                                fullWidth
                                contentOnly
                              />
                            </>
                          )}

                          {available.length > 0 && (
                            <>
                              <p className={cn("mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-neutral-500", assigned.length > 0 && "mt-3")}>
                                Disponibles
                              </p>
                              <TaskProcessColumn
                                processCode={code}
                                tasks={available}
                                expandedKey={expandedKey}
                                onToggleCard={handleToggleCard}
                                activeOverlayKey={activeOverlayKey}
                                onOverlayOpenChange={handleOverlayOpenChange}
                                fullWidth
                                contentOnly
                              />
                            </>
                          )}

                          {assigned.length === 0 && available.length === 0 && (
                            <div className="flex h-12 items-center justify-center rounded-xl bg-white/4 px-3 text-sm font-medium text-neutral-500">
                              Sin tareas
                            </div>
                          )}

                        </>
                      )

                    })()

                  )}

                </div>

              ))}

            </div>

          )}

        </ScrollArea>

        {summonTarget && (
          <SummonConfirmBar
            operatorName={summonTarget.operator.name}
            count={selectedStepIds.size}
            mode={summonMode}
            onModeChange={setSummonMode}
            onConfirm={handleConfirmSummon}
            onCancel={handleCancelSummon}
            confirming={summoning}
          />
        )}

      </SheetContent>

    </Sheet>

  )

}