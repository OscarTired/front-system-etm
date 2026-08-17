"use client"

import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { getBadgeColors } from "@/shared/utils/badge-colors"
import { useThemeStore } from "@/shared/theme"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { useDragScroll } from "@/shared/ui/horizontal-scroll/use-drag-scroll"
import { cn } from "@/shared/utils/utils"
import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"

import {
  ENGINEERING_PROCESS_DEFINITIONS,
  ENGINEERING_PROCESS_ORDER,
  type EngineeringProcessCode,
} from "../constants/engineering-process-definitions"
import type { EngineeringTask } from "../types/engineering-task.types"
import { EngineeringTaskRow } from "./engineering-task-row"

type Props = {
  tasks: EngineeringTask[]
  loading?: boolean
}

function groupByProcess(tasks: EngineeringTask[]) {
  const map = new Map<EngineeringProcessCode, EngineeringTask[]>()
  for (const code of ENGINEERING_PROCESS_ORDER) map.set(code, [])
  for (const t of tasks) {
    const list = map.get(t.processCode)
    if (list) list.push(t)
    else map.set(t.processCode, [t])
  }
  return map
}

/** Quién está en PROGRESS en esta columna (estilo TaskColumnOperator). */
function ActiveAssignees({ tasks }: { tasks: EngineeringTask[] }) {
  const active = tasks.filter(
    t => t.status === "PROGRESS" && t.assignee,
  )
  if (active.length === 0) return null

  const seen = new Set<string>()
  const unique = active.filter(t => {
    const id = t.assignee!.id
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1 pb-1 pt-0.5">
      {unique.map(t => (
        <div key={t.assignee!.id} className="flex items-center gap-1.5">
          <DynamicBadge
            label={t.assignee!.name}
            color={t.assignee!.color}
            icon={t.assignee!.icon}
            width="field"
          />
          <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Trabajando
          </span>
        </div>
      ))}
    </div>
  )
}

function ProcessColumnHeader({
  code,
  count,
  centered = false,
}: {
  code: EngineeringProcessCode
  count: number
  centered?: boolean
}) {
  const theme = useThemeStore(s => s.resolved)
  const def = ENGINEERING_PROCESS_DEFINITIONS[code]
  const Icon = ENTITY_ICONS[def.icon]
  const badge = getBadgeColors(def.color, theme)

  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center gap-2 border-b px-3",
        centered && "justify-center",
      )}
      style={{ borderColor: def.color }}
    >
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
        style={{ color: badge.text, backgroundColor: badge.background }}
      >
        {def.short}
      </span>
      {Icon && (
        <Icon size={14} style={{ color: def.color }} className="shrink-0" />
      )}
      <span className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
        {def.label}
      </span>
      <span className="shrink-0 text-xs font-semibold text-muted-foreground">
        {count}
      </span>
    </div>
  )
}

export function EngineeringProcessBoard({ tasks, loading }: Props) {
  const { isMobile } = useResponsive()
  const columns = useMemo(() => groupByProcess(tasks), [tasks])

  const {
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleClickCapture,
    stopDragging,
  } = useDragScroll()

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const rafRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const max = el.scrollWidth - el.clientWidth
      setCanScrollLeft(el.scrollLeft > 4)
      setCanScrollRight(el.scrollLeft < max - 4)
    }

    const schedule = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    }

    update()
    el.addEventListener("scroll", schedule, { passive: true })
    const ro = new ResizeObserver(schedule)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", schedule)
      ro.disconnect()
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [containerRef, tasks, isMobile])

  // Mobile: snap a página (misma idea que MobilePipelineCarousel)
  useLayoutEffect(() => {
    if (!isMobile) return
    const el = containerRef.current
    if (!el) return
    let settleTimer: number | null = null
    const snap = () => {
      const w = el.clientWidth || 1
      const max = ENGINEERING_PROCESS_ORDER.length - 1
      const idx = Math.max(0, Math.min(max, Math.round(el.scrollLeft / w)))
      const target = idx * w
      if (Math.abs(el.scrollLeft - target) > 2) {
        el.scrollTo({ left: target, behavior: "smooth" })
      }
    }
    const onScroll = () => {
      if (settleTimer != null) window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(snap, 80)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    el.addEventListener("scrollend", snap as EventListener)
    return () => {
      el.removeEventListener("scroll", onScroll)
      el.removeEventListener("scrollend", snap as EventListener)
      if (settleTimer != null) window.clearTimeout(settleTimer)
    }
  }, [containerRef, isMobile])

  function currentIndex() {
    const el = containerRef.current
    if (!el) return 0
    const w = el.clientWidth || 1
    return Math.round(el.scrollLeft / w)
  }

  function goToIndex(index: number) {
    const el = containerRef.current
    if (!el) return
    const max = ENGINEERING_PROCESS_ORDER.length - 1
    const next = Math.max(0, Math.min(max, index))
    el.scrollTo({
      left: isMobile ? next * el.clientWidth : next * 288,
      behavior: "smooth",
    })
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }

  return (
    <div className="relative min-h-0 w-full flex-1">
      <button
        type="button"
        onClick={() => goToIndex(currentIndex() - 1)}
        aria-label="Proceso anterior"
        tabIndex={-1}
        className={cn(
          "absolute left-1 top-5 z-20 flex h-8 w-8 items-center justify-center rounded-full",
          "border border-border bg-card/90 text-foreground backdrop-blur-xl transition-opacity duration-200",
          canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronLeft size={15} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={() => goToIndex(currentIndex() + 1)}
        aria-label="Proceso siguiente"
        tabIndex={-1}
        className={cn(
          "absolute right-1 top-5 z-20 flex h-8 w-8 items-center justify-center rounded-full",
          "border border-border bg-card/90 text-foreground backdrop-blur-xl transition-opacity duration-200",
          canScrollRight ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronRight size={15} strokeWidth={2.5} />
      </button>

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onClickCapture={handleClickCapture}
        className={cn(
          "hide-scrollbar flex h-full min-h-0 select-none",
          isMobile
            ? "snap-x snap-mandatory overflow-x-auto overflow-y-hidden [touch-action:pan-x]"
            : "gap-3 overflow-x-auto overflow-y-hidden pb-2",
        )}
      >
        {ENGINEERING_PROCESS_ORDER.map(code => {
          const colTasks = columns.get(code) ?? []
          return (
            <div
              key={code}
              className={cn(
                "flex shrink-0 flex-col",
                isMobile
                  ? "w-full snap-center [touch-action:pan-y]"
                  : "w-72",
              )}
            >
              <ProcessColumnHeader
                code={code}
                count={colTasks.length}
                centered={isMobile}
              />
              <ActiveAssignees tasks={colTasks} />
              <div
                className={cn(
                  "mt-1 flex flex-col gap-1.5 px-0.5",
                  isMobile && "overflow-y-auto overscroll-contain pb-4",
                )}
              >
                {colTasks.length === 0 ? (
                  <p className="px-2 py-8 text-center text-xs text-muted-foreground">
                    Sin tareas
                  </p>
                ) : (
                  colTasks.map(task => (
                    <EngineeringTaskRow key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
