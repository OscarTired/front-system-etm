"use client"

import {
  InspectionPanel,
  Layers3,
  PaintBucket,
  Puzzle,
} from "lucide-react"

import type {
  Task,
} from "../../types/task.types"

import {
  ProcessMiniCard,
} from "@/shared/ui/mini-card/process-mini-card"

import {
  KpiPanel,
} from "@/shared/ui/mini-card/kpi-panel"

import {
  KpiCarousel,
} from "@/shared/ui/mini-card/kpi-carousel"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

type Props={
  task:Task
}

const PIEZAS_COLOR = "#996666"

export function TaskKpisSection({
  task,
}:Props){

  const { isMobile, ready } = useResponsive()

  const hasAssemblyProcess=
    task.route.includes("EN")

  const hasPaintProcess=
    task.route.includes("PT")

  const cardSize = isMobile ? "large" : "default"

  const cards = [

    <ProcessMiniCard
      key="lote"
      size={cardSize}
      label="Lote"
      icon={Layers3}
      color={"#d4d2a6"}
      rows={[
        {
          label:"Asignación",
          value:`L${task.lotNumber}`,
        },
      ]}
    />,

    <ProcessMiniCard
      key="material"
      size={cardSize}
      label="Material"
      icon={InspectionPanel}
      color={task.material.color}
      rows={[
        {
          label:"Material",
          value:task.material.name.toUpperCase(),
        },
        {
          label:"Espesor",
          value:task.thickness.name,
        },
      ]}
    />,

    <ProcessMiniCard
      key="piezas"
      size={cardSize}
      label="Piezas"
      icon={Puzzle}
      color={PIEZAS_COLOR}
      rows={
        hasAssemblyProcess
          ?[
              {
                label:"Piezas",
                value:task.pieces,
              },
              {
                label:"UNIDADES",
                value:task.assemblyCount,
              },
              {
                label:"Entrega",
                value:`${task.assemblyCount} UND`,
              },
            ]
          :[
              {
                label:"Piezas",
                value:task.pieces,
              },
            ]
      }
    />,

    <ProcessMiniCard
      key="acabado"
      size={cardSize}
      label={
        hasPaintProcess
          ?"Pintura"
          :"Acabado"
      }
      icon={PaintBucket}
      color={
        hasPaintProcess
          ? task.color?.color ??
            "#64748B"
          : "#BBBBBB"
      }
      rows={
        hasPaintProcess
          ?[
              {
                label:"Color",
                value:task.color?.name.toUpperCase() ?? "-",
              },
              {
                label:"Pedido",
                value:`${task.paintKg} KG`,
              },
            ]
          :[
              {
                label:"Tipo",
                value:"NATURAL",
              },
            ]
      }
    />,

  ]

  if (!ready) {
    return null
  }

  if (!isMobile) {
    return (
      <KpiPanel
        cards={cards}
      />
    )
  }

  // KpiCarousel — mismo componente genérico que ya usa
  // TaskPipelineHeader para su barra "AVANCE" (colapsado: fila con
  // fondo tinteado + ícono + label + 2 valores + "..."; expandido:
  // las cards completas) — antes esto era una versión armada a
  // mano con texto plano estilo Kanban, que no era lo que se pedía.
  return (
    <KpiCarousel
      cards={cards}
      summary={{
        icon: Layers3,
        color: "#d4d2a6",
        label: "Producción",
        values: [
          { label: "Lote", value: `L${task.lotNumber}` },
          { label: "Piezas", value: task.pieces },
        ],
      }}
    />
  )

}