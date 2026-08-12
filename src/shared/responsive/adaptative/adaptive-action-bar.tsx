"use client"

import type { ReactNode } from "react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { SpeedDialFab } from "@/shared/ui/speed-dial-fab/speed-dial-fab"

type Props = {
  /** Back + lupa: en la barra, scrollean con el contenido. No van al FAB. */
  pinned?: ReactNode
  /** Filtro, orden, historial… → FAB en mobile. */
  actions: ReactNode[]
  right?: ReactNode
}

export function AdaptiveActionBar({ pinned, actions, right }: Props) {
  const { isMobile } = useResponsive()

  if (!isMobile) {
    return (
      <div className="flex h-full min-h-0 w-full flex-wrap items-center gap-2 select-none">
        {pinned}
        {actions.map((action, index) => (
          <div key={index} className="contents">
            {action}
          </div>
        ))}
        {right}
      </div>
    )
  }

  return (
    <>
      {/* Misma altura que EntityToolbar: sin py extra que sume al chip */}
      <div className="flex h-10 w-full items-center gap-2 select-none">
        {pinned && (
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-none">
            {pinned}
          </div>
        )}
        {right}
      </div>
      <SpeedDialFab actions={actions} />
    </>
  )
}
