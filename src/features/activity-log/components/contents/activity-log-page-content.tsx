"use client"

import { AppListScroll } from "@/shared/ui/vertical-scroll/app-list-scroll"

import { useCallback, useMemo, useState } from "react"
import { Trash2 } from "lucide-react"

import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { useAuthStore } from "@/features/auth/store/auth-store"

import { DateNavigator } from "@/shared/ui/date-picker/components/date-navigator"
import { toISODateString } from "@/shared/ui/date-picker/utils/date-format"
import { ActionDialog } from "@/shared/ui/dialogs/action-dialog/action-dialog"
import { TaskAreaPanelTrigger } from "@/features/tasks/pipeline/components/panel/task-area-panel-trigger"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

import { useMyActivityLog } from "../../hooks/use-my-activity-log"
import { useMyActivityLogRange } from "../../hooks/use-my-activity-log-range"
import { useDeleteActivityLog } from "../../hooks/use-delete-activity-log"
import { useMoveActivityLog } from "../../hooks/use-move-activity-log"
import { useCreateActivityLog } from "../../hooks/use-create-activity-log"
import { useActivityDrag } from "../../hooks/use-activity-drag"
import { useActivityLogMarkedDates } from "../../hooks/use-activity-log-marked-dates"
import type { ShiftSlotDefinition } from "../../constants/shift-definitions"
import { SHIFT_GROUPS } from "../../constants/shift-definitions"
import { useShiftSchedule } from "../../hooks/use-shift-schedule"
import type {
  ActivityDepartment,
  ActivityLog,
} from "../../types/activity-log.types"
import { useBitacoraViewStore } from "../../store/bitacora-view-store"
import { getWeekRangeISO, getMonthRangeISO } from "../../utils/week-range"
import { canDuplicateActivity } from "../../utils/duplicate-limit"

import { ShiftGroupSection } from "../shift-group-section"
import { AutoActivitySection } from "../auto-activity-section"
import { ActivityPickerDialog } from "../dialogs/activity-picker-dialog"
import { ActivityLogEditDialog } from "../dialogs/activity-log-edit-dialog"
import { BitacoraViewToggle } from "../toggles/bitacora-view-toggle"
import { AgendaWeekView } from "../agenda/agenda-week-view"
import { AgendaMonthView } from "../agenda/agenda-month-view"

type ViewTab = ActivityDepartment | "REGISTROS"

type Props = {
  department?: ViewTab
}

/**
 * Layout alineado a TaskPageContent:
 * - root: flex h-full min-h-0 flex-col
 * - toolbar: shrink-0
 * - cuerpo: min-h-0 flex-1 + scroll propio (día) o agenda con min-height dvh
 *
 * Responsive unificado con `isCompact` (no `tablet:` para cambiar de
 * árbol): phone landscape no salta a grilla de escritorio.
 */
