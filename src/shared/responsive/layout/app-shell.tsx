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

// Antes esto se hacía con clip-path: inset(... round Npx), pero
// clip-path con "round" tiene un bug conocido en navegadores basados
// en Chromium: a zoom de página != 100% el radio se rasteriza mal y
// la curva se ve cuadrada. border-radius no sufre ese bug (el
// navegador lo trata como una propiedad geométrica normal del box,
// no como una máscara rasterizada) y anima igual de bien. El <main>
// ya tiene overflow-hidden, así que el border-radius recorta el
// contenido exactamente como lo hacía el clip-path.
const CURVE_ROUNDED = `${CURVE_RADIUS}px 0px 0px ${CURVE_RADIUS}px`
const CURVE_SQUARE = "0px 0px 0px 0px"

const TRANSITION_TIMING = "300ms cubic-bezier(.22,1,.36,1)"

type ContentTransitionProperty = "margin-left" | "transform"

function buildContentTransitionBase(
  property: ContentTransitionProperty,
) {
  return `${property} ${TRANSITION_TIMING}`
}

function buildContentTransitionWithClip(
  property: ContentTransitionProperty,
) {
  return `${buildContentTransitionBase(property)}, border-radius ${TRANSITION_TIMING}`
}

const SIDEBAR_OPEN_WIDTH = 248
const SIDEBAR_COLLAPSED_WIDTH = 72

