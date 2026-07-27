"use client"

import { useState } from "react"
import { Activity, MessageSquare } from "lucide-react"

import type { ProcessTask } from "../../types/process.types"

import {
  EntityExpandedContent,
  EntityExpandedHeader,
  EntityExpandedRow,
  EntityExpandedToggle,
  EntityExpandedSlider,
} from "@/shared/ui/entity-expanded-row"

import { KpiPanel } from "@/shared/ui/mini-card/kpi-panel"
import { KpiCarousel } from "@/shared/ui/mini-card/kpi-carousel"
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

type Props={
  processTask:ProcessTask
}

export function ProcessExpandedRow({
  processTask,
}:Props){

  const { isMobile } = useResponsive()

  const processCode=
    processTask.workflowStep?.processCode

  const workflowStepId=
    processTask.workflowStep?.id

  const isMaterialProcess=
    processCode==="CT"||
    processCode==="PL"||
    processCode==="SD"

  const isPaintProcess=
    processCode==="PT"

  const isAssemblyProcess=
    processCode==="EN"

  const isDispatchProcess=
    processCode==="DS"

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
  ] = useState<"comments" | "kpis">("kpis")

  const { percent, statusLabel } = getProcessProgress(processTask)

  return(

    <EntityExpandedRow rowId={processTask.task.id}>

      <EntityExpandedHeader
        section="PROCESO OPERATIVO"
        title={processTask.task.reference}
        metric={processTask.workflowStep?.order??"-"}
        metricLabel="orden"
      />

      <EntityExpandedContent>

        <div className="mb-2 flex items-center justify-end select-none">
          <EntityExpandedToggle
            value={activeView}
            onChange={setActiveView}
            fullWidth={isMobile}
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
              content: !isMobile ? (
                <KpiPanel cards={cards} />
              ) : (
                <KpiCarousel
                  cards={cards}
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