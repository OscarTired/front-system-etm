"use client"

import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"

import type { EntityForm } from "../entity-dialog.types"

type Props = {
  value: EntityForm
  /** solid = color real al editar (default). */
  variant?: "subtle" | "solid"
}

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
