"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, PanelLeftClose, EyeOff } from "lucide-react"

import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"
import { ThemeToggle, chromeIconButtonClass } from "@/shared/theme/theme-toggle"
import { cn } from "@/shared/utils/utils"

type Props = {
  collapsed: boolean
  isDrawer?: boolean
}

const HEADER_BOX_HEIGHT = 150

export function SidebarHeader({ collapsed, isDrawer = false }: Props) {
  const [isMounting, setIsMounting] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsMounting(false), 700)
    return () => clearTimeout(timer)
  }, [])

  const toggleCollapsed = useSidebarStore(state => state.toggleCollapsed)
  const toggleClosed = useSidebarStore(state => state.toggleClosed)
  const closeDrawer = useMobileNavStore(state => state.closeDrawer)

  const handleClose = isDrawer ? closeDrawer : toggleClosed

  const headerWrapperClass = cn(
    "px-3 pb-3 pt-4 w-full",
    isMounting && "animate-gemini-in opacity-0",
  )

  const renderLogo = () => (
    <div className="relative flex h-9 w-9 items-center justify-center">
      <Image
        src="/icon.svg"
        alt="ETM SAC"
        fill
        priority
        draggable={false}
        className="select-none object-contain"
      />
    </div>
  )

  if (isDrawer) {
    return (
      <div
        className={cn(
          "w-full px-4 pb-4 pt-5",
          isMounting && "animate-gemini-in opacity-0",
        )}
      >
        <div className="grid grid-cols-[32px_1fr_32px] items-center">
          <ThemeToggle variant="icon" />
          <div className="flex flex-col items-center">
            {renderLogo()}
            <h1 className="mt-2 text-sm font-semibold text-blue-700 dark:text-amber-300">
              COMPANY S.A.C.
            </h1>
          </div>

          <button
            type="button"
            onClick={handleClose}
            title="Cerrar"
            className={cn(chromeIconButtonClass, "size-8")}
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={headerWrapperClass}
      style={isMounting ? { animationDelay: "60ms" } : undefined}
    >
      <div
        className="relative flex w-full items-center justify-center"
        style={{ height: HEADER_BOX_HEIGHT }}
      >
        {collapsed ? (
          <div className="flex h-full w-full flex-col items-center justify-between rounded-2xl bg-linear-to-b from-foreground/5 to-foreground/5 px-2 py-3">
            {renderLogo()}

            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Expandir"
                className={cn(chromeIconButtonClass, "size-8")}
              >
                <PanelLeftClose size={15} className="rotate-180" />
              </button>

              <button
                type="button"
                onClick={handleClose}
                title="Ocultar barra lateral"
                className={cn(chromeIconButtonClass, "size-8")}
              >
                {isDrawer ? <ChevronLeft size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex h-full w-full flex-col items-center justify-between rounded-2xl bg-linear-to-b from-foreground/5 to-foreground/5 px-4 py-3">
            {renderLogo()}

            <div className="flex flex-col items-center">
              <h1 className="whitespace-nowrap text-[11px] font-semibold tracking-[0.16em] text-blue-700 dark:text-amber-300">
                COMPANY S.A.C.
              </h1>
              <p className="mt-0.5 whitespace-nowrap text-[9px] tracking-[0.12em] text-blue-600/80 dark:text-amber-300/80">
                ERP INDUSTRIAL
              </p>
            </div>

            <div className="flex items-center gap-1">
              <ThemeToggle variant="icon" />
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Comprimir"
                className={cn(chromeIconButtonClass, "size-8")}
              >
                <PanelLeftClose size={15} />
              </button>

              <button
                type="button"
                onClick={handleClose}
                title="Ocultar barra lateral"
                className={cn(chromeIconButtonClass, "size-8")}
              >
                {isDrawer ? <ChevronLeft size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
