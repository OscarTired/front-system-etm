"use client"

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { Trash2, Image as ImageIcon, Plus, Copy, Pencil, MoreHorizontal, GripVertical } from "lucide-react"
import { getActivityIcon } from "../constants/activity-icons"
import { getSlotState } from "../constants/shift-definitions"
import { cn } from "@/shared/utils/utils"
import * as Dialog from "@radix-ui/react-dialog"
import { CommentImageDialog } from "@/features/comments/components/comment-image-dialog"

import type { ShiftGroupDefinition, ShiftSlotDefinition } from "../constants/shift-definitions"
import type { ActivityLog, DayShift } from "../types/activity-log.types"
import type { SlotState } from "../types/shift-schedule.types"

type Props = {
  /** true = fila de grid (día); reparte alto disponible. */
  fill?: boolean
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
  /** Estado desde GET /activity-log/shifts (preferido sobre referenceNow). */
  slotState?: (shift: DayShift) => SlotState
  /** true mientras el server no confirmó (optimistic / mutation in flight). */
  isLogBusy?: (logId: string) => boolean
  /** false si ya se alcanzó el tope de duplicados idénticos en la franja. */
  canDuplicateLog?: (log: ActivityLog) => boolean
  onEditLog?: (log: ActivityLog) => void
  /** Click en Duplicar: copia inmediata en la misma franja (sin drag). */
  onDuplicateLog?: (log: ActivityLog) => void
  /** Mismos nodos de fila; solo pulse / sin datos. */
  loading?: boolean
}

