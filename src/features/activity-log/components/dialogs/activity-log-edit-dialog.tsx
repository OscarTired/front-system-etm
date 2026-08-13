"use client"

import { useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"

import { FormDialog } from "@/shared/ui/dialogs/form-dialog/form-dialog"
import { FormField } from "@/shared/ui/dialogs/form-dialog/form-field"
import { cn } from "@/shared/utils/utils"
import {
  ContextPicker,
  type ContextPickerValue,
} from "@/features/tasks/components/context-picker"

import { useActivityTypes } from "../../hooks/use-activity-types"
import { myActivityLogQueryKey } from "../../hooks/use-my-activity-log"
import { activityLogService } from "../../services/activity-log.service"
import { getActivityIcon } from "../../constants/activity-icons"
import type {
  ActivityDepartment,
  ActivityLog,
} from "../../types/activity-log.types"

type Props = {
  log: ActivityLog | null
  department?: ActivityDepartment
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Edición de entrada MANUAL: tipo + proyecto/tarea + nota.
 * Requiere UpdateActivityLogDto ampliado en el backend.
 */
export function ActivityLogEditDialog({
  log,
  department = "PRODUCCION",
  open,
  onOpenChange,
}: Props) {
  const queryClient = useQueryClient()
  const { types } = useActivityTypes(false, department)

  const [activityTypeId, setActivityTypeId] = useState("")
  const [context, setContext] = useState<ContextPickerValue>({
    projectId: "",
    taskId: "",
  })
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    if (!open || !log) return
    setActivityTypeId(log.activityType.id)
    setContext({
      projectId: log.project?.id ?? log.projectId ?? "",
      taskId: log.task?.id ?? log.taskId ?? "",
    })
    setNote(log.note ?? "")
    setAttempted(false)
    setSaving(false)
  }, [open, log])

  const activeTypes = useMemo(
    () => types.filter(t => t.active),
    [types],
  )

  const canSave =
    !!activityTypeId && !!context.projectId && !saving

  async function handleSave() {
    if (!log) return
    setAttempted(true)
    if (!activityTypeId || !context.projectId) return

    setSaving(true)
    try {
      await activityLogService.update(log.id, {
        activityTypeId,
        projectId: context.projectId,
        taskId: context.taskId || null,
        note: note.trim() ? note.trim() : null,
      })
      await queryClient.invalidateQueries({
        queryKey: myActivityLogQueryKey(department),
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      open={open}
      title="Editar actividad"
      icon={Pencil}
      canSave={canSave}
      saving={saving}
      saveLabel="Guardar"
      onClose={() => {
        if (saving) return
        onOpenChange(false)
      }}
      onSave={() => {
        void handleSave()
      }}
    >
      <div className="flex flex-col gap-4 p-1">
        <FormField
          label="Tipo de actividad *"
          error={
            attempted && !activityTypeId ? "Elegí un tipo" : undefined
          }
        >
          <div className="flex flex-wrap gap-2">
            {activeTypes.map(type => {
              const Icon = getActivityIcon(type.icon)
              const selected = activityTypeId === type.id
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setActivityTypeId(type.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    selected
                      ? "bg-transparent"
                      : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
                  )}
                  style={
                    selected
                      ? {
                          backgroundColor: `${type.color}22`,
                          color: type.color,
                        }
                      : undefined
                  }
                >
                  <Icon size={14} />
                  {type.label}
                </button>
              )
            })}
          </div>
        </FormField>

        <FormField
          label="Proyecto *"
          error={
            attempted && !context.projectId
              ? "Elegí un proyecto"
              : undefined
          }
        >
          <ContextPicker
            value={context}
            onChange={next => {
              setContext({
                projectId: next.projectId,
                taskId:
                  next.projectId === context.projectId
                    ? next.taskId
                    : "",
              })
            }}
            mode="projects"
          />
        </FormField>

        <FormField label="Tarea (opcional)">
          <ContextPicker
            value={context}
            onChange={next => {
              setContext({
                projectId: next.projectId || context.projectId,
                taskId: next.taskId,
              })
            }}
            mode="tasks"
            taskProjectId={context.projectId || undefined}
          />
        </FormField>

        <FormField label="Nota">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Nota opcional"
            className="w-full resize-none rounded-xl bg-foreground/5 px-3 py-2 text-sm text-foreground outline-none"
          />
        </FormField>
      </div>
    </FormDialog>
  )
}
