"use client"

import { useCallback, useMemo, useState } from "react"
import { Trash2 } from "lucide-react"

import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { useAuthStore } from "@/features/auth/store/auth-store"

import { DateNavigator } from "@/shared/ui/date-picker/components/date-navigator"
import { toISODateString } from "@/shared/ui/date-picker/utils/date-format"
import { ActionDialog } from "@/shared/ui/dialogs/action-dialog/action-dialog"
import { TaskAreaPanelTrigger } from "@/features/tasks/pipeline/components/panel/task-area-panel-trigger"
import { cn } from "@/shared/utils/utils"

import { useMyActivityLog } from "../../hooks/use-my-activity-log"
import { useMyActivityLogRange } from "../../hooks/use-my-activity-log-range"
import { useDeleteActivityLog } from "../../hooks/use-delete-activity-log"
import { useMoveActivityLog } from "../../hooks/use-move-activity-log"
import { useActivityDrag } from "../../hooks/use-activity-drag"
import { useActivityLogMarkedDates } from "../../hooks/use-activity-log-marked-dates"
import type { ShiftSlotDefinition } from "../../constants/shift-definitions"
import { SHIFT_GROUPS, getSlotState } from "../../constants/shift-definitions"
import type {
  ActivityDepartment,
  ActivityLog,
} from "../../types/activity-log.types"
import { useBitacoraViewStore } from "../../store/bitacora-view-store"
import { getWeekRangeISO, getMonthRangeISO } from "../../utils/week-range"

import { ShiftGroupSection } from "../shift-group-section"
import { AutoActivitySection } from "../auto-activity-section"
import { ActivityPickerDialog } from "../dialogs/activity-picker-dialog"
import { ActivityLogSkeleton } from "../skeletons/activity-log-skeleton"
import { BitacoraViewToggle } from "../toggles/bitacora-view-toggle"
import { AgendaWeekView } from "../agenda/agenda-week-view"
import { AgendaMonthView } from "../agenda/agenda-month-view"

type ViewTab = ActivityDepartment | "REGISTROS"

type Props = {
  department?: ViewTab
}

