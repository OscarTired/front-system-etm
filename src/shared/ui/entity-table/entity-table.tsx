"use client"

import type { ReactNode } from "react"

import { useAnimatedPresence } from "@/shared/hooks/use-animated-presence"
import { cn } from "@/shared/utils/utils"

import { EntityTableCardRow } from "./entity-table-card-row"
import type { EntityTableProps } from "./types"

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

/**
 * Tabla/lista de entidades con alto acotado por el padre.
 * Scroll nativo (mismo modelo que AppListScroll): el thumb sigue el gesto.
 */
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
      <div
        data-entity-table-scroll
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain themed-scrollbar-y p-1.5",
        )}
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
                onExpandedRowChange?.(isExpanded ? null : id)
              }
            />
          )

          return (
            <div key={id} data-expanded-row-id={id}>
              {renderRow ? renderRow(item, cardContent, "", id) : cardContent}

              <ExpandedRowSlot isExpanded={isExpanded}>
                {renderExpandedRow?.(item)}
              </ExpandedRowSlot>
            </div>
          )
        })}
      </div>
    </div>
  )
}
