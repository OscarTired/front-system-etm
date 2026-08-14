"use client"

import { Info } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDateTime } from "@/shared/utils/date-format"
import { cn } from "@/shared/utils/utils"

type AuditUser = { id: string; name: string }

type Props = {
  createdAt?: string | null
  updatedAt?: string | null
  createdBy?: AuditUser | null
  updatedBy?: AuditUser | null
  className?: string
}

export function EntityAuditInfo({
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  className,
}: Props) {
  const rows = [
    { label: "Creado por", value: createdBy?.name ?? "—" },
    { label: "Creado", value: formatDateTime(createdAt) },
    { label: "Última modificación", value: formatDateTime(updatedAt) },
    ...(updatedBy
      ? [{ label: "Modificado por", value: updatedBy.name }]
      : []),
  ]

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Información de auditoría"
          title="Auditoría"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            "bg-muted text-foreground/80 shadow-sm",
            "transition-colors hover:bg-muted/80 hover:text-foreground",
            "active:bg-muted/70",
            className,
          )}
        >
          <Info size={14} strokeWidth={2.25} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="z-50 w-64 gap-0 border-border/60 p-0"
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
      >
        <div className="border-b border-border/50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Información
          </p>
        </div>
        <div className="flex flex-col gap-2.5 px-3 py-3">
          {rows.map(row => (
            <div key={row.label} className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {row.label}
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
