"use client"

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { Trash2, Image as ImageIcon, Plus } from "lucide-react"
import { getActivityIcon } from "../constants/activity-icons"
import { getSlotState } from "../constants/shift-definitions"
import { cn } from "@/shared/utils/utils"
import { CommentImageDialog } from "@/features/comments/components/comment-image-dialog"

import type { ShiftGroupDefinition, ShiftSlotDefinition } from "../constants/shift-definitions"
import type { ActivityLog, DayShift } from "../types/activity-log.types"

type Props = {
  group: ShiftGroupDefinition
  logsBySlot: Record<string, ActivityLog[]>
  onLogClick: (slot: ShiftSlotDefinition) => void
  onDeleteLog: (log: ActivityLog) => void
  beginDrag: (e: ReactPointerEvent<HTMLElement>, log: ActivityLog, isDuplicate?: boolean) => void
  registerSlot: (shift: DayShift, el: HTMLElement | null) => void
  draggingLogId: string | null
  hoverShift: DayShift | null
  deletingLogId?: string | null
  canCreate: boolean
  canDelete: boolean
  referenceNow?: Date
}

const DISTINCT_SHIFT_COLORS = [
  "text-amber-400",
  "text-emerald-400",
  "text-rose-400",
  "text-violet-400",
  "text-teal-400",
  "text-fuchsia-400",
]