function DesktopShell({ children }: Props) {
  const pathname = usePathname()
  const lastVisibleMode = useSidebarStore(state => state.lastVisibleMode)
  const visualState = useSidebarStore(state => state.visualState)
  const notifyContentTransitionEnd = useSidebarStore(
    state => state.notifyContentTransitionEnd,
  )
  const notifyClipTransitionEnd = useSidebarStore(
    state => state.notifyClipTransitionEnd,
  )

  const CONTENT_TRANSITION_BASE = buildContentTransitionBase("margin-left")
  const CONTENT_TRANSITION_WITH_CLIP = buildContentTransitionWithClip("margin-left")

  const borderRadius =
    visualState === "hidden" || visualState === "curve-closing"
      ? CURVE_SQUARE
      : CURVE_ROUNDED

  const contentTransition =
    visualState === "curve-closing"
      ? CONTENT_TRANSITION_WITH_CLIP
      : CONTENT_TRANSITION_BASE

  const targetOffset =
    lastVisibleMode === "open"
      ? SIDEBAR_OPEN_WIDTH
      : SIDEBAR_COLLAPSED_WIDTH

  const offset =
    visualState === "visible" || visualState === "moving-in"
      ? targetOffset
      : 0

  const handleTransitionEnd = (
    event: React.TransitionEvent<HTMLElement>,
  ) => {
    if (event.target !== event.currentTarget) return

    if (event.propertyName === "margin-left") {
      notifyContentTransitionEnd()
      return
    }

    // Fin de FASE 2: la curva terminó de cerrarse.
    if (event.propertyName === "border-radius") {
      notifyClipTransitionEnd()
    }
  }

  return (
    <div className="relative h-screen overflow-hidden bg-[#1d1c1c] text-white">
      <AppSidebar />

      <main
        onTransitionEnd={handleTransitionEnd}
        className="relative z-10 flex h-screen min-w-0 flex-col overflow-hidden bg-[#050505]"
        style={{
          marginLeft: offset,
          borderRadius,
          transition: contentTransition,
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

function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const visualState = useMobileNavStore(s => s.visualState)
  const closeDrawer = useMobileNavStore(s => s.closeDrawer)
  const notifyContentTransitionEnd = useMobileNavStore(s => s.notifyContentTransitionEnd)
  const notifyClipTransitionEnd = useMobileNavStore(s => s.notifyClipTransitionEnd)

  const contentRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const targetOffset = visualState === "visible" || visualState === "moving-in" ? DRAWER_REVEAL_OFFSET : 0

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    let startX = 0
    let startY = 0
    let currentOffset = targetOffset
    let startTime = 0
    let isHorizontalDrag = false
    let isTracking = false

    const handleTouchStart = (e: TouchEvent) => {
      // Solo permitimos arrastre para CERRAR cuando el drawer está completamente abierto
      if (visualState !== "visible") return

      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      startTime = performance.now()
      currentOffset = DRAWER_REVEAL_OFFSET
      isHorizontalDrag = false
      isTracking = true
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - startX
      const deltaY = touch.clientY - startY

      // Lock de dirección inicial para no romper el scroll vertical de la lista
      if (!isHorizontalDrag) {
        if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          isTracking = false // Es un scroll vertical normal
          return
        }
        isHorizontalDrag = true
        setIsDragging(true)
        el.style.transition = "none" // Remueve la animación CSS mientras el dedo está arrastrando
      }

      // Solo permitimos arrastrar hacia la izquierda (cerrar)
      currentOffset = Math.min(DRAWER_REVEAL_OFFSET, Math.max(0, DRAWER_REVEAL_OFFSET + deltaX))
      
      // Mutación DIRECTA al DOM para 120 FPS sin re-renders ni jank de React
      requestAnimationFrame(() => {
        if (el) {
          el.style.transform = `translateX(${currentOffset}px)`
        }
      })

      if (e.cancelable) e.preventDefault()
    }

    const handleTouchEnd = () => {
      if (!isTracking || !isHorizontalDrag) {
        isTracking = false
        return
      }

      isTracking = false
      setIsDragging(false)

      const elapsedTime = performance.now() - startTime
      const deltaX = currentOffset - DRAWER_REVEAL_OFFSET
      const velocityX = deltaX / elapsedTime // px/ms

      // Limpiamos estilos inline para devolver el control al estado de React y CSS
      el.style.transition = ""
      el.style.transform = ""

      // FÍSICAS SENIOR: Se cierra si supera el 50% O si el usuario lanzó un "flick" rápido hacia la izquierda
      const isFlick = velocityX < -0.35
      const isPassedDistance = currentOffset < DRAWER_REVEAL_OFFSET * 0.5

      if (isFlick || isPassedDistance) {
        closeDrawer()
      }
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
    }
  }, [visualState, closeDrawer, targetOffset])

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

      {/* OVERLAY TRANSPARENTE DEDICADO:
          Elimina la intercepción agresiva de onClickCapture en todo el árbol de componentes.
          Cubre únicamente el área cuando el drawer está asentado y visible. */}
      {visualState === "visible" && (
        <div
          aria-hidden="true"
          onClick={closeDrawer}
          className="fixed inset-0 z-20 cursor-pointer bg-transparent"
        />
      )}

      <div
        ref={contentRef}
        onTransitionEnd={handleTransitionEnd}
        className="relative z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#050505]"
        style={{
          transform: `translateX(${targetOffset}px)`,
          borderRadius: visualState === "hidden" || visualState === "curve-closing" ? CURVE_SQUARE : CURVE_ROUNDED,
          transition: isDragging
            ? "none"
            : "transform 300ms cubic-bezier(.22,1,.36,1), border-radius 300ms cubic-bezier(.22,1,.36,1)",
        }}
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

  // Antes de la primera medición real (matchMedia), `isMobile`
  // solo refleja la adivinanza por User-Agent del server — puede
  // estar mal (ventana de desktop angosta, tablet en landscape,
  // etc.), y como Compact/DesktopShell son árboles completamente
  // distintos (sidebar vs. bottom nav), adivinar mal se veía como
  // un parpadeo de todo el shell apenas hidrataba. Se muestra un
  // frame en blanco (mismo fondo, sin contenido) en vez de eso —
  // dura lo mismo que tardaba el salto, pero sin el flash de un
  // layout completo por otro.
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