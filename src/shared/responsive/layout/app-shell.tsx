"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion, useMotionValue, useTransform, animate } from "motion/react"

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
const CLOSE_THRESHOLD_RATIO = 0.35
const FLICK_VELOCITY_THRESHOLD = 350

// Curva de aceleración exacta de iOS (Apple System Curve)
const IOS_TRANSITION = {
  type: "tween",
  duration: 0.28,
  ease: [0.32, 0.72, 0, 1],
} as const

export function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const mode = useMobileNavStore((s) => s.mode)
  const closeDrawer = useMobileNavStore((s) => s.closeDrawer)

  // 1. Motion Value primario en GPU
  const x = useMotionValue(0)
  const isOpen = mode === "open"
  const isDraggingRef = useRef(false)

  // 2. Transformaciones reactivas sincronizadas fuera de React (sin re-renders)
  const backdropOpacity = useTransform(
    x,
    [0, DRAWER_REVEAL_OFFSET],
    [0, 0.45]
  )
  const shadowOpacity = useTransform(
    x,
    [0, DRAWER_REVEAL_OFFSET],
    [0, 0.25]
  )

  // Sincronización programática cuando el estado cambia desde botones externos
  useEffect(() => {
    if (isDraggingRef.current) return

    const targetX = isOpen ? DRAWER_REVEAL_OFFSET : 0
    const controls = animate(x, targetX, IOS_TRANSITION)

    return () => controls.stop()
  }, [isOpen, x])

  return (
    <div className="relative h-dvh w-full overflow-hidden select-none bg-[#1d1c1c] text-white">
      {/* Drawer inferior */}
      <SidebarDrawer />

      {/* Backdrop oscuro dinámico controlado por GPU */}
      <motion.div
        style={{ opacity: backdropOpacity }}
        onClick={closeDrawer}
        className={cn(
          "fixed inset-0 z-10 bg-black pointer-events-none transition-pointer-events",
          isOpen && "pointer-events-auto"
        )}
      />

      {/* Tarjeta Principal Desplazable */}
      <motion.div
        drag={isOpen ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: DRAWER_REVEAL_OFFSET }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={() => {
          isDraggingRef.current = true
        }}
        onDragEnd={async (_event, info) => {
          const currentX = x.get()
          const velocityX = info.velocity.x

          // Proyección de inercia para detectar la intención real del gesto
          const projectedX = currentX + velocityX * 0.1
          const isFlickLeft = velocityX < -FLICK_VELOCITY_THRESHOLD
          const isFlickRight = velocityX > FLICK_VELOCITY_THRESHOLD

          let shouldClose = false

          if (isFlickLeft) {
            shouldClose = true
          } else if (isFlickRight) {
            shouldClose = false
          } else {
            shouldClose = projectedX < DRAWER_REVEAL_OFFSET * CLOSE_THRESHOLD_RATIO
          }

          x.stop()

          if (shouldClose) {
            await animate(x, 0, IOS_TRANSITION)
            closeDrawer()
          } else {
            animate(x, DRAWER_REVEAL_OFFSET, IOS_TRANSITION)
          }

          isDraggingRef.current = false
        }}
        style={{
          x,
          touchAction: "pan-y",
          // 3. Forzar composición GPU y aislar layout rendering
          willChange: "transform",
          transformTemplate: ({ x }: { x: string | number }) =>
            `translate3d(${typeof x === "number" ? `${x}px` : x}, 0, 0)`,
        }}
        className="absolute inset-0 z-20 flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-l-[28px] bg-[#050505] shadow-2xl"
      >
        {/* Sombra proyectada dinámicamente según apertura */}
        <motion.div
          style={{ opacity: shadowOpacity }}
          className="pointer-events-none absolute -left-8 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-black/80"
        />

        <TopBar />

        {/* Contenedor optimizado mediante CSS isolation */}
        <div
          inert={isOpen}
          style={{ contain: "strict" }} // Evita reflows pesados del DOM interior mientras se arrastra
          className={cn(
            "flex min-h-0 flex-1 flex-col transition-opacity duration-200",
            isOpen && "pointer-events-none select-none opacity-90"
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
