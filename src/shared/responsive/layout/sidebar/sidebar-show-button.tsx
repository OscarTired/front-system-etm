"use client"

import { Eye } from "lucide-react"

import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { chromeIconButtonClass } from "@/shared/theme/theme-toggle"
import { cn } from "@/shared/utils/utils"

export function SidebarShowButton() {
  const mode = useSidebarStore(state => state.mode)
  const toggleClosed = useSidebarStore(state => state.toggleClosed)

  if (mode !== "closed") return null

  return (
    <button
      type="button"
      onClick={toggleClosed}
      title="Mostrar barra lateral"
      aria-label="Mostrar barra lateral"
      className={cn(chromeIconButtonClass, "size-8")}
    >
      <Eye size={16} strokeWidth={1.75} />
    </button>
  )
}
