"use client"

import { useMemo } from "react"

import { cn } from "@/shared/utils/utils"

import { PermissionToggle } from "./permission-toggle"

import type { Permission } from "../../types/role.types"

type Props = {
  title: string
  permissions: Permission[]
  checkedIds: Set<string>
  onToggle: (permissionId: string) => void
  onToggleAll: (permissionIds: string[], nextChecked: boolean) => void
  getLabel: (permission: Permission) => string
  // Solo en modo "Usuarios": ids de permisos que tienen una
  // excepción puntual aplicada (distinta de lo que da el rol solo).
  overriddenIds?: Set<string>
}

// Un grupo de permisos (ej: "PROYECTOS") con su título y un toggle
// de "Seleccionar todos" -- evita tener que tildar permiso por
// permiso cuando un admin quiere darle acceso completo a un módulo.
export function PermissionGroup({
  title,
  permissions,
  checkedIds,
  onToggle,
  onToggleAll,
  getLabel,
  overriddenIds,
}: Props) {
  const ids = useMemo(() => permissions.map((p) => p.id), [permissions])
  const allChecked = ids.every((id) => checkedIds.has(id))
  const someChecked = !allChecked && ids.some((id) => checkedIds.has(id))

  return (
    <section className="min-w-0 rounded-2xl bg-foreground/5 p-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h3>

        <button
          type="button"
          onClick={() => onToggleAll(ids, !allChecked)}
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
            allChecked
              ? "bg-green-500/15 text-green-400 hover:bg-green-500/20"
              : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-muted-foreground",
          )}
        >
          {allChecked ? "Todos" : someChecked ? "Completar" : "Seleccionar todos"}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-1 tablet:grid-cols-2 desktop:grid-cols-3">
        {permissions.map((permission) => (
          <PermissionToggle
            key={permission.id}
            label={getLabel(permission)}
            checked={checkedIds.has(permission.id)}
            onToggle={() => onToggle(permission.id)}
            overridden={overriddenIds?.has(permission.id) ?? false}
          />
        ))}
      </div>
    </section>
  )
}