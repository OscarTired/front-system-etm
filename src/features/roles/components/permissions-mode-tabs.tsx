"use client"

import { cn } from "@/shared/utils/utils"

export type PermissionsMode = "roles" | "usuarios"

type Props = {
  mode: PermissionsMode
  onChange: (mode: PermissionsMode) => void
}

// Roles = permisos que se aplican a todos los usuarios de ese rol.
// Usuarios = excepciones puntuales (ALLOW/DENY) sobre una persona
// en particular, por encima de lo que ya le dan sus roles.
const OPTIONS: { value: PermissionsMode; label: string }[] = [
  { value: "roles", label: "Roles" },
  { value: "usuarios", label: "Usuarios" },
]

export function PermissionsModeTabs({ mode, onChange }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-xl bg-white/3 p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            mode === option.value
              ? "bg-white/10 text-white"
              : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}