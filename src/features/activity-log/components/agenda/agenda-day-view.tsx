"use client"

import { ScrollArea } from "@/components/ui/scroll-area"

import { SHIFT_GROUPS } from "../../constants/shift-definitions"
import type { ShiftSlotDefinition } from "../../constants/shift-definitions"
import type { ActivityLog, DayShift } from "../../types/activity-log.types"
import type { SlotState } from "../../types/shift-schedule.types"
import { AutoActivitySection } from "../auto-activity-section"
import { ShiftGroupSection } from "../shift-group-section"

type Props = {
  logs: ActivityLog[]
  loading?: boolean
  showAutoSection?: boolean
  onLogClick: (slot: ShiftSlotDefinition) => void
  onDeleteLog: (log: ActivityLog) => void
  beginDrag: (
    e: React.PointerEvent<HTMLElement>,
    log: ActivityLog,
    isDuplicate?: boolean,
  ) => void
  registerSlot: (shift: DayShift, el: HTMLElement | null) => void
  draggingLogId: string | null
  hoverShift: DayShift | null
  deletingLogId?: string | null
  canCreate: boolean
  canDelete: boolean
  slotState?: (shift: DayShift) => SlotState
  isLogBusy?: (logId: string) => boolean
  canDuplicateLog?: (log: ActivityLog) => boolean
  onEditLog?: (log: ActivityLog) => void
  onDuplicateLog?: (log: ActivityLog) => void
}

/**
 * Vista día — mismo contrato que AgendaWeekView:
 *
 * - Root acotado + ScrollArea (scrollea cuando el contenido empuja).
 * - Grid `min-h-full` + filas `minmax(min-content, 1fr)`:
 *   poco contenido → llena viewport; mucho → crece y hay scroll.
 */
export function AgendaDayView({
  logs,
  loading = false,
  showAutoSection = false,
  onLogClick,
  onDeleteLog,
  beginDrag,
  registerSlot,
  draggingLogId,
  hoverShift,
  deletingLogId,
  canCreate,
  canDelete,
  slotState,
  isLogBusy,
  canDuplicateLog,
  onEditLog,
  onDuplicateLog,
}: Props) {
  const autoLogs = logs.filter(log => log.source === "AUTO")
  const showAuto = showAutoSection && autoLogs.length > 0

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <ScrollArea className="h-full min-h-0 min-w-0 flex-1">
        <div className="flex min-h-full flex-col gap-3 pb-1">
          {showAuto && (
            <div className="shrink-0">
              <AutoActivitySection logs={autoLogs} />
            </div>
          )}

          <div
            className="grid w-full min-h-full flex-1 gap-3"
            style={{
              gridTemplateRows: `repeat(${SHIFT_GROUPS.length}, minmax(min-content, 1fr))`,
            }}
          >
            {SHIFT_GROUPS.map(group => {
              const logsBySlot: Record<string, ActivityLog[]> = {}
              if (!loading) {
                for (const slot of group.slots) {
                  logsBySlot[slot.shift] = logs.filter(
                    log => log.shift === slot.shift,
                  )
                }
              }

              return (
                <ShiftGroupSection
                  key={group.key}
                  group={group}
                  logsBySlot={logsBySlot}
                  loading={loading}
                  fill
                  onLogClick={onLogClick}
                  onDeleteLog={onDeleteLog}
                  beginDrag={beginDrag}
                  registerSlot={registerSlot}
                  draggingLogId={draggingLogId}
                  hoverShift={hoverShift}
                  deletingLogId={deletingLogId}
                  canCreate={canCreate}
                  canDelete={canDelete}
                  slotState={slotState}
                  isLogBusy={isLogBusy}
                  canDuplicateLog={canDuplicateLog}
                  onEditLog={onEditLog}
                  onDuplicateLog={onDuplicateLog}
                />
              )
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
