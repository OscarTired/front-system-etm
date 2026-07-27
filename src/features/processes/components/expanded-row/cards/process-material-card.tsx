"use client"

import {
  InspectionPanel,
} from "lucide-react"

import {
  ProcessMiniCard,
} from "@/shared/ui/mini-card/process-mini-card"

import type {
  ProcessTask,
} from "../../../types/process.types"

type Props = {
  processTask: ProcessTask
  size?: "default" | "large"
}

export function ProcessMaterialCard({
  processTask,
  size,
}: Props) {
  const material =
    processTask.task.material

  const thickness =
    processTask.task.thickness

  const lotNumber =
    processTask.task.lotNumber

  return (
    <ProcessMiniCard
      size={size}
      label="Material"
      icon={InspectionPanel}
      color={
        material?.color ??
        "#64748B"
      }
      rows={[
        {
          label: "Lote",
          value: lotNumber ? `L${lotNumber}` : "-",
        },
        {
          label: "Material",
          value:
            material?.name?.toUpperCase() ??
            "-",
        },
        {
          label: "Espesor",
          value:
            thickness?.name ??
            "-",
        },
      ]}
    />
  )
}