"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import type { Task } from "@/features/tasks/types/task.types"

import { useDragScroll } from "@/shared/ui/horizontal-scroll/use-drag-scroll"
import { useHorizontalFade } from "@/shared/hooks/use-horizontal-fade"
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

  // Drag scroll horizontal exclusivo para el header
  const {
    containerRef: headerScrollRef,
    handleMouseDown,
    handleMouseMove,
    handleClickCapture,
    stopDragging,
  } = useDragScroll()

  // Ref para el área contenedora de tarjetas
  const contentScrollRef = useRef<HTMLDivElement | null>(null)

  // Fade horizontal independiente para header y contenido
  const headerFade = useHorizontalFade({ containerRef: headerScrollRef })
  const contentFade = useHorizontalFade({ containerRef: contentScrollRef })

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

    const handleHeaderScroll = () => {
      contentEl.scrollLeft = headerEl.scrollLeft
    }

    headerEl.addEventListener("scroll", handleHeaderScroll, { passive: true })
    return () => {
      headerEl.removeEventListener("scroll", handleHeaderScroll)
    }
  }, [headerScrollRef, loading])

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
        grouped.get(process)?.push(task)
      }
    }

    return grouped
  }, [tasks])

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
        <button
          type="button"
          onClick={scrollLeft}
          aria-label="Scrollear izquierda"
          tabIndex={-1}
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
          className={`
            absolute left-2 top-5.5 z-20 -translate-y-1/2
            flex h-7 w-8 items-center justify-center
            rounded-lg bg-[#18181b]/60 backdrop-blur-xl
            text-foreground transition-opacity duration-200
            hover:bg-[#18181b]
            ${showLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
          `}
        >
          <ChevronLeft size={13} strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={scrollRight}
          aria-label="Scrollear derecha"
          tabIndex={-1}
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
          className={`
            absolute right-2 top-5.5 z-20 -translate-y-1/2
            flex h-7 w-8 items-center justify-center
            rounded-lg bg-[#18181b]/60 backdrop-blur-xl
            text-foreground transition-opacity duration-200
            hover:bg-[#18181b]
            ${showRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
          `}
        >
          <ChevronRight size={13} strokeWidth={2.5} />
        </button>

        {/* Header con fade horizontal */}
        <div
          style={{
            WebkitMaskImage: `linear-gradient(to right, transparent 0, black ${headerFade.leftFade}px, black calc(100% - ${headerFade.rightFade}px), transparent 100%)`,
            maskImage: `linear-gradient(to right, transparent 0, black ${headerFade.leftFade}px, black calc(100% - ${headerFade.rightFade}px), transparent 100%)`,
          }}
          className="shrink-0 overflow-hidden"
        >
          <div
            ref={headerScrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
            onClickCapture={handleClickCapture}
            className="hide-scrollbar overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex w-max shrink-0 gap-4">
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
          </div>
        </div>

        {/* Área de tarjetas con fade horizontal + scroll vertical compartido */}
        <div
          style={{
            WebkitMaskImage: `linear-gradient(to right, transparent 0, black ${contentFade.leftFade}px, black calc(100% - ${contentFade.rightFade}px), transparent 100%)`,
            maskImage: `linear-gradient(to right, transparent 0, black ${contentFade.leftFade}px, black calc(100% - ${contentFade.rightFade}px), transparent 100%)`,
          }}
          className="min-h-0 flex-1 overflow-hidden"
        >
          <div
            ref={contentScrollRef}
            className="hide-scrollbar h-full overflow-x-auto overflow-y-auto"
          >
            <div className="flex h-fit w-max gap-4 pb-4">
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
          </div>
        </div>
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