"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { ListChecks } from "lucide-react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

import { useMyAreaTasks } from "../../../../areas/hooks/use-my-area-tasks"
import { useMyAreaPendingTasksCount } from "../../../../areas/hooks/use-my-area-pending-tasks-count"
import { TaskAreaPanel } from "./task-area-panel"

/**
 * Trigger + sheet de "Mis tareas".
 * Solo en compact/mobile: en desktop bitácora la columna lateral
 * (TaskAreaSidebar) reemplaza al sheet.
 */
export function TaskAreaPanelTrigger() {
  const [open, setOpen] = useState(false)
  const { isMobile, isCompact } = useResponsive()

  const { hasAreaPanel, canChooseAreas, isAdmin } = useMyAreaTasks()
  const pendingCount = useMyAreaPendingTasksCount()

  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams.toString()])

  // Supervisor puro usa la pantalla Asignación; operario/admin ven el panel.
  if (!hasAreaPanel || (canChooseAreas && !isAdmin)) {
    return null
  }

  // Desktop: la bitácora monta TaskAreaSidebar; no hace falta trigger.
  if (!isMobile && !isCompact) {
    return null
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mis tareas"
        className="flex h-9 w-40 max-w-full items-center gap-2 rounded-lg bg-foreground/5 px-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/10"
      >
        <ListChecks size={16} className="shrink-0" />

        <span className="min-w-0 flex-1 truncate">TAREAS</span>

        {pendingCount > 0 && (
          <span
            className="
              animate-badge-pulse flex h-5 min-w-5 shrink-0 items-center justify-center
              rounded-full px-1 text-[10px] font-bold select-none
              bg-primary text-primary-foreground shadow-sm
            "
          >
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      <TaskAreaPanel open={open} onOpenChange={setOpen} />
    </>
  )
}
