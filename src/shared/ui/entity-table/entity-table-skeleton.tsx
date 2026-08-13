"use client"

import { groupCardColumns } from "./entity-table-card-row"
import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"
import type { EntityColumn } from "./types"

type Props<T> = {
  columns: EntityColumn<T>[]
  rows?: number
}

const ROW_OPACITIES = [1, 0.85, 0.7, 0.55, 0.4, 0.3]

function ShapePlaceholder({
  shape,
}: {
  shape: EntityColumn<unknown>["skeletonShape"]
}) {
  switch (shape) {
    case "badge":
      // Componente real con label vacío y sin ícono, no un <span>
      // clonando su forma a mano — mismo alto, mismo padding, mismo
      // radio que el badge real siempre, porque es literalmente el
      // mismo componente. Si el diseño de DynamicBadge cambia algún
      // día, esto cambia solo con él.
      return (
        <DynamicBadge
          label=""
          color="#71717a"
          width="field"
          pulse
        />
      )

    case "icon":
      return <span className="block h-9 w-9 rounded-lg bg-foreground/5" />

    case "actions-pair":
      return (
        <div className="ml-3 flex items-center gap-6">
          <span className="block h-8 w-8 rounded-lg bg-foreground/5" />
          <span className="block h-8 w-8 rounded-lg bg-foreground/5" />
        </div>
      )

    case "workflow-action":
      return <span className="block h-9 w-full rounded-lg bg-foreground/5" />

    case "none":
      return null

    default:
      return <span className="block h-4 w-4/5 max-w-24 rounded bg-foreground/5" />
  }
}

function CardSkeletonRow<T>({
  columns,
  opacity,
}: {
  columns: EntityColumn<T>[]
  opacity: number
}) {
  const { structural, groups } = groupCardColumns(columns)

  return (
    <div
      className="rounded-xl border-b border-border px-3 py-3 transition-colors hover:bg-foreground/5"
      style={{ opacity }}
    >
      {structural.length > 0 && (
        <div className="mb-2 flex items-center gap-2">
          {structural.map(column => (
            <div key={column.id}>
              <ShapePlaceholder shape={column.skeletonShape ?? "icon"} />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-lg bg-foreground/5 p-2">
        {groups.map((group, groupIndex) => (
          <div
            key={group.key + groupIndex}
            className="grid gap-x-4 gap-y-2"
            style={{
              gridTemplateColumns: `repeat(${Math.min(group.columns.length, 4)}, minmax(0, 1fr))`,
            }}
          >
            {group.columns.map(column => (
              <div key={column.id} className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {column.title}
                </div>

                <div className="mt-0.5">
                  <ShapePlaceholder shape={column.skeletonShape} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function EntityTableSkeleton<T>({
  columns,
  rows = 6,
}: Props<T>) {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-foreground/5">
      <div className="flex min-h-0 flex-1">
        <div
          data-entity-table-scroll
          className="min-h-0 flex-1 animate-pulse overflow-hidden p-1.5"
        >
          {ROW_OPACITIES.slice(0, rows).map((opacity, i) => (
            <CardSkeletonRow key={i} columns={columns} opacity={opacity} />
          ))}
        </div>
      </div>
    </div>
  )
}