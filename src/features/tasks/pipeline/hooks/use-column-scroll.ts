"use client"

import {
  useEffect,
  useRef,
} from "react"

const DRAG_THRESHOLD = 4
const DRAG_SPEED = 1

export function useColumnScroll() {

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {

    const el = ref.current

    if (!el) {
      return
    }

    // --- Rueda ---
    const handleWheel = (event: WheelEvent) => {

      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return
      }

      const goingDown = event.deltaY > 0

      const atBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 1

      const atTop =
        el.scrollTop === 0

      if (goingDown && !atBottom) {

        event.preventDefault()
        event.stopImmediatePropagation()
        el.scrollTop += event.deltaY

        return

      }

      if (!goingDown && !atTop) {

        event.preventDefault()
        event.stopImmediatePropagation()
        el.scrollTop += event.deltaY

        return

      }

    }

    // --- Drag mouse ---
    let isDragging = false
    let dragged = false
    let startY = 0
    let startScrollTop = 0
    let suppressClick = false

    const handleMouseDown = (event: MouseEvent) => {

      isDragging = true
      dragged = false
      startY = event.clientY
      startScrollTop = el.scrollTop

      document.body.style.userSelect = "none"
      document.body.style.cursor = "grabbing"

    }

    const handleMouseMove = (event: MouseEvent) => {

      if (!isDragging) {
        return
      }

      const deltaY = event.clientY - startY

      if (Math.abs(deltaY) > DRAG_THRESHOLD) {

        dragged = true

        el.scrollTop = startScrollTop - deltaY * DRAG_SPEED

      }

    }

    const handleMouseUp = () => {

      if (dragged) {

        // Suprimimos el click que el browser dispara
        // después de un drag para que no abra la tarjeta.
        suppressClick = true

        window.setTimeout(() => {
          suppressClick = false
        }, 100)

      }

      isDragging = false
      dragged = false

      document.body.style.removeProperty("user-select")
      document.body.style.removeProperty("cursor")

    }

    const handleMouseLeave = () => {

      isDragging = false
      dragged = false

      document.body.style.removeProperty("user-select")
      document.body.style.removeProperty("cursor")

    }

    // Capturamos el click antes de que llegue a la tarjeta
    const handleClickCapture = (event: MouseEvent) => {

      if (suppressClick) {

        event.preventDefault()
        event.stopPropagation()

      }

    }

    // --- Touch ---
    let touchStartY = 0
    let touchStartScrollTop = 0

    const handleTouchStart = (event: TouchEvent) => {

      touchStartY = event.touches[0].clientY
      touchStartScrollTop = el.scrollTop

    }

    const handleTouchMove = (event: TouchEvent) => {

      const deltaY = event.touches[0].clientY - touchStartY

      const atBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 1

      const atTop =
        el.scrollTop === 0

      const goingDown = deltaY < 0

      if (goingDown && !atBottom) {

        event.preventDefault()
        el.scrollTop = touchStartScrollTop - deltaY

        return

      }

      if (!goingDown && !atTop) {

        event.preventDefault()
        el.scrollTop = touchStartScrollTop - deltaY

        return

      }

    }

    el.addEventListener("wheel", handleWheel, { passive: false })
    el.addEventListener("mousedown", handleMouseDown)
    el.addEventListener("mousemove", handleMouseMove)
    el.addEventListener("mouseup", handleMouseUp)
    el.addEventListener("mouseleave", handleMouseLeave)
    el.addEventListener("click", handleClickCapture, { capture: true })
    el.addEventListener("touchstart", handleTouchStart, { passive: true })
    el.addEventListener("touchmove", handleTouchMove, { passive: false })

    window.addEventListener("mouseup", handleMouseUp)

    return () => {

      el.removeEventListener("wheel", handleWheel)
      el.removeEventListener("mousedown", handleMouseDown)
      el.removeEventListener("mousemove", handleMouseMove)
      el.removeEventListener("mouseup", handleMouseUp)
      el.removeEventListener("mouseleave", handleMouseLeave)
      el.removeEventListener("click", handleClickCapture, { capture: true })
      el.removeEventListener("touchstart", handleTouchStart)
      el.removeEventListener("touchmove", handleTouchMove)

      window.removeEventListener("mouseup", handleMouseUp)

    }

  }, [])

  return ref

}