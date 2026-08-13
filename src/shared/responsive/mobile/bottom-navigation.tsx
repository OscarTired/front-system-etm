"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"

import { cn } from "@/shared/utils/utils"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"
import { BOTTOM_NAV_ITEMS } from "@/shared/responsive/navigation/bottom-nav-items"

/**
 * Tab bar flotante (patrón Instagram):
 * - no recorta el contenido del shell
 * - el listado scrollea detrás con blur
 * - fade superior suaviza el cruce contenido ? nav
 */
export function BottomNavigation() {
  const pathname = usePathname()
  const openDrawer = useMobileNavStore(s => s.openDrawer)

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Blur progresivo (mismo patrón que iOS/Instagram): el
          backdrop-blur y el oscurecido arrancan en 0% arriba del
          todo y llegan a 100% recién cerca de la nav — antes esto
          era una caja plana (blur al 100% desde su borde de
          arriba), por eso se veía como un corte duro en vez de un
          desvanecimiento. mask-image hace que el EFECTO del blur en
          sí se desvanezca, no solo el color de fondo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 backdrop-blur-xl"
        style={{
          maskImage: "linear-gradient(to top, black 40%, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black 40%, transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-background/60"
        style={{
          maskImage: "linear-gradient(to top, black 30%, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black 30%, transparent)",
        }}
      />

      <div className="pointer-events-auto relative px-3 pb-1">
        <nav className="flex items-stretch gap-1 rounded-full bg-foreground/10 px-1.5 py-1.5 shadow-lg shadow-black/30 ring-1 ring-border backdrop-blur-xl">
          {BOTTOM_NAV_ITEMS.map(item => {
            const isActive =
              item.action.type === "link" &&
              (Array.isArray(item.matchPrefix)
                ? item.matchPrefix.some(prefix =>
                    pathname.startsWith(prefix),
                  )
                : pathname.startsWith(item.matchPrefix))

            const Icon = item.icon

            const content = (
              <div className="relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold select-none">
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active-chip"
                    className="pointer-events-none absolute inset-0 rounded-full bg-white/12 will-change-transform"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}

                <div
                  className={cn(
                    "relative z-10 flex transform-gpu flex-col items-center gap-0.5 transition-colors duration-150",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <div className="flex h-5 w-5 items-center justify-center">
                    <Icon
                      size={19}
                      strokeWidth={isActive ? 2.4 : 2}
                      className="shrink-0 transition-all"
                    />
                  </div>
                  <span className="leading-none">{item.label}</span>
                </div>
              </div>
            )

            if (item.action.type === "sidebar") {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={openDrawer}
                  className="flex flex-1"
                  aria-label={item.label}
                >
                  {content}
                </button>
              )
            }

            return (
              <Link
                key={item.label}
                href={item.action.href}
                className="flex flex-1"
                aria-label={item.label}
              >
                {content}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}