export function ActivityLogPageContent({
  department = "PRODUCCION",
}: Props = {}) {
  const [date, setDate] = useState<Date>(new Date())
  const [viewMonth, setViewMonth] = useState<Date>(() => new Date())

  const dateISO = toISODateString(date)
  const isToday = dateISO === toISODateString(new Date())

  const departmentQuery =
    department === "REGISTROS" ? "PRODUCCION" : department

  const viewMode = useBitacoraViewStore(s => s.viewMode)
  const setViewMode = useBitacoraViewStore(s => s.setViewMode)
  const isAgenda = viewMode === "agenda"
  const isMonth = viewMode === "month"
  const isRangeView = isAgenda || isMonth

  const userId = useAuthStore(s => s.user?.id)

  const weekRange = useMemo(() => getWeekRangeISO(date), [date])
  const monthRange = useMemo(() => getMonthRangeISO(date), [date])

  const rangeFrom = isMonth ? monthRange.from : weekRange.from
  const rangeTo = isMonth ? monthRange.to : weekRange.to

  const { logs, loading } = useMyActivityLog(
    departmentQuery,
    isToday ? undefined : dateISO,
  )

  const { logs: rangeLogs, loading: rangeLoading } = useMyActivityLogRange(
    departmentQuery,
    rangeFrom,
    rangeTo,
    userId,
  )

  const { deleteLog } = useDeleteActivityLog(departmentQuery)
  const { moveLog } = useMoveActivityLog(departmentQuery)

  const { markedDates } = useActivityLogMarkedDates({
    scope: "me",
    month: viewMonth,
    department: departmentQuery,
  })

  const handleViewMonthChange = useCallback((month: Date) => {
    setViewMonth(month)
  }, [])

  const handleDateChange = useCallback((next: Date | null) => {
    const d = next ?? new Date()
    setDate(d)
    setViewMonth(d)
  }, [])

  const goToToday = useCallback(() => {
    const today = new Date()
    setDate(today)
    setViewMonth(today)
  }, [])

  const { has } = usePermissions()

  const canCreate = isToday && has(PermissionCode.ACTIVITY_LOG_CREATE)
  const canDelete = isToday && has(PermissionCode.ACTIVITY_LOG_DELETE)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeSlot, setActiveSlot] = useState<ShiftSlotDefinition | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ActivityLog | null>(null)

  function handleOpenPicker(slot: ShiftSlotDefinition) {
    if (!canCreate) return
    setActiveSlot(slot)
    setPickerOpen(true)
  }

  function handleMoveLog(id: string, shift: ShiftSlotDefinition["shift"]) {
    if (!canCreate) return
    moveLog({ id, shift }).catch(() => {})
  }

  function isShiftAvailable(shift: ShiftSlotDefinition["shift"]) {
    if (!isToday) return false
    const slot = SHIFT_GROUPS.flatMap(group => group.slots).find(
      s => s.shift === shift,
    )
    return !!slot && getSlotState(slot, new Date()) !== "upcoming"
  }

  const { beginDrag, registerSlot, draggingLogId, hoverShift, overlay } =
    useActivityDrag({
      onDrop: handleMoveLog,
      isShiftAvailable,
    })

  const referenceNow = useMemo(
    () =>
      isToday
        ? new Date()
        : new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            23,
            59,
          ),
    [isToday, date],
  )

  function handleDeleteLog(log: ActivityLog) {
    if (!canDelete) return
    setPendingDelete(log)
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    await deleteLog(pendingDelete.id)
    setPendingDelete(null)
  }

  function handleSelectDay(day: Date) {
    setDate(day)
    setViewMonth(day)
    setViewMode("day")
  }

  function handleAgendaLogClick(log: ActivityLog) {
    const d = new Date(log.loggedAt)
    setDate(d)
    setViewMonth(d)
    setViewMode("day")
  }

  const entryCount = isRangeView ? rangeLogs.length : logs.length

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden transition-all duration-200">
      <div className="shrink-0 rounded-2xl bg-[#0c0c0e]/80 p-3 shadow-lg backdrop-blur-xl tablet:p-4">
        <div className="flex flex-col gap-3 tablet:grid tablet:grid-cols-[1fr_auto_1fr] tablet:items-center">
          <div className="flex w-full items-center justify-center gap-2 tablet:justify-self-start tablet:justify-start">
            <BitacoraViewToggle />

            <button
              type="button"
              onClick={goToToday}
              disabled={isToday}
              className={cn(
                "flex h-8 items-center rounded-xl px-3.5 text-sm font-semibold transition-all",
                isToday
                  ? "cursor-default bg-amber-400/15 text-amber-400/50"
                  : "bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 hover:text-amber-200",
              )}
            >
              Hoy
            </button>
          </div>

          <div className="flex w-full justify-center tablet:justify-self-center">
            <DateNavigator
              value={date}
              onChange={handleDateChange}
              placeholder="Fecha"
              maxDate={new Date()}
              markedDates={markedDates}
              onViewMonthChange={handleViewMonthChange}
            />
          </div>

          <div className="flex w-full justify-center tablet:w-auto tablet:justify-self-end">
            <div className="flex items-center gap-2">
              <div className="flex h-9 min-w-32 items-center justify-center rounded-xl bg-white/5 px-3 text-sm font-medium text-neutral-300">
                {entryCount} {entryCount === 1 ? "entrada" : "entradas"}
              </div>

              {departmentQuery === "PRODUCCION" && (
                <div className="hidden tablet:block">
                  <TaskAreaPanelTrigger />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isAgenda && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AgendaWeekView
            anchorDate={date}
            logs={rangeLogs}
            loading={rangeLoading}
            onSelectDay={handleSelectDay}
            onLogClick={handleAgendaLogClick}
          />
        </div>
      )}

      {isMonth && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AgendaMonthView
            anchorDate={date}
            logs={rangeLogs}
            loading={rangeLoading}
            onSelectDay={handleSelectDay}
          />
        </div>
      )}

      {viewMode === "day" && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
            <div className="flex w-full flex-col gap-3 pb-4">
              {loading ? (
                <ActivityLogSkeleton />
              ) : (
                <>
                  {departmentQuery === "PRODUCCION" &&
                    department !== "REGISTROS" && (
                      <AutoActivitySection
                        logs={logs.filter(log => log.source === "AUTO")}
                      />
                    )}

                  {SHIFT_GROUPS.map(group => {
                    const logsBySlot: Record<string, typeof logs> = {}

                    for (const slot of group.slots) {
                      logsBySlot[slot.shift] = logs.filter(
                        log => log.shift === slot.shift,
                      )
                    }

                    return (
                      <ShiftGroupSection
                        key={group.key}
                        group={group}
                        logsBySlot={logsBySlot}
                        onLogClick={handleOpenPicker}
                        onDeleteLog={handleDeleteLog}
                        beginDrag={beginDrag}
                        registerSlot={registerSlot}
                        draggingLogId={draggingLogId}
                        hoverShift={hoverShift}
                        deletingLogId={null}
                        canCreate={canCreate}
                        canDelete={canDelete}
                        referenceNow={referenceNow}
                      />
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ActivityPickerDialog
        open={canCreate && pickerOpen}
        activeSlot={activeSlot}
        department={departmentQuery}
        onOpenChange={open => {
          setPickerOpen(open)
          if (!open) {
            setActiveSlot(null)
          }
        }}
      />

      {overlay}

      <ActionDialog
        open={!!pendingDelete}
        title="Eliminar actividad"
        description={
          pendingDelete
            ? `¿Eliminar "${pendingDelete.activityType.label}"? Esta acción no se puede deshacer.`
            : ""
        }
        icon={Trash2}
        confirmLabel="Eliminar"
        variant="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}