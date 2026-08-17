"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { Task, ProcessCode } from "@/features/tasks/types/task.types"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import {
  ProcessBoard,
  type ProcessBoardColumn,
} from "@/shared/ui/process-board"

import { PIPELINE_PROCESS_ORDER } from "../../utils/process-columns"
import { getTaskProcesses } from "../../utils/get-task-process"
import { TaskProcessColumn } from "../../table/task-process-column"
import { TaskPipelineHeader } from "../../table/task-pipeline-header"
import { TaskPipelineSkeleton } from "./task-pipeline-skeleton"
import { TaskDialog } from "@/features/tasks/components/dialog/task-dialog"

type Props = {
  tasks: Task[]
  kpiTasks: Task[]
  loading?: boolean
}

export function TaskPipelineBoard({
  tasks,
  kpiTasks,
  loading = false,
}: Props) {
  const { isMobile } = useResponsive()

  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [activeOverlayKey, setActiveOverlayKey] = useState<string | null>(null)
  const [pendingAutoExpandKey, setPendingAutoExpandKey] = useState<
    string | null
  >(null)
  const [openTaskDialog, setOpenTaskDialog] = useState(false)

  const activeTaskId = expandedKey ? expandedKey.split(":")[0] : null
  const prevTasksRef = useRef<Task[]>([])

  useEffect(() => {
    const prev = prevTasksRef.current
    if (prev.length === 0) {
      prevTasksRef.current = tasks
      return
    }

    let detectedKey: string | null = null
    for (const task of tasks) {
      const prevTask = prev.find(t => t.id === task.id)
      if (!prevTask) continue
      for (const step of task.workflowSteps) {
        if (step.status !== "PENDING") continue
        const prevStep = prevTask.workflowSteps.find(s => s.id === step.id)
        if (prevStep && prevStep.status !== "PENDING") {
          detectedKey = `${task.id}:${step.processCode}`
          break
        }
      }
      if (detectedKey) break
    }

    if (detectedKey) {
      if (activeOverlayKey !== null) setPendingAutoExpandKey(detectedKey)
      else setExpandedKey(detectedKey)
    }
    prevTasksRef.current = tasks
  }, [tasks, activeOverlayKey])

  useEffect(() => {
    if (activeOverlayKey === null && pendingAutoExpandKey !== null) {
      setExpandedKey(pendingAutoExpandKey)
      setPendingAutoExpandKey(null)
    }
  }, [activeOverlayKey, pendingAutoExpandKey])

  const handleOverlayOpenChange = useCallback((key: string, isOpen: boolean) => {
    setActiveOverlayKey(isOpen ? key : null)
  }, [])

  function toggleCard(key: string) {
    if (activeOverlayKey !== null) return
    setExpandedKey(current => (current === key ? null : key))
  }

  const grouped = useMemo(() => {
    const map = new Map<ProcessCode, Task[]>(
      PIPELINE_PROCESS_ORDER.map(code => [code, []]),
    )
    for (const task of tasks) {
      for (const process of getTaskProcesses(task)) {
        if (isMobile) {
          const step = task.workflowSteps.find(s => s.processCode === process)
          if (step?.status === "REVIEWED" || step?.status === "COMPLETED") {
            continue
          }
        }
        map.get(process)?.push(task)
      }
    }
    return map
  }, [tasks, isMobile])

  const columns: ProcessBoardColumn<ProcessCode>[] = useMemo(
    () =>
      PIPELINE_PROCESS_ORDER.map(code => ({
        id: code,
        content: (
          <TaskProcessColumn
            processCode={code}
            tasks={grouped.get(code) ?? []}
            allTasks={tasks}
            expandedKey={expandedKey}
            activeTaskId={activeTaskId}
            onToggleCard={toggleCard}
            activeOverlayKey={activeOverlayKey}
            onOverlayOpenChange={handleOverlayOpenChange}
            fullWidth={isMobile}
          />
        ),
      })),
    [
      grouped,
      tasks,
      expandedKey,
      activeTaskId,
      activeOverlayKey,
      handleOverlayOpenChange,
      isMobile,
    ],
  )

  return (
    <>
      <ProcessBoard
        columns={columns}
        loading={loading}
        loadingFallback={<TaskPipelineSkeleton />}
        header={<TaskPipelineHeader tasks={kpiTasks} />}
        columnClassName="min-w-72 w-72 shrink-0"
        scrollStep={320}
      />
      {openTaskDialog && (
        <TaskDialog
          open
          promptOpenAfterCreate
          onClose={() => setOpenTaskDialog(false)}
        />
      )}
    </>
  )
}