const DISTINCT_SHIFT_COLORS = [
  "text-amber-800 dark:text-amber-400",
  "text-emerald-700 dark:text-emerald-400",
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
  slotState,
  isLogBusy,
  canDuplicateLog,
  onEditLog,
  onDuplicateLog,
  loading = false,
  fill = false,
}: Props) {
  const now = referenceNow ?? new Date()
  const [menuOpenLogId, setMenuOpenLogId] = useState<string | null>(null)

  function resolveState(slot: ShiftSlotDefinition): SlotState {
    if (slotState) return slotState(slot.shift)
    return getSlotState(slot, now)
  }

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
    (slot) => resolveState(slot) === "upcoming",
  )

  // Asignamos un color distintivo basado en el índice o nombre del grupo para que coincida con la agenda
  const groupIndex = group.key.charCodeAt(0) % DISTINCT_SHIFT_COLORS.length
  const iconColorClass = DISTINCT_SHIFT_COLORS[groupIndex]

  return (
    <div
      className={cn(
        "rounded-2xl bg-foreground/5 p-4",
        // min-h-0 obligatorio en item de grid 1fr (si no, min-content gana)
        fill && "flex h-full min-h-0 flex-col overflow-hidden",
        groupUpcoming && "opacity-50",
      )}
    >
      <div className="flex shrink-0 items-center gap-2.5">
        <group.icon size={16} className={cn("shrink-0", iconColorClass)} />

        <span className="text-sm font-semibold text-foreground">
          {group.label}
        </span>
      </div>

      <div
        className={cn(
          "mt-3 flex flex-col gap-4",
          fill && "min-h-0 flex-1 overflow-y-auto overscroll-contain themed-scrollbar-y",
        )}
      >
        {group.slots.map((slot) => {
          const state = resolveState(slot)
          const logs = logsBySlot[slot.shift] ?? []

          return (
            <div
              key={slot.shift}
              className={cn(
                "flex flex-col gap-2",
                fill && "min-h-0",
              )}
            >
              {/* Cabecera de la sub-franja */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  {group.slots.length > 1 && (
                    <span className="text-xs font-medium text-muted-foreground shrink-0">
                      {slot.hours}
                    </span>
                  )}

                  {!slot.required && (
                    <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground shrink-0">
                      Opcional
                    </span>
                  )}

                  {(group.slots.length > 1 || !slot.required) && (
                    <span className="h-px flex-1 bg-foreground/10" />
                  )}
                </div>

              </div>

              {/* Lista de registros */}
              <div
                ref={getSlotRefCallback(slot.shift)}
                className={cn(
                  "flex flex-col gap-2 rounded-xl p-1.5 -m-1.5 transition-all",
                  fill && "min-h-0",
                  hoverShift === slot.shift
                    ? "duration-150 bg-emerald-500/20 dark:bg-emerald-500/6 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25),0_12px_32px_-12px_rgba(16,185,129,0.4)]"
                    : "duration-0",
                )}
              >
                {/* Loading = mismo vacío real (CTA), sin inventar filas de log.
                    Igual criterio que agenda: reutiliza el UI real, no un árbol aparte. */}
                {logs.map((log) => {
                  const LogIcon = getActivityIcon(log.activityType.icon)
                  const isManual = log.source === "MANUAL"
                  const isDraggingThis = draggingLogId === log.id
                  const busy =
                    isLogBusy?.(log.id) ?? log.id.startsWith("optimistic-")
                  const allowDup = canDuplicateLog?.(log) ?? true
                  const actionsEnabled = isManual && !busy

                  return (
                    <div
                      key={log.id}
                      className="group/log flex items-stretch gap-1.5"
                    >
                      {/* Handle de drag — mismo contrato visual que DragCell de filas */}
                      {actionsEnabled && canCreate && (
                        <button
                          type="button"
                          data-dnd-row-handle=""
                          data-drag-handle=""
                          title="Mover a otra franja"
                          aria-label="Arrastrar actividad"
                          style={{ touchAction: "none" }}
                          onPointerDown={e => {
                            e.stopPropagation()
                            beginDrag(e, log, e.ctrlKey || e.metaKey)
                          }}
                          className={cn(
                            "flex h-auto w-9 shrink-0 touch-none items-center justify-center rounded-xl",
                            "text-muted-foreground transition-colors",
                            // Desktop: hover. Móvil: active (no hay hover).
                            "hover:bg-foreground/10 hover:text-foreground",
                            "active:bg-foreground/15 active:text-foreground",
                            // Durante el drag: feedback claro, no apagar el handle
                            isDraggingThis &&
                              "bg-foreground/15 text-foreground opacity-100",
                            busy && !isDraggingThis && "opacity-40",
                          )}
                        >
                          <GripVertical size={18} />
                        </button>
                      )}

                      <div
                        className={cn(
                          "group flex min-w-0 flex-1 items-start gap-2.5 rounded-xl bg-foreground/5 p-2.5 transition-opacity",
                          (isDraggingThis || busy) && "opacity-40",
                          busy && "pointer-events-none",
                        )}
                      >
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${log.activityType.color}22`, color: log.activityType.color }}
                      >
                        <LogIcon size={14} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {log.activityType.label}
                        </p>

                        {log.project && (
                          <p className="mt-0.5 truncate text-xs text-primary">
                            {log.project.projectCode} · {log.project.name}
                            {log.task && ` · #${String(log.task.taskNumber).padStart(3, "0")} ${log.task.reference}`}
                          </p>
                        )}

                        {log.note && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {log.note}
                          </p>
                        )}

                        {log.photoUrl && (
                          <button
                            type="button"
                            data-activity-drag-ignore
                            onClick={() => setOpenPhotoUrl(log.photoUrl)}
                            className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-foreground/5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                          >
                            <ImageIcon size={13} />
                            Ver foto adjunta
                          </button>
                        )}
                      </div>

                      {/* Hora a la derecha; al hover los iconos expanden
                          (grid 0fr→1fr) y empujan la hora a la izquierda. */}
                      <div
                        data-activity-drag-ignore
                        onPointerDown={e => e.stopPropagation()}
                        className="ml-auto flex shrink-0 items-center self-start"
                      >
                        <span className="tabular-nums text-xs text-muted-foreground">
                          {new Date(log.loggedAt).toLocaleTimeString("es-PE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        {/* Desktop: reserva ancho solo en hover */}
                        <div
                          className={cn(
                            "hidden tablet:grid",
                            "transition-[grid-template-columns] duration-150 ease-out",
                            "grid-cols-[0fr] group-hover:grid-cols-[1fr] group-focus-within:grid-cols-[1fr]",
                          )}
                        >
                          <div className="min-w-0 overflow-hidden">
                            <div className="flex items-center gap-0.5 pl-1">
                              {isManual && onEditLog && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  title="Editar"
                                  aria-label="Editar entrada"
                                  onClick={() => onEditLog(log)}
                                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-amber-500/10 hover:text-amber-800 dark:text-amber-400 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {isManual && onDuplicateLog && (
                                <button
                                  type="button"
                                  disabled={!canCreate || busy || !allowDup}
                                  title={
                                    !allowDup
                                      ? "Límite de duplicados en esta franja"
                                      : "Duplicar en esta franja"
                                  }
                                  aria-label="Duplicar en esta franja"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!canCreate || busy || !allowDup) return
                                    onDuplicateLog(log)
                                  }}
                                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-sky-500/10 hover:text-sky-700 dark:text-sky-400 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                  <Copy size={14} />
                                </button>
                              )}
                              {(isManual || canDelete) && (
                                <button
                                  type="button"
                                  disabled={
                                    !canDelete ||
                                    busy ||
                                    deletingLogId === log.id
                                  }
                                  title="Eliminar"
                                  aria-label="Eliminar entrada"
                                  onClick={() => onDeleteLog(log)}
                                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Móvil: ⋮ → bottom sheet (Dialog local; cierra al tocar el overlay) */}
                        {isManual && (
                          <div className="tablet:hidden">
                            <Dialog.Root
                              open={menuOpenLogId === log.id}
                              onOpenChange={(open) =>
                                setMenuOpenLogId(open ? log.id : null)
                              }
                            >
                              <Dialog.Trigger asChild>
                                <button
                                  type="button"
                                  disabled={busy}
                                  aria-label="Más acciones"
                                  onPointerDown={(e) => e.stopPropagation()}
                                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                  <MoreHorizontal size={16} />
                                </button>
                              </Dialog.Trigger>
                              <Dialog.Portal>
                                <Dialog.Overlay
                                  className={cn(
                                    "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm",
                                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                                    "data-[state=closed]:duration-200 data-[state=open]:duration-200",
                                  )}
                                  onClick={() => setMenuOpenLogId(null)}
                                  onPointerDown={(e) => {
                                    e.preventDefault()
                                    setMenuOpenLogId(null)
                                  }}
                                />
                                <Dialog.Content
                                  onOpenAutoFocus={(e) => e.preventDefault()}
                                  onCloseAutoFocus={(e) => e.preventDefault()}
                                  onPointerDownOutside={() => setMenuOpenLogId(null)}
                                  onInteractOutside={() => setMenuOpenLogId(null)}
                                  className={cn(
                                    "fixed inset-x-0 bottom-0 z-40 flex max-h-[85dvh] flex-col overflow-hidden",
                                    "rounded-t-3xl bg-popover shadow-2xl outline-none",
                                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                                    "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                                    "data-[state=closed]:duration-250 data-[state=open]:duration-300",
                                  )}
                                >
                                  <Dialog.Title className="sr-only">Más acciones</Dialog.Title>
                                  <div className="flex w-full shrink-0 justify-center pb-1 pt-2.5">
                                    <div className="h-1.5 w-9 rounded-full bg-foreground/15" />
                                  </div>
                                  <div className="flex flex-col gap-0.5 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                                    {onEditLog && (
                                      <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => {
                                          onEditLog(log)
                                          setMenuOpenLogId(null)
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-40"
                                      >
                                        <Pencil size={15} className="text-amber-800 dark:text-amber-400" />
                                        Editar
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      disabled={!canCreate || busy || !allowDup || !onDuplicateLog}
                                      onClick={() => {
                                        onDuplicateLog?.(log)
                                        setMenuOpenLogId(null)
                                      }}
                                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-40"
                                    >
                                      <Copy size={15} className="text-sky-700 dark:text-sky-400" />
                                      Duplicar
                                    </button>
                                    <button
                                      type="button"
                                      disabled={!canDelete || busy || deletingLogId === log.id}
                                      onClick={() => {
                                        onDeleteLog(log)
                                        setMenuOpenLogId(null)
                                      }}
                                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                                    >
                                      <Trash2 size={15} />
                                      Eliminar
                                    </button>
                                  </div>
                                </Dialog.Content>
                              </Dialog.Portal>
                            </Dialog.Root>
                          </div>
                        )}
                      </div>
                    </div>

                      {/* + a la derecha; oculto mientras hay drag (desktop hover no lo muestre) */}
                      {!loading && state !== "upcoming" && canCreate && !draggingLogId && (
                        <button
                          type="button"
                          data-activity-drag-ignore
                          onClick={() => onLogClick(slot)}
                          title="Agregar debajo"
                          aria-label="Agregar otra actividad debajo"
                          className={cn(
                            "flex shrink-0 items-center justify-center overflow-hidden rounded-xl",
                            "bg-foreground/5 text-muted-foreground transition-all duration-150",
                            "w-9 opacity-100",
                            "tablet:w-0 tablet:opacity-0",
                            "tablet:group-hover/log:w-9 tablet:group-hover/log:opacity-100",
                            "hover:bg-foreground/10 hover:text-foreground",
                            "focus-visible:w-9 focus-visible:opacity-100",
                          )}
                        >
                          <Plus size={16} strokeWidth={2.25} />
                        </button>
                      )}
                    </div>
                  )
                })}

                {/* Loading: mismo shell dashed, pulse inline. */}
                {loading && (
                  <div
                    aria-hidden
                    className={cn(
                      "flex min-h-14.5 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3",
                      "animate-pulse pointer-events-none",
                    )}
                  >
                    <span className="h-3 w-28 rounded-md bg-foreground/10" />
                  </div>
                )}

                {!loading && logs.length === 0 && state !== "upcoming" && (
                  <button
                    type="button"
                    disabled={!canCreate}
                    onClick={() => onLogClick(slot)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl min-h-14.5 border border-dashed py-3 text-sm font-medium transition-colors",
                      canCreate
                        ? "hover:bg-foreground/5 hover:text-muted-foreground"
                        : "cursor-not-allowed opacity-50",
                      slot.required
                        ? "border-border text-muted-foreground"
                        : "border-border text-muted-foreground/80",
                    )}
                  >
                    <Plus size={15} />
                    <span>Registrar qué hiciste</span>
                  </button>
                )}

                {/* Upcoming vacío: mismo dashed que el resto, solo texto distinto. */}
                {!loading && logs.length === 0 && state === "upcoming" && (
                  <div
                    className={cn(
                      "flex min-h-14.5 items-center justify-center rounded-xl border border-dashed border-border py-3",
                      "pointer-events-none",
                    )}
                  >
                    <p className="text-center text-xs text-muted-foreground/80">
                      Todavía no llega esta franja
                    </p>
                  </div>
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
