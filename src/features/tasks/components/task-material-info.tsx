"use client"

import { Layers } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/shared/utils/utils"
import type { Task } from "../types/task.types"
import { getTaskPiecesTotal } from "../utils/task-material-summary"

type Props = {
  task: Task
  className?: string
  /** En card de proceso: botón más grande */
  size?: "sm" | "md"
}

/** Solo se muestra si hay >1 línea de material. */
export function TaskMaterialInfo({
  task,
  className,
  size = "sm",
}: Props) {
  const lines = task.materialLines
  if (!lines || lines.length <= 1) return null

  const total = getTaskPiecesTotal(task)
  const isMd = size === "md"

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Detalle de materiales"
          title="Materiales"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors",
            "hover:bg-foreground/10 hover:text-foreground active:bg-foreground/15",
            isMd ? "size-9" : "size-7 rounded-lg",
            className,
          )}
        >
          <Layers size={isMd ? 18 : 14} strokeWidth={2} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="z-50 w-72 gap-0 border-border/60 p-0"
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