export function ShiftGroupSection({
  group,
  logsBySlot,
  onLogClick,
  onDeleteLog,
  beginDrag,
  registerSlot,
  draggingLogId,
  hoverShift,
  deletingLogId,
  canCreate,
  canDelete,
  referenceNow,
}: Props) {
  const now = referenceNow ?? new Date()

  // Un solo dialog compartido por todo el grupo — CommentImageDialog
  // es genérico (solo necesita una URL), no depende de comentarios.
  const [openPhotoUrl, setOpenPhotoUrl] = useState<string | null>(null)

  const slotRefCallbacks = useRef<Map<DayShift, (el: HTMLElement | null) => void>>(new Map())

  const getSlotRefCallback = useCallback((shift: DayShift) => {
    let callback = slotRefCallbacks.current.get(shift)

    if (!callback) {
      callback = (el: HTMLElement | null) => registerSlot(shift, el)
      slotRefCallbacks.current.set(shift, callback)
    }

    return callback
  }, [registerSlot])

  const groupUpcoming = group.slots.every(
    (slot) => getSlotState(slot, now) === "upcoming",
  )

  // Asignamos un color distintivo basado en el índice o nombre del grupo para que coincida con la agenda
  const groupIndex = group.key.charCodeAt(0) % DISTINCT_SHIFT_COLORS.length
  const iconColorClass = DISTINCT_SHIFT_COLORS[groupIndex]

  return (
    <div
      className={cn(
        "rounded-2xl bg-white/3 p-4",
        groupUpcoming && "opacity-50",
      )}
    >
      <div className="flex items-center gap-2.5">
        <group.icon size={16} className={cn("shrink-0", iconColorClass)} />

        <span className="text-sm font-semibold text-neutral-200">
          {group.label}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-4">
        {group.slots.map((slot) => {
          const state = getSlotState(slot, now)
          const logs = logsBySlot[slot.shift] ?? []

          return (
            <div key={slot.shift} className="flex flex-col gap-2">
              {/* Cabecera de la sub-franja */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  {group.slots.length > 1 && (
                    <span className="text-xs font-medium text-neutral-400 shrink-0">
                      {slot.hours}
                    </span>
                  )}

                  {!slot.required && (
                    <span className="rounded-full bg-white/6 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500 shrink-0">
                      Opcional
                    </span>
                  )}

                  {(group.slots.length > 1 || !slot.required) && (
                    <span className="h-px flex-1 bg-white/8" />
                  )}
                </div>

                {/* Botón "+" rápido en la cabecera si la franja está activa y ya contiene registros */}
                {state !== "upcoming" && logs.length > 0 && (
                  <button
                    type="button"
                    disabled={!canCreate}
                    onClick={() => onLogClick(slot)}
                    title="Agregar otra actividad"
                    aria-label="Agregar otra actividad"
                    className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={14} />
                    <span>Agregar</span>
                  </button>
                )}
              </div>

              {/* Lista de registros */}
              <div
                ref={getSlotRefCallback(slot.shift)}
                className={cn(
                  "flex flex-col gap-2 rounded-xl p-1.5 -m-1.5 transition-all",
                  hoverShift === slot.shift
                    ? "duration-150 bg-emerald-500/6 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25),0_12px_32px_-12px_rgba(16,185,129,0.4)]"
                    : "duration-0",
                )}
              >
                {logs.map((log) => {
                  const LogIcon = getActivityIcon(log.activityType.icon)
                  const isManual = log.source === "MANUAL"
                  const isDraggingThis = draggingLogId === log.id

                  return (
                    <div
                      key={log.id}
                      onPointerDown={(e) => {
                        // Las automáticas nunca se arrastran, ni con
                        // Ctrl — las genera el sistema solo, no tiene
                        // sentido mover ni duplicar algo que la
                        // persona no registró a mano.
                        if (!isManual || !canCreate) return
                        if ((e.target as HTMLElement).closest("[data-activity-drag-ignore]")) return
                        // Ctrl/Cmd sobre una manual = duplicar en vez
                        // de mover (el original queda intacto).
                        beginDrag(e, log, e.ctrlKey || e.metaKey)
                      }}
                      className={cn(
                        "group flex items-start gap-2.5 rounded-xl bg-white/4 p-2.5 transition-opacity",
                        isManual && canCreate && "cursor-grab touch-none active:cursor-grabbing",
                        isDraggingThis && "opacity-40",
                      )}
                    >
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${log.activityType.color}22`, color: log.activityType.color }}
                      >
                        <LogIcon size={14} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-200">
                          {log.activityType.label}
                        </p>

                        {log.project && (
                          <p className="mt-0.5 truncate text-xs text-cyan-400">
                            {log.project.projectCode} · {log.project.name}
                            {log.task && ` · #${String(log.task.taskNumber).padStart(3, "0")} ${log.task.reference}`}
                          </p>
                        )}

                        {log.note && (
                          <p className="mt-0.5 truncate text-xs text-neutral-500">
                            {log.note}
                          </p>
                        )}

                        {log.photoUrl && (
                          <button
                            type="button"
                            data-activity-drag-ignore
                            onClick={() => setOpenPhotoUrl(log.photoUrl)}
                            className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <ImageIcon size={13} />
                            Ver foto adjunta
                          </button>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-neutral-500">
                          {new Date(log.loggedAt).toLocaleTimeString("es-PE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        <button
                          type="button"
                          data-activity-drag-ignore
                          onClick={() => onDeleteLog(log)}
                          disabled={!canDelete || deletingLogId === log.id}
                          aria-label="Eliminar entrada"
                          className="rounded-md p-1 text-neutral-600 opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-400 focus-visible:opacity-100 disabled:opacity-35 disabled:cursor-not-allowed tablet:opacity-0 tablet:group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {logs.length === 0 && state !== "upcoming" && (
                  <button
                    type="button"
                    disabled={!canCreate}
                    onClick={() => onLogClick(slot)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border border-dashed py-3 text-sm font-medium transition-colors",
                      canCreate
                        ? "hover:bg-white/4 hover:text-neutral-300"
                        : "cursor-not-allowed opacity-50",
                      slot.required
                        ? "border-white/10 text-neutral-500"
                        : "border-white/6 text-neutral-600",
                    )}
                  >
                    <Plus size={15} />
                    <span>Registrar qué hiciste</span>
                  </button>
                )}

                {logs.length === 0 && state === "upcoming" && (
                  <p className="py-2 text-center text-xs text-neutral-600">
                    Todavía no llega esta franja
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <CommentImageDialog
        imageUrl={openPhotoUrl}
        onClose={() => setOpenPhotoUrl(null)}
      />
    </div>
  )
}