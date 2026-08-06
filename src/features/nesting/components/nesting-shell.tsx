"use client"

import type { ReactNode } from "react"
import {
  LayoutGrid,
  SlidersHorizontal,
  Layers,
  Info,
  PanelLeftClose,
  X,
} from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

export type NestingPanelId = "sheet-pieces" | "project-material" | "layers" | "inspector"

const RAIL_ITEMS: {
  id: NestingPanelId
  label: string
  icon: typeof LayoutGrid
}[] = [
  { id: "project-material", label: "Proyecto", icon: SlidersHorizontal },
  { id: "sheet-pieces", label: "Piezas", icon: LayoutGrid },
  { id: "layers", label: "Capas", icon: Layers },
  { id: "inspector", label: "Inspector", icon: Info },
]

export interface NestingShellProps {
  activePanel: NestingPanelId | null
  onActivePanelChange: (panel: NestingPanelId | null) => void
  /** Contenido del drawer (PieceList, Material, etc.) */
  panel: ReactNode
  /** Canvas + toolbars + tabs */
  workspace: ReactNode
  /** Botón Nestear / progreso, fijo abajo del rail */
  footer?: ReactNode
  className?: string
}

/**
 * Layout moderno tipo Figma / CAD:
 * - Rail de iconos estrecho (siempre visible)
 * - Drawer overlay sobre el canvas (no empuja el layout)
 * - Mobile: rail inferior + drawer desde abajo
 * El canvas ocupa TODO el espacio restante.
 */
export function NestingShell({
  activePanel,
  onActivePanelChange,
  panel,
  workspace,
  footer,
  className,
}: NestingShellProps) {
  const { isCompact } = useResponsive()
  const open = activePanel !== null

  const toggle = (id: NestingPanelId) => {
    onActivePanelChange(activePanel === id ? null : id)
  }

  const railButtons = (
    <>
      {RAIL_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = activePanel === id
        return (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => toggle(id)}
            className={cn(
              "relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
              active
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-neutral-400 hover:bg-white/8 hover:text-white",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-cyan-400" />
            )}
          </button>
        )
      })}
    </>
  )

  if (isCompact) {
    return (
      <div className={cn("relative flex h-full min-h-0 w-full flex-col overflow-hidden", className)}>
        {/* Workspace full */}
        <div className="relative min-h-0 flex-1 overflow-hidden">{workspace}</div>

        {/* Bottom rail */}
        <nav className="z-30 flex shrink-0 items-center justify-around gap-1 border-t border-white/8 bg-neutral-950/95 px-2 py-1.5 backdrop-blur-md">
          {railButtons}
        </nav>

        {/* Bottom sheet drawer */}
        {open && (
          <>
            <button
              type="button"
              aria-label="Cerrar panel"
              className="absolute inset-0 z-40 bg-black/50"
              onClick={() => onActivePanelChange(null)}
            />
            <div className="absolute inset-x-0 bottom-0 z-50 flex max-h-[78vh] flex-col rounded-t-2xl border-t border-white/10 bg-neutral-950 shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-4 py-3">
                <span className="text-sm font-medium text-neutral-200">
                  {RAIL_ITEMS.find((i) => i.id === activePanel)?.label ?? "Panel"}
                </span>
                <button
                  type="button"
                  onClick={() => onActivePanelChange(null)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden p-3">{panel}</div>
              {footer && <div className="shrink-0 border-t border-white/8 p-3">{footer}</div>}
            </div>
          </>
        )}
      </div>
    )
  }

  // Desktop: rail left + overlay drawer + full canvas
  return (
    <div className={cn("relative flex h-full min-h-0 w-full overflow-hidden", className)}>
      {/* Icon rail */}
      <aside className="z-30 flex w-14 shrink-0 flex-col items-center gap-1 border-r border-white/8 bg-neutral-950/90 py-3 backdrop-blur-md">
        <div className="flex flex-1 flex-col items-center gap-1">{railButtons}</div>
        {open && (
          <button
            type="button"
            title="Cerrar panel"
            onClick={() => onActivePanelChange(null)}
            className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-white/8 hover:text-white"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </aside>

      {/* Main stage: canvas always full width of remaining area */}
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        {workspace}

        {/* Overlay drawer — no layout shift */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 z-20 flex w-[min(100%,20rem)] flex-col border-r border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full pointer-events-none",
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-3 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {RAIL_ITEMS.find((i) => i.id === activePanel)?.label ?? ""}
            </span>
            <button
              type="button"
              onClick={() => onActivePanelChange(null)}
              className="rounded-lg p-1 text-neutral-500 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden p-3">{panel}</div>
          {footer && <div className="shrink-0 border-t border-white/8 p-3">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
