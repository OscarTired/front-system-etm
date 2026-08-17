"use client"

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
} from "lucide-react"

import type { EngineeringTask } from "../types/engineering-task.types"
import { ProcessMiniCard } from "@/shared/ui/mini-card/process-mini-card"
import { KpiCarousel } from "@/shared/ui/mini-card/kpi-carousel"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

type Props = {
  tasks: EngineeringTask[]
}

/** KPIs de ingeniería — mismo shell mobile (AVANCE colapsado) que TaskPipelineHeader. */
export function EngineeringKpiHeader({ tasks }: Props) {
  const { isMobile } = useResponsive()
  const total = tasks.length
  const queue = tasks.filter(t => t.status === "QUEUE").length
  const progress = tasks.filter(t => t.status === "PROGRESS").length
  const completed = tasks.filter(t => t.status === "COMPLETED").length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const size = isMobile ? "large" : "default"

  const cards = [
    <ProcessMiniCard
      key="total"
      size={size}
      label="Tareas"
      icon={ClipboardList}
      color="#3B82F6"
      rows={[
        { label: "Total", value: total },
        { label: "En cola", value: queue },
      ]}
    />,
    <ProcessMiniCard
      key="progress"
      size={size}
      label="En proceso"
      icon={Loader2}
      color="#F59E0B"
      rows={[
        { label: "Activas", value: progress },
        {
          label: "Ratio",
          value: total > 0 ? `${Math.round((progress / total) * 100)}%` : "0%",
        },
      ]}
    />,
    <ProcessMiniCard
      key="queue"
      size={size}
      label="Cola"
      icon={Clock}
      color="#64748B"
      rows={[
        { label: "En cola", value: queue },
        { label: "Pendientes", value: tasks.filter(t => t.status === "PENDING").length },
      ]}
    />,
    <ProcessMiniCard
      key="done"
      size={size}
      label="Avance"
      icon={CheckCircle2}
      color="#16A34A"
      rows={[
        { label: "Completadas", value: completed },
        { label: "Progreso", value: `${pct}%` },
      ]}
    />,
  ]

  return (
    <KpiCarousel
      cards={cards}
      defaultExpanded={isMobile}
      summary={{
        icon: CheckCircle2,
        color: "#16A34A",
        label: "Avance",
        values: [
          { label: "Completadas", value: completed },
          { label: "Progreso", value: `${pct}%` },
        ],
      }}
    />
  )
}
