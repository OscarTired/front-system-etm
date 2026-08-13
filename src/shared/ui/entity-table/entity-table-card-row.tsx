"use client"

import type { ReactNode } from "react"

import type { EntityColumn, EntityColumnContext } from "./types"

export const CARD_STRUCTURAL_IDS = new Set(["drag", "expand", "actions"])

export type CardColumnGroup<T> = { key: string; columns: EntityColumn<T>[] }

// Extraída para que EntityTableCardRow (la card real) y
// EntityTableSkeleton (su esqueleto de carga) usen EXACTAMENTE la
// misma lógica de estructural/orden/agrupado — antes el skeleton
// tenía su propia versión simplificada a mano, y con el tiempo dejó
// de calcar la estructura real (títulos genéricos en vez de los
// reales, cantidad de grupos distinta).
export function groupCardColumns<T>(columns: EntityColumn<T>[]) {

  const structural = columns.filter(c => CARD_STRUCTURAL_IDS.has(c.id))

  // Se ordena por cardOrder (las que no lo tienen quedan al final,
  // en su orden natural del array) — esto es INDEPENDIENTE del
  // orden de columnas de la tabla normal, que no cambia.
  const content = columns
    .filter(c => !CARD_STRUCTURAL_IDS.has(c.id))
    .map((column, naturalIndex) => ({
      column,
      order: column.cardOrder ?? 1000 + naturalIndex,
    }))
    .sort((a, b) => a.order - b.order)
    .map(({ column }) => column)

  // Agrupa manteniendo el orden ya resuelto arriba — cada grupo
  // distinto (o "sin grupo") se separa visualmente con una línea.
  const groups: CardColumnGroup<T>[] = []

  for (const column of content) {

    const key = column.cardGroup ?? "__default"
    const lastGroup = groups[groups.length - 1]

    if (lastGroup?.key === key) {
      lastGroup.columns.push(column)
    } else {
      groups.push({ key, columns: [column] })
    }

  }

  return { structural, groups }

}

type Props<T> = {
  item: T
  rowIndex: number
  columns: EntityColumn<T>[]
  isExpanded: boolean
  toggleExpanded: () => void
}

// Mismo criterio que ya usan drag/expand/actions en las 4 tablas
// (Tasks/Projects/Processes/Users) — son siempre las mismas 3 ids
// "estructurales", nunca contenido de negocio. Van en una fila
// propia arriba; el resto se reorganiza abajo según cardOrder/
// cardGroup (ver types.ts) — ninguna se pierde, no hace falta
// scroll.
export function EntityTableCardRow<T>({
  item,
  rowIndex,
  columns,
  isExpanded,
  toggleExpanded,
}: Props<T>) {

  const context: EntityColumnContext<T> = {
    item,
    rowIndex,
    isExpanded,
    toggleExpanded,
  }

  const { structural, groups } = groupCardColumns(columns)

  return (

    <div className="rounded-xl border-b border-border px-3 py-3 transition-colors hover:bg-foreground/5">

      {structural.length > 0 && (

        <div className="mb-2 flex items-center gap-2">

          {structural.map((column): ReactNode => (

            <div key={column.id}>
              {column.render(item, context)}
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
              // Tantas columnas como campos tenga ESTE grupo (hasta
              // 4) — así, por ejemplo, ID/PROYECTO/PRY/ENTREGA
              // entran los 4 en una sola fila en vez de partirse en
              // dos por un grid-cols fijo que no sabía cuántos
              // campos venían en cada grupo.
              gridTemplateColumns: `repeat(${Math.min(group.columns.length, 4)}, minmax(0, 1fr))`,
            }}
          >

            {group.columns.map(column => (

              <div key={column.id} className="min-w-0">

                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {column.title}
                </div>

                <div className="mt-0.5 text-xs font-medium text-foreground">
                  {column.render(item, context)}
                </div>

              </div>

            ))}

          </div>

        ))}

      </div>

    </div>

  )

}