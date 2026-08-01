"use client"

import { Eye } from "lucide-react"

import { useSidebarStore } from "@/shared/stores/sidebar-store"

export function SidebarShowButton() {

  const mode = useSidebarStore(state => state.mode)
  const toggleClosed = useSidebarStore(state => state.toggleClosed)

  if (mode !== "closed") return null

  return (
    <button
      onClick={toggleClosed}
      title="Mostrar barra lateral"
      className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-white/5 hover:text-white"
    >
      <Eye size={16} />
    </button>
  )

}