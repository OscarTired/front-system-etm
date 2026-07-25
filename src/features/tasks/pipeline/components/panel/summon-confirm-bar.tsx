"use client"

import { Check, X } from "lucide-react"

import { cn } from "@/shared/utils/utils"

type Props = {
  operatorName: string
  count: number
  mode: "ASSIGN" | "INVITE"
  onModeChange: (mode: "ASSIGN" | "INVITE") => void
  onConfirm: () => void
  onCancel: () => void
  confirming?: boolean
}

export function SummonConfirmBar({
  operatorName,
  count,
  mode,
  onModeChange,
  onConfirm,
  onCancel,
  confirming,
}: Props) {

  return (

    // absolute, no fixed — SheetContent (el panel) ya es position:fixed
    // por su cuenta, así que esto se ancla al PANEL (su containing
    // block), no al viewport completo. Antes, como fixed+z-50 vivía
    // FUERA del Portal de Radix (era hermano de <Sheet>, no hijo de
    // SheetContent), terminaba pintándose en otra capa de stacking y
    // quedaba tapado por el overlay con blur del Sheet.
    <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/8 bg-[#101012] px-4 py-3">

      <div className="flex items-center gap-3">

        <div className="min-w-0 flex-1">

          <p className="truncate text-sm font-semibold text-white">
            {count} {count === 1 ? "tarea" : "tareas"} para {operatorName}
          </p>

          <div className="mt-1.5 flex gap-1">

            <button
              type="button"
              onClick={() => onModeChange("ASSIGN")}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                mode === "ASSIGN"
                  ? "bg-white/15 text-white"
                  : "text-neutral-500 hover:text-neutral-300",
              )}
            >
              Asignar directo
            </button>

            <button
              type="button"
              onClick={() => onModeChange("INVITE")}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                mode === "INVITE"
                  ? "bg-white/15 text-white"
                  : "text-neutral-500 hover:text-neutral-300",
              )}
            >
              Invitar
            </button>

          </div>

        </div>

        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancelar"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-neutral-400 transition-colors hover:bg-white/10"
        >
          <X size={16} />
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={count === 0 || confirming}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-black transition-opacity disabled:opacity-40"
        >
          <Check size={16} />
          OK
        </button>

      </div>

    </div>

  )

}