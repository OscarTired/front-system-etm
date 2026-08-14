"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import { EntityAuditInfo } from "@/shared/ui/entity-audit-info/entity-audit-info"
import { TaskMaterialInfo } from "@/features/tasks/components/task-material-info"

import { cn } from "@/shared/utils/utils"

import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { IconAction } from "@/shared/ui/actions/icon-action"
import { ActionDialog } from "@/shared/ui/dialogs/action-dialog/action-dialog"

import { TaskDialog } from "../dialog/task-dialog"
import { useTasks } from "../../hooks/use-tasks"
import type { Task } from "../../types/task.types"

type TaskRowActionsProps = {
  task: Task
  className?: string
}

export function TaskRowActions({ task, className }: TaskRowActionsProps) {
  const { remove } = useTasks()
  const { has } = usePermissions()

  const canUpdate = has(PermissionCode.TASK_UPDATE)
  const canDelete = has(PermissionCode.TASK_DELETE)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleDelete = async () => {
    if (!canDelete) {
      return
    }

    try {
      await remove(task.id)
      setDeleteOpen(false)
    } catch (error) {
      console.error("TASK DELETE ERROR", error)
    }
  }

  return (
    <>
      <div className={cn("flex items-center gap-1", className)}>
        <EntityAuditInfo
          createdAt={task.createdAt}
          updatedAt={task.updatedAt}
          createdBy={task.createdBy}
          updatedBy={task.updatedBy}
        />
        <TaskMaterialInfo task={task} />
        <IconAction
          icon={Pencil}
          disabled={!canUpdate}
          onClick={() => {
            if (!canUpdate) return
            setEditOpen(true)
          }}
        />

        <IconAction
          icon={Trash2}
          variant="danger"
          disabled={!canDelete}
          onClick={() => {
            if (!canDelete) return
            setDeleteOpen(true)
          }}
        />
      </div>

      <TaskDialog
        open={canUpdate && editOpen}
        task={task}
        onClose={() => setEditOpen(false)}
      />

      <ActionDialog
        open={canDelete && deleteOpen}
        title="Eliminar tarea"
        description={`Se eliminará "${task.reference}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        submittingLabel="Eliminando..."
        variant="danger"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  )
}