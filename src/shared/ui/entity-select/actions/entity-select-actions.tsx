"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Props = {
  onEdit?: () => void
  onDelete?: () => void
  color?: string
}

export function EntitySelectActionMenu({
  onEdit,
  onDelete,
  color,
}: Props) {
  const [open, setOpen] = useState(false)
  const hasActions = !!(onEdit || onDelete)

  if (!hasActions) {
    return null
  }

  // Cierra el menú al instante y luego abre el modal de edición
  const handleEdit = () => {
    setOpen(false)
    requestAnimationFrame(() => {
      onEdit?.()
    })
  }

  // Cierra el menú al instante y luego invoca la eliminación
  const handleDelete = () => {
    setOpen(false)
    requestAnimationFrame(() => {
      onDelete?.()
    })
  }

  return (
    /* modal={false} es clave: evita conflicto de foco con el Popover padre */
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-foreground/10 focus-visible:outline-none"
          style={{
            color: color ?? "rgba(255,255,255,0.5)",
          }}
          aria-label="Opciones"
        >
          <MoreHorizontal size={15} strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={4}
        /* Evita que cerrar este sub-menú transmita un evento de cierre al Popover contenedor */
        onPointerDownOutside={(e) => {
          e.preventDefault()
          setOpen(false)
        }}
        /* Evita que el foco salte de forma agresiva rompiendo el Popover padre */
        onCloseAutoFocus={(e) => {
          e.preventDefault()
        }}
        className="z-50 min-w-32 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl"
      >
        {onEdit && (
          <DropdownMenuItem
            onSelect={handleEdit}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-foreground/10 hover:text-foreground focus:bg-foreground/10 focus:text-foreground"
          >
            <Pencil size={13} className="text-muted-foreground" />
            <span>Editar</span>
          </DropdownMenuItem>
        )}

        {onEdit && onDelete && (
          <DropdownMenuSeparator className="my-1 h-px bg-foreground/10" />
        )}

        {onDelete && (
          <DropdownMenuItem
            variant="destructive"
            onSelect={handleDelete}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300"
          >
            <Trash2 size={13} />
            <span>Eliminar</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}