export function ActivityLogPageContent({
  department = "PRODUCCION",
}: Props = {}) {
  const { isCompact } = useResponsive()

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
  const { createLog } = useCreateActivityLog(
    useMemo(() => logs.map(l => l.activityType), [logs]),
    departmentQuery,
  )

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
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null)

  function handleOpenPicker(slot: ShiftSlotDefinition) {
    if (!canCreate) return
    setActiveSlot(slot)
    setPickerOpen(true)
  }

  function handleMoveLog(
    id: string,
    shift: ShiftSlotDefinition["shift"],
    isDuplicate: boolean,
  ) {
    if (!canCreate) return
    if (id.startsWith("optimistic-")) return

    if (isDuplicate) {
      const source = logs.find(l => l.id === id)
      if (!source || source.source !== "MANUAL") return
      const asTarget = { ...source, shift } as ActivityLog
      if (!canDuplicateActivity(logs, asTarget)) return
      createLog({
        activityTypeId: source.activityType.id,
        projectId: source.project?.id ?? undefined,
        taskId: source.task?.id ?? undefined,
        note: source.note ?? undefined,
        shift,
      }).catch(() => {})
      return
    }

    moveLog({ id, shift }).catch(() => {})
  }

  function handleDuplicateLog(log: ActivityLog) {
    if (!log.shift) return
    handleMoveLog(log.id, log.shift, true)
  }

  function isLogBusy(logId: string) {
    if (logId.startsWith("optimistic-")) return true
    if (pendingDelete?.id === logId) return true
    return false
  }

  function canDuplicateLog(log: ActivityLog) {
    return canDuplicateActivity(logs, log)
  }

  function handleEditLog(log: ActivityLog) {
    if (log.source !== "MANUAL") return
    if (log.id.startsWith("optimistic-")) return
    if (!canCreate) return
    setEditingLog(log)
  }

  const { getState, isOpen } = useShiftSchedule(
    isToday ? undefined : dateISO,
  )

  function isShiftAvailable(shift: ShiftSlotDefinition["shift"]) {
    if (!isToday) return false
    return isOpen(shift)
  }

  const { beginDrag, registerSlot, draggingLogId, hoverShift, overlay } =
    useActivityDrag({
      onDrop: handleMoveLog,
      isShiftAvailable,
    })

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
    <div className="relative flex h-full min-h-0 w-full flex-col gap-3 max-md:pt-14">
      {/* Toolbar — compact: columna; laptop+: grid 3 cols (como tasks toolbar) */}
      <div
        className={cn(
          "w-full shrink-0 rounded-2xl bg-[#0c0c0e]/80 shadow-lg backdrop-blur-xl",
          isCompact ? "p-2" : "p-3 desktop:p-4",
        )}
      >
        {isCompact ? (
          /* Móvil: una franja — vista + hoy + fecha + contador numérico */
          <div className="flex items-center gap-1.5">
            <div className="min-w-0 shrink">
              <BitacoraViewToggle compact />
            </div>

            <button
              type="button"
              onClick={goToToday}
              disabled={isToday}
              className={cn(
                "flex h-8 shrink-0 items-center rounded-lg px-2.5 text-xs font-semibold transition-all",
                isToday
                  ? "cursor-default bg-amber-400/15 text-amber-400/50"
                  : "bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 hover:text-amber-200",
              )}
            >
              Hoy
            </button>

            <div className="min-w-0 flex-1 flex justify-center">
              <DateNavigator
                value={date}
                onChange={handleDateChange}
                placeholder="Fecha"
                maxDate={new Date()}
                markedDates={markedDates}
                onViewMonthChange={handleViewMonthChange}
                iconOnly
              />
            </div>

            <div
              className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 px-2 text-xs font-semibold tabular-nums text-neutral-300"
              title={`${entryCount} ${entryCount === 1 ? "entrada" : "entradas"}`}
            >
              {entryCount}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex items-center justify-self-start gap-2">
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

            <div className="justify-self-center">
              <DateNavigator
                value={date}
                onChange={handleDateChange}
                placeholder="Fecha"
                maxDate={new Date()}
                markedDates={markedDates}
                onViewMonthChange={handleViewMonthChange}
              />
            </div>

            <div className="flex items-center justify-self-end gap-2">
              <div className="flex h-9 min-w-32 items-center justify-center rounded-xl bg-white/5 px-3 text-sm font-medium text-neutral-300">
                {entryCount} {entryCount === 1 ? "entrada" : "entradas"}
              </div>

              {departmentQuery === "PRODUCCION" && (
                <TaskAreaPanelTrigger />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cuerpo — mismo patrón que TaskPageContent (scroll en el hijo) */}
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
        <AppListScroll className="max-md:pt-0">
          <div className="flex w-full flex-col gap-3 pb-4">
            {!loading &&
              departmentQuery === "PRODUCCION" &&
              department !== "REGISTROS" && (
                <AutoActivitySection
                  logs={logs.filter(log => log.source === "AUTO")}
                />
              )}

            {SHIFT_GROUPS.map(group => {
              const logsBySlot: Record<string, typeof logs> = {}

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
                  onLogClick={handleOpenPicker}
                  onDeleteLog={handleDeleteLog}
                  beginDrag={beginDrag}
                  registerSlot={registerSlot}
                  draggingLogId={draggingLogId}
                  hoverShift={hoverShift}
                  deletingLogId={pendingDelete?.id ?? null}
                  canCreate={canCreate}
                  canDelete={canDelete}
                  slotState={getState}
                  isLogBusy={isLogBusy}
                  canDuplicateLog={canDuplicateLog}
                  onEditLog={handleEditLog}
                  onDuplicateLog={handleDuplicateLog}
                />
              )
            })}
          </div>
        </AppListScroll>
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

      <ActivityLogEditDialog
        log={editingLog}
        open={!!editingLog}
        department={departmentQuery}
        onOpenChange={open => {
          if (!open) setEditingLog(null)
        }}
      />
    </div>
  )
}