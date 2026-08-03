"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion, useMotionValue, animate } from "motion/react"

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

const DRAWER_REVEAL_OFFSET = 248
const CLOSE_THRESHOLD_RATIO = 0.4 // Umbral más natural tipo iOS (40%)
const FLICK_VELOCITY_THRESHOLD = 400

// Curva de desaceleración estándar de iOS (cubic-bezier suave sin rebotes)
const IOS_EASING = [0.32, 0.72, 0, 1] as const

const IOS_SPRING_TRANSITION = {
  type: "tween",
  duration: 0.28,
  ease: IOS_EASING,
} as const

export function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const mode = useMobileNavStore((s) => s.mode)
  const closeDrawer = useMobileNavStore((s) => s.closeDrawer)

  const x = useMotionValue(0)
  const isOpen = mode === "open"
  const isDraggingRef = useRef(false)

  // Control programático (Botones: Hamburguesa / Chevron / Click fuera)
  useEffect(() => {
    // Si el cambio viene de un gesto activo de arrastre, ignoramos la sincronización programática
    if (isDraggingRef.current) return

    const targetX = isOpen ? DRAWER_REVEAL_OFFSET : 0
    const controls = animate(x, targetX, IOS_SPRING_TRANSITION)

    return () => controls.stop()
  }, [isOpen, x])

  return (
    <div className="relative h-dvh overflow-hidden select-none bg-[#1d1c1c] text-white">
      <SidebarDrawer />

      <motion.div
        drag={isOpen ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: DRAWER_REVEAL_OFFSET }}
        dragElastic={0} // Sin resistencia o resorte artificial durante el arrastre
        dragMomentum={false} // Desactivar el momentum por defecto para controlarlo de forma fluida
        onDragStart={() => {
          isDraggingRef.current = true
        }}
        onDragEnd={async (_event, info) => {
          const currentX = x.get()
          const velocityX = info.velocity.x

          // Proyección estilo iOS: estimamos dónde terminaría la tarjeta según la velocidad de la mano
          const projectedX = currentX + velocityX * 0.12

          const isFlickLeft = velocityX < -FLICK_VELOCITY_THRESHOLD
          const isFlickRight = velocityX > FLICK_VELOCITY_THRESHOLD
          
          let shouldClose = false

          if (isFlickLeft) {
            shouldClose = true
          } else if (isFlickRight) {
            shouldClose = false
          } else {
            // Evaluamos por proyección física + umbral relativo
            shouldClose = projectedX < DRAWER_REVEAL_OFFSET * CLOSE_THRESHOLD_RATIO
          }

          x.stop()

          if (shouldClose) {
            // Transición fluida a 0 y posterior actualización del store
            await animate(x, 0, IOS_SPRING_TRANSITION)
            closeDrawer()
          } else {
            // Mantener abierto suavemente
            animate(x, DRAWER_REVEAL_OFFSET, IOS_SPRING_TRANSITION)
          }

          isDraggingRef.current = false
        }}
        style={{ x, touchAction: "pan-y" }}
        className="absolute inset-0 z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-l-[28px] bg-[#050505] will-change-transform"
      >
        <TopBar />
        <div
          inert={isOpen}
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            isOpen && "pointer-events-none select-none"
          )}
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

