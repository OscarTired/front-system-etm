"use client"

import { PIPELINE_PROCESS_ORDER } from "@/features/tasks/pipeline/utils/process-columns"
import { PROCESS_DEFINITIONS } from "../../constants/process-definitions"

function SkeletonProcessRow({
  color,
  opacity,
}: {
  color: string
  opacity: number
}) {

  return (

    <div
      className="overflow-hidden rounded-2xl"
      style={{ opacity }}
    >

      <div
        className="flex w-full items-center gap-3 p-3 tablet:gap-4"
        style={{
          background: `linear-gradient(135deg, ${color}20, var(--process-card-end, #101012))`,
        }}
      >

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground/5">

          <span
            className="h-5 w-5 rounded"
            style={{ backgroundColor: `${color}40` }}
          />

        </div>

        {/* CORTE */}
        <span
          className="h-3 w-15 shrink-0 rounded"
          style={{ backgroundColor: `${color}30` }}
        />

        <div className="flex min-w-0 flex-1 items-center justify-end gap-4 tablet:gap-8">

          <div className="min-w-0 text-right">

            {/* TOTAL */}
            <span className="ml-auto block h-3 w-8.5 rounded bg-foreground/10" />

            {/* 0 */}
            <span
              className="mt-1 ml-auto block h-7 w-4 rounded"
              style={{ backgroundColor: `${color}35` }}
            />

          </div>

          <div className="h-8 w-px shrink-0 bg-foreground/10" />

          <div className="min-w-0 text-right">

            {/* URGENTES */}
            <span className="ml-auto block h-3 w-19.5 rounded bg-foreground/10" />

            {/* 0 */}
            <span className="mt-1 ml-auto block h-7 w-4 rounded bg-foreground/12" />

          </div>

        </div>

        <span className="h-4.5 w-4.5 shrink-0 rounded-sm bg-foreground/5" />

      </div>

    </div>

  )

}

const SKELETON_OPACITIES = [
  1,
  0.85,
  0.7,
  0.55,
  0.4,
  0.3,
]

export function ProductionHubSkeleton() {

  return (

    <div className="flex animate-pulse flex-col gap-2">

      {PIPELINE_PROCESS_ORDER.map((code, index) => (

        <SkeletonProcessRow
          key={code}
          color={PROCESS_DEFINITIONS[code].color}
          opacity={SKELETON_OPACITIES[index] ?? 0.3}
        />

      ))}

    </div>

  )

}