"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, PanelLeftClose, EyeOff } from "lucide-react"

import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"
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
    isMounting && "animate-gemini-in opacity-0"
  )

  if (isDrawer) {
    return (
      <div className={cn("px-4 pb-4 pt-5 w-full", isMounting && "animate-gemini-in opacity-0")}>
        <div className="grid grid-cols-[32px_1fr_32px] items-center">
          <div />
          <div className="flex flex-col items-center">
            <div className="relative h-12 w-12">
              <Image
                src="/icon.svg"
                alt="ETM SAC"
                fill
                priority
                draggable={false}
                className="select-none object-contain"
              />
            </div>
            <h1 className="mt-2 text-sm font-semibold text-white">
              COMPANY S.A.C.
            </h1>
          </div>

          <button
            onClick={handleClose}
            title="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors duration-200 hover:bg-white/5 hover:text-white"
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
        className="relative flex items-center justify-center w-full"
        style={{ height: HEADER_BOX_HEIGHT }}
      >
        {collapsed ? (
          <div className="flex flex-col items-center w-full rounded-2xl bg-linear-to-b from-white/5 to-white/2.5 px-2 py-4">
            <div className="relative h-9 w-9">
              <Image
                src="/icon.svg"
                alt="ETM SAC"
                fill
                priority
                draggable={false}
                className="select-none object-contain"
              />
            </div>

            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                onClick={toggleCollapsed}
                title="Expandir"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors duration-200 hover:bg-white/5 hover:text-white"
              >
                <PanelLeftClose size={15} className="rotate-180" />
              </button>

              <button
                onClick={handleClose}
                title="Ocultar barra lateral"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors duration-200 hover:bg-white/5 hover:text-white"
              >
                {/* Mostrar Chevron si es drawer, de lo contrario mostrar EyeOff */}
                {isDrawer ? <ChevronLeft size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex h-full w-full flex-col items-center justify-center rounded-2xl bg-linear-to-b from-white/5 to-white/2.5 px-4">
            <div className="relative flex h-18 w-18 items-center justify-center">
              <Image
                src="/icon.svg"
                alt="ETM SAC"
                fill
                priority
                draggable={false}
                className="select-none object-contain"
              />
            </div>

            <div className="mt-2 flex flex-col items-center">
              <h1 className="whitespace-nowrap text-[12px] font-semibold tracking-[0.16em] text-white/90">
                COMPANY S.A.C.
              </h1>
              <p className="mt-0.5 whitespace-nowrap text-[10px] tracking-[0.12em] text-neutral-500">
                ERP INDUSTRIAL
              </p>
            </div>

            <div className="absolute right-3 top-3 flex items-center gap-1">
              <button
                onClick={toggleCollapsed}
                title="Comprimir"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors duration-200 hover:bg-white/5 hover:text-white"
              >
                <PanelLeftClose size={15} />
              </button>

              <button
                onClick={handleClose}
                title="Ocultar barra lateral"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors duration-200 hover:bg-white/5 hover:text-white"
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