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

  if (!isMobile) {
    return (
      <KpiPanel
        cards={cards}
      />
    )
  }

  return (

    <div>

      {/* Mismo estilo denso y sin caja que ya usa KanbanCardView
          para esta misma info (L{lote} • MATERIAL espesor • PIEZAS)
          — antes esto era un botón con fondo/padding tipo dropdown,
          que no es el lenguaje visual que se pidió acá. Sigue siendo
          clickeable (el div entero, no cada span), solo que ahora
          se ve como texto plano en vez de una pill. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(v => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setExpanded(v => !v)
          }
        }}
        className="flex cursor-pointer items-center justify-between gap-2"
      >

        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-neutral-300">

          <span>L{task.lotNumber}</span>
          <span className="text-neutral-600">•</span>
          <span>{task.material.name.toUpperCase()} {task.thickness.name}</span>
          <span className="text-neutral-600">•</span>
          <span>{task.pieces} PIEZAS</span>
          <span className="text-neutral-600">•</span>
          <span>
            {hasPaintProcess
              ? `${task.color?.name.toUpperCase() ?? "-"} ${task.paintKg}kg`
              : "NATURAL"}
          </span>

        </div>

        <ChevronDown
          size={15}
          className={cn(
            "shrink-0 text-neutral-500 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />

      </div>

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