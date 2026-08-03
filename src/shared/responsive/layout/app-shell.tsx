"use client"

import { useEffect, useRef, type ReactNode } from "react"
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

const DRAWER_REVEAL_OFFSET = 248
// 0.25 es el default real de Vaul (closeThreshold, documentado en su
// fuente como @default 0.25) — no un número mío. Tenía 0.6 antes, más
// del doble de exigente que la referencia: por eso un arrastre chico
// no cerraba aunque fuera una intención clara de cerrar.
const CLOSE_THRESHOLD_RATIO = 0.25
const FLICK_VELOCITY_THRESHOLD = 500 // px/s (motion reporta velocidad en px/s, no px/ms)

// Sin duration/bounce/stiffness/damping propios — motion ya trae sus
// propios valores por defecto documentados en su paquete (no
// inventados por mí, y no hace falta ajustarlos después):
//   - DRAG_RELEASE_SPRING: resorte puro sin config, para cuando SÍ hay
//     un gesto físico real con velocidad detrás (soltar un drag).
//   - PROGRAMMATIC_TRANSITION: tween simple, sin resorte — la misma
//     decisión que toma Vaul (la librería de drawers de shadcn/ui)
//     para el caso sin gesto (botón: hamburguesa/chevron/bottom-nav):
//     ahí no hay velocidad que "heredar", así que ni siquiera hace
//     falta un spring.
// Sin duration/bounce/stiffness/damping propios salvo bounce:0 — que
// no es "un número mío a ajustar", es la garantía documentada de
// motion (cero overshoot posible, ver docs de SpringOptions). El
// resorte "bare" (sin nada) trae stiffness:100/damping:10 por
// default, que da un ratio de amortiguación de 0.5 — bastante
// subamortiguado, rebota de verdad. Ese rebote (pasarse del borde 0 o
// DRAWER_REVEAL_OFFSET) es la causa más probable de que soltar el
// drag a medio camino se viera roto.
const DRAG_RELEASE_SPRING = { type: "spring", bounce: 0 } as const
const PROGRAMMATIC_TRANSITION = { type: "tween" } as const

function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const mode = useMobileNavStore(s => s.mode)
  const closeDrawer = useMobileNavStore(s => s.closeDrawer)

  const x = useMotionValue(0)
  const borderRadius = useTransform(x, [0, DRAWER_REVEAL_OFFSET], [0, CURVE_RADIUS])

  const isOpen = mode === "open"

  // Se pone en true justo antes de un closeDrawer() que YA animó `x`
  // a mano (onDragEnd) — así el efecto de abajo, que reacciona a
  // isOpen, sabe que esta vuelta no le toca animar nada: si lo
  // hiciera igual, terminaríamos con DOS animate() sobre el mismo `x`
  // casi al mismo tiempo (una con resorte, otra con tween), cada una
  // tirando para su lado — eso es lo que se veía "roto" al soltar.
  const selfAnimatedCloseRef = useRef(false)

  // Único lugar que anima `x` cuando el cambio de `mode` viene de
  // AFUERA de un drag (un botón: abrir desde bottom-nav/top-bar,
  // cerrar desde el chevron del header). Sin gesto físico de por
  // medio, así que sin bounce (PROGRAMMATIC_TRANSITION). Durante un
  // drag en curso, motion ya está escribiendo `x` directo por su
  // cuenta — este efecto no compite porque `mode` no cambia hasta
  // soltar.
  useEffect(() => {
    if (selfAnimatedCloseRef.current) {
      selfAnimatedCloseRef.current = false
      return
    }

    const controls = animate(x, isOpen ? DRAWER_REVEAL_OFFSET : 0, PROGRAMMATIC_TRANSITION)
    return () => controls.stop()
  }, [isOpen, x])

  return (
    <div className="relative h-dvh overflow-hidden select-none bg-[#1d1c1c] text-white">
      <SidebarDrawer />

      <motion.div
        drag={isOpen ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: DRAWER_REVEAL_OFFSET }}
        dragElastic={0}
        dragMomentum={false}
        dragTransition={{ power: 0 }}
        onDragEnd={(_event, info) => {
          const currentX = x.get()
          const closeThreshold = DRAWER_REVEAL_OFFSET * CLOSE_THRESHOLD_RATIO
          const isFastFlickLeft = info.velocity.x < -FLICK_VELOCITY_THRESHOLD
          const shouldClose = currentX < closeThreshold || isFastFlickLeft

          // x.stop() antes de animar: por más que dragMomentum esté en
          // false, esto garantiza que no quede ningún control del
          // gesto de drag todavía "vivo" sobre el valor peleando un
          // frame con la animación nueva — nada de handoff implícito.
          x.stop()

          // Acá SÍ hay velocidad real del gesto que motion hereda
          // automáticamente — DRAG_RELEASE_SPRING. Anima explícito acá
          // (no solo vía el efecto de arriba): si NO cierra, `mode`
          // sigue en "open" y el efecto nunca se re-dispara — sin
          // esto, soltar a mitad de camino sin pasar el umbral
          // dejaría el drawer trabado ahí, sin volver a asentarse en
          // el 100% abierto. Si SÍ cierra, marcamos la bandera antes
          // de closeDrawer() para que el efecto no vuelva a animar lo
          // que esta llamada ya está animando.
          animate(x, shouldClose ? 0 : DRAWER_REVEAL_OFFSET, DRAG_RELEASE_SPRING)
          if (shouldClose) {
            selfAnimatedCloseRef.current = true
            closeDrawer()
          }
        }}
        style={{ x, borderRadius }}
        className="absolute inset-0 z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#050505]"
      >
        {/*
          pointer-events-none + inert acá adentro, NO en el motion.div
          de afuera: ese necesita seguir recibiendo el gesto de drag
          normalmente. pointer-events-none en un descendiente no
          bloquea el bubbling hacia el ancestro (el hit-test salta a
          lo que esté detrás, pero el evento sigue subiendo por la
          cadena real del DOM), así que el drag sigue andando.

          Esto reemplaza el onClickCapture de antes: ese solo
          interceptaba clicks — con el drawer abierto, el contenido
          desplazado seguía siendo hoverable, tabbable por teclado, y
          reaccionaba a cualquier otra interacción que no fuera
          literalmente un click. pointer-events-none bloquea TODA
          interacción de puntero, inert además lo saca del foco por
          teclado y del árbol de accesibilidad — el estándar real que
          usan los drawers premium, no un parche por tipo de evento.
        */}
        <div
          inert={isOpen}
          className={cn("flex h-full min-h-0 min-w-0 flex-1 flex-col", isOpen && "pointer-events-none")}
        >
          <TopBar />
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