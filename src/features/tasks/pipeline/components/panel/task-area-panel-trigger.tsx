"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { ListChecks } from "lucide-react"

import { useMyAreaTasks } from "../../../../areas/hooks/use-my-area-tasks"
import { useMyAreaPendingTasksCount } from "../../../../areas/hooks/use-my-area-pending-tasks-count"
import { TaskAreaPanel } from "./task-area-panel"

export function TaskAreaPanelTrigger() {
  const [open, setOpen] = useState(false)

  const { hasAreaPanel, canChooseAreas } = useMyAreaTasks()
  const pendingCount = useMyAreaPendingTasksCount()

  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams.toString()])

  if (!hasAreaPanel || canChooseAreas) {
    return null
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mis tareas"
        className="flex h-10 max-w-full items-center gap-2 rounded-xl bg-white/5 px-4 text-sm font-semibold text-neutral-200 transition-colors hover:bg-white/10"
      >
        <ListChecks size={16} className="shrink-0" />

        <span className="min-w-0 flex-1 truncate">
          TAREAS
        </span>

        {pendingCount > 0 && (
          <span className="animate-badge-pulse flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md px-1 text-[10px] font-bold">
            {pendingCount}
          </span>
        )}
      </button>

      <TaskAreaPanel
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}