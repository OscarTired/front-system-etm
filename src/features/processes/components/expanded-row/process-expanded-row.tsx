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
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

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

  // Sin "tareas" acá (un proceso no tiene sub-tareas propias) — a
  // diferencia de Project/Task, solo 2 opciones. Si no hay
  // workflowStepId todavía, Mensajes no tiene sentido (no hay a qué
  // step engancharlo) y arranca directo en KPIs.
  //
  // KPIs queda como default SIEMPRE (no solo cuando falta
  // workflowStepId) — es la primera opción del toggle acá, a
  // diferencia de Project/Task donde el default es la vista de
  // contenido (Tareas/Workflow).
  const [
    activeView,
    setActiveView,
  ] = useState<"comments" | "kpis">("kpis")

  return(

    <EntityExpandedRow rowId={processTask.task.id}>

      <EntityExpandedHeader
        section="PROCESO OPERATIVO"
        title={processTask.task.reference}
        metric={processTask.workflowStep?.order??"-"}
        metricLabel="orden"
      />

      <EntityExpandedContent>

        <div className="mb-2 flex items-center justify-between select-none">

          <div className="mb-2 hidden items-center justify-between select-none tablet:flex">
            <span className="text-xs font-semibold tracking-widest text-neutral-500">
              {activeView === "comments"
                ? "MENSAJES"
                : "INDICADORES"}
            </span>
          </div>

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
              content: (
                <KpiPanel cards={cards} />
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