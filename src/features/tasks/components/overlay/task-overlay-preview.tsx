"use client"

import type {
  Task,
} from "../../types/task.types"

import {
  DynamicBadge,
} from "@/shared/ui/badge/dynamic-badge"

import {
  taskAccess,
} from "../../access/task-access"

type Props={
  task:Task
}

export function TaskOverlayPreview({
  task,
}:Props){

  const stage=
    taskAccess.stageLabel(
      task,
    )

  return(

    <div className="flex min-w-225 items-center gap-4 px-4 py-3">

      <span className="w-16 font-semibold text-foreground">

        {String(task.taskNumber).padStart(3,"0")}

      </span>

      <DynamicBadge
        label={task.project.client.name}
        color={task.project.client.color}
        icon={task.project.client.icon}
        width="field"
      />

      <span className="min-w-55 text-foreground">

        {task.reference}

      </span>

      <DynamicBadge
        label={task.priority.name}
        color={task.priority.color}
        icon={task.priority.icon}
        width="field"
      />

      <DynamicBadge
        label={stage.label}
        color={stage.color}
        icon={stage.icon}
        width="field"
      />

    </div>

  )

}