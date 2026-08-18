"use client"

import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"

import type { EntityForm } from "../entity-dialog.types"

type Props = {
  value: EntityForm
  /** solid = color real (default). subtle solo si el caller lo pide. */
  variant?: "subtle" | "solid"
}

/**
 * Preview al crear/editar entidad.
 * Default solid: el usuario debe ver el color que está guardando.
 * Los chips de lista no pasan por aquí (usan DynamicBadge subtle vía motor).
 */
export function EntityPreview({ value, variant = "solid" }: Props) {
  return (
    <div className="flex justify-center py-3">
      <div className="scale-125">
        <DynamicBadge
          label={value.name || "Preview"}
          icon={value.icon}
          color={value.color}
          variant={variant}
        />
      </div>
    </div>
  )
}
