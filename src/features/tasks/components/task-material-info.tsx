"use client"

import { Layers } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CHROME_ICON_BTN } from "@/shared/ui/actions/icon-action"
import { cn } from "@/shared/utils/utils"
import type { Task } from "../types/task.types"
import { getTaskPiecesTotal } from "../utils/task-material-summary"

type Props = {
  task: Task
  className?: string
  /** En card de proceso: botón más grande */
  size?: "sm" | "md"
  /**
   * En process row: siempre visible si hay al menos un material.
   * En cards de kanban: por defecto solo si hay multi-material.
   */
  alwaysShow?: boolean
}

/** Por defecto solo multi-material; `alwaysShow` → desde 1 línea. */
export function TaskMaterialInfo({
  task,
  className,
  size = "sm",
  alwaysShow = false,
}: Props) {
  const lines = task.materialLines
  if (!lines || lines.length === 0) return null
  if (!alwaysShow && lines.length <= 1) return null

  const total = getTaskPiecesTotal(task)
  const isMd = size === "md"
  const count = lines.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Detalle de materiales"
          title="Materiales"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          className={cn(
            CHROME_ICON_BTN,
            "relative",
            isMd && "size-9 rounded-xl",
            className,
          )}
        >
          <Layers size={isMd ? 18 : 14} strokeWidth={2.25} />
          {count > 1 && (
            <span
              className={cn(
                "absolute -right-1 -top-1 flex items-center justify-center",
                "rounded-full bg-primary font-bold tabular-nums text-primary-foreground",
                isMd ? "size-4 text-[9px]" : "size-3.5 text-[8px]",
              )}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        collisionPadding={12}
        floatingClassName="w-72"
        className="gap-0 border-border/60 p-0"
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
      >
        <div className="border-b border-border/50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Materiales · {total} piezas
          </p>
        </div>
        <div className="flex flex-col gap-2 px-3 py-3">
          {lines.map(line => (
            <div
              key={line.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="min-w-0 truncate font-medium text-foreground">
                {line.material.name}
                <span className="text-muted-foreground">
                  {" "}
                  · {line.thickness.name}
                </span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {line.pieces} pzas
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
