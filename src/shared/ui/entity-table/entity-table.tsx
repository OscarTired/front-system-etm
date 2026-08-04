"use client"

import type { ReactNode } from "react"

import {
  ScrollArea,
} from "@/components/ui/scroll-area"

import {
  useAnimatedPresence,
} from "@/shared/hooks/use-animated-presence"

import {
  EntityTableCardRow,
} from "./entity-table-card-row"

import type {
  EntityTableProps,
} from "./types"

// Envuelve el contenido expandido para poder usar useAnimatedPresence
// (un hook no puede llamarse directo dentro del .map() de abajo).
function ExpandedRowSlot({
  isExpanded,
  children,
}: {
  isExpanded: boolean
  children: ReactNode
}) {

  const { shouldRender, isClosing } = useAnimatedPresence(isExpanded)

  if (!shouldRender) {
    return null
  }

  return (

    <div className={isClosing ? "animate-comment-out" : "animate-comment-in"}>
      {children}
    </div>

  )

}

export function EntityTable<T>({
  data,
  columns,
  rowId,
  emptyMessage = "Sin registros",
  renderRow,
  expandedRowId,
  onExpandedRowChange,
  renderExpandedRow,
}: EntityTableProps<T>) {

  return (

    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white/3">

      <ScrollArea
        data-entity-table-scroll
        className="min-h-0 flex-1 p-1.5"
      >

        {data.length === 0 && (

          <div className="flex h-60 items-center justify-center text-neutral-500">
            {emptyMessage}
          </div>

        )}

        {data.map((item, rowIndex) => {

          const id = rowId(item)
          const isExpanded = expandedRowId === id

          const cardContent = (

            <EntityTableCardRow
              item={item}
              rowIndex={rowIndex}
              columns={columns}
              isExpanded={isExpanded}
              toggleExpanded={() =>
                onExpandedRowChange?.(
                  isExpanded ? null : id,
                )
              }
            />

          )

          return (

            <div key={id} data-expanded-row-id={id}>

              {renderRow

                ? renderRow(item, cardContent, "", id)

                : cardContent

              }

              <ExpandedRowSlot isExpanded={isExpanded}>
                {renderExpandedRow?.(item)}
              </ExpandedRowSlot>

            </div>

          )

        })}

      </ScrollArea>

    </div>

  )

}