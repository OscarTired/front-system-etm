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

type Props = {
  onDrop: (logId: string, shift: DayShift) => void
  // El caller decide qué franjas aceptan drop (ej. no "upcoming") —
  // este hook no sabe nada de franjas horarias/estado de slot.
  isShiftAvailable: (shift: DayShift) => boolean
}

type SlotRect = {
  shift: DayShift
  left: number
  right: number
  top: number
  bottom: number
}

// Drag & drop por puntero, NO el drag nativo de HTML5 (draggable/
// onDragStart) — ese no permite un overlay propio consistente entre
// navegadores. Acá se dibuja la tarjetita de overlay a mano, mismo
// estilo visual que el overlay de useRowDragReorder (recuadro
// oscuro, ícono + label), pero pensado para moverse ENTRE
// contenedores (franjas) en vez de reordenar dentro de una sola
// lista — por eso no se reutiliza ese hook tal cual.
export function useActivityDrag({ onDrop, isShiftAvailable }: Props) {

  // Identidad del drag (separada de la posición a propósito): si
  // todo fuera un solo estado y cada pointermove lo reemplazara, el
  // useEffect de abajo (que depende de esta identidad para saber
  // cuándo suscribirse) se desmontaría y volvería a montar los
  // listeners de `window` en cada pixel de movimiento.
  const [draggingLog, setDraggingLog] = useState<ActivityLog | null>(null)
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 })
  const [hoverShift, setHoverShift] = useState<DayShift | null>(null)

  const draggingLogRef = useRef(draggingLog)
  draggingLogRef.current = draggingLog

  const isShiftAvailableRef = useRef(isShiftAvailable)
  isShiftAvailableRef.current = isShiftAvailable

  const onDropRef = useRef(onDrop)
  onDropRef.current = onDrop

  // Cada slot montado se registra acá con su elemento DOM.
  const slotEls = useRef<Map<DayShift, HTMLElement>>(new Map())

  // Rects cacheados: se calculan al iniciar el drag (y se
  // refrescan si la página scrollea durante el gesto), NO en cada
  // pointermove — leer getBoundingClientRect() en cada pixel de
  // movimiento es layout thrashing innecesario, la geometría de los
  // slots no cambia salvo que la página scrollee o se resize.
  const cachedSlotRects = useRef<SlotRect[]>([])

  const registerSlot = useCallback((shift: DayShift, el: HTMLElement | null) => {
    if (el) {
      slotEls.current.set(shift, el)
    } else {
      slotEls.current.delete(shift)
    }
  }, [])

  const updateCachedRects = useCallback((excludeShift?: DayShift | null) => {

    const rects: SlotRect[] = []

    for (const [shift, el] of slotEls.current) {

      // La franja de origen de la tarjeta que se está arrastrando
      // no es un destino válido — soltar ahí es un no-op (mismo
      // shift), así que ni siquiera debería iluminarse como si
      // fuera a pasar algo.
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
      if (x >= slot.left && x <= slot.right && y >= slot.top && y <= slot.bottom) {
        return slot.shift
      }
    }

    return null

  }, [])

  const beginDrag = useCallback((e: ReactPointerEvent<HTMLElement>, log: ActivityLog) => {

    // Solo botón principal — evita que un click derecho o el botón
    // central disparen un drag por accidente.
    if (e.button !== 0) return

    // Evita que el navegador interprete el toque como scroll nativo
    // antes de que llegue el primer pointermove.
    e.preventDefault()

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Fallback defensivo si el navegador rechaza el capture.
    }

    updateCachedRects(log.shift)
    setDraggingLog(log)
    setPointerPos({ x: e.clientX, y: e.clientY })
    setHoverShift(null)

  }, [updateCachedRects])

  const endDrag = useCallback((x: number, y: number, shouldDrop: boolean) => {

    const log = draggingLogRef.current

    if (shouldDrop && log) {

      const targetShift = findShiftAt(x, y)

      if (targetShift && targetShift !== log.shift) {
        onDropRef.current(log.id, targetShift)
      }

    }

    setDraggingLog(null)
    setHoverShift(null)
    cachedSlotRects.current = []

  }, [findShiftAt])

  // Este efecto solo se re-suscribe cuando ARRANCA o TERMINA un
  // drag — nunca durante el movimiento, porque pointerPos vive en
  // un estado aparte que este efecto ni lee ni depende.
  useEffect(() => {

    if (!draggingLog) return

    function onMove(e: PointerEvent) {
      setPointerPos({ x: e.clientX, y: e.clientY })
      setHoverShift(findShiftAt(e.clientX, e.clientY))
    }

    function onUp(e: PointerEvent) {
      endDrag(e.clientX, e.clientY, true)
    }

    // Gesto cancelado a mitad de camino (el navegador decide que es
    // un scroll, otra app roba el foco, etc.) — se limpia el estado
    // SIN disparar el drop, a diferencia de onUp.
    function onCancel() {
      endDrag(0, 0, false)
    }

    // Si algo scrollea mientras se arrastra (ej. cerca del borde de
    // la lista, que tiene su propio VerticalScroll), los rects
    // cacheados quedan desactualizados — se recalculan. capture:true
    // porque el scroll real ocurre en un contenedor anidado, no en
    // window, y ese evento no burbujea salvo que se escuche en fase
    // de captura.
    function onScroll() {
      updateCachedRects(draggingLogRef.current?.shift)
    }

    // onMove no llama preventDefault, así que puede ir passive (más
    // performante, no bloquea el scroll del navegador mientras
    // decide qué hacer con el gesto).
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onCancel)
    window.addEventListener("scroll", onScroll, { capture: true, passive: true })

    return () => {
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
        top: pointerPos.y - 18,
        pointerEvents: "none",
        zIndex: 10000,
        transform: "rotate(-2deg)",
      }}
    >

      <div className="flex max-w-64 items-center gap-2.5 rounded-xl bg-neutral-900 px-3 py-2.5 ring-1 ring-white/10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]">

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

        <span className="min-w-0 truncate text-xs font-medium text-neutral-100">
          {draggingLog.activityType.label}
        </span>

      </div>

    </div>

  )

  return {
    beginDrag,
    registerSlot,
    draggingLogId: draggingLog?.id ?? null,
    hoverShift,
    overlay,
  }

}