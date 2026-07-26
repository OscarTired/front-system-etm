"use client"

import {
  useEffect,
  useRef,
  useState,
} from "react"

import {
  ChevronDown,
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
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

import {
  cn,
} from "@/shared/utils/utils"

type Props={
  task:Task
}

const PIEZAS_COLOR = "#996666"

export function TaskKpisSection({
  task,
}:Props){

  const { isMobile } = useResponsive()

  // En desktop KpiPanel ya se ve bien (grid auto-fit, sin necesidad
  // de resumen/detalle) — esto solo aplica en mobile, mismo motivo
  // que TaskProductionPanel: antes eran 4 cards enteras siempre
  // visibles (aunque KpiPanel ya las mostraba de una por vez en un
  // carrusel, seguía siendo bastante alto de por sí). Ahora arranca
  // en un resumen de una línea, y el carrusel completo solo aparece
  // si lo tocás.
  const [
    expanded,
    setExpanded,
  ] = useState(false)

  // Mismo motivo que en TaskProductionPanel: {expanded && (...)}
  // solo anima al ABRIR (mount), al cerrar desaparece de golpe
  // porque desmonta sin ninguna animación de salida. Midiendo la
  // altura real y animando max-height, la transición queda
  // simétrica en los dos sentidos.
  const contentRef = useRef<HTMLDivElement>(null)

  const [
    contentHeight,
    setContentHeight,
  ] = useState(0)

  useEffect(() => {

    if (!contentRef.current) return

    const measure = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight)
      }
    }

    measure()

    const resizeObserver = new ResizeObserver(measure)

    resizeObserver.observe(contentRef.current)

    return () => resizeObserver.disconnect()

  }, [])

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

  // Resumen de una línea, mismos datos que las 4 cards pero
  // condensados — nada nuevo, solo otra forma de mostrar lo mismo.
  const summaryText = [
    `L${task.lotNumber}`,
    `${task.material.name.toUpperCase()} ${task.thickness.name}`,
    `${task.pieces} pzs`,
    hasPaintProcess
      ? `${task.color?.name.toUpperCase() ?? "-"} ${task.paintKg}kg`
      : "Natural",
  ].join(" · ")

  if (!isMobile) {
    return (
      <KpiPanel
        cards={cards}
      />
    )
  }

  return (

    <div>

      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl bg-white/3 px-3 py-2.5 text-left transition hover:bg-white/5"
      >

        <span className="min-w-0 truncate text-sm font-medium text-neutral-300">
          {summaryText}
        </span>

        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-neutral-500 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />

      </button>

      <div
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out",
          expanded ? "mt-3 opacity-100" : "opacity-0",
        )}
        style={{
          maxHeight: expanded ? contentHeight : 0,
        }}
      >
        <div ref={contentRef}>
          <KpiPanel
            cards={cards}
          />
        </div>
      </div>

    </div>

  )

}