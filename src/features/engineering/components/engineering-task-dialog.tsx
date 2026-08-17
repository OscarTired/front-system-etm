"use client"

import { useEffect, useMemo, useState } from "react"
import { PenTool } from "lucide-react"

import { FormDialog } from "@/shared/ui/dialogs/form-dialog/form-dialog"
import { ContextPicker } from "@/features/tasks/components/context-picker"
import { UserSelect } from "@/features/users/components/user-select"
import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import type { User } from "@/features/users/types/user.types"
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

const STATUS_OPTIONS: { value: EngineeringTaskStatus; label: string }[] = [
  { value: "QUEUE", label: "En cola" },
  { value: "PENDING", label: "Pendiente" },
  { value: "PROGRESS", label: "En proceso" },
  { value: "COMPLETED", label: "Completado" },
]

type Props = {
  open: boolean
  onClose: () => void
  task?: EngineeringTask | null
  /** Prefills al crear */
  defaultProcessCode?: EngineeringProcessCode
  defaultProjectId?: string
  defaultAssigneeId?: string
}

export function EngineeringTaskDialog({
  open,
  onClose,
  task,
  defaultProcessCode,
  defaultProjectId,
  defaultAssigneeId,
}: Props) {
  const isEdit = !!task
  const { users } = useUsersDirectory()
  const { create, update } = useEngineeringTaskMutations()

  const engineeringUsers = useMemo(
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

  useEffect(() => {
    if (!open) return
    if (task) {
      setTitle(task.title)
      setProjectId(task.projectId)
      setProcessCode(task.processCode)
      setStatus(task.status)
      setAssigneeId(task.assigneeId ?? undefined)
      setNote(task.note ?? "")
    } else {
      setTitle("")
      setProjectId(defaultProjectId ?? "")
      setProcessCode(defaultProcessCode ?? "MECHANICAL_DESIGN")
      setStatus("QUEUE")
      setAssigneeId(defaultAssigneeId)
      setNote("")
    }
  }, [open, task, defaultProcessCode, defaultProjectId, defaultAssigneeId])

  const assignee = engineeringUsers.find(u => u.id === assigneeId)

  const canSave =
    title.trim().length > 0 &&
    !!projectId &&
    !!processCode &&
    !create.isPending &&
    !update.isPending

  async function handleSave() {
    if (!canSave) return
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

  const fieldClass =
    "h-10 w-full rounded-xl bg-foreground/5 px-3 text-sm text-foreground outline-none focus:bg-foreground/10"

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Editar tarea" : "Nueva tarea de ingeniería"}
      icon={PenTool}
      canSave={canSave}
      saving={create.isPending || update.isPending}
      saveLabel={isEdit ? "Guardar" : "Crear"}
      onClose={onClose}
      onSave={() => void handleSave()}
    >
      <div className="flex flex-col gap-4 p-1">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Título
          </span>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={fieldClass}
            placeholder="Ej. Lista de procura tablero"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Proyecto
          </span>
          <ContextPicker
            mode="projects"
            value={{ projectId, taskId: "" }}
            onChange={v => setProjectId(v.projectId)}
          />
          {!projectId && (
            <span className="text-[11px] text-muted-foreground">
              Obligatorio — el stage del proyecto no bloquea la creación
            </span>
          )}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Proceso
          </span>
          <select
            value={processCode}
            onChange={e =>
              setProcessCode(e.target.value as EngineeringProcessCode)
            }
            className={fieldClass}
          >
            {ENGINEERING_PROCESS_ORDER.map(code => (
              <option key={code} value={code}>
                {ENGINEERING_PROCESS_DEFINITIONS[code].short} ·{" "}
                {ENGINEERING_PROCESS_DEFINITIONS[code].label}
              </option>
            ))}
          </select>
        </label>

        {isEdit && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Estado
            </span>
            <select
              value={status}
              onChange={e =>
                setStatus(e.target.value as EngineeringTaskStatus)
              }
              className={fieldClass}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Asignar a
          </span>
          <UserSelect
            items={engineeringUsers}
            value={assignee}
            placeholder="Sin asignar"
            onChange={u => setAssigneeId(u?.id)}
          />
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Nota (opcional)
          </span>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            className={cn(
              fieldClass,
              "h-auto min-h-[4.5rem] resize-none py-2",
            )}
            placeholder="Detalle o alcance"
          />
        </label>
      </div>
    </FormDialog>
  )
}
