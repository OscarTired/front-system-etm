"use client"

import {
  Hash,
  InspectionPanel,
  Layers3,
  Package,
  PaintBucket,
  Palette,
  Puzzle,
  Ruler,
  Sparkles,
} from "lucide-react"

import type {
  Task,
} from "../../types/task.types"

import {
  ProcessMiniCard,
} from "@/shared/ui/mini-card/process-mini-card"

import {
  KpiCarousel,
  type KpiItem,
} from "@/shared/ui/mini-card/kpi-carousel"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

type Props={
  task:Task
}

const PIEZAS_COLOR = "#c44a4a"

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
      color={"#b8a42a"}
      rows={[
        {
          label:"Lote",
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

  // Mismo dato que las cards de arriba, pero aplanado en filas
  // sueltas (una por métrica) para el carousel mobile — ahí no se
  // muestra como card sino como ítem compacto tipo stepper. Cada
  // fila tiene su propio ícono (antes Material/Espesor compartían
  // uno, y Piezas/Unidades/Entrega otro, y Color/Tipo/Pedido otro
  // más — en la card no se notaba porque ahí es UN ícono por card
  // completa, pero acá cada fila es su propio chip y quedaban
  // repetidos entre sí).
  const items: KpiItem[] = [

    {
      icon: Layers3,
      color: "#b8a42a",
      label: "Lote",
      value: `L${task.lotNumber}`,
    },

    {
      icon: Package,
      color: task.material.color,
      label: "Material",
      value: task.material.name.toUpperCase(),
    },
    {
      icon: Ruler,
      color: task.material.color,
      label: "Espesor",
      value: task.thickness.name,
    },

    {
      icon: Puzzle,
      color: PIEZAS_COLOR,
      label: "Piezas",
      value: task.pieces,
    },
    ...(hasAssemblyProcess ? [
      {
        icon: Hash,
        color: PIEZAS_COLOR,
        label: "Unidades",
        value: task.assemblyCount,
      },
      {
        icon: InspectionPanel,
        color: PIEZAS_COLOR,
        label: "Entrega",
        value: `${task.assemblyCount} UND`,
      },
    ] : []),

    hasPaintProcess
      ? {
          icon: Palette,
          color: task.color?.color ?? "#64748B",
          label: "Color",
          value: task.color?.name.toUpperCase() ?? "-",
        }
      : {
          icon: Sparkles,
          color: "#BBBBBB",
          label: "Tipo",
          value: "NATURAL",
        },
    ...(hasPaintProcess ? [
      {
        icon: PaintBucket,
        color: task.color?.color ?? "#64748B",
        label: "Pedido",
        value: `${task.paintKg} KG`,
      },
    ] : []),

  ]

  if (!ready) {
    return null
  }

  return (
    <KpiCarousel
      cards={cards}
      items={items}
      summary={{
        icon: Layers3,
        color: "#b8a42a",
        label: "Producción",
        values: [
          { label: "Lote", value: `L${task.lotNumber}` },
          { label: "Piezas", value: task.pieces },
        ],
      }}
    />
  )

}