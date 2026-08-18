"use client"

import { useEffect, useMemo, useState } from "react"
import {
  MessageSquarePlus,
  PenTool,
} from "lucide-react"

import { FormDialog } from "@/shared/ui/dialogs/form-dialog/form-dialog"
import { FormField } from "@/shared/ui/dialogs/form-dialog/form-field"
import { ContextPicker } from "@/features/tasks/components/context-picker"
import { EngineeringConvocarSelect } from "./engineering-convocar-select"
import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import type { User } from "@/features/users/types/user.types"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { EntityChip } from "@/shared/ui/entity-chip/entity-chip"
import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"
import { WORKFLOW_STATUS_DEFINITIONS } from "@/features/workflow/constants/workflow-status-definitions"
import { cn } from "@/shared/utils/utils"

import {
  ENGINEERING_PROCESS_DEFINITIONS,
  ENGINEERING_PROCESS_ORDER,
  type EngineeringProcessCode,
} from "../constants/engineering-process-definitions"
import type {
  EngineeringTask,
  EngineeringTaskStatus,
} from "../types/engineering-task.types"
import { useEngineeringTaskMutations } from "../hooks/use-engineering-task-mutations"
import { isEngineeringUser } from "../utils/is-engineering-user"

const STATUS_OPTIONS: {
  value: EngineeringTaskStatus
  label: string
  color: string
}[] = [
  { value: "QUEUE", label: "En cola", color: "#64748B" },
  { value: "PENDING", label: "Pendiente", color: "#2563EB" },
  { value: "PROGRESS", label: "En proceso", color: "#F59E0B" },
  { value: "COMPLETED", label: "Completado", color: "#16A34A" },
]

type Props = {
  open: boolean
  onClose: () => void
  task?: EngineeringTask | null
  defaultProcessCode?: EngineeringProcessCode
  defaultProjectId?: string
  defaultAssigneeId?: string
  /** Cuando true, el proceso viene del contexto (columna) y no se muestra el grid. */
  lockProcess?: boolean
  /** Cuando true, el asignado viene del contexto (fila de usuario) y no se muestra UserSelect editable. */
  lockAssignee?: boolean
}

