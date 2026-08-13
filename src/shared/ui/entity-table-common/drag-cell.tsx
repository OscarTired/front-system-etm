"use client"

import { GripVertical } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useDndRow } from "@/shared/ui/entity-table-common/dnd-row-context"

type Props = {
  /** true = no arrastre (correlativo / etc.): el handle se oculta con animación */
  hidden?: boolean
}

export function DragCell({ hidden = false }: Props) {
  const handle = useDndRow()

  return (
    <button
      type="button"
      data-dnd-row-handle=""
      data-drag-handle=""
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden}
      disabled={hidden}
      onPointerDown={hidden ? undefined : handle?.onPointerDown}
      style={{ touchAction: "none" }}
      className={cn(
        "flex shrink-0 touch-none items-center justify-center overflow-hidden rounded-lg text-muted-foreground",
        "transition-[width,opacity,margin] duration-200 ease-out",
        "hover:bg-foreground/5 hover:text-foreground",
        hidden
          ? "pointer-events-none h-9 w-0 opacity-0"
          : "h-9 w-9 opacity-100",
      )}
    >
      <GripVertical
        size={18}
        className={cn(
          "transition-opacity duration-200 ease-out",
          hidden ? "opacity-0" : "opacity-100",
        )}
      />
    </button>
  )
}
