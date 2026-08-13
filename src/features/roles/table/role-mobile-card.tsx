"use client"

import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"

import type { Role } from "../types/role.types"

type Props = {
  role: Role
  index: number
  onSelect: () => void
}

// Card de rol en MOBILE -- copia exacta de la estructura de
// UserMobileCard: header con label chico ("ROL 001") + estado a la
// derecha, después una fila con el badge de color a ancho completo.
// Sin chevron: en Usuarios el chevron abre detalles inline (mismo
// card se expande), acá tocar la card ya navega directo al panel de
// Permisos -- no hay nada que expandir en el lugar.
export function RoleMobileCard({ role, index, onSelect }: Props) {
  return (
    <article className="overflow-hidden rounded-xl bg-foreground/5">
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left"
      >
        <header className="flex items-center justify-between gap-2.5 px-3 py-3">
          <span className="text-xs font-semibold tracking-[0.12em] text-muted-foreground">
            ROL {String(index + 1).padStart(3, "0")}
          </span>

          {!role.active && (
            <span className="text-xs font-medium text-muted-foreground">
              Inactivo
            </span>
          )}
        </header>

        <div className="flex items-center gap-2.5 px-3 pb-3">
          <div className="min-w-0 flex-1">
            <DynamicBadge
              label={role.name}
              icon={role.icon}
              color={role.color}
              width="field"
            />
          </div>
        </div>
      </button>
    </article>
  )
}
