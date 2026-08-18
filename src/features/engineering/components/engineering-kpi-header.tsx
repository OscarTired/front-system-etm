"use client"

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
} from "lucide-react"

import type { EngineeringTask } from "../types/engineering-task.types"
import { ProcessMiniCard } from "@/shared/ui/mini-card/process-mini-card"
import {
  KpiCarousel,
  type KpiItem,
} from "@/shared/ui/mini-card/kpi-carousel"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

type Props = {
  tasks: EngineeringTask[]
}

/** Mismo contrato mobile expandido (chips) que TaskPipelineHeader / proyectos. */
export function EngineeringKpiHeader({ tasks }: Props) {
  const { isMobile } = useResponsive()
  const total = tasks.length
  const queue = tasks.filter(t => t.status === "QUEUE").length
  const pending = tasks.filter(t => t.status === "PENDING").length
  const progress = tasks.filter(t => t.status === "PROGRESS").length
  const completed = tasks.filter(t => t.status === "COMPLETED").length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const size = isMobile ? "large" : "default"

  const items: KpiItem[] = [
    {
      icon: ClipboardList,
      color: "#3B82F6",
      label: "Total tareas",
      value: total,
      rows: [
        { label: "Total", value: total },
        { label: "En cola", value: queue },
      ],
    },
    {
      icon: Clock,
      color: "#64748B",
      label: "En cola",
      value: queue,
      rows: [
        { label: "Cola", value: queue },
        { label: "Pendiente", value: pending },
      ],
    },
    {
      icon: Loader2,
      color: "#F59E0B",
      label: "En proceso",
      value: progress,
      rows: [
        { label: "Activas", value: progress },
        {
          label: "Ratio",
          value: total > 0 ? `${Math.round((progress / total) * 100)}%` : "0%",
        },
      ],
    },
    {
      icon: CheckCircle2,
      color: "#16A34A",
      label: "Avance",
      value: `${pct}%`,
      rows: [
        { label: "Completadas", value: completed },
        { label: "Progreso", value: `${pct}%` },
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
      defaultExpanded={false}
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
