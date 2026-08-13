"use client"

import { cn } from "@/shared/utils/utils"

import type { Role } from "../types/role.types"

type Props = {
  role: Role
  selected: boolean
  onSelect: () => void
}

// Fila de rol en DESKTOP -- lista plana dentro del aside, sin card
// propia (el aside ya es el panel completo). A diferencia de
// Proyectos/Tareas/Usuarios, Roles no usa EntityTable en desktop:
// es un selector maestro-detalle (con el panel de Permisos al
// lado), no una tabla de varios campos por fila.
export function RoleDesktopRow({ role, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        selected
          ? "bg-foreground/10 text-foreground"
          : "hover:bg-foreground/5 text-muted-foreground"
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: role.color || "#71717a" }}
        />
        <span className="truncate text-sm font-medium">
          {role.name}
        </span>
      </div>

      {!role.active && (
        <span className="shrink-0 text-xs text-muted-foreground">Inactivo</span>
      )}
    </button>
  )
}
