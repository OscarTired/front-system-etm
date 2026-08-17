"use client"

import { ProcessBoardSkeleton } from "@/shared/ui/process-board"
import { ENGINEERING_PROCESS_ORDER } from "../constants/engineering-process-definitions"

/** @deprecated Usar ProcessBoardSkeleton directo. Se mantiene por imports legacy. */
export function EngineeringProcessSkeleton() {
  return (
    <ProcessBoardSkeleton
      accentColor="#16A34A"
      columnCount={ENGINEERING_PROCESS_ORDER.length}
    />
  )
}
