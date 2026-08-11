"use client"

import type { Task } from "../../types/task.types"

import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"

import { taskAccess } from "../../access/task-access"
import { displayProjectCode } from "@/features/projects/utils/display-project-code"

type Props={
  task:Task
}

export function TaskRowDragPreview({
  task,
}:Props){

  const stage=
    taskAccess.stageLabel(task)

  const status=
    taskAccess.statusLabel(task)

  return(

    <div className="w-130 rounded-2xl border border-white/10 bg-[#101012] p-4 shadow-[0_40px_120px_rgba(0,0,0,.75)] pointer-events-none">

      <div className="space-y-3">

        <div className="flex items-center justify-between">

          <span className="text-lg font-bold text-neutral-400">
            #{String(task.taskNumber).padStart(3,"0")}
          </span>

          <span className="text-sm text-neutral-500">
            {task.deliveryDate}
          </span>

        </div>

        <h3 className="text-base font-semibold text-white">
          {task.reference}
        </h3>

        <div className="text-sm text-neutral-400">
          {displayProjectCode(task.project.projectCode)}
          {" • "}
          L{task.lotNumber}
          {" • "}
          {task.pieces} PIEZAS
        </div>

        <div className="flex gap-2">

          <DynamicBadge
            label={task.priority.name}
            color={task.priority.color}
          />

          <DynamicBadge
            label={stage.label}
            color={stage.color}
            icon={stage.icon}
          />

          <DynamicBadge
            label={status.label}
            color={status.color}
            icon={status.icon}
          />

        </div>

      </div>

    </div>

  )

}
