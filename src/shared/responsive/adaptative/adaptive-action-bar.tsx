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
    // flex-wrap + sin altura fija: al estrechar, baja de línea y
    // EntityToolbar crece → la lista no queda debajo del chip.
    return (
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 overflow-visible select-none">
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
      <div className="flex min-h-0 w-full flex-wrap items-center gap-2 overflow-visible select-none">
        {pinned && (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 overflow-visible">
            {pinned}
          </div>
        )}
        {right}
      </div>
      <SpeedDialFab actions={actions} />
    </>
  )
}
