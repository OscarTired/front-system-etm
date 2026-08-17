"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { useTaskAreaPanel } from "../../hooks/use-task-area-panel"
import { TaskAreaPanelBody } from "./task-area-panel-body"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Sheet móvil de "Mis tareas". Desktop bitácora usa TaskAreaSidebar. */
export function TaskAreaPanel({ open, onOpenChange }: Props) {
  const panel = useTaskAreaPanel()
  const { state } = panel

  if (!state.hasAreaPanel) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Mis tareas</SheetTitle>
        </SheetHeader>
        <TaskAreaPanelBody panel={panel} className="h-full" />
      </SheetContent>
    </Sheet>
  )
}
