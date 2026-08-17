"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ProcessBoardNavButton } from "@/shared/ui/process-board"

import type { Task } from "@/features/tasks/types/task.types"

import { ScrollArea } from "@/components/ui/scroll-area"
import { notifyScrollInteraction } from "@/shared/ui/scroll/scroll-interaction"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

import { PIPELINE_PROCESS_ORDER } from "../../utils/process-columns"
import { getTaskProcesses } from "../../utils/get-task-process"

import { TaskProcessColumn } from "../../table/task-process-column"
import { TaskPipelineHeader } from "../../table/task-pipeline-header"
import { TaskPipelineSkeleton } from "../../components/tasks/task-pipeline-skeleton"
import { MobilePipelineCarousel } from "../carousel/mobile-pipeline-carousel"

import { TaskDialog } from "@/features/tasks/components/dialog/task-dialog"

const SCROLL_STEP = 320

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
  const [pendingAutoExpandKey, setPendingAutoExpandKey] = useState<string | null>(null)
  const [openTaskDialog, setOpenTaskDialog] = useState(false)
  const [hoveringHeader, setHoveringHeader] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Extraer el ID de la tarea activa para aplicar el efecto de opacidad por fila
  const activeTaskId = expandedKey ? expandedKey.split(":")[0] : null

  const headerScrollRef = useRef<HTMLDivElement | null>(null)
  const contentScrollRef = useRef<HTMLDivElement | null>(null)

  const prevTasksRef = useRef<Task[]>([])

  // Sincronización del scroll horizontal (Header -> Content)
  //
  // IMPORTANTE: `headerScrollRef` es un ref estable (su identidad nunca
  // cambia entre renders), por lo que este efecto solo se re-ejecuta
  // cuando cambian sus dependencias reales. Si el primer render ocurre
  // mientras `loading` es `true` (p. ej. justo después de un F5, antes de
  // que llegue la data), los nodos DOM del header/content todavía no
  // existen y el listener nunca se adjunta, quedando el scroll
  // desincronizado para siempre. Por eso `loading` se agrega como
  // dependencia: fuerza a que el efecto se vuelva a evaluar apenas el
  // layout real (no el skeleton) esté montado y los refs apunten a nodos
  // reales.
  useEffect(() => {
    const headerEl = headerScrollRef.current
    const contentEl = contentScrollRef.current
    if (!headerEl || !contentEl) return

    let lock = false
    const syncFrom = (source: HTMLElement, target: HTMLElement) => {
      if (lock) return
      lock = true
      target.scrollLeft = source.scrollLeft
      notifyScrollInteraction()
      lock = false
    }
    const onHeader = () => syncFrom(headerEl, contentEl)
    const onContent = () => syncFrom(contentEl, headerEl)
    headerEl.addEventListener("scroll", onHeader, { passive: true })
    contentEl.addEventListener("scroll", onContent, { passive: true })
    return () => {
      headerEl.removeEventListener("scroll", onHeader)
      contentEl.removeEventListener("scroll", onContent)
    }
  }, [loading])

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
      if (activeOverlayKey !== null) {
        setPendingAutoExpandKey(detectedKey)
      } else {
        setExpandedKey(detectedKey)
      }
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

  const updateArrows = useCallback(() => {
    const el = headerScrollRef.current
    if (!el) return

    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [headerScrollRef])

  // Mismo problema que el efecto de sincronización de scroll: el ref es
  // estable, así que también necesita `loading` en las dependencias para
  // re-engancharse cuando el layout real (con los nodos DOM reales) se
  // monta después del skeleton.
  useEffect(() => {
    if (isMobile) return

    const el = headerScrollRef.current
    if (!el) return

    updateArrows()
    el.addEventListener("scroll", updateArrows, { passive: true })

    const observer = new ResizeObserver(updateArrows)
    observer.observe(el)

    return () => {
      el.removeEventListener("scroll", updateArrows)
      observer.disconnect()
    }
  }, [updateArrows, headerScrollRef, isMobile, loading])

  function scrollLeft() {
    headerScrollRef.current?.scrollBy({
      left: -SCROLL_STEP,
      behavior: "smooth",
    })
  }

  function scrollRight() {
    headerScrollRef.current?.scrollBy({
      left: SCROLL_STEP,
      behavior: "smooth",
    })
  }

  function toggleCard(key: string) {
    if (activeOverlayKey !== null) return
    setExpandedKey(current => (current === key ? null : key))
  }

  const columns = useMemo(() => {
    const grouped = new Map(
      PIPELINE_PROCESS_ORDER.map(code => [code, [] as Task[]]),
    )

    for (const task of tasks) {
      const processes = getTaskProcesses(task)
      for (const process of processes) {
        // Móvil: no listar steps ya revisados/completados en la cola activa.
        if (isMobile) {
          const step = task.workflowSteps.find(s => s.processCode === process)
          if (step?.status === "REVIEWED" || step?.status === "COMPLETED") {
            continue
          }
        }
        grouped.get(process)?.push(task)
      }
    }

    return grouped
  }, [tasks, isMobile])

  if (loading) {
    return <TaskPipelineSkeleton />
  }

  if (isMobile) {
    return (
      <div className="flex flex-col pb-28">
        <TaskPipelineHeader tasks={kpiTasks} />
        <div className="mt-3">
          <MobilePipelineCarousel
            tasks={tasks}
            columns={columns}
            expandedKey={expandedKey}
            onToggleCard={toggleCard}
            activeOverlayKey={activeOverlayKey}
            onOverlayOpenChange={handleOverlayOpenChange}
          />
        </div>
        {openTaskDialog && (
          <TaskDialog
            open
            promptOpenAfterCreate
            onClose={() => setOpenTaskDialog(false)}
          />
        )}
      </div>
    )
  }

  const showLeft = hoveringHeader && canScrollLeft
  const showRight = hoveringHeader && canScrollRight

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <TaskPipelineHeader tasks={kpiTasks} />

      <div
        className="relative mt-4 flex min-h-0 flex-1 flex-col overflow-hidden"
        onMouseEnter={() => setHoveringHeader(true)}
        onMouseLeave={() => setHoveringHeader(false)}
      >
                <ProcessBoardNavButton
          direction="left"
          visible={showLeft}
          onClick={scrollLeft}
          label="Scrollear izquierda"
        />

                <ProcessBoardNavButton
          direction="right"
          visible={showRight}
          onClick={scrollRight}
          label="Scrollear derecha"
        />

        <ScrollArea
          ref={headerScrollRef}
          orientation="horizontal"
          dragToScroll
          className="w-full shrink-0"
        >
          <div className="flex min-w-full w-max gap-4">
            {PIPELINE_PROCESS_ORDER.map(code => (
              <TaskProcessColumn
                key={code}
                processCode={code}
                tasks={columns.get(code) ?? []}
                expandedKey={expandedKey}
                onToggleCard={toggleCard}
                activeOverlayKey={activeOverlayKey}
                onOverlayOpenChange={handleOverlayOpenChange}
                headerOnly
              />
            ))}
          </div>
        </ScrollArea>

        <ScrollArea
          ref={contentScrollRef}
          orientation="both"
          dragToScroll
          className="min-h-0 w-full flex-1"
        >
          <div className="flex h-fit min-w-full w-max gap-4 pb-4">
            {PIPELINE_PROCESS_ORDER.map(code => (
              <TaskProcessColumn
                key={code}
                processCode={code}
                tasks={columns.get(code) ?? []}
                allTasks={tasks}
                expandedKey={expandedKey}
                activeTaskId={activeTaskId}
                onToggleCard={toggleCard}
                activeOverlayKey={activeOverlayKey}
                onOverlayOpenChange={handleOverlayOpenChange}
                contentOnly
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {openTaskDialog && (
        <TaskDialog
          open
          promptOpenAfterCreate
          onClose={() => setOpenTaskDialog(false)}
        />
      )}
    </div>
  )
}