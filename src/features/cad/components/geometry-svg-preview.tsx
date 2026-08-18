"use client"

import { useMemo } from "react"

import { cn } from "@/shared/utils/utils"
import type { GeometryEntity, GeometryModel } from "../types/geometry-model"

type Props = {
  model: GeometryModel | null
  className?: string
  padRatio?: number
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const toRad = (d: number) => (d * Math.PI) / 180
  let sweep = endDeg - startDeg
  while (sweep < 0) sweep += 360
  while (sweep >= 360) sweep -= 360
  const large = sweep > 180 ? 1 : 0
  const x1 = cx + r * Math.cos(toRad(startDeg))
  const y1 = cy + r * Math.sin(toRad(startDeg))
  const x2 = cx + r * Math.cos(toRad(endDeg))
  const y2 = cy + r * Math.sin(toRad(endDeg))
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

function entityToSvg(e: GeometryEntity, key: number): React.ReactNode {
  const layer = "layer" in e ? e.layer : undefined
  const stroke =
    layer === "BEND"
      ? "#22d3ee"
      : layer === "HOLE"
        ? "#fb923c"
        : "currentColor"
  const common = {
    fill: "none" as const,
    stroke,
    strokeWidth: layer === "BEND" ? 1 : 1.25,
    strokeDasharray: layer === "BEND" ? "4 3" : undefined,
    vectorEffect: "non-scaling-stroke" as const,
  }

  switch (e.type) {
    case "LINE":
      return (
        <line
          key={key}
          x1={e.start.x}
          y1={e.start.y}
          x2={e.end.x}
          y2={e.end.y}
          {...common}
        />
      )
    case "CIRCLE":
      return (
        <circle
          key={key}
          cx={e.center.x}
          cy={e.center.y}
          r={e.radius}
          {...common}
        />
      )
    case "ARC":
      return (
        <path
          key={key}
          d={arcPath(
            e.center.x,
            e.center.y,
            e.radius,
            e.startAngle,
            e.endAngle,
          )}
          {...common}
        />
      )
    case "POLYLINE": {
      if (e.points.length < 2) return null
      const d =
        e.points
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ") + (e.closed ? " Z" : "")
      return <path key={key} d={d} {...common} />
    }
    default:
      return null
  }
}

export function GeometrySvgPreview({
  model,
  className,
  padRatio = 0.08,
}: Props) {
  const view = useMemo(() => {
    if (!model || !model.entities.length) return null
    const { minX, minY, maxX, maxY } = model.bounds
    const w = Math.max(maxX - minX, 1)
    const h = Math.max(maxY - minY, 1)
    const pad = Math.max(w, h) * padRatio
    return {
      box: `${minX - pad} ${-(maxY + pad)} ${w + pad * 2} ${h + pad * 2}`,
      entities: model.entities,
    }
  }, [model, padRatio])

  if (!view) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[240px] items-center justify-center rounded-xl bg-foreground/5 text-sm text-muted-foreground",
          className,
        )}
      >
        Sin geometría
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative h-full min-h-[240px] overflow-hidden rounded-xl bg-foreground/5 text-foreground",
        className,
      )}
    >
      <svg
        className="h-full w-full"
        viewBox={view.box}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Vista previa de geometría"
      >
        <g transform="scale(1,-1)">
          {view.entities.map((e, i) => entityToSvg(e, i))}
        </g>
      </svg>
    </div>
  )
}