/** Shell/UX alineado a ActivityPickerDialog. Chips reutilizan EntityChip (mismo contrato que KanbanCard). */
export function EngineeringTaskDialog({
  open,
  onClose,
  task,
  defaultProcessCode,
  defaultProjectId,
  defaultAssigneeId,
  lockProcess = false,
  lockAssignee = false,
}: Props) {
  const isEdit = !!task
  const { users } = useUsersDirectory()
  const { create, update } = useEngineeringTaskMutations()

  const assignableUsers = useMemo(
    () => (users as User[]).filter(isEngineeringUser),
    [users],
  )

  const [title, setTitle] = useState("")
  const [projectId, setProjectId] = useState("")
  const [processCode, setProcessCode] = useState<EngineeringProcessCode>(
    "MECHANICAL_DESIGN",
  )
  const [status, setStatus] = useState<EngineeringTaskStatus>("QUEUE")
  const [assigneeId, setAssigneeId] = useState<string | undefined>()
  const [note, setNote] = useState("")
  const [showDetail, setShowDetail] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  useEffect(() => {
    if (!open) return
    if (task) {
      setTitle(task.title)
      setProjectId(task.projectId)
      setProcessCode(task.processCode)
      setStatus(task.status)
      setAssigneeId(task.assigneeId ?? undefined)
      setNote(task.note ?? "")
      setShowDetail(!!task.note)
    } else {
      setTitle("")
      setProjectId(defaultProjectId ?? "")
      setProcessCode(defaultProcessCode ?? "MECHANICAL_DESIGN")
      setStatus("QUEUE")
      setAssigneeId(defaultAssigneeId)
      setNote("")
      setShowDetail(false)
    }
    setSubmitAttempted(false)
  }, [open, task, defaultProcessCode, defaultProjectId, defaultAssigneeId])

  const assignee = assignableUsers.find(u => u.id === assigneeId)
  const processDef = ENGINEERING_PROCESS_DEFINITIONS[processCode]

  const canSave =
    title.trim().length > 0 &&
    !!projectId &&
    !!processCode &&
    !create.isPending &&
    !update.isPending

  const errors = {
    title:
      submitAttempted && !title.trim() ? "El título es obligatorio" : undefined,
    projectId:
      submitAttempted && !projectId ? "El proyecto es obligatorio" : undefined,
  }

  async function handleSave() {
    if (!canSave) {
      setSubmitAttempted(true)
      return
    }
    if (isEdit && task) {
      await update.mutateAsync({
        id: task.id,
        dto: {
          title: title.trim(),
          processCode,
          status,
          assigneeId: assigneeId ?? null,
          note: note.trim() || null,
        },
      })
    } else {
      await create.mutateAsync({
        title: title.trim(),
        projectId,
        processCode,
        assigneeId,
        note: note.trim() || undefined,
      })
    }
    onClose()
  }

  const showProcessGrid = !lockProcess && !isEdit
  const showAssigneeSelect = !lockAssignee

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Editar tarea" : "Nueva tarea de ingeniería"}
      icon={PenTool}
      canSave={canSave}
      saving={create.isPending || update.isPending}
      saveLabel={isEdit ? "Guardar" : "Crear"}
      savingLabel="Guardando..."
      onClose={onClose}
      onSave={() => void handleSave()}
    >
      <div className="flex flex-col gap-4">
        <FormField label="Título *" error={errors.title}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej. Lista de procura tablero"
            className="h-10 w-full rounded-xl bg-foreground/5 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/80 focus:bg-foreground/10"
          />
        </FormField>

        <div className="flex flex-col gap-2 rounded-xl bg-foreground/5 p-3">
          <FormField label="Proyecto *" error={errors.projectId}>
            <ContextPicker
              mode="projects"
              value={{ projectId, taskId: "" }}
              onChange={v => setProjectId(v.projectId)}
            />
          </FormField>
        </div>

        {/* Proceso: grid solo en flujo general; si lock o edición → chip de solo lectura */}
        <div className="flex flex-col gap-2">
          <div className="mb-0.5 flex items-center justify-between px-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Proceso
            </span>
          </div>

          {showProcessGrid ? (
            <div className="flex flex-wrap gap-2">
              {ENGINEERING_PROCESS_ORDER.map(code => {
                const def = ENGINEERING_PROCESS_DEFINITIONS[code]
                const Icon = ENTITY_ICONS[def.icon]
                const isSelected = processCode === code
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setProcessCode(code)}
                    className="cursor-pointer active:scale-95"
                  >
                    <DynamicBadge
                      label={def.short}
                      color={def.color}
                      iconComponent={Icon}
                      muted={!isSelected}
                      width="process"
                    />
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-0.5">
              <EntityChip
                label={processDef.label}
                color={processDef.color}
                icon={processDef.icon}
              />
              {lockProcess && (
                <span className="text-[11px] text-muted-foreground">
                  Fijado por contexto
                </span>
              )}
            </div>
          )}
        </div>

        {isEdit && (
          <div className="flex flex-col gap-2">
            <span className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Estado
            </span>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => {
                const isSelected = status === opt.value
                const def = WORKFLOW_STATUS_DEFINITIONS[opt.value]
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className="cursor-pointer active:scale-95"
                  >
                    <DynamicBadge
                      label={def.label}
                      color={def.color}
                      icon={def.icon}
                      muted={!isSelected}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <FormField label="Convocar">
          {showAssigneeSelect ? (
            <>
              <EngineeringConvocarSelect
                users={assignableUsers}
                value={assignee}
                onChange={u => setAssigneeId(u?.id)}
              />
              {assignableUsers.length === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  No hay usuarios con rol Ingeniería. Asígnalo en Acceso.
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 px-0.5">
              {assignee ? (
                <DynamicBadge
                  label={assignee.name}
                  color={assignee.color}
                  icon={assignee.icon}
                  width="field"
                />
              ) : (
                <span className="text-sm text-muted-foreground">Sin asignar</span>
              )}
              {lockAssignee && (
                <span className="text-[11px] text-muted-foreground">
                  Fijado por contexto
                </span>
              )}
            </div>
          )}
        </FormField>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Detalle
            </span>
            <button
              type="button"
              onClick={() => setShowDetail(prev => !prev)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors tablet:hidden",
                showDetail || note.trim()
                  ? "bg-foreground/12 text-foreground"
                  : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
              )}
            >
              <MessageSquarePlus size={15} />
              <span>
                {showDetail || note.trim()
                  ? "Ocultar detalle"
                  : "Añadir detalle"}
              </span>
              {note.trim() && (
                <span className="absolute -right-1 -top-1 size-2 rounded-full bg-emerald-500" />
              )}
            </button>
          </div>

          <div
            className={cn(
              "overflow-hidden transition-all duration-200 tablet:max-h-none tablet:opacity-100 tablet:pointer-events-auto",
              showDetail || note.trim()
                ? "max-h-40 opacity-100"
                : "max-h-0 opacity-0 pointer-events-none tablet:max-h-none tablet:opacity-100",
            )}
          >
            <div className="flex flex-col gap-2 rounded-xl bg-foreground/5 p-2.5">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Detalle o alcance (opcional)..."
                className="min-h-16 min-w-0 flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/80"
              />
            </div>
          </div>
        </div>
      </div>
    </FormDialog>
  )
}
