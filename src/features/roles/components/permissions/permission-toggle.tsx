"use client"

import { Check } from "lucide-react"

import { cn } from "@/shared/utils/utils"

type Props = {
  label: string
  checked: boolean
  onToggle: () => void
  // Solo se usa en el modo "Usuarios": marca que este permiso ya no
  // coincide con lo que le daría el rol solo -- o sea, hay una
  // excepción puntual (ALLOW o DENY) aplicada a este usuario.
  overridden?: boolean
}

// Checkbox accesible propio en vez de <input type="checkbox"> con
// className de color pisado por encima. role="checkbox" +
// aria-checked + soporte de teclado (Enter/Espacio) para que siga
// siendo un checkbox real para lectores de pantalla, solo que
// dibujado a mano para que combine con el resto del diseño.
export function PermissionToggle({ label, checked, onToggle, overridden = false }: Props) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        "flex min-w-0 cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors",
        checked ? "bg-gray-500/10" : "hover:bg-foreground/5",
      )}
    >
      <span
        className={cn(
          "flex size-4.5 shrink-0 items-center justify-center rounded-md transition-colors",
          checked
            ? "bg-green-500"
            : "bg-foreground/5",
        )}
      >
        {checked && <Check size={11} strokeWidth={3} className="text-black" />}
      </span>

      <span
        className={cn(
          "min-w-0 truncate text-sm transition-colors",
          checked ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>

      {overridden && (
        <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
          Excepción
        </span>
      )}
    </div>
  )
}