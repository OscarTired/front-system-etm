"use client"

import { useState } from "react"

import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"

import { useMyActivityLog } from "../hooks/use-my-activity-log"
import { useDeleteActivityLog } from "../hooks/use-delete-activity-log"
import { useMoveActivityLog } from "../hooks/use-move-activity-log"
import { useActivityDrag } from "../hooks/use-activity-drag"
import type { ShiftSlotDefinition } from "../constants/shift-definitions"
import { SHIFT_GROUPS, getSlotState } from "../constants/shift-definitions"
import type { ActivityDepartment } from "../types/activity-log.types"
import { ShiftGroupSection } from "./shift-group-section"
import { AutoActivitySection } from "./auto-activity-section"
import { ActivityPickerDialog } from "./activity-picker-dialog"
import { ActivityLogSkeleton } from "./activity-log-skeleton"

const TODAY_LABEL = new Date().toLocaleDateString("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
})

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

  const { logs, loading } = useMyActivityLog(department)
  const { deleteLog } = useDeleteActivityLog(department)
  const { moveLog } = useMoveActivityLog(department)

  const { has } = usePermissions()
  const canCreate = has(PermissionCode.ACTIVITY_LOG_CREATE)
  const canDelete = has(PermissionCode.ACTIVITY_LOG_DELETE)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeSlot, setActiveSlot] = useState<ShiftSlotDefinition | null>(null)
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null)

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

  async function handleDeleteLog(id: string) {

    if (!canDelete) return

    setDeletingLogId(id)

    try {
      await deleteLog(id)
    } finally {
      setDeletingLogId(null)
    }

  }

  return (

    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">

      {/* En desktop esto es redundante con "BITÁCORA..." del
          header (que ya dice el nombre de la página) — pero en
          mobile el header queda oculto y el TopBar solo muestra
          "Bitácora", sin fecha. Esta línea es la única referencia a
          "qué día es hoy" que le queda a la persona en mobile, así
          que se mantiene en ambos breakpoints. */}
      <p className="text-xs capitalize text-neutral-500">
        {TODAY_LABEL}
      </p>

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
                  deletingLogId={deletingLogId}
                  canCreate={canCreate}
                  canDelete={canDelete}
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

    </div>

  )

}