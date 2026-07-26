"use client"

import {
  ScrollArea,
  ScrollBar,
} from "@/components/ui/scroll-area"

import {
  EntityTableCardRow,
} from "./entity-table-card-row"

import type {
  EntityTableProps,
} from "./types"

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

              {isExpanded && (
                <div className="animate-comment-in">
                  {renderExpandedRow?.(item)}
                </div>
              )}

            </div>

          )

        })}

        <ScrollBar className="w-1.5 bg-transparent hover:bg-white/5" />

      </ScrollArea>

    </div>

  )

}