"use client"

import { useMemo, useState } from "react"

import { Trash2 } from "lucide-react"

import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"

import { DateNavigator } from "@/shared/ui/date-picker/components/date-navigator"
import { toISODateString } from "@/shared/ui/date-picker/utils/date-format"
import { ActionDialog } from "@/shared/ui/dialogs/action-dialog/action-dialog"

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

type Props = {
  // Bitácora de Producción (default, con franjas + auto-registro) o
  // de Ingeniería (mismo motor, 100% manual, sin AutoActivitySection
  // porque ahí nunca hay logs AUTO — no hay WorkflowStep que
  // completar en Ingeniería).
  department?: ActivityDepartment
}

export function ActivityLogPageContent({
  department = "PRODUCCION",
}: Props = {}) {

  // Mismo mecanismo de navegación por día que Bitácora del Equipo
  // (DateNavigator), pero sin selector de usuario — acá siempre es
  // "yo", no hace falta elegir a quién ver.
  const [date, setDate] = useState<Date>(new Date())

  const dateISO = toISODateString(date)
  const isToday = dateISO === toISODateString(new Date())

  // Si es hoy, no se manda `date` al hook — mismo query key "sin
  // fecha" que usan los hooks de mutación (crear/borrar/mover), que
  // solo se habilitan viendo el día de hoy. Así el cache de fetch y
  // el de las mutaciones optimistas apuntan al mismo lugar.
  const { logs, loading } = useMyActivityLog(department, isToday ? undefined : dateISO)
  const { deleteLog } = useDeleteActivityLog(department)
  const { moveLog } = useMoveActivityLog(department)

  const { has } = usePermissions()

  // Editar/registrar/mover/borrar solo tiene sentido para el día de
  // HOY — un día pasado es historial. Ver un día anterior nunca
  // debería permitir tocar sus entradas, ni aunque el permiso lo
  // habilite en general.
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

    moveLog({ id, shift }).catch(() => {
      // El rollback ya lo maneja el onError del hook — no hay nada
      // más que hacer acá, la tarjeta vuelve sola a su franja.
    })

  }

  function isShiftAvailable(shift: ShiftSlotDefinition["shift"]) {

    if (!isToday) {
      return false
    }

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

  // Contra qué hora se decide "¿ya llegó esta franja?" en cada
  // grupo — ver comentario en ShiftGroupSection.referenceNow. Un
  // día pasado usa las 23:59 de ESE día (todas sus franjas ya
  // "llegaron" hace tiempo), no la hora real de ahora.
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

      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white/2 p-4">

        <DateNavigator
          value={date}
          onChange={next => setDate(next ?? new Date())}
          placeholder="Fecha"
          maxDate={new Date()}
        />

        <div className="rounded-lg bg-white/5 px-3 py-2 text-sm text-neutral-400">
          {logs.length} {logs.length === 1 ? "entrada" : "entradas"}
        </div>

      </div>

      <div className="flex flex-col gap-3">

        {loading ? (

          <ActivityLogSkeleton />

        ) : (

          <>

            {department === "PRODUCCION" && (

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
        department={department}
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