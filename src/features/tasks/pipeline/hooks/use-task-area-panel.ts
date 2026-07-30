import { useState, useMemo, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { useMyAreaTasks } from "@/features/areas/hooks/use-my-area-tasks"
import { useMyAreaTaskColumns } from "@/features/areas/hooks/use-my-area-task-columns"
import { useTasks } from "@/features/tasks/hooks/use-tasks"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { useWorkflowSummon } from "@/features/workflow/hooks/use-workflow-summon"
import { isProcessStepReviewed } from "@/features/workflow/selectors/is-process-step-reviewed"
import type { ProcessCode, Task } from "@/features/tasks/types/task.types"
import type { User } from "@/features/users/types/user.types"

export type SummonTarget = {
  processCode: ProcessCode
  operator: User
}

export function useTaskAreaPanel() {
  const {
    areas,
    canChooseAreas,
    supervisorAreas,
    setSupervisorAreas,
    allAreas,
    hasAreaPanel,
  } = useMyAreaTasks()

  const { columns: allColumns, loading } = useMyAreaTaskColumns(areas)
  const { tasks: allTasks } = useTasks()
  const currentUserId = useAuthStore(state => state.user?.id)
  const { summon, summoning, unsummon, unsummoning } = useWorkflowSummon()

  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [activeOverlayKey, setActiveOverlayKey] = useState<string | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const [summonTarget, setSummonTarget] = useState<SummonTarget | null>(null)
  const [selectedStepIds, setSelectedStepIds] = useState<Set<string>>(new Set())
  const [summonMode, setSummonMode] = useState<"ASSIGN" | "INVITE">("ASSIGN")

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

  const handleToggleStepSelection = useCallback((stepId: string) => {
    setSelectedStepIds(prev => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }, [])

  const handleCancelSummon = useCallback(() => {
    setSummonTarget(null)
    setSelectedStepIds(new Set())
  }, [])

  // Si el área que se está convocando deja de estar en la lista
  // (ej. la desmarcás en el selector de áreas de arriba), esa
  // sección de la página desaparece — pero summonTarget/
  // selectedStepIds viven acá, en el hook compartido, no adentro de
  // AreaTaskSection. Sin este efecto, quedaban huérfanos: "Convocar"
  // seguía activo para un área que ya ni se ve, y si la volvías a
  // marcar aparecía como si nunca hubieras salido del modo
  // selección.
  useEffect(() => {

    if (summonTarget && !areas.includes(summonTarget.processCode)) {
      handleCancelSummon()
    }

  }, [areas, summonTarget, handleCancelSummon])

  const handleConfirmSummon = useCallback(async () => {
    if (!summonTarget || selectedStepIds.size === 0) return

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
  }, [summonTarget, selectedStepIds, summonMode, summon, handleCancelSummon])

  const handleUnsummon = useCallback(async (stepId: string) => {
    try {
      await unsummon(stepId)
      toast.success("Convocatoria deshecha")
    } catch {
      toast.error("No se pudo deshacer la convocatoria. Intenta de nuevo.")
    }
  }, [unsummon])

  const handleToggleCard = useCallback((key: string) => {
    if (activeOverlayKey === key) return
    setExpandedKey(current => (current === key ? null : key))
  }, [activeOverlayKey])

  const handleOverlayOpenChange = useCallback((key: string, isOpen: boolean) => {
    setActiveOverlayKey(isOpen ? key : null)
  }, [])

  const handleSelectSummonTarget = useCallback((target: SummonTarget | null) => {
    setSummonTarget(target)
    setSelectedStepIds(new Set())
  }, [])

  return {
    state: {
      areas,
      allAreas,
      canChooseAreas,
      supervisorAreas,
      allTasks,
      currentUserId,
      loading,
      columns,
      completedCount,
      showHistory,
      configOpen,
      expandedKey,
      activeOverlayKey,
      summonTarget,
      selectedStepIds,
      summonMode,
      summoning,
      unsummoning,
      hasAreaPanel,
    },
    actions: {
      setSupervisorAreas,
      setShowHistory,
      setConfigOpen,
      setExpandedKey: handleToggleCard,
      setActiveOverlayKey: handleOverlayOpenChange,
      setSummonTarget: handleSelectSummonTarget,
      setSummonMode,
      handleToggleStepSelection,
      handleCancelSummon,
      handleConfirmSummon,
      handleUnsummon,
    },
  }
}

export type TaskAreaPanelReturn = ReturnType<typeof useTaskAreaPanel>