"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion, useMotionValue, animate } from "motion/react"

import { AppSidebar } from "./app-sidebar"
import { SidebarShowButton } from "./sidebar/sidebar-show-button"
import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"
import { SidebarDrawer } from "@/shared/responsive/mobile/sidebar-drawer"
import { TopBar } from "@/shared/responsive/mobile/top-bar"
import { BottomNavigation } from "../mobile/bottom-navigation"
import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"
import { PullToRefresh } from "../mobile/pull-to-refresh"
import { cn } from "@/shared/utils/utils"

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

// Cuánto se revela del sidebar (ancho real del <aside> en modo
// drawer, w-62 = 248px — ver app-sidebar.tsx).
const DRAWER_REVEAL_OFFSET = 248
const CLOSE_THRESHOLD_RATIO = 0.25
const FLICK_VELOCITY_THRESHOLD = 500

// El contenido viaja 28px MÁS de lo que en verdad se revela — ver
// comentario grande más abajo sobre por qué.
const CONTENT_TRAVEL = DRAWER_REVEAL_OFFSET + CURVE_RADIUS

const SHELL_SPRING_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
} as const

function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const mode = useMobileNavStore(s => s.mode)
  const closeDrawer = useMobileNavStore(s => s.closeDrawer)
  const openDrawer = useMobileNavStore(s => s.openDrawer)

  const isOpen = mode === "open"
  const x = useMotionValue(0)
  const selfAnimatedRef = useRef(false)

  // NO uso el prop declarativo `animate={{x: isOpen ? ...}}` — es un
  // patrón con un bug documentado en el propio repo de motion (issue
  // #697): `onDragEnd` cambia `mode`, React tiene que re-renderizar
  // para que el prop declarativo se entere, y en esa ventana nada
  // controla `x`. `animate()` imperativo, directo acá abajo y en
  // onDragEnd, no espera ningún ciclo de React.
  useEffect(() => {
    if (selfAnimatedRef.current) {
      selfAnimatedRef.current = false
      return
    }

    const controls = animate(x, isOpen ? CONTENT_TRAVEL : 0, SHELL_SPRING_TRANSITION)
    return () => controls.stop()
  }, [isOpen, x])

  return (
    <div className="relative h-dvh overflow-hidden select-none bg-[#1d1c1c] text-white">
      <SidebarDrawer />

      <motion.div
        drag={isOpen ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: CONTENT_TRAVEL }}
        dragElastic={{ left: 0, right: 0.1 }}
        dragMomentum={false}
        onDragEnd={(_event, info) => {
          const currentX = x.get()
          const closeThreshold = CONTENT_TRAVEL * CLOSE_THRESHOLD_RATIO
          const isFastFlickLeft = info.velocity.x < -FLICK_VELOCITY_THRESHOLD
          const isFastFlickRight = info.velocity.x > FLICK_VELOCITY_THRESHOLD
          const shouldClose = isFastFlickLeft || (!isFastFlickRight && currentX < closeThreshold)

          x.stop()
          animate(x, shouldClose ? 0 : CONTENT_TRAVEL, SHELL_SPRING_TRANSITION)

          selfAnimatedRef.current = true
          if (shouldClose) closeDrawer()
          else openDrawer()
        }}
        style={{ x, touchAction: "pan-y" }}
        // will-change solo en transform — border-radius YA NO se
        // anima, es una clase fija, así que no hace falta promover
        // capa para esa propiedad tampoco.
        className="absolute -left-7 top-0 h-full w-[calc(100%+28px)] z-10 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-l-[28px] bg-[#050505] will-change-transform"
      >
        {/*
          El truco: el contenido es 28px (CURVE_RADIUS) más ANCHO que
          la pantalla, arrancando 28px a la izquierda del borde real
          (-left-7 = -28px), con la esquina redondeada puesta ACÁ,
          fija, permanente — nunca animada por JS.

          Cerrado (x=0): la esquina redondeada queda físicamente fuera
          de la pantalla (en -28px), y el `overflow-hidden` del
          contenedor de afuera se la come — se ve perfectamente
          cuadrado, como un borde de pantalla normal.

          Al abrir, el contenido viaja CONTENT_TRAVEL (248+28=276px)
          en vez de 248 — esos 28px de más son exactamente lo que hace
          falta para que la esquina, que arrancó escondida a -28,
          termine visible en +248 (el punto real donde el sidebar de
          atrás mide 248px de ancho). El resultado: se revela
          exactamente 248px de sidebar, ni más ni menos, con la
          esquina redondeada asomando en el momento justo.

          Toda la animación — abrir, cerrar, revelar la curva — corre
          sobre UNA sola propiedad: transform. Nada de border-radius
          cambiando por JS, nada que sincronizar entre dos valores,
          nada que repintar en cada frame del drag. El navegador solo
          composita, no repinta — la clase de bug de rendimiento que
          venía persiguiendo (el willChange de la sesión anterior, el
          "se pierde el llenado") deja de poder existir porque ya no
          hay ninguna propiedad cara animándose.
        */}
        <TopBar />
        <div
          inert={isOpen}
          className={cn("flex min-h-0 flex-1 flex-col", isOpen && "pointer-events-none")}
        >
          <PullToRefresh>
            <VerticalScroll
              key={pathname}
              containerClassName="h-full"
              className="overflow-x-hidden pt-14 pb-20"
              arrowTopOffset={64}
              arrowBottomOffset={88}
            >
              {children}
            </VerticalScroll>
          </PullToRefresh>
          <BottomNavigation />
        </div>
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
