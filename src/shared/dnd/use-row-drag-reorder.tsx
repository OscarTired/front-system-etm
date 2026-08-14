"use client"

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"

import { DndRowProvider } from "@/shared/ui/entity-table-common/dnd-row-context"
import { usePullToRefreshStore } from "@/shared/ui/pull-to-refresh/pull-to-refresh-store"

import {
  autoScrollAtPointer,
  findVerticalScrollParent,
  overlayTopAbovePointer,
} from "./pointer-drag-utils"

type RowRect = {
  id: string
  top: number
  height: number
  center: number
}

type DragState<T> = {
  item: T
  id: string
  left: number
  width: number
  offsetY: number
}

type Props<T> = {
  items: T[]
  getId: (item: T) => string
  onReorder: (next: T[]) => void
  renderDragLabel: (item: T) => ReactNode
  disabled?: boolean
  isRowDisabled?: (item: T) => boolean
}

export function useRowDragReorder<T>({
  items,
  getId,
  onReorder,
  renderDragLabel,
  disabled,
  isRowDisabled,
}: Props<T>) {
  const [drag, setDrag] = useState<DragState<T> | null>(null)
  const [isActuallyDragging, setIsActuallyDragging] = useState(false)
  const [insertIndex, setInsertIndex] = useState<number | null>(null)
  const [labelTop, setLabelTop] = useState(0)

  const itemsRef = useRef(items)
  itemsRef.current = items

  const dragRef = useRef(drag)
  dragRef.current = drag

  const insertIndexRef = useRef(insertIndex)
  insertIndexRef.current = insertIndex

  const rowEls = useRef<Record<string, HTMLDivElement | null>>({})
  const rects = useRef<RowRect[]>([])
  const raf = useRef<number | null>(null)
  const scrollRaf = useRef<number | null>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const scrollParentRef = useRef<HTMLElement | null>(null)
  const lastClientY = useRef(0)

  function capture() {
    rects.current = itemsRef.current.map(item => {
      const id = getId(item)
      const el = rowEls.current[id]

      if (!el) {
        return { id, top: 0, height: 0, center: 0 }
      }

      const r = el.getBoundingClientRect()

      return {
        id,
        top: r.top,
        height: r.height,
        center: r.top + r.height / 2,
      }
    })
  }

  function getInsertIndex(y: number, dragId: string) {
    let index = 0
    const otherRects = rects.current.filter(r => r.id !== dragId)

    for (let i = 0; i < otherRects.length; i++) {
      const rect = otherRects[i]
      if (y < rect.center) {
        return index
      }
      index++
    }

    return Math.min(index, otherRects.length)
  }

  function beginDrag(e: ReactPointerEvent<HTMLElement>, item: T) {
    if (disabled) return

    const id = getId(item)
    const rowEl = rowEls.current[id]
    if (!rowEl) return

    // Evita que el navegador interprete el toque como scroll nativo.
    e.preventDefault()

    const rect = rowEl.getBoundingClientRect()
    capture()

    scrollParentRef.current = findVerticalScrollParent(rowEl)
    lastClientY.current = e.clientY

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // noop
    }

    const initialIndex = itemsRef.current.findIndex(i => getId(i) === id)
    setInsertIndex(initialIndex)

    const offsetY = e.clientY - rect.top

    startPos.current = { x: e.clientX, y: e.clientY }
    setIsActuallyDragging(false)

    setDrag({
      item,
      id,
      left: rect.left,
      width: rect.width,
      offsetY,
    })

    // Ghost por encima del dedo (no debajo / bajo el dedo)
    setLabelTop(overlayTopAbovePointer(e.clientY))
  }

  function finishDrag() {
    const current = dragRef.current
    const finalInsertIndex = insertIndexRef.current

    if (current && finalInsertIndex !== null) {
      const list = itemsRef.current
      const from = list.findIndex(i => getId(i) === current.id)

      if (from !== finalInsertIndex) {
        const next = [...list]
        const [moved] = next.splice(from, 1)
        next.splice(finalInsertIndex, 0, moved)
        onReorder(next)
      }
    }

    if (scrollRaf.current) {
      cancelAnimationFrame(scrollRaf.current)
      scrollRaf.current = null
    }

    usePullToRefreshStore.getState().setDragLocked(false)
    setDrag(null)
    setIsActuallyDragging(false)
    setInsertIndex(null)
    startPos.current = null
    scrollParentRef.current = null
  }

  useEffect(() => {
    if (!drag) return

    const dragId = drag.id

    function tickAutoScroll() {
      const y = lastClientY.current
      const moved = autoScrollAtPointer(y, scrollParentRef.current)
      if (moved) {
        capture()
        setInsertIndex(getInsertIndex(y, dragId))
      }
      scrollRaf.current = requestAnimationFrame(tickAutoScroll)
    }

    function onMove(e: PointerEvent) {
      lastClientY.current = e.clientY

      if (startPos.current) {
        const dx = Math.abs(e.clientX - startPos.current.x)
        const dy = Math.abs(e.clientY - startPos.current.y)
        if (dx > 4 || dy > 4) {
          setIsActuallyDragging(true)
          usePullToRefreshStore.getState().setDragLocked(true)
          if (!scrollRaf.current) {
            scrollRaf.current = requestAnimationFrame(tickAutoScroll)
          }
        }
      }

      if (raf.current) cancelAnimationFrame(raf.current)

      raf.current = requestAnimationFrame(() => {
        autoScrollAtPointer(e.clientY, scrollParentRef.current)
        capture()
        const newIndex = getInsertIndex(e.clientY, dragId)
        setInsertIndex(newIndex)
        setLabelTop(overlayTopAbovePointer(e.clientY))
      })
    }

    function onUp() {
      finishDrag()
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag])

  const lineTop = (() => {
    if (insertIndex === null || !drag || !isActuallyDragging) return 0

    const otherRects = rects.current.filter(r => r.id !== drag.id)
    if (otherRects.length === 0) return 0

    if (insertIndex >= otherRects.length) {
      const last = otherRects.at(-1)
      return last ? last.top + last.height : 0
    }

    return otherRects[insertIndex]?.top ?? 0
  })()

  const isAtOriginalPosition = (() => {
    if (insertIndex === null || !drag) return true
    const originalIndex = itemsRef.current.findIndex(i => getId(i) === drag.id)
    return insertIndex === originalIndex
  })()

  const isOutOfBounds = (() => {
    if (!isActuallyDragging || insertIndex === null || rects.current.length === 0)
      return true
    const otherRects = rects.current.filter(r => r.id !== drag?.id)
    if (otherRects.length === 0) return true

    const firstTop = otherRects[0].top
    const lastBottom =
      (otherRects.at(-1)?.top ?? 0) + (otherRects.at(-1)?.height ?? 0)
    const currentY = lastClientY.current

    return currentY < firstTop - 20 || currentY > lastBottom + 20
  })()

  function renderRow(
    item: T,
    content: ReactNode,
    templateColumns: string,
    rowId: string,
  ) {
    const isThisDragging = drag?.id === rowId
    const rowDisabled = disabled || isRowDisabled?.(item)
    const isGridMode = templateColumns.length > 0

    return (
      <div
        ref={el => {
          rowEls.current[rowId] = el
        }}
        className={
          isGridMode
            ? "grid min-w-0 items-center rounded-xl border-b border-border px-2 transition-colors hover:bg-foreground/5"
            : "min-w-0"
        }
        style={{
          gridTemplateColumns: isGridMode ? templateColumns : undefined,
          opacity: isThisDragging && isActuallyDragging ? 0 : 1,
          transform:
            isThisDragging && isActuallyDragging ? "scale(0.98)" : "scale(1)",
          pointerEvents:
            isThisDragging && isActuallyDragging ? "none" : "auto",
        }}
      >
        <DndRowProvider
          value={
            rowDisabled
              ? null
              : { onPointerDown: e => beginDrag(e, item) }
          }
        >
          {content}
        </DndRowProvider>
      </div>
    )
  }

  const overlay =
    drag && isActuallyDragging ? (
      <>
        {!isOutOfBounds && !isAtOriginalPosition && (
          <div
            style={{
              position: "fixed",
              left: drag.left,
              width: drag.width,
              top: lineTop,
              pointerEvents: "none",
              zIndex: 9999,
            }}
          >
            <div className="h-0.5 w-full rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" />
          </div>
        )}

        <div
          style={{
            position: "fixed",
            left: drag.left,
            width: Math.min(drag.width, 288),
            top: labelTop,
            pointerEvents: "none",
            zIndex: 10000,
          }}
        >
          <div className="flex w-64 max-w-full items-center gap-3 rounded-xl bg-popover px-3 py-2 shadow-[0_28px_70px_rgba(0,0,0,.45)] backdrop-blur-xl">
            <span className="shrink-0 text-foreground/35">≡</span>
            <div className="min-w-0 overflow-hidden">
              {renderDragLabel(drag.item)}
            </div>
          </div>
        </div>
      </>
    ) : null

  return {
    renderRow,
    overlay,
    isDragging: isActuallyDragging,
  }
}
