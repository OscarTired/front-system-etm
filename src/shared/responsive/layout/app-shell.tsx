// app-shell.tsx
"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"

import { AppSidebar } from "./app-sidebar"
import { SidebarShowButton } from "./sidebar-show-button"
import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"
import { SidebarDrawer } from "@/shared/responsive/mobile/sidebar-drawer"
import { TopBar } from "@/shared/responsive/mobile/top-bar"
import { BottomNavigation } from "../mobile/bottom-navigation"
import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"

type Props = {
  children: ReactNode
}

function DesktopTopBar() {
  return (
    <div className="flex h-12 shrink-0 items-center px-3">
      <SidebarShowButton />
    </div>
  )
}

const CURVE_RADIUS = 28
const CURVE_ROUNDED = `${CURVE_RADIUS}px 0px 0px ${CURVE_RADIUS}px`
const CURVE_SQUARE = "0px 0px 0px 0px"

const TRANSITION_TIMING = "300ms cubic-bezier(.22,1,.36,1)"

function DesktopShell({ children }: Props) {
  const pathname = usePathname()
  const visualState = useSidebarStore(state => state.visualState)
  const notifyClipTransitionEnd = useSidebarStore(
    state => state.notifyClipTransitionEnd,
  )

  const borderRadius =
    visualState === "hidden" || visualState === "curve-closing"
      ? CURVE_SQUARE
      : CURVE_ROUNDED

  // Así es como lo resuelven las apps grandes (VS Code, Slack,
  // Notion...): sidebar y contenido son HERMANOS REALES de flexbox,
  // no un div posicionado con "left"/transform simulando el empuje
  // a mano. AppSidebar ya anima su propio `width` con una
  // transición de CSS normal (ver app-sidebar.tsx) — main acá
  // abajo es simplemente flex-1, así que el navegador recalcula su
  // ancho SOLO, en cada frame de ESA MISMA animación, sin que este
  // componente necesite rastrear ningún offset ni estado propio.
  // El contenido de adentro (lo que antes se veía "empujado sin
  // acomodarse" o "deformándose") ahora se reacomoda de la forma
  // más simple y correcta que existe: dejando que sea flexbox el
  // que decide el ancho, no un cálculo manual en JS tratando de
  // imitarlo.
  const handleTransitionEnd = (
    event: React.TransitionEvent<HTMLElement>,
  ) => {
    if (event.target !== event.currentTarget) return

    if (event.propertyName === "border-radius") {
      notifyClipTransitionEnd()
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#1d1c1c] text-white">
      <AppSidebar />

      <main
        onTransitionEnd={handleTransitionEnd}
        className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#050505] will-change-[border-radius]"
        style={{
          borderRadius,
          transition: `border-radius ${TRANSITION_TIMING}`,
        }}
      >
        <DesktopTopBar />
        <div key={pathname} className="hide-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

const DRAWER_REVEAL_OFFSET = 248
const CLOSE_THRESHOLD_RATIO = 0.6
const DIRECTION_LOCK_THRESHOLD = 6
const FLICK_VELOCITY_THRESHOLD = 0.5

function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const visualState = useMobileNavStore(s => s.visualState)
  const closeDrawer = useMobileNavStore(s => s.closeDrawer)
  const notifyContentTransitionEnd = useMobileNavStore(s => s.notifyContentTransitionEnd)
  const notifyClipTransitionEnd = useMobileNavStore(s => s.notifyClipTransitionEnd)

  const targetOffset = DRAWER_REVEAL_OFFSET
  const stateOffset = visualState === "visible" || visualState === "moving-in" ? targetOffset : 0

  const contentRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const pendingOffsetRef = useRef<number | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const suppressClickRef = useRef(false)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    let drag: {
      startX: number
      startY: number
      direction: "horizontal" | "vertical" | null
      dragged: boolean
      lastX: number
      lastTime: number
      velocityX: number
    } | null = null

    const writeTransform = (offset: number) => {
      pendingOffsetRef.current = offset
      if (rafIdRef.current !== null) return

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        if (pendingOffsetRef.current !== null && contentRef.current) {
          contentRef.current.style.transform = `translate3d(${pendingOffsetRef.current}px, 0, 0)`
        }
      })
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (visualState !== "visible") return

      const touch = event.touches[0]
      const now = performance.now()

      drag = {
        startX: touch.clientX,
        startY: touch.clientY,
        direction: null,
        dragged: false,
        lastX: touch.clientX,
        lastTime: now,
        velocityX: 0,
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!drag) return

      const touch = event.touches[0]
      const now = performance.now()
      const deltaX = touch.clientX - drag.startX
      const deltaY = touch.clientY - drag.startY

      if (drag.direction === null) {
        if (
          Math.abs(deltaX) < DIRECTION_LOCK_THRESHOLD &&
          Math.abs(deltaY) < DIRECTION_LOCK_THRESHOLD
        ) {
          return
        }

        drag.direction =
          Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical"

        if (drag.direction === "vertical") {
          drag = null
          return
        }

        setIsDragging(true)
      }

      const dt = now - drag.lastTime
      if (dt > 0) {
        drag.velocityX = (touch.clientX - drag.lastX) / dt
      }

      drag.lastX = touch.clientX
      drag.lastTime = now

      const nextOffset = Math.min(
        DRAWER_REVEAL_OFFSET,
        Math.max(0, DRAWER_REVEAL_OFFSET + deltaX),
      )

      drag.dragged = true
      writeTransform(nextOffset)
      event.preventDefault()
    }

    const handleTouchEnd = () => {
      if (!drag || !drag.dragged) {
        drag = null
        return
      }

      const finalOffset = pendingOffsetRef.current ?? DRAWER_REVEAL_OFFSET
      const closeThreshold = DRAWER_REVEAL_OFFSET * CLOSE_THRESHOLD_RATIO
      const isFastFlickLeft = drag.velocityX < -FLICK_VELOCITY_THRESHOLD

      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 300)

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }

      pendingOffsetRef.current = null
      setIsDragging(false)

      if (finalOffset < closeThreshold || isFastFlickLeft) {
        closeDrawer()
      }

      drag = null
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true })
    el.addEventListener("touchmove", handleTouchMove, { passive: false })
    el.addEventListener("touchend", handleTouchEnd, { passive: true })
    el.addEventListener("touchcancel", handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener("touchstart", handleTouchStart)
      el.removeEventListener("touchmove", handleTouchMove)
      el.removeEventListener("touchend", handleTouchEnd)
      el.removeEventListener("touchcancel", handleTouchEnd)

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [visualState, closeDrawer])

  const offset = isDragging ? undefined : stateOffset

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    
    if (event.propertyName === "transform") {
      notifyContentTransitionEnd()
    } else if (event.propertyName === "border-radius") {
      notifyClipTransitionEnd()
    }
  }

  return (
    <div className="relative h-dvh overflow-hidden select-none bg-[#1d1c1c] text-white">
      <SidebarDrawer />
      <div
        ref={contentRef}
        onTransitionEnd={handleTransitionEnd}
        className="absolute inset-0 z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#050505]"
        style={{
          ...(offset !== undefined ? { transform: `translate3d(${offset}px, 0, 0)` } : {}),
          borderRadius: visualState === "hidden" || visualState === "curve-closing" ? CURVE_SQUARE : CURVE_ROUNDED,
          willChange: isDragging ? "transform" : "auto",
          transition: isDragging
            ? "none"
            : "transform 300ms cubic-bezier(.22,1,.36,1), border-radius 300ms cubic-bezier(.22,1,.36,1)",
        }}
        onClickCapture={
          visualState === "visible"
            ? (event) => {
                event.preventDefault()
                event.stopPropagation()

                if (suppressClickRef.current) {
                  suppressClickRef.current = false
                  return
                }

                closeDrawer()
              }
            : undefined
        }
      >
        <TopBar />
        <VerticalScroll
          key={pathname}
          containerClassName="h-full"
          className="overflow-x-hidden pt-14 pb-20"
          arrowTopOffset={64}
          arrowBottomOffset={88}
        >
          {children}
        </VerticalScroll>
        <BottomNavigation />
      </div>
    </div>
  )
}

export function AppShell({ children }: Props) {
  const { isMobile, ready } = useResponsive()

  if (!ready) {
    return <div className="h-full bg-[#050505]" />
  }

  if (isMobile) {
    return (
      <CompactShell>
        {children}
      </CompactShell>
    )
  }

  return (
    <DesktopShell>
      {children}
    </DesktopShell>
  )
}