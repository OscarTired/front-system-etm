"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Activity, ArrowRight, Clock, MessageSquare, Puzzle } from "lucide-react"

import type { ProcessTask } from "../../types/process.types"

import {
  EntityExpandedContent,
  EntityExpandedRow,
  EntityExpandedToggle,
  EntityExpandedSlider,
} from "@/shared/ui/entity-expanded-row"

import { KpiCarousel, type KpiItem } from "@/shared/ui/mini-card/kpi-carousel"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { getProcessProgress } from "@/features/processes/selectors/get-process-progress"

import { ProcessProductionCard } from "./cards/process-production-card"
import { ProcessMaterialCard } from "./cards/process-material-card"
import { ProcessPaintCard } from "./cards/process-paint-card"
import { ProcessAssemblyCard } from "./cards/process-assembly-card"
import { ProcessDispatchCard } from "./cards/process-dispatch-card"
import { ProcessTimeCard } from "./cards/process-time-card"
import { ProcessProgressCard } from "./cards/process-progress-card"
import { ProcessCommentsPanel } from "./comments/process-comments-panel"

type Props = {
  processTask: ProcessTask
}

export function ProcessExpandedRow({
  processTask,
}: Props) {
  const { isMobile, ready } = useResponsive()
  const searchParams = useSearchParams()

  const urlTaskId = searchParams.get("taskId")
  const isTarget = urlTaskId === processTask.task.id
  const tabParam = searchParams.get("tab") as "comments" | "kpis"

  // Si esta fila es la destinataria de la notificación y pide tab=comments, se inicia en comments
  const initialTab = isTarget && tabParam === "comments" ? "comments" : "kpis"

  const processCode =
    processTask.workflowStep?.processCode

  const workflowStepId =
    processTask.workflowStep?.id

  const isMaterialProcess =
    processCode === "CT" ||
    processCode === "PL" ||
    processCode === "SD"

  const isPaintProcess =
    processCode === "PT"

  const isAssemblyProcess =
    processCode === "EN"

  const isDispatchProcess =
    processCode === "DS"

  const cardSize = isMobile ? "large" : "default"

  const cards: React.ReactNode[] = [
    ...(isMaterialProcess
      ? [
          <ProcessProductionCard
            key="production"
            size={cardSize}
            processTask={processTask}
          />,
          <ProcessMaterialCard
            key="material"
            size={cardSize}
            processTask={processTask}
          />,
        ]
      : []),

    ...(isPaintProcess
      ? [
          <ProcessProductionCard
            key="production"
            size={cardSize}
            processTask={processTask}
          />,
          <ProcessPaintCard
            key="paint"
            size={cardSize}
            processTask={processTask}
          />,
        ]
      : []),

    ...(isAssemblyProcess
      ? [
          <ProcessAssemblyCard
            key="assembly"
            size={cardSize}
            processTask={processTask}
          />,
          <ProcessPaintCard
            key="paint"
            size={cardSize}
            processTask={processTask}
            readOnly
          />,
        ]
      : []),

    ...(isDispatchProcess
      ? [
          <ProcessDispatchCard
            key="dispatch"
            size={cardSize}
            processTask={processTask}
          />,
          <ProcessPaintCard
            key="paint"
            size={cardSize}
            processTask={processTask}
            readOnly
          />,
        ]
      : []),

    <ProcessTimeCard
      key="time"
      size={cardSize}
      processTask={processTask}
    />,

    <ProcessProgressCard
      key="progress"
      size={cardSize}
      processTask={processTask}
    />,
  ]

  const [
    activeView,
    setActiveView,
  ] = useState<"comments" | "kpis">(initialTab)

  const { percent, statusLabel, nextProcessLabel } = getProcessProgress(processTask)

  // Las cards de arriba son componentes (ProcessProductionCard,
  // ProcessMaterialCard, etc.) que calculan sus propios valores
  // puertas adentro (piezas de salida, PL/RT...) — reconstruir eso
  // acá duplicaría esa lógica y podría desincronizarse. En vez de
  // eso, este items usa lo que ya está disponible sin duplicar
  // nada (getProcessProgress + processTask.task): cubre lo esencial
  // para que el carousel mobile no quede vacío, aunque sea menos
  // granular que las cards de escritorio.
  const items: KpiItem[] = [

    {
      icon: Activity,
      color: "#22C55E",
      label: "Estado",
      value: statusLabel,
    },
    {
      icon: Activity,
      color: "#22C55E",
      label: "Avance",
      value: `${percent}%`,
    },
    {
      icon: ArrowRight,
      color: "#64748B",
      label: "Siguiente",
      value: nextProcessLabel,
    },
    {
      icon: Puzzle,
      color: "#a6c7d4",
      label: "Piezas",
      value: processTask.task.pieces,
    },
    {
      icon: Clock,
      color: "#d4d2a6",
      label: "Lote",
      value: `L${processTask.task.lotNumber}`,
    },

  ]

  return (
    <EntityExpandedRow rowId={processTask.task.id}>
      <EntityExpandedContent>
        <div className="mb-2 flex items-center justify-end select-none">
          <EntityExpandedToggle
            value={activeView}
            onChange={setActiveView}
            options={[
              {
                value: "kpis" as const,
                label: "KPIs",
                icon: Activity,
              },
              ...(workflowStepId
                ? [{
                    value: "comments" as const,
                    label: "Mensajes",
                    icon: MessageSquare,
                  }]
                : []),
            ]}
          />
        </div>

        <EntityExpandedSlider
          value={activeView}
          panels={[
            {
              value: "kpis" as const,
              content: !ready ? null : (
                <KpiCarousel
                  cards={cards}
                  items={items}
                  summary={{
                    icon: Activity,
                    color: "#22C55E",
                    label: "Progreso",
                    values: [
                      { label: "Estado", value: statusLabel },
                      { label: "Avance", value: `${percent}%` },
                    ],
                  }}
                />
              ),
            },
            ...(workflowStepId
              ? [{
                  value: "comments" as const,
                  content: (
                    <ProcessCommentsPanel
                      workflowStepId={workflowStepId}
                    />
                  ),
                }]
              : []),
          ]}
        />
      </EntityExpandedContent>
    </EntityExpandedRow>
  )
}