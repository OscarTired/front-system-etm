"use client"

import { useState } from "react"
import { Trash2, Image as ImageIcon, Plus } from "lucide-react"
import { getActivityIcon } from "../constants/activity-icons"
import { getSlotState } from "../constants/shift-definitions"
import { cn } from "@/shared/utils/utils"
import { CommentImageDialog } from "@/features/comments/components/comment-image-dialog"

import type { ShiftGroupDefinition, ShiftSlotDefinition } from "../constants/shift-definitions"
import type { ActivityLog } from "../types/activity-log.types"

type Props = {
  group: ShiftGroupDefinition
  logsBySlot: Record<string, ActivityLog[]>
  onLogClick: (slot: ShiftSlotDefinition) => void
  onDeleteLog: (id: string) => void
  deletingLogId?: string | null
  canCreate: boolean
  canDelete: boolean
}

export function ShiftGroupSection({
  group,
  logsBySlot,
  onLogClick,
  onDeleteLog,
  deletingLogId,
  canCreate,
  canDelete,
}: Props) {
  const now = new Date()

  // Un solo dialog compartido por todo el grupo — CommentImageDialog
  // es genérico (solo necesita una URL), no depende de comentarios.
  const [openPhotoUrl, setOpenPhotoUrl] = useState<string | null>(null)

  // El grupo entero se ve "apagado" solo si TODAS sus sub-franjas
  // todavía no llegan (ej. es de mañana y falta para las 8:30) —
  // si al menos una ya empezó, el grupo se muestra activo aunque la
  // otra sub-franja siga en "upcoming".
  const groupUpcoming = group.slots.every(
    (slot) => getSlotState(slot, now) === "upcoming",
  )

  return (
    <div
      className={cn(
        "rounded-2xl bg-white/3 p-4",
        groupUpcoming && "opacity-50",
      )}
    >
      <div className="flex items-center gap-2.5">
        <group.icon size={16} className="text-neutral-400" />

        <span className="text-sm font-semibold text-neutral-200">
          {group.label}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-4">
        {group.slots.map((slot, index) => {
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
              <div className="flex flex-col gap-2">
                {logs.map((log) => {
                  const LogIcon = getActivityIcon(log.activityType.icon)

                  return (
                    <div
                      key={log.id}
                      className="group flex items-start gap-2.5 rounded-xl bg-white/4 p-2.5"
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
                          onClick={() => onDeleteLog(log.id)}
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

                {/* Sin registros aún en esta franja activa */}
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

                {/* Si ya hay registros en la franja, botón para agregar uno nuevo */}
                {logs.length > 0 && state !== "upcoming" && (
                  <button
                    type="button"
                    disabled={!canCreate}
                    onClick={() => onLogClick(slot)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/6 py-2 text-xs font-medium text-neutral-400 transition-colors hover:border-white/10 hover:bg-white/4 hover:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    <Plus size={14} />
                    <span>Agregar otra actividad</span>
                  </button>
                )}

                {/* Franja que aún no llega */}
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