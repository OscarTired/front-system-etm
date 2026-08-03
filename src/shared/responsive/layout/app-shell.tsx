// app-shell.tsx
"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion, useMotionValue, useTransform, animate } from "motion/react"

import { AppSidebar } from "./app-sidebar"
import { SidebarShowButton } from "./sidebar/sidebar-show-button"
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
const FLICK_VELOCITY_THRESHOLD = 500 // px/s (motion reporta velocidad en px/s, no px/ms)

// duration + bounce, NO stiffness/damping/mass a mano: con esos tres
// hay que calcular el ratio de amortiguación (damping / 2√(stiffness·mass))
// para saber si rebota o no — eso fue lo que salió mal la vez pasada:
// eran números elegidos "a sentimiento", con un comentario afirmando
// "casi sin rebote" que nunca se verificó con la fórmula.
//
// bounce está documentado así en motion: 0 = sin rebote (garantizado
// por la librería, no aproximado por mí), 1 = muy rebotón. duration
// es el tiempo total en segundos. Esto es intención explícita, no
// constantes de física reverse-engineered.
const DRAWER_SPRING = { type: "spring", duration: 0.3, bounce: 0 } as const

function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const mode = useMobileNavStore(s => s.mode)
  const closeDrawer = useMobileNavStore(s => s.closeDrawer)

  const x = useMotionValue(0)
  const borderRadius = useTransform(x, [0, DRAWER_REVEAL_OFFSET], [0, CURVE_RADIUS])

  const isOpen = mode === "open"

  // Único lugar que anima `x` cuando el cambio de `mode` viene de
  // AFUERA de un drag (un botón: abrir desde bottom-nav/top-bar,
  // cerrar desde el chevron del header). Durante un drag en curso,
  // motion ya está escribiendo `x` directo por su cuenta — este
  // efecto no compite porque `mode` no cambia hasta soltar.
  useEffect(() => {
    const controls = animate(x, isOpen ? DRAWER_REVEAL_OFFSET : 0, DRAWER_SPRING)
    return () => controls.stop()
  }, [isOpen, x])

  return (
    <div className="relative h-dvh overflow-hidden select-none bg-[#1d1c1c] text-white">
      <SidebarDrawer />

      <motion.div
        drag={isOpen ? "x" : false}
        dragConstraints={{ left: 0, right: DRAWER_REVEAL_OFFSET }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={(_event, info) => {
          const currentX = x.get()
          const closeThreshold = DRAWER_REVEAL_OFFSET * CLOSE_THRESHOLD_RATIO
          const isFastFlickLeft = info.velocity.x < -FLICK_VELOCITY_THRESHOLD
          const shouldClose = currentX < closeThreshold || isFastFlickLeft

          // Anima explícito acá (no solo vía el efecto de arriba):
          // si NO cierra, `mode` sigue en "open" y el efecto nunca se
          // re-dispara — sin esto, soltar a mitad de camino sin pasar
          // el umbral dejaría el drawer trabado ahí, sin volver a
          // asentarse en el 100% abierto.
          animate(x, shouldClose ? 0 : DRAWER_REVEAL_OFFSET, DRAWER_SPRING)
          if (shouldClose) closeDrawer()
        }}
        style={{ x, borderRadius }}
        className="absolute inset-0 z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#050505]"
        onClick={() => {
          if (isOpen) closeDrawer()
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
      </motion.div>
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