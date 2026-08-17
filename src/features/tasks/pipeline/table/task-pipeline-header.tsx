"use client"

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Puzzle,
} from "lucide-react"

import type { Task } from "@/features/tasks/types/task.types"

import { ProcessMiniCard } from "@/shared/ui/mini-card/process-mini-card"
import {
  KpiCarousel,
  type KpiItem,
} from "@/shared/ui/mini-card/kpi-carousel"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

import { getPipelineKpis } from "../utils/get-pipeline-kpis"
import { PIPELINE_KPI_COLORS } from "../utils/process-columns"

type Props = {
  tasks: Task[]
}

export function TaskPipelineHeader({ tasks }: Props) {
  const kpis = getPipelineKpis(tasks)
  const { isMobile } = useResponsive()
  const size = isMobile ? "large" : "default"

  const items: KpiItem[] = [
    {
      icon: ClipboardList,
      color: PIPELINE_KPI_COLORS.tasks,
      label: "Total tareas",
      value: kpis.totalTasks,
      rows: [
        { label: "Total", value: kpis.totalTasks },
        { label: "En proceso", value: kpis.inProgressCount },
      ],
    },
    {
      icon: Puzzle,
      color: PIPELINE_KPI_COLORS.pieces,
      label: "Piezas",
      value: kpis.totalPieces,
      rows: [
        { label: "Total", value: kpis.totalPieces },
        {
          label: "Promedio",
          value:
            kpis.totalTasks > 0
              ? Math.round(kpis.totalPieces / kpis.totalTasks)
              : 0,
        },
      ],
    },
    {
      icon: AlertTriangle,
      color: PIPELINE_KPI_COLORS.urgent,
      label: "Urgentes",
      value: kpis.urgentCount,
      rows: [
        { label: "Total", value: kpis.urgentCount },
        {
          label: "Porcentaje",
          value:
            kpis.totalTasks > 0
              ? `${Math.round((kpis.urgentCount / kpis.totalTasks) * 100)}%`
              : "0%",
        },
      ],
    },
    {
      icon: CheckCircle2,
      color: PIPELINE_KPI_COLORS.progress,
      label: "Avance",
      value: `${kpis.progressPercent}%`,
      rows: [
        { label: "Finalizadas", value: kpis.completedCount },
        { label: "Progreso", value: `${kpis.progressPercent}%` },
      ],
    },
  ]

  const cards = items.map(item => (
    <ProcessMiniCard
      key={item.label}
      size={size}
      label={item.label}
      icon={item.icon}
      color={item.color}
      rows={item.rows ?? [{ label: item.label, value: item.value }]}
    />
  ))

  return (
    <KpiCarousel
      cards={cards}
      items={items}
      defaultExpanded={isMobile}
      summary={{
        icon: CheckCircle2,
        color: PIPELINE_KPI_COLORS.progress,
        label: "Avance",
        values: [
          { label: "Finalizadas", value: kpis.completedCount },
          { label: "Progreso", value: `${kpis.progressPercent}%` },
        ],
      }}
    />
  )
}
