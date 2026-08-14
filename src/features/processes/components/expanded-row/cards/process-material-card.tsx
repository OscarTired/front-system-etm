"use client"

import { InspectionPanel } from "lucide-react"

import { ProcessMiniCard } from "@/shared/ui/mini-card/process-mini-card"
import {
  getTaskMaterialLabel,
  getTaskPiecesTotal,
} from "@/features/tasks/utils/task-material-summary"
import { TaskMaterialInfo } from "@/features/tasks/components/task-material-info"

import type { ProcessTask } from "../../../types/process.types"

type Props = {
  processTask: ProcessTask
  size?: "default" | "large"
}

export function ProcessMaterialCard({
  processTask,
  size,
}: Props) {
  const task = processTask.task
  const material = task.material
  const thickness = task.thickness
  const lotNumber = task.lotNumber
  const multi =
    (task.materialLines?.length ?? 0) > 1

  return (
    <div className="relative h-full min-h-0">
      {multi && (
        <div className="absolute right-2 top-2 z-10">
          <TaskMaterialInfo task={task} />
        </div>
      )}
      <ProcessMiniCard
        size={size}
        label="Material"
        icon={InspectionPanel}
        color={material?.color ?? "#64748B"}
        rows={[
          {
            label: "Lote",
            value: lotNumber ? `L${lotNumber}` : "-",
          },
          {
            label: "Material",
            value: getTaskMaterialLabel(task),
          },
          {
            label: multi ? "Piezas" : "Espesor",
            value: multi
              ? `${getTaskPiecesTotal(task)}`
              : (thickness?.name ?? "-"),
          },
          ...(multi
            ? [
                {
                  label: "Principal",
                  value: thickness?.name ?? "-",
                },
              ]
            : []),
        ]}
      />
    </div>
  )
}
