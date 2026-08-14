"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"

import { getActivityIcon } from "../constants/activity-icons"
import type { ActivityLog, DayShift } from "../types/activity-log.types"
import { usePullToRefreshStore } from "@/shared/ui/pull-to-refresh/pull-to-refresh-store"
import {
  autoScrollAtPointer,
  findVerticalScrollParent,
  overlayTopAbovePointer,
} from "@/shared/dnd/pointer-drag-utils"

type Props = {
  onDrop: (logId: string, shift: DayShift, isDuplicate: boolean) => void
  isShiftAvailable: (shift: DayShift) => boolean
}

type SlotRect = {
  shift: DayShift
  left: number
  right: number
  top: number
  bottom: number
}

/**
 * Drag entre franjas de bitácora.
 * Comparte clearance del dedo + auto-scroll con useRowDragReorder
 * (pointer-drag-utils) — sin duplicar esa lógica.
 */
export function useActivityDrag({ onDrop, isShiftAvailable }: Props) {
  const [draggingLog, setDraggingLog] = useState<ActivityLog | null>(null)
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 })
  const [hoverShift, setHoverShift] = useState<DayShift | null>(null)
  const [isDuplicateMode, setIsDuplicateMode] = useState(false)

  const isDuplicateModeRef = useRef(false)
  const draggingLogRef = useRef(draggingLog)
  draggingLogRef.current = draggingLog

  const isShiftAvailableRef = useRef(isShiftAvailable)
  isShiftAvailableRef.current = isShiftAvailable

  const onDropRef = useRef(onDrop)
  onDropRef.current = onDrop

  const slotEls = useRef<Map<DayShift, HTMLElement>>(new Map())
  const cachedSlotRects = useRef<SlotRect[]>([])
  const scrollParentRef = useRef<HTMLElement | null>(null)
  const lastClientY = useRef(0)
  const lastClientX = useRef(0)
  const scrollRaf = useRef<number | null>(null)

  const registerSlot = useCallback((shift: DayShift, el: HTMLElement | null) => {
    if (el) slotEls.current.set(shift, el)
    else slotEls.current.delete(shift)
  }, [])

  const updateCachedRects = useCallback((excludeShift?: DayShift | null) => {
    const rects: SlotRect[] = []

    for (const [shift, el] of slotEls.current) {
      if (shift === excludeShift) continue
      if (!isShiftAvailableRef.current(shift)) continue

      const rect = el.getBoundingClientRect()
      rects.push({
        shift,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      })
    }

    cachedSlotRects.current = rects
  }, [])

  const findShiftAt = useCallback((x: number, y: number): DayShift | null => {
    for (const slot of cachedSlotRects.current) {
      if (
        x >= slot.left &&
        x <= slot.right &&
        y >= slot.top &&
        y <= slot.bottom
      ) {
        return slot.shift
      }
    }
    return null
  }, [])

  const DRAG_THRESHOLD_PX = 12

  const beginDrag = useCallback(
    (
      e: ReactPointerEvent<HTMLElement>,
      log: ActivityLog,
      isDuplicate = false,
    ) => {
      if (e.button !== 0) return
      if (draggingLogRef.current) return

      const startX = e.clientX
      const startY = e.clientY
      const pointerId = e.pointerId
      const target = e.currentTarget
      let activated = false

      scrollParentRef.current = findVerticalScrollParent(target)

      function activate(clientX: number, clientY: number) {
        if (activated) return
        activated = true

        try {
          target.setPointerCapture(pointerId)
        } catch {
          /* ignore */
        }

        updateCachedRects(isDuplicate ? null : log.shift)
        usePullToRefreshStore.getState().setDragLocked(true)
        setDraggingLog(log)
        setPointerPos({ x: clientX, y: clientY })
        lastClientY.current = clientY
        lastClientX.current = clientX
        setHoverShift(null)
        isDuplicateModeRef.current = isDuplicate
        setIsDuplicateMode(isDuplicate)
      }

      function onMove(ev: PointerEvent) {
        if (ev.pointerId !== pointerId) return
        if (activated) return

        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return

        ev.preventDefault()
        activate(ev.clientX, ev.clientY)
      }

      function onUp(ev: PointerEvent) {
        if (ev.pointerId !== pointerId) return
        cleanup()
      }

      function onCancel(ev: PointerEvent) {
        if (ev.pointerId !== pointerId) return
        cleanup()
      }

      function cleanup() {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        window.removeEventListener("pointercancel", onCancel)
      }

      window.addEventListener("pointermove", onMove, { passive: false })
      window.addEventListener("pointerup", onUp)
      window.addEventListener("pointercancel", onCancel)
    },
    [updateCachedRects],
  )

  const endDrag = useCallback(
    (x: number, y: number, shouldDrop: boolean) => {
      const log = draggingLogRef.current
      const isDuplicate = isDuplicateModeRef.current

      if (shouldDrop && log) {
        const targetShift = findShiftAt(x, y)
        if (targetShift && (isDuplicate || targetShift !== log.shift)) {
          onDropRef.current(log.id, targetShift, isDuplicate)
        }
      }

      if (scrollRaf.current) {
        cancelAnimationFrame(scrollRaf.current)
        scrollRaf.current = null
      }

      usePullToRefreshStore.getState().setDragLocked(false)
      setDraggingLog(null)
      setHoverShift(null)
      setIsDuplicateMode(false)
      cachedSlotRects.current = []
      scrollParentRef.current = null
    },
    [findShiftAt],
  )

  useEffect(() => {
    if (!draggingLog) return

    function tickAutoScroll() {
      const y = lastClientY.current
      const moved = autoScrollAtPointer(y, scrollParentRef.current)
      if (moved) {
        updateCachedRects(
          isDuplicateModeRef.current
            ? null
            : draggingLogRef.current?.shift,
        )
        setHoverShift(findShiftAt(lastClientX.current, y))
      }
      scrollRaf.current = requestAnimationFrame(tickAutoScroll)
    }

    scrollRaf.current = requestAnimationFrame(tickAutoScroll)

    function onMove(e: PointerEvent) {
      lastClientY.current = e.clientY
      lastClientX.current = e.clientX
      setPointerPos({ x: e.clientX, y: e.clientY })
      autoScrollAtPointer(e.clientY, scrollParentRef.current)
      updateCachedRects(
        isDuplicateModeRef.current ? null : draggingLogRef.current?.shift,
      )
      setHoverShift(findShiftAt(e.clientX, e.clientY))
    }

    function onUp(e: PointerEvent) {
      endDrag(e.clientX, e.clientY, true)
    }

    function onCancel() {
      endDrag(0, 0, false)
    }

    function onScroll() {
      updateCachedRects(
        isDuplicateModeRef.current ? null : draggingLogRef.current?.shift,
      )
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onCancel)
    window.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    })

    return () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onCancel)
      window.removeEventListener("scroll", onScroll, { capture: true })
    }
  }, [draggingLog, endDrag, findShiftAt, updateCachedRects])

  const overlay = draggingLog && (
    <div
      style={{
        position: "fixed",
        left: pointerPos.x + 14,
        top: overlayTopAbovePointer(pointerPos.y),
        pointerEvents: "none",
        zIndex: 10000,
        transform: "rotate(-2deg)",
      }}
    >
      <div className="flex max-w-64 items-center gap-2.5 rounded-xl bg-popover px-3 py-2.5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]">
        {(() => {
          const Icon = getActivityIcon(draggingLog.activityType.icon)
          return (
            <div
              className="flex size-7 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${draggingLog.activityType.color}22`,
                color: draggingLog.activityType.color,
              }}
            >
              <Icon size={13} />
            </div>
          )
        })()}

        <span className="min-w-0 truncate text-xs font-medium text-foreground">
          {draggingLog.activityType.label}
        </span>

        {isDuplicateMode && (
          <span className="shrink-0 rounded-md bg-emerald-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
            Copiar
          </span>
        )}
      </div>
    </div>
  )

  return {
    beginDrag,
    registerSlot,
    draggingLogId: draggingLog?.id ?? null,
    hoverShift,
    isDuplicateMode,
    overlay,
  }
}
