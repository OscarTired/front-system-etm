"use client"

import { useMemo, useState } from "react"
import { Trash2 } from "lucide-react"

import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"

import { DateNavigator } from "@/shared/ui/date-picker/components/date-navigator"
import { toISODateString } from "@/shared/ui/date-picker/utils/date-format"
import { ActionDialog } from "@/shared/ui/dialogs/action-dialog/action-dialog"
import { TaskAreaPanelTrigger } from "@/features/tasks/pipeline/components/panel/task-area-panel-trigger"

import { useMyActivityLog } from "../hooks/use-my-activity-log"
import { useDeleteActivityLog } from "../hooks/use-delete-activity-log"
import { useMoveActivityLog } from "../hooks/use-move-activity-log"
import { useActivityDrag } from "../hooks/use-activity-drag"
import type { ShiftSlotDefinition } from "../constants/shift-definitions"
import { SHIFT_GROUPS, getSlotState } from "../constants/shift-definitions"
import type { ActivityDepartment, ActivityLog } from "../types/activity-log.types"
import { ShiftGroupSection } from "./shift-group-section"
import { AutoActivitySection } from "./auto-activity-section"
import { ActivityPickerDialog } from "./activity-picker-dialog"
import { ActivityLogSkeleton } from "./activity-log-skeleton"

type ViewTab = ActivityDepartment | "REGISTROS"

type Props = {
  department?: ViewTab
}

export function ActivityLogPageContent({
  department = "PRODUCCION",
}: Props = {}) {
  const [date, setDate] = useState<Date>(new Date())

  const dateISO = toISODateString(date)
  const isToday = dateISO === toISODateString(new Date())

  // Si es "REGISTROS", mapeamos al departamento correspondiente para los hooks
  const departmentQuery = department === "REGISTROS" ? "PRODUCCION" : department

  const { logs, loading } = useMyActivityLog(departmentQuery, isToday ? undefined : dateISO)
  const { deleteLog } = useDeleteActivityLog(departmentQuery)
  const { moveLog } = useMoveActivityLog(departmentQuery)

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
    const slot = SHIFT_GROUPS
      .flatMap(group => group.slots)
      .find(s => s.shift === shift)
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
        : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59),
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">

      {/* Navegador de fecha y botón de Mis Tareas */}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white/2 p-4">
        <DateNavigator
          value={date}
          onChange={next => setDate(next ?? new Date())}
          placeholder="Fecha"
          maxDate={new Date()}
        />

        <div className="flex items-center gap-2">
          {/* Badge con ancho y alto fijo para evitar saltos */}
          <div className="flex h-9 w-[110px] items-center justify-center rounded-lg bg-white/5 px-3 py-2 text-sm text-neutral-400 shrink-0">
            {logs.length} {logs.length === 1 ? "entrada" : "entradas"}
          </div>

          {/* Botón de mis tareas ubicado al lado de entradas en todas las vistas del contenido */}
          {departmentQuery === "PRODUCCION" && (
            <div className="shrink-0">
              <TaskAreaPanelTrigger />
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <ActivityLogSkeleton />
        ) : (
          <>
            {departmentQuery === "PRODUCCION" && department !== "REGISTROS" && (
              <AutoActivitySection
                logs={logs.filter(log => log.source === "AUTO")}
              />
            )}

            {SHIFT_GROUPS.map((group) => {
              const logsBySlot: Record<string, typeof logs> = {}

              for (const slot of group.slots) {
                logsBySlot[slot.shift] = logs.filter((log) => log.shift === slot.shift)
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

      <ActivityPickerDialog
        open={canCreate && pickerOpen}
        activeSlot={activeSlot}
        department={departmentQuery}
        onOpenChange={(open) => {
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